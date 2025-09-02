import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'node:net';
import { josLogger } from 'src/utils/josLogger';
import { crc16IBM } from 'src/utils/crc';
import { EnvConfiguration } from 'config/app.config';
import { Fecha, FrameDto, Tiempo } from 'src/dto/frame.dto';
import { ConfigFinalTxDto, EstadoDispositivoTxDto, PresentacionDto, ProgresoActualizacionTxDto, UrlDescargaOtaTxDto } from 'src/dto/tt_sistema.dto';
import { PeticionConsolaDto } from 'src/dto/tt_depuracion.dto';
import { defaultDataActividadCalefaccion1 as defaultDataActividadCalefaccion1, defaultDataContadorAgua, defaultDataTempSonda1 } from 'src/dto/defaultTrama';
import { getDataSection, getTipoMensaje, getTipoTrama, hexDump } from 'src/utils/getters';
import { EnTipoTrama, EnTmEstadisticos } from 'src/utils/enums';
import { ACK_TTL_MS } from 'src/utils/helpersTipado';
import { EnviaEstadisticoDto } from 'src/dto/tt_estadisticos.dto';

//! CAPA 0

const env = EnvConfiguration();

const DESTINY_HOST = env.destinyHost ?? '127.0.0.1';
const DESTINY_PORT = env.destinyPort ?? 8010; // 8020 o 8010;

// Constantes protocolo
const START_ARR = [0xCC, 0xAA, 0xAA, 0xAA] as const;
const END_ARR = [0xCC, 0xBB, 0xBB, 0xBB] as const;

const START = Buffer.from(START_ARR);
const END = Buffer.from(END_ARR);

const PROTO_VERSION = 2; // según doc

// Máximo datos (no frame completo): 2480 bytes
const MAX_DATA_BYTES = 2480; // ver protocolo
const MAX_FRAME_BYTES = 2500; // frame completo (aprox)

const ACK_TIMEOUT_MS = 6000;

