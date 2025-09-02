import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'node:net';
import { josLogger } from 'src/utils/logger';
import { crc16IBM } from 'src/utils/crc';
import { EnvConfiguration } from 'config/app.config';
import { Fecha, FrameDto, Tiempo } from 'src/dto/frame.dto';
import { ConfigFinalTxDto, EstadoDispositivoTxDto, PresentacionDto, ProgresoActualizacionTxDto, UrlDescargaOtaTxDto } from 'src/dto/tt_sistema.dto';
import { PeticionConsolaDto, RtPeticionConsolaDto } from 'src/dto/tt_depuracion.dto';
import { EnScvTipo, EnTipoDato } from 'src/utils/enums';
import { ScvDto } from 'src/dto/tt_scv.dto';
import { encodeScvValor } from 'src/utils/helpersTipado';
import { EstadisticoValorDto, EstadisticoDato } from 'src/dto/tt_estadisticos.dto';
import { defaultDataTempSonda1 } from 'src/dto/defaultTrama';
import { getDataSection } from 'src/utils/get';

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
const TT_SISTEMA = 25;   // Tipo de trama SISTEMA
const TM_SISTEMA_TX_PRESENTACION = 1;
const TM_SISTEMA_TX_PRESENCIA = 4;

// Máximo datos (no frame completo): 2480 bytes
const MAX_DATA_BYTES = 2480; // ver protocolo
const MAX_FRAME_BYTES = 2500; // frame completo (aprox)

