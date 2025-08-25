import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'node:net';
import { josLogger } from 'src/logger';

const HOST = '127.0.0.1';
const PORT = 8010;

// === Constantes protocolo ===
const START = Buffer.from([0xCC, 0xAA, 0xAA, 0xAA]);
const END = Buffer.from([0xCC, 0xBB, 0xBB, 0xBB]);

const PROTO_VERSION = 2; // según doc
const TT_SISTEMA = 25;   // Tipo de trama SISTEMA
const TM_SISTEMA_TX_PRESENTACION = 1;
const TM_SISTEMA_TX_PRESENCIA = 4;

// Máximo datos (no frame completo): 2480 bytes
const MAX_DATA_BYTES = 2480; // ver sección 1 del doc

@Injectable()
export class TcpClientService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;

  onModuleInit() {
    this.connect();
  }
  onModuleDestroy() {
    this.socket?.destroy();
  }

  private connect() {
    this.socket = new Socket();
    this.socket.connect(PORT, HOST, () => {
      josLogger.info(`🔌 Cliente TCP conectado a ${HOST}:${PORT}`);
    });
    this.socket.on('data', d => {
      josLogger.debug('📨 RX raw: ' + d.toString())
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

  /** Enviar un frame ya montado */
  sendFrame(frame: Buffer) {
    if (!this.socket || !this.socket.writable) {
      throw new Error('Socket no conectado');
    }
    this.socket.write(frame);
    return { bytes: frame.length, hex: frame.toString('hex') };
  }

  /** Builder genérico de frame CTI (little-endian) */
  buildFrame(params: {
    reserved?: number,
    originNode: number,
    destNode: number,
    tipoTrama: number,
    tipoMensaje: number,
    data: Buffer
  }) {
    const {
      reserved = 0,
      originNode,
      destNode,
      tipoTrama,
      tipoMensaje,
      data
    } = params;

    if (data.length > MAX_DATA_BYTES) {
      throw new Error(`El cuerpo supera ${MAX_DATA_BYTES} bytes`);
    }

    // Encabezado variable (después del START)
    const header = Buffer.alloc(1 + 1 + 2 + 2 + 1 + 1 + 2); // ver sección 1
    let o = 0;
    header.writeUInt8(PROTO_VERSION, o); o += 1;           // Versión protocolo
    header.writeUInt8(reserved, o); o += 1;                 // Reserva
    header.writeUInt16LE(originNode, o); o += 2;            // Nodo origen
    header.writeUInt16LE(destNode, o); o += 2;              // Nodo destino
    header.writeUInt8(tipoTrama, o); o += 1;                // Tipo de Trama
    header.writeUInt8(tipoMensaje, o); o += 1;              // Tipo de mensaje
    header.writeUInt16LE(data.length, o); o += 2;           // Tamaño datos

    // CRC de 2 bytes sobre (header + data) o sobre todo excepto START/END (el doc no lo precisa).
    // Usamos Modbus/IBM (0xA001) como placeholder típico y lo escribimos LE.
    const crc = Buffer.alloc(2);
    const crcVal = this.crc16Modbus(Buffer.concat([header, data]));
    crc.writeUInt16LE(crcVal, 0);

    // Frame completo: START + header + data + CRC + END
    return Buffer.concat([START, header, data, crc, END]);
  }

  // CRC-16 Modbus (placeholder). Si tu equipo usa otro polinomio, cámbialo.
  private crc16Modbus(buf: Buffer) {
    let crc = 0xFFFF;
    for (let pos = 0; pos < buf.length; pos++) {
      crc ^= buf[pos];
      for (let i = 0; i < 8; i++) {
        const lsb = crc & 1;
        crc >>= 1;
        if (lsb) crc ^= 0xA001;
      }
    }
    return crc & 0xFFFF;
  }

  /** Cuerpo TM_SISTEMA_TX_PRESENTACION (N_variables=6) */
  buildDataPresentacion(p: {
    versionPresentacion: number,
    mac: number,
    versionEquipo: number,
    tipoEquipo: number,
    claveEquipo: number,
    versionHw: number
  }) {
    const data = Buffer.alloc(4 * (1 + 6)); // 7 uint32
    let o = 0;
    data.writeUInt32LE(6, o); o += 4;                         // N_variables (6)
    data.writeUInt32LE(p.versionPresentacion, o); o += 4;     // version_presentacion
    data.writeUInt32LE(p.mac, o); o += 4;                     // MAC
    data.writeUInt32LE(p.versionEquipo, o); o += 4;           // VERSION_EQUIPO
    data.writeUInt32LE(p.tipoEquipo, o); o += 4;              // tipo_equipo
    data.writeUInt32LE(p.claveEquipo, o); o += 4;             // clave_equipo
    data.writeUInt32LE(p.versionHw, o); o += 4;               // VERSION_HW
    return data;
  }

  /** Cuerpo TM_SISTEMA_TX_PRESENCIA (el doc no define campos -> vacío) */
  buildDataPresencia() {
    return Buffer.alloc(0);
  }

  /** Demo: cuerpo con una temperatura uint32 (x100) */
  buildDataTempS1(tempC: number) {
    const data = Buffer.alloc(4);
    const raw = Math.round(tempC * 100);
    data.writeUInt32LE(raw, 0);
    return data;
  }
}

function hexDump(buf: Buffer, width = 16): string {
  const hex: string[] = buf.toString('hex').match(/.{1,2}/g) ?? []; // ← string[]
  const lines: string[] = [];                                       // ← string[]

  for (let i = 0; i < hex.length; i += width) {
    const slice = hex.slice(i, i + width);                          // string[]
    lines.push(slice.join(' '));                                    // ok
  }
  return lines.join('\n');
}




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
