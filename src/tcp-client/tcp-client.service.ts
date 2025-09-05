import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { EnvConfiguration } from "config/app.config";
import { Socket } from "node:net";
import { defaultPresentacionOmegaOld } from "src/dtoBE/defaultTramaOld";
import { FrameOldDto } from "src/dtoBE/frameOld.dto";
import { PresentacionCentralOldDto, RtPresenciaCentralOldDto } from "src/dtoBE/tt_sistemaOld.dto";
import { defaultDataTempSonda1, defaultDataContadorAgua, defaultDataActividadCalefaccion1, defaultDataEventoInicioCrianza, defaultDataAlarmaTempAlta, defaultDataCambioParametro, defaultPresentacionCTI40 } from "src/dtoLE/defaultTrama";
import { FrameDto } from "src/dtoLE/frame.dto";
import { PeticionConsolaDto } from "src/dtoLE/tt_depuracion.dto";
import { EnviaEstadisticoDto } from "src/dtoLE/tt_estadisticos.dto";
import { PresentacionDto, EstadoDispositivoTxDto, ConfigFinalTxDto, UrlDescargaOtaTxDto, ProgresoActualizacionTxDto } from "src/dtoLE/tt_sistema.dto";
import { DEF_MAX_DATOS_TRAMA, PROTO_VERSION_BE } from "src/utils/BE_Old/globals/constGlobales";
import { EnTipoTramaOld, EnTipoMensajeCentralServidor } from "src/utils/BE_Old/globals/enumOld";
import { crc16IBM } from "src/utils/crc";
import { hexDump } from "src/utils/helpers";
import { josLogger } from "src/utils/josLogger";
import { getTipoTrama, getTipoMensaje, getDataSection } from "src/utils/LE/get/getTrama";
import { ACK_TTL_MS, PROTO_VERSION, MAX_DATA_BYTES, START, END, ACK_TIMEOUT_MS } from "src/utils/LE/globals/constGlobales";
import { EnTipoTrama, EnTmEstadisticos, EnTmSistema } from "src/utils/LE/globals/enums";

//! CAPA 0

@Injectable()
export class TcpClientService implements OnModuleInit, OnModuleDestroy {
    private socket: Socket | null = null;

    // --- Control de estadísticos en vuelo ---
    private statIdSecond = 0; // segundo (epoch) del último ID generado
    private statIdCounter = 0; // contador 0..255 dentro del segundo
    private pendingStats = new Map<number, { ts: number }>(); // id -> timestamp envío
    private receivedAcks = new Set<number>();

    private env = EnvConfiguration();
    private defaultHost = this.env.destinyHost;
    private defaultPort = this.env.destinyPort;

    private currentHost = this.defaultHost;
    private currentPort = this.defaultPort;
    private connectPromise: Promise<void> | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;

    onModuleInit() {
        this.connect();
    }

    onModuleDestroy() {
        // if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.socket?.destroy();
    }

    /** Genera un identificador_unico_dentro_del_segundo (0..255) y hace wrap por segundo. */
    public nextStatId(): number {
        const sec = Math.floor(Date.now() / 1000);
        if (sec !== this.statIdSecond) {
            this.statIdSecond = sec;
            this.statIdCounter = 0;
        }
        const id = this.statIdCounter & 0xff;
        this.statIdCounter = (this.statIdCounter + 1) & 0xff;
        return id;
    }

    //done Función para manejar el cambio de puerto dinámico (segun el valor de "ver" en los endpoints)
    /** Cambia host/puerto si hace falta y garantiza conexión abierta y usable. */
    async switchTargetAndEnsureConnected(opts: { host?: string; port?: number }) {
        const host = opts.host ?? this.defaultHost;
        const port = opts.port ?? this.defaultPort;

        // ¿ya estamos en ese destino y conectados?
        if (this.socket && !this.socket.destroyed &&
            this.socket.remoteAddress === host && this.socket.remotePort === port) {
            return; // ya estamos conectados a ese target
        }

        // Cambiamos target y reconectamos
        this.currentHost = host;
        this.currentPort = port;

        // cerramos la conexión anterior (si la hay)
        if (this.socket && !this.socket.destroyed) {
            this.socket.destroy(); // dispara 'close' pero vamos a conectar manualmente ahora
        }
        await this.connect(); // espera hasta que esté conectada
    }

