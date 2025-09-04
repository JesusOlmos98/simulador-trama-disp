
export const INICIO_TRAMA_BE = Buffer.from([0xCC, 0xAA, 0xAA, 0xAA]);
export const FIN_TRAMA_BE    = Buffer.from([0xCC, 0xBB, 0xBB, 0xBB]);

/**
 * NOTA GLOBAL (BE):
 * - Todos los campos multi-byte (longitud, CRC, direcciones, versiones, etc.)
 *   se codifican/decodifican en **Big Endian**.
 * - "longitud" es el tamaño en bytes del campo `datos` únicamente.
 */

// Opcional: completa estos enums con los valores reales si ya los tienes en tu proyecto.
export enum EnTipoTramaBE {
  centralServidor = 0x11, // TT_central_servidor
}

export enum EnTipoMensajeBE {
  presentacionCentral = 0x11,     // TM_presentacion_central
  rtPresenciaCentral = 0x22,      // TM_rt_presencia_central
}

// === Cabecera (equivalente a HeaderFields) ===
export interface HeaderFieldsBe {
  versionProtocolo: number; // 1 byte si así lo define tu framing; numérico en código
  reserva: number;          // conserva el campo 'reserva' como en tu DTO original
  nodoOrigen: number;       // central
  nodoDestino: number;      // servidor
  tipoTrama: number;        // TT_central_servidor
  tipoMensaje: number;      // TM_presentacion_central | TM_rt_presencia_central | ...
  longitud: number;         // tamaño del bloque `datos`
}

// === Datos de TM_presentacion_central ===
// Datos a enviar:
// 1 byte  tipoDispositivo
// 8 bytes MAC
// 2 bytes versionEquipo
// 16 bytes password (terminado en '\0' si sobra espacio)
// 2 bytes crcTabla
export interface PresentacionCentralDto {
  tipoDispositivo: number;  // 1 byte
  mac: Buffer;              // 8 bytes (representación raw; si prefieres string, cámbialo a string "AA:BB:...")
  versionEquipo: number;    // uint16 BE
  password: string;         // hasta 16 bytes, null-terminated si <16
  crcTabla: number;         // uint16 BE
}

// === Datos de TM_rt_presencia_central ===
// Secuencia repetida por nodo (antiguo):
// [ crcTabla(2) , direccionNodo(2) , crcParametros(2) , crcAlarmas(2) ] x N
// En el método nuevo solo se envía el crcTabla por nodo, pero aquí modelamos el antiguo.
export interface PresenciaNodoCrc {
  direccionNodo: number;    // uint16 BE
  crcTabla: number;         // uint16 BE
  crcParametros: number;    // uint16 BE (en antiguo; 0 en nuevo)
  crcAlarmas: number;       // uint16 BE
}

export interface PresenciaCentralDto {
  nodos: PresenciaNodoCrc[]; // lista de nodos incluidos en la presencia
}

// Unión de “datos” posibles para central → servidor (puedes ampliarla con más TMs)
export type DatosCentralServidor =
  | PresentacionCentralDto
  | PresenciaCentralDto
  | Buffer; // para TMs que aún no hayas tipado

// === Frame BE (equivalente a tu FrameDto) ===
export class FrameBeDto {
  inicioTrama: Buffer = INICIO_TRAMA_BE;

  versionProtocolo!: number;
  reserva!: number;
  nodoOrigen!: number;     // central
  nodoDestino!: number;    // servidor
  tipoTrama!: number;      // TT_central_servidor
  tipoMensaje!: number;    // p.ej. EnTipoMensajeBE.presentacionCentral
  longitud!: number;       // bytes del campo `datos` (no incluye CRC ni finales)

  datos!: DatosCentralServidor;

  crc!: number;            // uint16 BE del frame según tu algoritmo (defínelo donde corresponda)
  finTrama: Buffer = FIN_TRAMA_BE;
}
