import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'node:net';
import { josLogger } from 'src/utils/logger';
import { FrameDto, PresentacionDto } from 'src/dto/frame.dto';
import { crc16IBM } from 'src/utils/crc';
import { EnvConfiguration } from 'config/app.config';

//! CAPA 0

const env = EnvConfiguration();

const HOST = '127.0.0.1';
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
    this.socket.connect(DESTINY_PORT, HOST, () => {
      josLogger.info(`🔌 Cliente TCP conectado a ${HOST}:${DESTINY_PORT}`);
    });
    this.socket.on('data', d => {
      josLogger.debug('📨 RX raw: ' + d.toString());
      josLogger.debug(`📨 RX len=${d.length}`);
      josLogger.debug('📨 RX HEX:\n' + hexDump(d));
      josLogger.debug('📨 RX b64: ' + d.toString('base64') + '\n');
    });
    this.socket.on('error', e => josLogger.error('❗ Socket error: ' + e.message));
    this.socket.on('close', () => {
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

  /** Serializa un FrameDto (creado con crearFrame) a Buffer (Little Endian) */
  serializarFrame(f: FrameDto): Buffer {
    const start = f.inicioTrama;
    const end = f.finTrama;

    const header = Buffer.alloc(1 + 1 + 2 + 2 + 1 + 1 + 2);
    let offset = 0;
    header.writeUInt8(f.versionProtocolo, offset); offset += 1;
    header.writeUInt8(f.reserva ?? 0, offset); offset += 1;
    header.writeUInt16LE(f.nodoOrigen, offset); offset += 2;
    header.writeUInt16LE(f.nodoDestino, offset); offset += 2;
    header.writeUInt8(f.tipoTrama, offset); offset += 1;
    header.writeUInt8(f.tipoMensaje, offset); offset += 1;
    header.writeUInt16LE(f.longitud, offset); offset += 2;

    const datosBuf = Buffer.isBuffer(f.datos) ? f.datos : Buffer.alloc(0); // ! si alguien dejó un DTO aquí por error, mandamos vacío

    // CRC-16 Modbus sobre header+datos (placeholder)
    const crc = Buffer.alloc(2);
    const crcVal = crc16IBM(Buffer.concat([header, datosBuf]));
    crc.writeUInt16LE(crcVal, 0);

    return Buffer.concat([start, header, datosBuf, crc, end]);
  }

  // ------------------------------------------- PAYLOADS -------------------------------------------
  /** Cuerpo TM_SISTEMA_TX_PRESENTACION (N_variables=6) */
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

  /** Cuerpo TM_SISTEMA_TX_PRESENCIA (vacío) */
  crearDataPresencia() {
    return Buffer.alloc(0);
  }

  /** Demo: cuerpo con una temperatura uint32 (x100) */
  crearDataTempS1(tempC: number) {
    const data = Buffer.alloc(4);
    const raw = Math.round(tempC * 100);
    data.writeUInt32LE(raw, 0);
    return data;
  }

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

  //jos Ver nuevo src/utils/crc.ts
  // ------------------------------------------- CRC -------------------------------------------
  // CRC-16 Modbus (0xA001).
  // private crc16Modbus(buf: Buffer) {
  //   let crc = 0xFFFF;
  //   for (let pos = 0; pos < buf.length; pos++) {
  //     crc ^= buf[pos];
  //     for (let i = 0; i < 8; i++) {
  //       const lsb = crc & 1;
  //       crc >>= 1;
  //       if (lsb) crc ^= 0xA001;
  //     }
  //   }
  //   return crc & 0xFFFF;
  // }
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