    /** Registra un estadístico pendiente de ACK. */
    public trackPendingStat(id: number) {
        this.pendingStats.set(id & 0xff, { ts: Date.now() });
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
        return await new Promise<void>((r) => setTimeout(r, ms));
    }

    // ------------------------------------------- CONEXIÓN -------------------------------------------

    //* XXXXXXXXXXXXXXXXXXXXXXXXXX ↓↓↓ NUEVA CONEXIÓN ↓↓↓ XXXXXXXXXXXXXXXXXXXXXXXXXX
    /** Garantiza que hay socket conectado al target actual. */
    private async connect(): Promise<void> {
        if (this.connectPromise) return this.connectPromise; // evita carreras

        this.connectPromise = new Promise<void>((resolve, reject) => {
            const socket = new Socket();
            this.socket = socket;

            // Opcional: mantener viva la conexión
            // s.setKeepAlive(true, 10_000);
            // s.setNoDelay(true);

            socket.connect(this.currentPort, this.currentHost, () => {
                josLogger.info(`🔌 Conectado a ${this.currentHost}:${this.currentPort}`);
                if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
                resolve();
            });

            socket.on('data', (serverResponse) => this.onData(serverResponse));
            socket.on('error', (e) => josLogger.error(`❗ Socket error: ${e.message}`));
            socket.on('close', () => {
                josLogger.error(`🛑 Conexión cerrada (${this.currentHost}:${this.currentPort}). Reintentando en 1s…`);
                this.connectPromise = null;                // ← libera el lock para permitir nuevo connect()
                setTimeout(() => this.connect(), 1000);    // ← reintento único (como antes), no un setInterval
            });
        })

        // return this.connectPromise;
    }