@Injectable()
export class TcpClientService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.socket?.destroy();
  }

  // ------------------------------------------- CONEXIÓN -------------------------------------------
  private connect() {
    this.socket = new Socket();
    this.socket.connect(DESTINY_PORT, DESTINY_HOST, () => {
      josLogger.debug("env.destinyHost: " + env.destinyHost);
      josLogger.info(`🔌 Cliente TCP conectado a ${DESTINY_HOST}:${DESTINY_PORT}`);
    });
    this.socket.on('data', serverResponse => {
      josLogger.debug('La respuesta (RX) probablemente sea el ACK de la última operación.');
      josLogger.debug('📨 RX raw: ' + serverResponse.toString());
      josLogger.debug(`📨 RX len=${serverResponse.length}`);
      josLogger.debug('📨 RX HEX:\n' + hexDump(serverResponse));
      josLogger.debug('📨 RX b64: ' + serverResponse.toString('base64') + '\n');
      const dataACK= getDataSection(serverResponse);
      josLogger.debug('📨 Data ACK: '+dataACK);
      // josLogger.debug('📨 Data:\n');
      // josLogger.debug(dataACK.toString('hex'));
      // josLogger.debug('📨 Data b64:\n');
      // josLogger.debug(dataACK.toString('base64'));
      // josLogger.debug('📨 Data ASCII:\n');
      // josLogger.debug(dataACK.toString('ascii'));
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

  //* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  //* XXXXXXXXXXXXXX Aquí se serializan los datos a enviar (metiéndole el respectivo objeto) XXXXXXXXXXXXXX
  //* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

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

  /** Serializa un FrameDto (creado con crearFrame) a Buffer (Little Endian) */
  // serializarFrame(f: FrameDto): Buffer {
  //   const start = f.inicioTrama;
  //   const end = f.finTrama;

  //   const header = Buffer.alloc(1 + 1 + 2 + 2 + 1 + 1 + 2);
  //   let offset = 0;
  //   header.writeUInt8(f.versionProtocolo, offset); offset += 1;
  //   header.writeUInt8(f.reserva ?? 0, offset); offset += 1;
  //   header.writeUInt16LE(f.nodoOrigen, offset); offset += 2;
  //   header.writeUInt16LE(f.nodoDestino, offset); offset += 2;
  //   header.writeUInt8(f.tipoTrama, offset); offset += 1;
  //   header.writeUInt8(f.tipoMensaje, offset); offset += 1;
  //   header.writeUInt16LE(f.longitud, offset); offset += 2;

  //   const datosBuf = Buffer.isBuffer(f.datos) ? f.datos : Buffer.alloc(0); // ! si alguien dejó un DTO aquí por error, mandamos vacío

  //   // CRC-16 Modbus sobre header+datos (placeholder)
  //   const crc = Buffer.alloc(2);
  //   const crcVal = crc16IBM(Buffer.concat([header, datosBuf]));
  //   crc.writeUInt16LE(crcVal, 0);

  //   return Buffer.concat([start, header, datosBuf, crc, end]);
  // }

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

  /** Demo: cuerpo con una temperatura uint32 (x100) */
  // crearDataTempS1(tempC?: number) {
  // const data = Buffer.alloc(4);
  // const raw = Math.round(tempC * 100);
  // data.writeUInt32LE(raw, 0);

  // const data = defaultDataTempSonda1;
  // return data;
  // }

  // Convenio local: fecha -> yyyymmdd (uint32 LE), hora -> segundos del día (uint32 LE)
  // tipoDato (cabecera) = 47 (0x2F)

  /** Serializa los datos de una temperatura a buffer, es decir, 
   * coge todos los objetos y subobjetos de tt_estadisticos.dto, 
   * incluyendo los tipo Fecha y Tiempo y los serializa para obtener 
   * el "data" en bytes para la trama. */
  crearDataTempS1(_tempC?: number): Buffer {
    const dto = defaultDataTempSonda1; // Datos de ejemplo.

    // Calcular longitudes para establecer los bytes del buffer en función del estadístico, que puede tener dato[] variables.
    const HEADER_LEN = 22; // 4(mac)+1(tipoDatoHdr)+1(idSeg)+1(ver)+1(tipoReg)+4(res1..4)+4(fecha)+4(hora)+1(res5)+1(nDatos)
    const itemsLen = dto.datos.reduce((acc, it) => acc + 2 + (it.sizeDatoByte ?? it.dato.length), 0);
    const data = Buffer.alloc(HEADER_LEN + itemsLen);

    let offset = 0;

    // ---- cabecera estadístico ----
    data.writeUInt32LE(dto.mac >>> 0, offset); offset += 4;                                       // MAC
    data.writeUInt8((dto.tipoDato & 0xFF) >>> 0, offset++);                                   // tipo_dato (cabecera) => 47
    data.writeUInt8((dto.identificadorUnicoDentroDelSegundo ?? 0) & 0xFF, offset++);          // id dentro del segundo (uint8)
    data.writeUInt8((dto.version ?? 0) & 0xFF, offset++);                                     // VERSION (uint8)
    data.writeUInt8((dto.tipoRegistro ?? 0) & 0xFF, offset++);                                // tipo_registro (uint8)

    data.writeUInt8((dto.res1 ?? 0) & 0xFF, offset++);
    data.writeUInt8((dto.res2 ?? 0) & 0xFF, offset++);
    data.writeUInt8((dto.res3 ?? 0) & 0xFF, offset++);
    data.writeUInt8((dto.res4 ?? 0) & 0xFF, offset++);

    // fecha -> yyyymmdd (uint32 LE)
    const f: Fecha = dto.fecha;
    const yyyy = (f.anyo ?? 0) >>> 0;
    const mm = (f.mes ?? 0) >>> 0;
    const dd = (f.dia ?? 0) >>> 0;
    const fechaU32 = (yyyy * 10000 + mm * 100 + dd) >>> 0;
    data.writeUInt32LE(fechaU32, offset); offset += 4;

    // hora -> segundos desde 00:00 (uint32 LE)
    const t: Tiempo = dto.hora;
    const hh = (t.hora ?? 0) >>> 0;
    const mi = (t.min ?? t.min ?? 0) >>> 0;
    const ss = (t.seg ?? t.seg ?? 0) >>> 0;
    const segundosDelDia = ((hh * 3600 + mi * 60 + ss) >>> 0);
    data.writeUInt32LE(segundosDelDia, offset); offset += 4;

    data.writeUInt8((dto.res5 ?? 0) & 0xFF, offset++);

    const nDatos = dto.datos.length & 0xFF; // forzamos a uint8
    data.writeUInt8(nDatos, offset++);                                               // numero_datos

    // ---- items datos[]: tipo (u8) | size (u8) | dato[size] ----
    for (const it of dto.datos) {
      const size = it.sizeDatoByte ?? it.dato.length;
      if (size !== it.dato.length) {
        // Si te interesa, puedes normalizar: size = it.dato.length;
        // Aquí validamos para que no haya incoherencias silenciosas.
        throw new Error(`Size inconsistente en item tipo=${it.tipoDato}: sizeDatoByte=${it.sizeDatoByte} dato.len=${it.dato.length}`);
      }
      data.writeUInt8((it.tipoDato & 0xFF) >>> 0, offset++); // tipo_dato (ENUM_TIPO_DATO)
      data.writeUInt8(size & 0xFF, offset++);               // size_dato_byte
      it.dato.copy(data, offset); offset += size;                // dato[size]
    }

    return data;
  }

  // -------------------------------------------------- OPCIONAL: helper para empaquetar en tu EnviaEstadisticoDto.datos[] --------------------------------------------------
  // Este helper transforma un "EstadisticoValorDto" en el array de bloques (tipo_dato, size, dato[])
  // que pide TM_ESTADISTICOS_envia_estadistico. Útil para temperaturas.
  serializarDatosFromEstadisticoValor(e: EstadisticoValorDto): EstadisticoDato[] {
    const { valorTipo = EnTipoDato.float } = e;

    // pequeñas utilidades para empaquetar LE:
    const u8 = (n: number) => Buffer.from([n & 0xFF]);
    const u16 = (n: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(n & 0xFFFF, 0); return b; };
    const tiempo = (t: Tiempo) => {
      //* El doc no fija la representación binaria exacta de TD_TIEMPO en esta sección.
      //* Sugerencia: segundos desde 00:00:00 como uint32 LE (hh*3600+mm*60+ss).
      const s = ((t.hora | 0) * 3600 + (t.min | 0) * 60 + (t.seg | 0)) >>> 0;
      const b = Buffer.alloc(4); b.writeUInt32LE(s, 0); return b;
    };

    // encoder genérico únicamente para tipos usados aquí (uint8, uint16, float, tiempo)
    const encode = (tipo: EnTipoDato, n: number | Tiempo): Buffer => {
      switch (tipo) {
        case EnTipoDato.uint8: return u8(Number(n));
        case EnTipoDato.uint16: return u16(Number(n));
        case EnTipoDato.float: { const b = Buffer.alloc(4); b.writeFloatLE(Number(n), 0); return b; }
        case EnTipoDato.tiempo: return tiempo(n as Tiempo);
        default:
          //* Si necesitas más tipos (int16, uint32, etc.), amplía aquí.
          throw new Error(`Tipo no soportado en este helper: ${tipo}`);
      }
    };

    const make = (tipoDato: EnTipoDato, datoBuf: Buffer) => ({
      tipoDato,
      sizeDatoByte: datoBuf.length,
      dato: datoBuf,
    });

    return [
      make(EnTipoDato.uint16, encode(EnTipoDato.uint16, e.nombreEstadistico)),               // Nombre estadístico
      make(EnTipoDato.uint8, encode(EnTipoDato.uint8, e.periodicidad)),                   // Periodicidad
      make(valorTipo, encode(valorTipo, e.valorMedio)),                     // Valor medio
      make(valorTipo, encode(valorTipo, e.valorMax)),                       // Valor máx
      make(valorTipo, encode(valorTipo, e.valorMin)),                       // Valor mín
      make(EnTipoDato.tiempo, encode(EnTipoDato.tiempo, e.horaValorMax)),                   // Hora valor máx
      make(EnTipoDato.tiempo, encode(EnTipoDato.tiempo, e.horaValorMin)),                   // Hora valor mín
      make(EnTipoDato.uint8, encode(EnTipoDato.uint8, e.estado)),                         // Estado (0/1)
      make(EnTipoDato.uint8, encode(EnTipoDato.uint8, e.unidad)),                         // Unidad (EN_GT_UNIDADES)
    ];
  }


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
  crearDataMetricas(seq = 0) {
    const data = Buffer.alloc(12);
    const sentNs = process.hrtime.bigint();   // reloj monotónico (ns)
    data.writeBigUInt64LE(sentNs, 0);         // u64 LE
    data.writeUInt32LE(seq >>> 0, 8);         // u32 LE
    return data;
  }

}

// ------------------------------------------- hexDump -------------------------------------------
/** Convierte un buffer en texto hexadecimal en columnas. */
export function hexDump(buf: Buffer, width = 16): string {
  const hex: string[] = buf.toString('hex').match(/.{1,2}/g) ?? []; // Divide en grupos de 2 bytes
  const lines: string[] = [];                                       // Aquí irá el resultado

  for (let i = 0; i < hex.length; i += width) {
    const slice = hex.slice(i, i + width);                          // Toma un "ancho" de bytes
    lines.push(slice.join(' '));                                    // ok
  }
  return lines.join('\n');
}



// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { Socket } from 'node:net';
// import { josLogger } from 'src/logger';

// //! CAPA 0

// const HOST = '127.0.0.1';
// const PORT = 8010;

// // === Constantes protocolo ===
// const START = Buffer.from([0xCC, 0xAA, 0xAA, 0xAA]);
// const END = Buffer.from([0xCC, 0xBB, 0xBB, 0xBB]);

// const PROTO_VERSION = 2; // según doc
// const TT_SISTEMA = 25;   // Tipo de trama SISTEMA
// const TM_SISTEMA_TX_PRESENTACION = 1;
// const TM_SISTEMA_TX_PRESENCIA = 4;

// // Máximo datos (no frame completo): 2480 bytes
// const MAX_DATA_BYTES = 2480; // ver sección 1 del doc

// @Injectable()
// export class TcpClientService implements OnModuleInit, OnModuleDestroy {
//   private socket: Socket | null = null;

//   onModuleInit() {
//     this.connect();
//   }
//   onModuleDestroy() {
//     this.socket?.destroy();
//   }

//   // ------------------------------------------- PRESENTACION -------------------------------------------
//   private connect() {

//     this.socket = new Socket();
//     this.socket.connect(PORT, HOST, () => {
//       josLogger.info(`🔌 Cliente TCP conectado a ${HOST}:${PORT}`);
//     });
//     this.socket.on('data', d => {
//       josLogger.debug('📨 RX raw: ' + d.toString())
//       josLogger.debug(`📨 RX len=${d.length}`);
//       josLogger.debug('📨 RX HEX:\n' + hexDump(d));
//       josLogger.debug('📨 RX b64: ' + d.toString('base64') + '\n');
//     });
//     this.socket.on('error', e => josLogger.error('❗ Socket error: ' + e.message));
//     this.socket.on('close', () => {
//       josLogger.error('🛑 Conexión cerrada. Reintentando en 1s…');
//       setTimeout(() => this.connect(), 1000);
//     });

//   }

//   // ------------------------------------------- PRESENTACION -------------------------------------------
//   /** Enviar un frame ya montado */
//   sendFrame(frame: Buffer) {
//     if (!this.socket || !this.socket.writable) {
//       throw new Error('Socket no conectado');
//     }
//     this.socket.write(frame);
//     return { bytes: frame.length, hex: frame.toString('hex') };
//   }

//   // ------------------------------------------- PRESENTACION -------------------------------------------
//   /** Builder genérico de frame CTI (little-endian) */
//   buildFrame(params: {
//     reserved?: number,
//     originNode: number,
//     destNode: number,
//     tipoTrama: number,
//     tipoMensaje: number,
//     data: Buffer
//   }) {
//     const {
//       reserved = 0,
//       originNode,
//       destNode,
//       tipoTrama,
//       tipoMensaje,
//       data
//     } = params;

//     if (data.length > MAX_DATA_BYTES) {
//       throw new Error(`El cuerpo supera ${MAX_DATA_BYTES} bytes`);
//     }

//     // Encabezado variable (después del START)
//     const header = Buffer.alloc(1 + 1 + 2 + 2 + 1 + 1 + 2); // ver sección 1
//     let o = 0;
//     header.writeUInt8(PROTO_VERSION, o); o += 1;           // Versión protocolo
//     header.writeUInt8(reserved, o); o += 1;                 // Reserva
//     header.writeUInt16LE(originNode, o); o += 2;            // Nodo origen
//     header.writeUInt16LE(destNode, o); o += 2;              // Nodo destino
//     header.writeUInt8(tipoTrama, o); o += 1;                // Tipo de Trama
//     header.writeUInt8(tipoMensaje, o); o += 1;              // Tipo de mensaje
//     header.writeUInt16LE(data.length, o); o += 2;           // Tamaño datos

//     // CRC de 2 bytes sobre (header + data) o sobre todo excepto START/END (el doc no lo precisa).
//     // Usamos Modbus/IBM (0xA001) como placeholder típico y lo escribimos LE.
//     const crc = Buffer.alloc(2);
//     const crcVal = this.crc16Modbus(Buffer.concat([header, data]));
//     crc.writeUInt16LE(crcVal, 0);

//     // Frame completo: START + header + data + CRC + END
//     return Buffer.concat([START, header, data, crc, END]);
//   }

//   // ------------------------------------------- Creación -------------------------------------------
//   // CRC-16 Modbus (placeholder). Si tu equipo usa otro polinomio, cámbialo.
//   private crc16Modbus(buf: Buffer) {
//     let crc = 0xFFFF;
//     for (let pos = 0; pos < buf.length; pos++) {
//       crc ^= buf[pos];
//       for (let i = 0; i < 8; i++) {
//         const lsb = crc & 1;
//         crc >>= 1;
//         if (lsb) crc ^= 0xA001;
//       }
//     }
//     return crc & 0xFFFF;
//   }

//   // ------------------------------------------- Datos Presentacion -------------------------------------------
//   /** Cuerpo TM_SISTEMA_TX_PRESENTACION (N_variables=6) */
//   buildDataPresentacion(p: {
//     versionPresentacion: number,
//     mac: number,
//     versionEquipo: number,
//     tipoEquipo: number,
//     claveEquipo: number,
//     versionHw: number
//   }) {
//     const data = Buffer.alloc(4 * (1 + 6)); // 7 uint32
//     let o = 0;
//     data.writeUInt32LE(6, o); o += 4;                         // N_variables (6)
//     data.writeUInt32LE(p.versionPresentacion, o); o += 4;     // version_presentacion
//     data.writeUInt32LE(p.mac, o); o += 4;                     // MAC
//     data.writeUInt32LE(p.versionEquipo, o); o += 4;           // VERSION_EQUIPO
//     data.writeUInt32LE(p.tipoEquipo, o); o += 4;              // tipo_equipo
//     data.writeUInt32LE(p.claveEquipo, o); o += 4;             // clave_equipo
//     data.writeUInt32LE(p.versionHw, o); o += 4;               // VERSION_HW
//     return data;
//   }

//   // ------------------------------------------- Datos Presencia -------------------------------------------
//   /** Cuerpo TM_SISTEMA_TX_PRESENCIA (el doc no define campos -> vacío) */
//   buildDataPresencia() {
//     return Buffer.alloc(0);
//   }

//   // ------------------------------------------- Datos TempS1 -------------------------------------------
//   /** Demo: cuerpo con una temperatura uint32 (x100) */
//   buildDataTempS1(tempC: number) {
//     const data = Buffer.alloc(4);
//     const raw = Math.round(tempC * 100);
//     data.writeUInt32LE(raw, 0);
//     return data;
//   }
// }

// // ------------------------------------------- hexDump -------------------------------------------
// /** Función para transofrmar un buffer en un string de texto hexadecimal. */
// function hexDump(buf: Buffer, width = 16): string {
//   const hex: string[] = buf.toString('hex').match(/.{1,2}/g) ?? []; // ← string[]
//   const lines: string[] = [];                                       // ← string[]

//   for (let i = 0; i < hex.length; i += width) {
//     const slice = hex.slice(i, i + width);                          // string[]
//     lines.push(slice.join(' '));                                    // ok
//   }
//   return lines.join('\n');
// }




// import { Injectable } from '@nestjs/common';
// import { CreateTcpClientDto } from './dto/create-tcp-client.dto';
// import { UpdateTcpClientDto } from './dto/update-tcp-client.dto';

// @Injectable()
// export class TcpClientService {
//   create(createTcpClientDto: CreateTcpClientDto) {
//     return 'This action adds a new tcpClient';
//   }

//   findAll() {
//     return `This action returns all tcpClient`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} tcpClient`;
//   }

//   update(id: number, updateTcpClientDto: UpdateTcpClientDto) {
//     return `This action updates a #${id} tcpClient`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} tcpClient`;
//   }
// }