@Injectable()
export class TcpClientService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;

  // --- Control de estadísticos en vuelo ---
  private statIdSecond = 0;                   // segundo (epoch) del último ID generado
  private statIdCounter = 0;                  // contador 0..255 dentro del segundo
  private pendingStats = new Map<number, { ts: number }>(); // id -> timestamp envío
  private receivedAcks = new Set<number>();

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.socket?.destroy();
  }

  /** Genera un identificador_unico_dentro_del_segundo (0..255) y hace wrap por segundo. */
  public nextStatId(): number {
    const sec = Math.floor(Date.now() / 1000);
    if (sec !== this.statIdSecond) {
      this.statIdSecond = sec;
      this.statIdCounter = 0;
    }
    const id = this.statIdCounter & 0xFF;
    this.statIdCounter = (this.statIdCounter + 1) & 0xFF;
    return id;
  }

  /** Registra un estadístico pendiente de ACK. */
  public trackPendingStat(id: number) {
    this.pendingStats.set(id & 0xFF, { ts: Date.now() });
  }

  /** Limpia pendientes antiguos para evitar choque entre segundos distintos. */
  private sweepPendingStats() {
    const now = Date.now();
    for (const [id, meta] of this.pendingStats) {
      if (now - meta.ts > ACK_TTL_MS) {
        this.pendingStats.delete(id);
      }
    }
  }

  private async delay(ms: number) {
    return await new Promise<void>(r => setTimeout(r, ms));
  }

  // ------------------------------------------- CONEXIÓN -------------------------------------------
  private connect() {

    this.socket = new Socket();
    // this.socket.setNoDelay(true);

    this.socket.connect(DESTINY_PORT, DESTINY_HOST, () => {
      josLogger.debug("env.destinyHost: " + env.destinyHost);
      josLogger.info(`🔌 Cliente TCP conectado a ${DESTINY_HOST}:${DESTINY_PORT}`);
    });

    this.socket.on('data', serverResponse => {

      try {
        const tt = getTipoTrama(serverResponse);
        const tm = getTipoMensaje(serverResponse);

        josLogger.debug('La respuesta (RX) probablemente sea el ACK de la última operación.');
        josLogger.debug('📨 RX raw: ' + serverResponse.toString());
        josLogger.debug(`📨 RX len=${serverResponse.length}`);
        josLogger.debug('📨 RX HEX:\n' + hexDump(serverResponse));
        josLogger.debug('📨 RX b64: ' + serverResponse.toString('base64'));
        const dataACK = getDataSection(serverResponse);
        josLogger.debug('📨 Data ACK: ' + dataACK);
        josLogger.debug('📨 Data ACK b64: ' + dataACK.toString('base64'));
        josLogger.debug('📨 Data ACK HEX: ' + dataACK.toString('hex'));
        josLogger.debug('📨 RX len=' + serverResponse.length);

        if (tt === EnTipoTrama.estadisticos && tm === EnTmEstadisticos.rtEstadistico) {
          const dataACK = getDataSection(serverResponse);
          const ackId = dataACK.readUInt8(dataACK.length - 1);

          this.receivedAcks.add(ackId & 0xFF);                 // lo marca como recibido
          josLogger.info(`✅ ACK estadístico id=${ackId} recibido`);

          // (opcional) si mantienes tus métricas antiguas:
          if (this.pendingStats.has(ackId)) this.pendingStats.delete(ackId);

          this.sweepPendingStats();
          return; // ya tratado

        }

      } catch (e) {
        josLogger.error('Error procesando RX: ' + (e as Error).message);
      }

    });

    this.socket.on('error', e => josLogger.error('❗ Socket error: ' + e.message));

    this.socket.on('close', () => {
      josLogger.error("env.destinyHost: " + env.destinyHost);
      josLogger.error("env.destinyPort: " + env.destinyPort);
      josLogger.error('process.env.DESTINY_PORT: ' + process.env.DESTINY_PORT);
      josLogger.error('🛑 Conexión cerrada. Reintentando en 1s…');
      setTimeout(() => this.connect(), 1000);
    });

  }

  // ------------------------------------------- ENVÍO -------------------------------------------
  /** Enviar un FrameDto (se serializa internamente a Buffer) */
  enviarFrame(frame: FrameDto) {
    if (!this.socket || !this.socket.writable) {
      josLogger.fatal('XXX Socket no conectado XXX');
      return false;
    }
    const buf = this.serializarFrame(frame);
    this.socket.write(buf);
    return { bytes: buf.length, hex: buf.toString('hex') };
  }

  //* -----------------------------------------------------------------------------------------------------
  //* -------------- Aquí se serializan los datos a enviar (metiéndole el respectivo objeto) --------------
  //* -----------------------------------------------------------------------------------------------------

  // ------------------------------------------- BUILDERS -------------------------------------------
  /** Builder genérico de FrameDto a partir de parámetros sueltos, crea el frame. */
  crearFrame(params: { nodoOrigen: number, nodoDestino: number, tipoTrama: number, tipoMensaje: number, data: Buffer, reserva?: number, versionProtocolo?: number }): FrameDto {

    const { nodoOrigen, nodoDestino, tipoTrama, tipoMensaje, data, reserva = 0, versionProtocolo = PROTO_VERSION } = params;

    if (data.length > MAX_DATA_BYTES) {
      throw new Error(`El cuerpo supera ${MAX_DATA_BYTES} bytes`);
    }

    const frame: FrameDto = {
      inicioTrama: START,
      versionProtocolo,
      reserva,
      nodoOrigen,
      nodoDestino,
      tipoTrama,
      tipoMensaje,
      longitud: data.length,
      datos: data, // Buffer
      crc: 0,      // done se recalcula en serializeFrame
      finTrama: END,
    };

    return frame;
  }

  /** Serializa un FrameDto (Little Endian en header, CRC escrito en BE como espera el server) */
  serializarFrame(f: FrameDto): Buffer {
    const start = f.inicioTrama;
    const end = f.finTrama;

    // Header (NO incluye el "start")
    const header = Buffer.alloc(1 + 1 + 2 + 2 + 1 + 1 + 2);
    let o = 0;
    header.writeUInt8(f.versionProtocolo, o); o += 1;
    header.writeUInt8(f.reserva ?? 0, o); o += 1;
    header.writeUInt16LE(f.nodoOrigen, o); o += 2;
    header.writeUInt16LE(f.nodoDestino, o); o += 2;
    header.writeUInt8(f.tipoTrama, o); o += 1;
    header.writeUInt8(f.tipoMensaje, o); o += 1;
    header.writeUInt16LE(f.longitud, o); o += 2;

    const datosBuf = Buffer.isBuffer(f.datos) ? f.datos : Buffer.alloc(0);

    // === CRC16 IBM/ARC sobre (header + datos) ===
    const crcSegment = Buffer.concat([header, datosBuf]);
    const crcValSwapped = crc16IBM(crcSegment);        // ya viene "swappeado" como el server lo compara
    const crcBuf = Buffer.alloc(2);
    crcBuf.writeUInt16BE(crcValSwapped, 0);            // el server hace readUInt16BE → ¡coinciden!

    return Buffer.concat([start, header, datosBuf, crcBuf, end]);
  }

  /** Espera hasta timeout a que llegue el ACK con ese id. */
  private async waitAck(id: number, timeoutMs = ACK_TIMEOUT_MS): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (this.receivedAcks.has(id & 0xFF)) {
        this.receivedAcks.delete(id & 0xFF); // lo consumimos
        return; // ACK encontrado
      }
      await this.delay(50); // intervalo de comprobación
    }
    throw new Error(`ACK timeout id=${id}`);
  }

  /** Envía un estadístico y espera su ACK; si no llega en 6s, reintenta el MISMO frame. */
  public async enviarEstadisticoYEsperarAck(id: number, frame: FrameDto): Promise<boolean> {
    // reintentos indefinidos; si quieres límite, añade un contador
    while (true) {
      this.trackPendingStat(id); // opcional: telemetría

      const res = this.enviarFrame(frame);
      if (!res) {
        josLogger.error(`❌ Fallo al enviar frame de estadístico id=${id}`);
        await this.delay(200); // evita bucles calientes
        continue;
      }

      try {
        await this.waitAck(id, ACK_TIMEOUT_MS);
        return true; // ACK correcto recibido
      } catch (e) {
        josLogger.warn(`⏳ Timeout ACK (${ACK_TIMEOUT_MS}ms) para estadístico id=${id} → reintentando MISMO frame…`);
        // loop: reintenta mismo frame con mismo id
      }
    }
  }


  // ------------------------------------------- PAYLOADS -------------------------------------------

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT SISTEMAS -------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  /** TM_SISTEMA_TX_PRESENTACION (N_variables=6) */
  crearDataPresentacion(p: PresentacionDto) {
    const data = Buffer.alloc(4 * (1 + p.nVariables)); // 7 uint32
    let offset = 0;
    data.writeUInt32LE(p.nVariables, offset); offset += 4;                          // N_variables (6)
    data.writeUInt32LE(p.versionPresentacion, offset); offset += 4;         // version_presentacion
    data.writeUInt32LE(p.mac, offset); offset += 4;        // MAC  
    data.writeUInt32LE(p.versionEquipo, offset); offset += 4;        // VERSION_EQUIPO
    data.writeUInt32LE(p.tipoEquipo, offset); offset += 4;        // tipo_equipo
    data.writeUInt32LE(p.claveEquipo, offset); offset += 4;        // clave_equipo
    data.writeUInt32LE(p.versionHw, offset); offset += 4;        // VERSION_HW
    return data;
  }

  /** TM_SISTEMA_TX_PRESENCIA */
  crearDataPresencia() {
    return Buffer.alloc(0);
  }

  /** TM_SISTEMA_TX_ESTADO_DISPOSITIVO */
  serializarDataEstadoDispositivo(ed: EstadoDispositivoTxDto) {
    const data = Buffer.alloc(16);
    let offset = 0;
    data.writeUInt32LE(ed.nVariables, offset); offset += 4;        // N_variables
    data.writeUInt32LE(ed.version, offset); offset += 4;           // version
    data.writeUInt32LE(ed.idEnvio, offset); offset += 4;           // ID_ENVIO
    data.writeUInt32LE(ed.alarmaEquipo, offset); offset += 4;      // Alarma_equipo
    return data;
  }

  // -------------------------------------------------- TM_SISTEMA_TX_CONFIG_FINAL --------------------------------------------------
  /** 2 × uint32 (8 bytes): version, Envia_estadisticos. Doc 2.4.7. */
  serializarDataConfigFinal(cf: ConfigFinalTxDto) {
    const data = Buffer.alloc(8);
    let o = 0;
    data.writeUInt32LE(cf.version >>> 0, o); o += 4;               // version
    data.writeUInt32LE(cf.enviaEstadisticos >>> 0, o);             // Envia_estadisticos (0/1)
    return data;
  }

  // -------------------------------------------------- TM_SISTEMA_TX_URL_DESCARGA_OTA --------------------------------------------------
  /** 2 × uint32 (8 bytes): VERSION_TRAMA_OTA (=1), tipo_equipo. Doc 2.4.5→1.1.1. */
  serializarDataUrlDescargaOta(ota: UrlDescargaOtaTxDto) {
    const data = Buffer.alloc(8);
    let o = 0;
    data.writeUInt32LE(ota.versionTramaOta >>> 0, o); o += 4;      // VERSION_TRAMA_OTA (=1)
    data.writeUInt32LE(ota.tipoEquipo >>> 0, o);                   // tipo_equipo (EN_TIPO_EQUIPO)
    return data;
  }

  // -------------------------------------------------- TM_SISTEMA_TX_PROGRESO_ACTUALIZACION --------------------------------------------------
  /** 3 × uint32 (12 bytes): N_variables, version, estado_progreso. Doc 1.1.3. */
  serializarDataProgresoActualizacion(pa: ProgresoActualizacionTxDto) {
    const data = Buffer.alloc(12);
    let o = 0;
    data.writeUInt32LE(pa.nVariables >>> 0, o); o += 4;            // N_variables
    data.writeUInt32LE(pa.version >>> 0, o); o += 4;               // version
    data.writeUInt32LE(pa.estadoProgreso as unknown as number, o); // EN_GCSPA_EVENTO_ACTUALIZACION_SERVER
    return data;
  }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ESTADISTICOS ---------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  /** Serializa los datos de una temperatura a buffer, es decir, 
   * coge todos los objetos y subobjetos de tt_estadisticos.dto, 
   * incluyendo los tipo Fecha y Tiempo y los serializa para obtener 
   * el "data" en bytes para la trama. */
  crearDataTempS1(_tempC?: number): Buffer {
    const dto = defaultDataTempSonda1;
    return this.serializarEstadisticoPayload(dto);
  }

  /** TM_ESTADISTICOS_envia_estadistico — Contador */
  crearDataContador(): Buffer {
    const dto = defaultDataContadorAgua;
    return this.serializarEstadisticoPayload(dto);
  }

  /** TM_ESTADISTICOS_envia_estadistico — Actividad */
  crearDataActividad(): Buffer {
    const dto = defaultDataActividadCalefaccion1;
    return this.serializarEstadisticoPayload(dto);
  }

  /** Serializa un EnviaEstadisticoDto a Buffer (cabecera + items). */
  private serializarEstadisticoPayload(dto: EnviaEstadisticoDto): Buffer {
    // 4(mac)+1(tipoDatoHdr)+1(idSeg)+1(ver)+1(tipoReg)+4(res1..4)+4(fecha)+4(hora)+1(res5)+1(nDatos)
    const HEADER_LEN = 22;
    const itemsLen = dto.datos.reduce((acc, it) => acc + 2 + (it.sizeDatoByte ?? it.dato.length), 0);
    const data = Buffer.alloc(HEADER_LEN + itemsLen);

    let offset = 0;

    // cabecera estadístico
    data.writeUInt32LE(dto.mac >>> 0, offset); offset += 4;                              // MAC
    data.writeUInt8((dto.tipoDato & 0xFF) >>> 0, offset++);                              // tipo_dato cabecera (47)
    data.writeUInt8((dto.identificadorUnicoDentroDelSegundo ?? 0) & 0xFF, offset++);    // id dentro del segundo
    data.writeUInt8((dto.version ?? 0) & 0xFF, offset++);                                // VERSION
    data.writeUInt8((dto.tipoRegistro ?? 0) & 0xFF, offset++);                           // tipo_registro

    data.writeUInt8((dto.res1 ?? 0) & 0xFF, offset++);
    data.writeUInt8((dto.res2 ?? 0) & 0xFF, offset++);
    data.writeUInt8((dto.res3 ?? 0) & 0xFF, offset++);
    data.writeUInt8((dto.res4 ?? 0) & 0xFF, offset++);

    // fecha -> yyyymmdd (uint32 LE)
    const yyyy = (dto.fecha.anyo ?? 0) >>> 0;
    const mm = (dto.fecha.mes ?? 0) >>> 0;
    const dd = (dto.fecha.dia ?? 0) >>> 0;
    const fechaU32 = (yyyy * 10000 + mm * 100 + dd) >>> 0;
    data.writeUInt32LE(fechaU32, offset); offset += 4;

    // hora -> segundos desde 00:00 (uint32 LE)
    const hh = (dto.hora.hora ?? 0) >>> 0;
    const mi = (dto.hora.min ?? 0) >>> 0;
    const ss = (dto.hora.seg ?? 0) >>> 0;
    const segundosDelDia = ((hh * 3600 + mi * 60 + ss) >>> 0);
    data.writeUInt32LE(segundosDelDia, offset); offset += 4;

    data.writeUInt8((dto.res5 ?? 0) & 0xFF, offset++);

    const nDatos = dto.datos.length & 0xFF;
    data.writeUInt8(nDatos, offset++);                                                  // numero_datos

    // items datos[]: tipo (u8) | size (u8) | dato[size]
    for (const it of dto.datos) {
      const size = it.sizeDatoByte ?? it.dato.length;
      if (size !== it.dato.length) {
        throw new Error(`Size inconsistente en item tipo=${it.tipoDato}: sizeDatoByte=${it.sizeDatoByte} dato.len=${it.dato.length}`);
      }
      data.writeUInt8((it.tipoDato & 0xFF) >>> 0, offset++);// tipo_dato
      data.writeUInt8(size & 0xFF, offset++);               // size_dato_byte
      it.dato.copy(data, offset); offset += size;           // dato[size]
    }

    return data;
  }


























//! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
//! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
//! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
//! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
//! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP


















  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT DEPURACION -----------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // -------------------------------------------------- TM_DEPURACION_peticion_consola --------------------------------------------------
  /** Payload: uint16 identificador_cliente (LE) */
  // serializarDepuracionPeticionConsola(p: PeticionConsolaDto) {
  //   const data = Buffer.alloc(2);  
  //   data.writeUInt16LE((p.identificadorCliente ?? 0) & 0xFFFF, 0);
  //   return data;
  // }
  serializarDepuracionPeticionConsola(p: PeticionConsolaDto) {
    const data = Buffer.alloc(4);
    data.writeUInt32LE((p.identificadorCliente ?? 0) >>> 0, 0);
    return data;
  }


  //! En principio supongo que esto sería respuesta del propio servidor.
  // -------------------------------------------------- TM_DEPURACION_rt_peticion_consola --------------------------------------------------
  /** Payload: uint16 identificador_cliente (LE) + bytes UTF-8 de 'datos' */
  // serializarDepuracionRtPeticionConsola(r: RtPeticionConsolaDto) {
  //   const texto = r.datos ?? "";  
  //   const textoBuf = Buffer.from(texto, "utf8");
  //   const data = Buffer.alloc(2 + textoBuf.length);
  //   data.writeUInt16LE((r.identificadorCliente ?? 0) & 0xFFFF, 0);
  //   textoBuf.copy(data, 2);
  //   return data;
  // }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ACTUALIZACION_SERVER -------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------



  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT SERVICIOS_CLAVE_VALOR ------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  //! WIP: Servicios Clave Valor  
  // private serializarScv(dto: ScvDto): Buffer {
  //   const headerSize = 2 + 2 + 1 + 2; // uid (u16) + servicio (u16) + tipo (u8) + N_claves (u16)  
  //   const bloques: Buffer[] = [];

  //   for (const par of dto.claves) {
  //     const payload = encodeScvValor(par.tipo, par.valor);  
  //     if (payload.length > 0xFFFF) throw new Error("SCV: valor excede 65535 bytes");

  //     const bloque = Buffer.alloc(2 + 1 + 2 + payload.length);
  //     let o = 0;
  //     bloque.writeUInt16LE((par.clave >>> 0) & 0xFFFF, o); o += 2;         // Clave
  //     bloque.writeUInt8(par.tipo as unknown as number, o); o += 1;         // tipo_valor
  //     bloque.writeUInt16LE(payload.length & 0xFFFF, o); o += 2;            // size
  //     payload.copy(bloque, o);                                             // dato
  //     bloques.push(bloque);
  //   }

  //   const totalSize = headerSize + bloques.reduce((s, b) => s + b.length, 0);
  //   const data = Buffer.alloc(totalSize);

  //   let o = 0;
  //   data.writeUInt16LE((dto.uidEnvioTrama >>> 0) & 0xFFFF, o); o += 2;     // UID_envio_trama
  //   data.writeUInt16LE((dto.servicio >>> 0) & 0xFFFF, o); o += 2;          // servicio
  //   data.writeUInt8(dto.tipo as unknown as number, o); o += 1;             // tipo (petición/respuesta)
  //   data.writeUInt16LE((dto.claves.length >>> 0) & 0xFFFF, o); o += 2;     // N_claves

  //   for (const b of bloques) { b.copy(data, o); o += b.length; }

  //   return data;
  // }

  // // ----------------------------- Serializadores públicos para cada TM -----------------------------
  // /** TM_SCV_PETICION_SERVIDOR_FINAL (0) */
  // serializarScvPeticionServidorFinal(dto: Omit<ScvDto, "tipo">) {
  //   return this.serializarScv({ ...dto, tipo: EnScvTipo.peticion });  
  // }
  // /** TM_SCV_RT_PETICION_SERVIDOR_FINAL (1) */
  // serializarScvRtPeticionServidorFinal(dto: Omit<ScvDto, "tipo">) {
  //   return this.serializarScv({ ...dto, tipo: EnScvTipo.respuesta });  
  // }
  // /** TM_SCV_PETICION_FINAL_SERVIDOR (2) */
  // serializarScvPeticionFinalServidor(dto: Omit<ScvDto, "tipo">) {
  //   return this.serializarScv({ ...dto, tipo: EnScvTipo.peticion });  
  // }
  // /** TM_SCV_RT_PETICION_FINAL_SERVIDOR (3) */
  // serializarScvRtPeticionFinalServidor(dto: Omit<ScvDto, "tipo">) {
  //   return this.serializarScv({ ...dto, tipo: EnScvTipo.respuesta });  
  // }


  /** Cuerpo TM_SISTEMA_TX_METRICAS:
  *  offset 0..7  : sentNs  (u64 LE) -> process.hrtime.bigint()
  *  offset 8..11 : seq     (u32 LE)
  */
  // crearDataMetricas(seq = 0) {
  //   const data = Buffer.alloc(12);
  //   const sentNs = process.hrtime.bigint();   // reloj monotónico (ns)
  //   data.writeBigUInt64LE(sentNs, 0);         // u64 LE
  //   data.writeUInt32LE(seq >>> 0, 8);         // u32 LE
  //   return data;
  // }

}