    private onData(serverResponse: Buffer) {
        try {
            const tt = getTipoTrama(serverResponse);
            const tm = getTipoMensaje(serverResponse);

            josLogger.debug('La respuesta (RX) probablemente sea el ACK de la última operación.',);
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

                this.receivedAcks.add(ackId & 0xff); // lo marca como recibido
                josLogger.info(`✅ ACK estadístico id=${ackId} recibido`);

                // (opcional) si mantienes tus métricas antiguas:
                if (this.pendingStats.has(ackId)) this.pendingStats.delete(ackId);

                this.sweepPendingStats();
                return; // ya tratado
            }
        } catch (e) {
            josLogger.error('Error procesando RX: ' + (e as Error).message);
        }
    }
    //* XXXXXXXXXXXXXXXXXXXXXXXXXX ↑↑↑ NUEVA CONEXIÓN ↑↑↑ XXXXXXXXXXXXXXXXXXXXXXXXXX

    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done ----------------------------------------------- ENVIO Y BUILDER EQUIPOS NUEVOS LE ---------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------

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
    crearFrame(params: {
        nodoOrigen: number;
        nodoDestino: number;
        tipoTrama: number;
        tipoMensaje: number;
        data: Buffer;
        reserva?: number;
        versionProtocolo?: number;
    }): FrameDto {
        const {
            nodoOrigen,
            nodoDestino,
            tipoTrama,
            tipoMensaje,
            data,
            reserva = 0,
            versionProtocolo = PROTO_VERSION,
        } = params;

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
            crc: 0, // done se recalcula en serializeFrame
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
        let offset = 0;
        header.writeUInt8(f.versionProtocolo, offset);
        offset += 1;
        header.writeUInt8(f.reserva ?? 0, offset);
        offset += 1;
        header.writeUInt16LE(f.nodoOrigen, offset);
        offset += 2;
        header.writeUInt16LE(f.nodoDestino, offset);
        offset += 2;
        header.writeUInt8(f.tipoTrama, offset);
        offset += 1;
        header.writeUInt8(f.tipoMensaje, offset);
        offset += 1;
        header.writeUInt16LE(f.longitud, offset);
        offset += 2;

        const datosBuf = Buffer.isBuffer(f.datos) ? f.datos : Buffer.alloc(0);

        // === CRC16 IBM/ARC sobre (header + datos) ===
        const crcSegment = Buffer.concat([header, datosBuf]);
        const crcValSwapped = crc16IBM(crcSegment); // ya viene "swappeado" como el server lo compara
        const crcBuf = Buffer.alloc(2);
        crcBuf.writeUInt16BE(crcValSwapped, 0); // el server hace readUInt16BE → ¡coinciden!

        return Buffer.concat([start, header, datosBuf, crcBuf, end]);
    }

    /** Espera hasta timeout a que llegue el ACK con ese id. */
    private async waitAck(id: number, timeoutMs = ACK_TIMEOUT_MS): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            if (this.receivedAcks.has(id & 0xff)) {
                this.receivedAcks.delete(id & 0xff); // lo consumimos
                return; // ACK encontrado
            }
            await this.delay(50); // intervalo de comprobación
        }
        throw new Error(`ACK timeout id=${id}`);
    }

    /** Envía un estadístico y espera su ACK; si no llega en 6s, reintenta el MISMO frame. */
    public async enviarEstadisticoYEsperarAck(
        id: number,
        frame: FrameDto,
    ): Promise<boolean> {
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
                josLogger.warn(
                    `⏳ Timeout ACK (${ACK_TIMEOUT_MS}ms) para estadístico id=${id} → reintentando MISMO frame…`,
                );
                // loop: reintenta mismo frame con mismo id
            }
        }
    }

    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done ----------------------------------------------- ENVIO Y BUILDER EQUIPOS VIEJOS BE ---------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------
    // done -------------------------------------------------------------------------------------------------------------------

    // ------------------------------------------- ENVÍO (VIEJOS, BE) -------------------------------------------
    /** Enviar un FrameOldDto (se serializa internamente a Buffer, BE y CRC 1 byte LSB) */
    enviarFrameOld(frame: FrameOldDto) {
        if (!this.socket || !this.socket.writable) {
            josLogger.fatal('XXX Socket no conectado XXX');
            return false;
        }
        const buf = this.serializarFrameOld(frame);
        this.socket.write(buf);
        return { bytes: buf.length, hex: buf.toString('hex') };
    }

    // ------------------------------------------- BUILDERS (VIEJOS, BE) -------------------------------------------
    /** Builder genérico de FrameOldDto a partir de parámetros sueltos, crea el frame (BE) */
    crearFrameOld(params: {
        nodoOrigen: number;
        nodoDestino: number;
        tipoTrama: number;
        tipoMensaje: number;
        data: Buffer;
        versionProtocolo?: number; // por defecto 1 en el legado
    }): FrameOldDto {
        const {
            nodoOrigen,
            nodoDestino,
            tipoTrama,
            tipoMensaje,
            data,
            versionProtocolo = 1,
        } = params;

        // Límite clásico del campo datos (ajusta al nombre de tus constantes si difiere)
        if (typeof DEF_MAX_DATOS_TRAMA === 'number' && data.length > DEF_MAX_DATOS_TRAMA) {
            throw new Error(`El cuerpo supera ${DEF_MAX_DATOS_TRAMA} bytes`);
        }

        const frame: FrameOldDto = {
            inicioTrama: START,         // mismos delimitadores que en nuevo
            versionProtocolo,           // normalmente 1
            nodoOrigen,
            nodoDestino,
            tipoTrama,
            tipoMensaje,
            longitud: data.length,      // solo bytes de datos
            datos: data,                // Buffer
            crc: 0,                     // se recalcula en serializarFrameOld
            finTrama: END,
        } as FrameOldDto;

        return frame;
    }

    // ------------------------------------------- SERIALIZADOR (VIEJOS, BE) -------------------------------------------
    /** Serializa un FrameOldDto (Big Endian en header y CRC de 1 byte = LSB del CRC16 IBM sobre header+datos) */
    serializarFrameOld(f: FrameOldDto): Buffer {
        const start = f.inicioTrama;
        const end = f.finTrama;

        // Header BE de 9 bytes (NO incluye el "start")
        // Versión(1) + Origen(2 BE) + Destino(2 BE) + TipoTrama(1) + TipoMensaje(1) + LenDatos(2 BE)
        const header = Buffer.alloc(1 + 2 + 2 + 1 + 1 + 2);
        let o = 0;
        header.writeUInt8(f.versionProtocolo & 0xff, o); o += 1;
        header.writeUInt16BE(f.nodoOrigen & 0xffff, o); o += 2;
        header.writeUInt16BE(f.nodoDestino & 0xffff, o); o += 2;
        header.writeUInt8(f.tipoTrama & 0xff, o); o += 1;
        header.writeUInt8(f.tipoMensaje & 0xff, o); o += 1;
        header.writeUInt16BE(f.longitud & 0xffff, o); o += 2;

        const datosBuf = Buffer.isBuffer(f.datos) ? f.datos : Buffer.alloc(0);

        // === CRC16 IBM/ARC sobre (header + datos) y se envía SOLO el LSB (1 byte) ===
        const crcSegment = Buffer.concat([header, datosBuf]);
        const crc16 = crc16IBM(crcSegment);           // 16-bit
        const crcBuf = Buffer.from([crc16 & 0xff]);   // LSB → 1 byte

        return Buffer.concat([start, header, datosBuf, crcBuf, end]);
    }


    /** Espera hasta timeout a que llegue el ACK con ese id. */
    // private async waitAck(id: number, timeoutMs = ACK_TIMEOUT_MS): Promise<void> {
    //     const deadline = Date.now() + timeoutMs;
    //     while (Date.now() < deadline) {
    //         if (this.receivedAcks.has(id & 0xff)) {
    //             this.receivedAcks.delete(id & 0xff); // lo consumimos
    //             return; // ACK encontrado
    //         }
    //         await this.delay(50); // intervalo de comprobación
    //     }
    //     throw new Error(`ACK timeout id=${id}`);
    // }

    // /** Envía un estadístico y espera su ACK; si no llega en 6s, reintenta el MISMO frame. */
    // public async enviarEstadisticoYEsperarAck(
    //     id: number,
    //     frame: FrameDto,
    // ): Promise<boolean> {
    //     // reintentos indefinidos; si quieres límite, añade un contador
    //     while (true) {
    //         this.trackPendingStat(id); // opcional: telemetría

    //         const res = this.enviarFrame(frame);
    //         if (!res) {
    //             josLogger.error(`❌ Fallo al enviar frame de estadístico id=${id}`);
    //             await this.delay(200); // evita bucles calientes
    //             continue;
    //         }

    //         try {
    //             await this.waitAck(id, ACK_TIMEOUT_MS);
    //             return true; // ACK correcto recibido
    //         } catch (e) {
    //             josLogger.warn(
    //                 `⏳ Timeout ACK (${ACK_TIMEOUT_MS}ms) para estadístico id=${id} → reintentando MISMO frame…`,
    //             );
    //             // loop: reintenta mismo frame con mismo id
    //         }
    //     }
    // }

    // ------------------------------------------- PAYLOADS -------------------------------------------

    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * ----------------------------------------------- TT SISTEMAS EQUIPOS NUEVOS LE -------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------

    /** TM_SISTEMA_TX_PRESENTACION (N_variables=6) */
    crearDataPresentacion(p: PresentacionDto) {
        const data = Buffer.alloc(4 * (1 + p.nVariables)); // 7 uint32
        let offset = 0;
        data.writeUInt32LE(p.nVariables, offset);
        offset += 4; // N_variables (6)
        data.writeUInt32LE(p.versionPresentacion, offset);
        offset += 4; // version_presentacion
        data.writeUInt32LE(p.mac, offset);
        offset += 4; // MAC
        data.writeUInt32LE(p.versionEquipo, offset);
        offset += 4; // VERSION_EQUIPO
        data.writeUInt32LE(p.tipoEquipo, offset);
        offset += 4; // tipo_equipo
        data.writeUInt32LE(p.claveEquipo, offset);
        offset += 4; // clave_equipo
        data.writeUInt32LE(p.versionHw, offset);
        offset += 4; // VERSION_HW
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
        data.writeUInt32LE(ed.nVariables, offset);
        offset += 4; // N_variables
        data.writeUInt32LE(ed.version, offset);
        offset += 4; // version
        data.writeUInt32LE(ed.idEnvio, offset);
        offset += 4; // ID_ENVIO
        data.writeUInt32LE(ed.alarmaEquipo, offset);
        offset += 4; // Alarma_equipo
        return data;
    }

    // -------------------------------------------------- TM_SISTEMA_TX_CONFIG_FINAL --------------------------------------------------
    /** 2 × uint32 (8 bytes): version, Envia_estadisticos. Doc 2.4.7. */
    serializarDataConfigFinal(cf: ConfigFinalTxDto) {
        const data = Buffer.alloc(8);
        let o = 0;
        data.writeUInt32LE(cf.version >>> 0, o);
        o += 4; // version
        data.writeUInt32LE(cf.enviaEstadisticos >>> 0, o); // Envia_estadisticos (0/1)
        return data;
    }

    // -------------------------------------------------- TM_SISTEMA_TX_URL_DESCARGA_OTA --------------------------------------------------
    /** 2 × uint32 (8 bytes): VERSION_TRAMA_OTA (=1), tipo_equipo. Doc 2.4.5→1.1.1. */
    serializarDataUrlDescargaOta(ota: UrlDescargaOtaTxDto) {
        const data = Buffer.alloc(8);
        let o = 0;
        data.writeUInt32LE(ota.versionTramaOta >>> 0, o);
        o += 4; // VERSION_TRAMA_OTA (=1)
        data.writeUInt32LE(ota.tipoEquipo >>> 0, o); // tipo_equipo (EN_TIPO_EQUIPO)
        return data;
    }

    // -------------------------------------------------- TM_SISTEMA_TX_PROGRESO_ACTUALIZACION --------------------------------------------------
    /** 3 × uint32 (12 bytes): N_variables, version, estado_progreso. Doc 1.1.3. */
    serializarDataProgresoActualizacion(pa: ProgresoActualizacionTxDto) {
        const data = Buffer.alloc(12);
        let o = 0;
        data.writeUInt32LE(pa.nVariables >>> 0, o);
        o += 4; // N_variables
        data.writeUInt32LE(pa.version >>> 0, o);
        o += 4; // version
        data.writeUInt32LE(pa.estadoProgreso as unknown as number, o); // EN_GCSPA_EVENTO_ACTUALIZACION_SERVER
        return data;
    }

    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * ----------------------------------------------- TT SISTEMAS EQUIPOS VIEJOS BE -------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------
    // * -------------------------------------------------------------------------------------------------------------------

    /** TM_presentacion_central (viejos, BE) */
    crearDataPresentacionOld(p: PresentacionCentralOldDto): Buffer {
        // Datos: 1(tipo) + 8(MAC) + 2(version) + 16(password) + 2(crc) = 29 bytes
        const passBuf = Buffer.alloc(16, 0x00);
        const passBytes = Buffer.from(p.password ?? '', 'utf8');
        passBytes.copy(passBuf, 0, 0, Math.min(passBytes.length, 15)); // null-terminated con relleno 0x00

        const data = Buffer.alloc(29);
        let off = 0;

        data.writeUInt8(p.tipoEquipo & 0xff, off); off += 1;                   // tipo (1)
        data.writeBigUInt64BE(BigInt(p.mac), off); off += 8;                    // MAC (8) BE
        data.writeUInt16BE(p.versionEquipo & 0xffff, off); off += 2;            // versionEquipo (2) BE
        passBuf.copy(data, off); off += 16;                                     // password (16)
        data.writeUInt16BE((p.crcTabla ?? 0) & 0xffff, off); off += 2;          // crcTabla (2) BE
        return data;
    }

    /** TM_rt_presencia_central (old) — BE, 8 bytes por nodo */
    createDataPresenciaOld(p: RtPresenciaCentralOldDto): Buffer {
        const nodos = p?.nodos ?? [];
        if (nodos.length === 0) return Buffer.alloc(0);

        const data = Buffer.alloc(8 * nodos.length);
        let o = 0;

        for (const n of nodos) {
            data.writeUInt16BE((n.crcTabla ?? 0) & 0xffff, o); o += 2; // 16b CRC tabla
            data.writeUInt16BE((n.direccionNodo ?? 0) & 0xffff, o); o += 2; // 16b dirección nodo
            data.writeUInt16BE((n.crcParametros ?? 0) & 0xffff, o); o += 2; // 16b CRC parámetros (0 si no se usa)
            data.writeUInt16BE((n.crcAlarmas ?? 0) & 0xffff, o); o += 2; // 16b CRC alarmas
        }

        return data;
    }

    /** TM_SISTEMA_TX_ESTADO_DISPOSITIVO */
    serializarDataEstadoDispositivoOld(ed: EstadoDispositivoTxDto) {
        const data = Buffer.alloc(16);
        // let offset = 0;
        // data.writeUInt32LE(ed.nVariables, offset);
        // offset += 4; // N_variables
        // data.writeUInt32LE(ed.version, offset);
        // offset += 4; // version
        // data.writeUInt32LE(ed.idEnvio, offset);
        // offset += 4; // ID_ENVIO
        // data.writeUInt32LE(ed.alarmaEquipo, offset);
        // offset += 4; // Alarma_equipo
        return data;
    }

    // -------------------------------------------------- TM_SISTEMA_TX_CONFIG_FINAL --------------------------------------------------
    /** 2 × uint32 (8 bytes): version, Envia_estadisticos. Doc 2.4.7. */
    serializarDataConfigFinalOld(cf: ConfigFinalTxDto) {
        const data = Buffer.alloc(8);
        // let o = 0;
        // data.writeUInt32LE(cf.version >>> 0, o);
        // o += 4; // version
        // data.writeUInt32LE(cf.enviaEstadisticos >>> 0, o); // Envia_estadisticos (0/1)
        return data;
    }

    // -------------------------------------------------- TM_SISTEMA_TX_URL_DESCARGA_OTA --------------------------------------------------
    /** 2 × uint32 (8 bytes): VERSION_TRAMA_OTA (=1), tipo_equipo. Doc 2.4.5→1.1.1. */
    serializarDataUrlDescargaOtaOld(ota: UrlDescargaOtaTxDto) {
        const data = Buffer.alloc(8);
        // let o = 0;
        // data.writeUInt32LE(ota.versionTramaOta >>> 0, o);
        // o += 4; // VERSION_TRAMA_OTA (=1)
        // data.writeUInt32LE(ota.tipoEquipo >>> 0, o); // tipo_equipo (EN_TIPO_EQUIPO)
        return data;
    }

    // -------------------------------------------------- TM_SISTEMA_TX_PROGRESO_ACTUALIZACION --------------------------------------------------
    serializarDataProgresoActualizacionOld(pa: ProgresoActualizacionTxDto) {
        const data = Buffer.alloc(12);
        // let o = 0;
        // data.writeUInt32LE(pa.nVariables >>> 0, o);
        // o += 4; // N_variables
        // data.writeUInt32LE(pa.version >>> 0, o);
        // o += 4; // version
        // data.writeUInt32LE(pa.estadoProgreso as unknown as number, o); // EN_GCSPA_EVENTO_ACTUALIZACION_SERVER
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

    crearDataContador(): Buffer {
        const dto = defaultDataContadorAgua;
        return this.serializarEstadisticoPayload(dto);
    }

    crearDataActividad(): Buffer {
        const dto = defaultDataActividadCalefaccion1;
        return this.serializarEstadisticoPayload(dto);
    }

    crearDataEventoInicioCrianza(): Buffer {
        const dto = defaultDataEventoInicioCrianza;
        return this.serializarEstadisticoPayload(dto);
    }

    crearDataAlarmaTempAlta(): Buffer {
        const dto = defaultDataAlarmaTempAlta;
        return this.serializarEstadisticoPayload(dto);
    }

    crearDataCambioParametro(): Buffer {
        const dto = defaultDataCambioParametro;
        return this.serializarEstadisticoPayload(dto);
    }

    /** Serializa un EnviaEstadisticoDto a Buffer (cabecera + items). */
    private serializarEstadisticoPayload(dto: EnviaEstadisticoDto): Buffer {
        // 4(mac)+1(tipoDatoHdr)+1(idSeg)+1(ver)+1(tipoReg)+4(res1..4)+4(fecha)+4(hora)+1(res5)+1(nDatos)
        const HEADER_LEN = 22;
        const itemsLen = dto.datos.reduce(
            (acc, it) => acc + 2 + (it.sizeDatoByte ?? it.dato.length),
            0,
        );
        const data = Buffer.alloc(HEADER_LEN + itemsLen);

        let offset = 0;

        // cabecera estadístico
        data.writeUInt32LE(dto.mac >>> 0, offset);
        offset += 4; // MAC
        data.writeUInt8((dto.tipoDato & 0xff) >>> 0, offset++); // tipo_dato cabecera (47)
        data.writeUInt8(
            (dto.identificadorUnicoDentroDelSegundo ?? 0) & 0xff,
            offset++,
        ); // id dentro del segundo
        data.writeUInt8((dto.version ?? 0) & 0xff, offset++); // VERSION
        data.writeUInt8((dto.tipoRegistro ?? 0) & 0xff, offset++); // tipo_registro

        data.writeUInt8((dto.res1 ?? 0) & 0xff, offset++);
        data.writeUInt8((dto.res2 ?? 0) & 0xff, offset++);
        data.writeUInt8((dto.res3 ?? 0) & 0xff, offset++);
        data.writeUInt8((dto.res4 ?? 0) & 0xff, offset++);

        // fecha -> yyyymmdd (uint32 LE)
        // const yyyy = (dto.fecha.anyo ?? 0) >>> 0;
        // const mm = (dto.fecha.mes ?? 0) >>> 0;
        // const dd = (dto.fecha.dia ?? 0) >>> 0;
        // const fechaU32 = (yyyy * 10000 + mm * 100 + dd) >>> 0;
        // data.writeUInt32LE(fechaU32, offset);
        // offset += 4;

        // jos Antes serializaba como"yyyymmdd"
        // fecha -> dd-mm-yyyy bit-packed (dia(8) | mes(8) | anyo(16)) en LE
        const dd = (dto.fecha.dia ?? 0) & 0xff;
        const mm = (dto.fecha.mes ?? 0) & 0xff;
        const yyyy = (dto.fecha.anyo ?? 0) & 0xffff;
        const fechaU32 = (yyyy << 16) | (mm << 8) | dd; // <-- DD-MM-YYYY bit-packed

        data.writeUInt32LE(fechaU32, offset);
        offset += 4;

        // hora -> segundos desde 00:00 (uint32 LE)
        const hh = (dto.hora.hora ?? 0) >>> 0;
        const mi = (dto.hora.min ?? 0) >>> 0;
        const ss = (dto.hora.seg ?? 0) >>> 0;
        const segundosDelDia = (hh * 3600 + mi * 60 + ss) >>> 0; //jos la IA podría usar aquí el tiempoToSeg y terminamos antes
        data.writeUInt32LE(segundosDelDia, offset);
        offset += 4;

        data.writeUInt8((dto.res5 ?? 0) & 0xff, offset++);

        const nDatos = dto.datos.length & 0xff;
        data.writeUInt8(nDatos, offset++); // numero_datos

        // items datos[]: tipo (u8) | size (u8) | dato[size]
        for (const it of dto.datos) {
            const size = it.sizeDatoByte ?? it.dato.length;
            if (size !== it.dato.length) {
                throw new Error(
                    `Size inconsistente en item tipo=${it.tipoDato}: sizeDatoByte=${it.sizeDatoByte} dato.len=${it.dato.length}`,
                );
            }
            data.writeUInt8((it.tipoDato & 0xff) >>> 0, offset++); // tipo_dato
            data.writeUInt8(size & 0xff, offset++); // size_dato_byte
            it.dato.copy(data, offset);
            offset += size; // dato[size]
        }

        return data;
    }

    //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
    //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
    //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
    //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
    //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP

    // tcp-client.service.ts

    /** Handler: PRESENTACIÓN (equipos nuevos, LE) */
    async handlerPresentacion(): Promise<boolean | { bytes: number; hex: string }> {
        const pres: PresentacionDto = defaultPresentacionCTI40;
        const data = this.crearDataPresentacion(pres);

        const frame = this.crearFrame({
            nodoOrigen: 1,
            nodoDestino: 0,
            tipoTrama: EnTipoTrama.sistema,            // TT_SISTEMA
            tipoMensaje: EnTmSistema.txPresentacion,   // TM_SISTEMA_TX_PRESENTACION
            data,
            reserva: 0,                                 // presente en “nuevos”
        });

        return this.enviarFrame(frame);
    }


    /** Handler: PRESENCIA (equipos nuevos, LE) */
    async handlerPresencia(): Promise<boolean | { bytes: number; hex: string }> {
        const data = this.crearDataPresencia(); // vacío
        const frame = this.crearFrame({
            nodoOrigen: 1,
            nodoDestino: 0,
            tipoTrama: EnTipoTrama.sistema,          // TT_SISTEMA
            tipoMensaje: EnTmSistema.txPresencia,    // TM_SISTEMA_TX_PRESENCIA
            data,
            reserva: 0,
        });

        return this.enviarFrame(frame);
    }

    // Presentación (central -> servidor) — protocolo antiguo (BE) 
    async handlerPresentacionOld(): Promise<boolean | { bytes: number; hex: string }> {
        const presOld: PresentacionCentralOldDto = defaultPresentacionOmegaOld;
        const data = this.crearDataPresentacionOld(presOld);

        const frameOld = this.crearFrameOld({
            nodoOrigen: 1,
            nodoDestino: 0,
            tipoTrama: EnTipoTramaOld.ttCentralServidor, // TT_central_servidor (=6)
            tipoMensaje: EnTipoMensajeCentralServidor.tmTramaPresentacionCentral, // (=8)
            data,
            versionProtocolo: PROTO_VERSION_BE,
        });

        return this.enviarFrameOld(frameOld);
    }

    // Presencia (central -> servidor) — protocolo antiguo (BE)    
    async handlerPresenciaOld(): Promise<boolean | { bytes: number; hex: string }> {
        // Si quieres enviar nodos reales, pásalos aquí. Con [] se envía payload vacío.
        const data = this.createDataPresenciaOld({ nodos: [] });

        const frameOld = this.crearFrameOld({
            nodoOrigen: 1,
            nodoDestino: 0,
            tipoTrama: EnTipoTramaOld.ttCentralServidor, // TT_central_servidor (=6)
            tipoMensaje: EnTipoMensajeCentralServidor.tmRtPresenciaCentral, // (=7)
            data,
            versionProtocolo: PROTO_VERSION_BE,
        });

        return this.enviarFrameOld(frameOld);
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
    // crearDataMetricas(seq = 0) {
    //   const data = Buffer.alloc(12);
    //   const sentNs = process.hrtime.bigint();   // reloj monotónico (ns)
    //   data.writeBigUInt64LE(sentNs, 0);         // u64 LE
    //   data.writeUInt32LE(seq >>> 0, 8);         // u32 LE
    //   return data;
    // }
}
