import { crc16IBM } from "src/utils/crc";
import { START_OLD, END_OLD, HEADER_OFFSET_OLD, HEADER_SIZE_OLD, H_VER_OFF_OLD, H_ORIG_OFF_OLD, H_DEST_OFF_OLD, H_TT_OFF_OLD, H_TM_OFF_OLD, H_LEN_OFF_OLD } from "../globals/constGlobales";

// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------- getters de frame general (OLD / BE) -------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getStartOld -------------------------------------------
/** Verifica que el frame comienza con el delimitador START_OLD. */
export function getStartOld(frame: Buffer): Buffer {
  return frame.subarray(0, START_OLD.length);
}

// ------------------------------------------- getEndOld -------------------------------------------
/** Verifica que el frame termina con el delimitador END_OLD. */
export function getEndOld(frame: Buffer): Buffer {
  return frame.subarray(frame.length - END_OLD.length);
}

//*  Validación de inicio y fin
// ------------------------------------------- inicioCorrectoOld -------------------------------------------
export function inicioCorrectoOld(buf: Buffer): boolean {
  return getStartOld(buf).equals(START_OLD);
}

// ------------------------------------------- finalCorrectoOld -------------------------------------------
export function finalCorrectoOld(buf: Buffer): boolean {
  return getEndOld(buf).equals(END_OLD);
}

// ------------------------------------------- getHeaderOld -------------------------------------------
/**
 * Devuelve el header sin delimitadores ni CRC ni END. Son 9 bytes, no 10.
 * Header = versión(1) + !!!!reserva(1) NO!!!! + nodoOrigen(2 BE) + nodoDestino(2 BE) + tipoTrama(1) + tipoMensaje(1) + longitud(2 BE)
 */
export function getHeaderOld(frame: Buffer): Buffer {
  const startOffset = START_OLD.length;
  // header fijo: 1+1+2+2+1+1+2 = 10 bytes MAL, NO HAY RESERVA EN LOS ANTIGUOS, son 9 bytes
  return frame.subarray(startOffset, startOffset + HEADER_SIZE_OLD); // ✅ (HEADER_SIZE_OLD = 9)

}

// ------------------------------------------- getDataSectionOld -------------------------------------------
/** Extrae la sección de datos (payload) del frame OLD. */
export function getDataSectionOld(frame: Buffer): Buffer | undefined {
  const start = HEADER_OFFSET_OLD + HEADER_SIZE_OLD; // 13
  const len = frame.readUInt16BE(HEADER_OFFSET_OLD + H_LEN_OFF_OLD); // +7
  const end = start + len;
  if (end + 1 + END_OLD.length > frame.length) return undefined; // +1 CRC (LSB) +4 END
  return frame.subarray(start, end);
}


// CRC = LSB del CRC16 → 1 byte
export function getCRCFromFrameOld(frame: Buffer): number {
  const { longitud } = getParsedHeaderOld(frame);
  const crcOffset = HEADER_OFFSET_OLD + HEADER_SIZE_OLD + longitud;
  if (crcOffset + 1 > frame.length) throw new Error("CRC fuera de rango");
  return frame.readUInt8(crcOffset);
}

// ------------------------------------------- getCROld -------------------------------------------
/** Recalcula el CRC sobre header+datos y lo compara con el recibido. Implementación CRC16 IBM/ARC (polinomio 0xA001). */
export function getCROld(frame: Buffer): {
  ok: boolean;
  expected: number;
  received: number;
} {
  const header = getHeaderOld(frame);
  const data = getDataSectionOld(frame);

  const buf = Buffer.concat([header, data!]);
  const expected = crc16IBM(buf);
  const received = getCRCFromFrameOld(frame);

  return {
    ok: expected === received,
    expected,
    received,
  };
}

// ------------------------------------------- parseHeaderOld -------------------------------------------
export interface HeaderFieldsOld {
  versionProtocolo: number;
  nodoOrigen: number;   // u16 BE
  nodoDestino: number;  // u16 BE
  tipoTrama: number;    // u8
  tipoMensaje: number;  // u8
  longitud: number;     // u16 BE (bytes de la sección datos)
}

// ------------------------------------------- parseHeaderOld -------------------------------------------
/** Parsea el header y devuelve un objeto con los campos. */
export function getParsedHeaderOld(frame: Buffer) {
  const off = HEADER_OFFSET_OLD;
  if (frame.length < off + HEADER_SIZE_OLD) throw new Error("Cabecera OLD incompleta");
  const versionProtocolo = frame.readUInt8(off + H_VER_OFF_OLD);
  const nodoOrigen = frame.readUInt16BE(off + H_ORIG_OFF_OLD); // BE
  const nodoDestino = frame.readUInt16BE(off + H_DEST_OFF_OLD); // BE
  const tipoTrama = frame.readUInt8(off + H_TT_OFF_OLD);
  const tipoMensaje = frame.readUInt8(off + H_TM_OFF_OLD);
  const longitud = frame.readUInt16BE(off + H_LEN_OFF_OLD);  // BE

  const headerOld: HeaderFieldsOld = { versionProtocolo, nodoOrigen, nodoDestino, tipoTrama, tipoMensaje, longitud }

  return headerOld;
}

// ------------------------------------------- getTipoTramaOld -------------------------------------------
export function getTipoTramaOld(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET_OLD + H_TT_OFF_OLD); // +5
}

// ------------------------------------------- getTipoMensajeOld -------------------------------------------
export function getTipoMensajeOld(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET_OLD + H_TM_OFF_OLD); // +6
}

// ------------------------------------------- getLongitudOld -------------------------------------------
export function getLongitudOld(frame: Buffer): number {
  // ✅ usar el offset correcto (+7) o, mejor, la constante
  return frame.readUInt16BE(HEADER_OFFSET_OLD + H_LEN_OFF_OLD); // H_LEN_OFF_OLD = 7
}
