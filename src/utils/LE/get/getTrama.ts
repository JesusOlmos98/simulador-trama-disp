import { HeaderFields } from 'src/utils/dtoLE/frame.dto';
import { crc16IBM } from 'src/utils/crc';
import {
  START,
  END,
  HEADER_OFFSET,
  HEADER_SIZE,
} from '../globals/constGlobales';
import { EnTipoTrama } from '../globals/enums';

//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de frame general ------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ======================= CAPA 1 — BYTES (Little Endian) =======================

// Delimitadores
export function getStartBytes(frame: Buffer): Buffer {
  return frame.subarray(0, START.length);
}
export function getEndBytes(frame: Buffer): Buffer {
  return frame.subarray(frame.length - END.length);
}

// Header (10B = 1+1+2+2+1+1+2)
export function getHeaderBytes(frame: Buffer): Buffer {
  const startOffset = START.length;
  return frame.subarray(startOffset, startOffset + HEADER_SIZE); // HEADER_SIZE=10
}

// Campos del header (en bytes)
export function getHeaderVersionBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(0, 1);
}
export function getHeaderReservaBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(1, 2);
}
export function getHeaderNodoOrigenBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(2, 4); // u16 LE
}
export function getHeaderNodoDestinoBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(4, 6); // u16 LE
}
export function getHeaderTipoTramaBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(6, 7); // u8
}
export function getHeaderTipoMensajeBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(7, 8); // u8
}
export function getHeaderLongitudBytes(frame: Buffer): Buffer {
  return getHeaderBytes(frame).subarray(8, 10); // u16 LE
}

// DATA (payload) en bytes
export function getDataSectionBytes(frame: Buffer): Buffer {
  const dataLen = getLongitud(frame);
  const dataStart = HEADER_OFFSET + HEADER_SIZE;
  return frame.subarray(dataStart, dataStart + dataLen);
}

// Identificador único de RT-estadísticos (último byte de DATA)
export function getEstadisticoIdUnicoBytes(frame: Buffer): Buffer | undefined {
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  const data = getDataSectionBytes(frame);
  if (data.length < 1) return undefined;
  return data.subarray(data.length - 1, data.length);
}

// CRC (2 bytes LE)
export function getCRCFieldBytes(frame: Buffer): Buffer {
  const dataLen = getLongitud(frame);
  const crcOffset = START.length + HEADER_SIZE + dataLen;
  return frame.subarray(crcOffset, crcOffset + 2);
}


// ======================= CAPA 2 — VALORES (usa CAPA 1) =======================

// Compat: mismas firmas públicas que ya usabas

export function getStart(frame: Buffer): Buffer {
  return getStartBytes(frame);
}
export function getEnd(frame: Buffer): Buffer {
  return getEndBytes(frame);
}

export function inicioCorrecto(buf: Buffer): boolean {
  return getStartBytes(buf).equals(START);
}
export function finalCorrecto(buf: Buffer): boolean {
  return getEndBytes(buf).equals(END);
}

export function getHeader(frame: Buffer): Buffer {
  return getHeaderBytes(frame);
}

export function getDataSection(frame: Buffer): Buffer {
  return getDataSectionBytes(frame);
}

// Lectores de valores sueltos (Header LE)
export function getTipoTrama(frame: Buffer): number {
  const b = getHeaderTipoTramaBytes(frame);
  return b.readUInt8(0);
}
export function getTipoMensaje(frame: Buffer): number {
  const b = getHeaderTipoMensajeBytes(frame);
  return b.readUInt8(0);
}
export function getLongitud(frame: Buffer): number {
  const b = getHeaderLongitudBytes(frame);
  return b.readUInt16LE(0);
}

// Identificador único (si aplica a TT_ESTADISTICOS)
export function getIdentificadorUnicoDentroDelSegundo(frame: Buffer): number | undefined {
  const b = getEstadisticoIdUnicoBytes(frame);
  return b ? b.readUInt8(0) : undefined;
}

// CRC16 LE recibido
export function getCRCFromFrame(frame: Buffer): number {
  return getCRCFieldBytes(frame).readUInt16LE(0);
}

// Recalcular y comparar CRC
export function getCRC(frame: Buffer): {
  ok: boolean;
  expected: number;
  received: number;
} {
  const header = getHeaderBytes(frame);
  const data = getDataSectionBytes(frame);
  const expected = crc16IBM(Buffer.concat([header, data]));
  const received = getCRCFromFrame(frame);
  return { ok: expected === received, expected, received };
}

// Parse completo del header (valores)
export function parseHeader(frame: Buffer): HeaderFields {
  const versionProtocolo = getHeaderVersionBytes(frame).readUInt8(0);
  const reserva = getHeaderReservaBytes(frame).readUInt8(0);
  const nodoOrigen = getHeaderNodoOrigenBytes(frame).readUInt16LE(0);
  const nodoDestino = getHeaderNodoDestinoBytes(frame).readUInt16LE(0);
  const tipoTrama = getTipoTrama(frame);
  const tipoMensaje = getTipoMensaje(frame);
  const longitud = getLongitud(frame);

  return { versionProtocolo, reserva, nodoOrigen, nodoDestino, tipoTrama, tipoMensaje, longitud };
}
