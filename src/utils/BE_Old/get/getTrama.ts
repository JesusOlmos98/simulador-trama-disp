import { crc16IBM } from 'src/utils/crc';
import {
  START_OLD,
  END_OLD,
  HEADER_OFFSET_OLD,
  HEADER_SIZE_OLD,
  H_VER_OFF_OLD,
  H_ORIG_OFF_OLD,
  H_DEST_OFF_OLD,
  H_TT_OFF_OLD,
  H_TM_OFF_OLD,
  H_LEN_OFF_OLD,
} from '../globals/constGlobales';
import { HeaderFieldsOld } from 'src/utils/dtoBE/frameOld.dto';
import { josLogger } from 'src/utils/josLogger';
import {
  EnTipoTramaOld,
  EnTipoMensajeDispositivoCentral,
} from '../globals/enumOld';

// ============================================================================
// LECTURA EN DOS CAPAS (OLD): 1) BYTES CRUDOS  2) VALOR INTERPRETADO
// Reutiliza nombres donde tiene sentido para minimizar refactors.
// ============================================================================

// 1) CAPA RAW (BYTES)

/** Devuelve los bytes de inicio (START_OLD) del frame. */
export function getStartOld(frame: Buffer): Buffer {
  return frame.subarray(0, START_OLD.length);
}

/** Devuelve los bytes de fin (END_OLD) del frame. */
export function getEndOld(frame: Buffer): Buffer {
  return frame.subarray(frame.length - END_OLD.length);
}

/** Devuelve el header OLD (9B) sin START/CRC/END. */
export function getHeaderOld(frame: Buffer): Buffer {
  const startOffset = START_OLD.length;
  // Header = versión(1) + nodoOrigen(2) + nodoDestino(2) + tipoTrama(1) + tipoMensaje(1) + longitud(2) = 9 bytes
  if (frame.length < startOffset + HEADER_SIZE_OLD) {
    throw new Error('Cabecera OLD incompleta');
  }
  return frame.subarray(startOffset, startOffset + HEADER_SIZE_OLD); // HEADER_SIZE_OLD = 9
}

/** Bytes del campo versión de protocolo (1B). */
export function getBytesVersionProtocoloOld(frame: Buffer): Buffer {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD)
    throw new Error('Cabecera OLD incompleta');
  const off = HEADER_OFFSET_OLD + H_VER_OFF_OLD;
  return frame.subarray(off, off + 1);
}

/** Bytes del campo nodoOrigen (2B, BE). */
export function getBytesNodoOrigenOld(frame: Buffer): Buffer {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD)
    throw new Error('Cabecera OLD incompleta');
  const off = HEADER_OFFSET_OLD + H_ORIG_OFF_OLD;
  return frame.subarray(off, off + 2);
}

/** Bytes del campo nodoDestino (2B, BE). */
export function getBytesNodoDestinoOld(frame: Buffer): Buffer {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD)
    throw new Error('Cabecera OLD incompleta');
  const off = HEADER_OFFSET_OLD + H_DEST_OFF_OLD;
  return frame.subarray(off, off + 2);
}

/** Bytes del campo tipoTrama (1B). */
export function getBytesTipoTramaOld(frame: Buffer): Buffer {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD)
    throw new Error('Cabecera OLD incompleta');
  const off = HEADER_OFFSET_OLD + H_TT_OFF_OLD;
  return frame.subarray(off, off + 1);
}

/** Bytes del campo tipoMensaje (1B). */
export function getBytesTipoMensajeOld(frame: Buffer): Buffer {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD)
    throw new Error('Cabecera OLD incompleta');
  const off = HEADER_OFFSET_OLD + H_TM_OFF_OLD;
  return frame.subarray(off, off + 1);
}

/** Bytes del campo longitud (2B, BE). */
export function getBytesLongitudOld(frame: Buffer): Buffer {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD)
    throw new Error('Cabecera OLD incompleta');
  const off = HEADER_OFFSET_OLD + H_LEN_OFF_OLD;
  return frame.subarray(off, off + 2);
}

/** Devuelve la sección de datos (payload) del frame OLD (según longitud). */
export function getDataSectionOld(frame: Buffer): Buffer | undefined {
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD) return undefined;
  const start = HEADER_OFFSET_OLD + HEADER_SIZE_OLD;
  const len = frame.readUInt16BE(HEADER_OFFSET_OLD + H_LEN_OFF_OLD);
  const end = start + len;
  // +1 (CRC LSB) + END_OLD
  if (end + 1 + END_OLD.length > frame.length) return undefined;
  return frame.subarray(start, end);
}

/** Devuelve el byte de CRC recibido (LSB del CRC16). */
export function getBytesCRCOld(frame: Buffer): Buffer {
  const { longitud } = getParsedHeaderOld(frame); // usa capa-valor, pero solo para el offset
  const crcOffset = HEADER_OFFSET_OLD + HEADER_SIZE_OLD + longitud;
  if (crcOffset + 1 > frame.length) throw new Error('CRC fuera de rango');
  return frame.subarray(crcOffset, crcOffset + 1);
}

// 2) CAPA VALOR (PARSEADO)

/** ¿El inicio de trama coincide con START_OLD? */
export function inicioCorrectoOld(buf: Buffer): boolean {
  return getStartOld(buf).equals(START_OLD);
}

/** ¿El final de trama coincide con END_OLD? */
export function finalCorrectoOld(buf: Buffer): boolean {
  return getEndOld(buf).equals(END_OLD);
}

/** Valor: versión de protocolo (u8). */
export function getValorVersionProtocoloOld(frame: Buffer): number {
  const b = getBytesVersionProtocoloOld(frame);
  return b.readUInt8(0);
}

/** Valor: nodoOrigen (u16 BE). */
export function getValorNodoOrigenOld(frame: Buffer): number {
  const b = getBytesNodoOrigenOld(frame);
  return b.readUInt16BE(0);
}

/** Valor: nodoDestino (u16 BE). */
export function getValorNodoDestinoOld(frame: Buffer): number {
  const b = getBytesNodoDestinoOld(frame);
  return b.readUInt16BE(0);
}

/** Valor: tipoTrama (u8). */
export function getValorTipoTramaOld(frame: Buffer): number {
  const b = getBytesTipoTramaOld(frame);
  return b.readUInt8(0);
}

/** Valor: tipoMensaje (u8). */
export function getValorTipoMensajeOld(frame: Buffer): number {
  const b = getBytesTipoMensajeOld(frame);
  return b.readUInt8(0);
}

/** Valor: longitud (u16 BE). */
export function getValorLongitudOld(frame: Buffer): number {
  const b = getBytesLongitudOld(frame);
  return b.readUInt16BE(0);
}

/** Valor: CRC recibido (LSB). */
export function getCRCFromFrameOld(frame: Buffer): number {
  const b = getBytesCRCOld(frame);
  return b.readUInt8(0);
}

// ---------------------------------------------------------------------------
// PARSE HEADER COMPLETO (usando las funciones valor)
// ---------------------------------------------------------------------------

/** Parsea el header OLD y devuelve los campos interpretados. */
export function getParsedHeaderOld(frame: Buffer): HeaderFieldsOld {
  // Validación de cabecera mínima
  if (frame.length < HEADER_OFFSET_OLD + HEADER_SIZE_OLD) {
    throw new Error('Cabecera OLD incompleta');
  }
  return {
    versionProtocolo: getValorVersionProtocoloOld(frame),
    nodoOrigen: getValorNodoOrigenOld(frame),
    nodoDestino: getValorNodoDestinoOld(frame),
    tipoTrama: getValorTipoTramaOld(frame),
    tipoMensaje: getValorTipoMensajeOld(frame),
    longitud: getValorLongitudOld(frame),
  };
}

// ---------------------------------------------------------------------------
// COMPAT: getters directos (mantener nombres ya usados en el código existente)
// ---------------------------------------------------------------------------

/** Compat: devuelve tipoTrama (u8). */
export function getTipoTramaOld(frame: Buffer): number {
  return getValorTipoTramaOld(frame);
}

/** Compat: devuelve tipoMensaje (u8). */
export function getTipoMensajeOld(frame: Buffer): number {
  return getValorTipoMensajeOld(frame);
}

/** Compat: devuelve longitud (u16 BE). */
export function getLongitudOld(frame: Buffer): number {
  return getValorLongitudOld(frame);
}

// ---------------------------------------------------------------------------
// CRC: RECÁLCULO Y COMPARACIÓN
// ---------------------------------------------------------------------------

/**
 * Recalcula el CRC16 (IBM/ARC, polinomio 0xA001) sobre header+datos
 * y lo compara con el CRC recibido (LSB almacenado tras el payload).
 */
export function getCROld(frame: Buffer): {
  ok: boolean;
  expected: number;
  received: number;
} {
  const header = getHeaderOld(frame); // raw
  const data = getDataSectionOld(frame); // raw
  if (!data)
    return { ok: false, expected: NaN, received: getCRCFromFrameOld(frame) };

  const buf = Buffer.concat([header, data]);
  const expected = crc16IBM(buf);
  const received = getCRCFromFrameOld(frame);

  return { ok: expected === received, expected, received };
}

export function logCabeceraComunOld(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);

  josLogger.trace(`---------- DECODIFICAMOS TRAMA EN BYTES: ----------`);
  josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
  josLogger.trace(`Versión protocolo: ${hdr.versionProtocolo} `);
  josLogger.trace(`Nodo origen: ${hdr.nodoOrigen} `);
  josLogger.trace(`Nodo destino: ${hdr.nodoDestino} `);
  josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[hdr.tipoTrama]} `);
  josLogger.trace(
    `Tipo Mensaje TM: ${EnTipoMensajeDispositivoCentral[hdr.tipoMensaje]} `,
  );
  josLogger.trace(`Longitud: ${hdr.longitud} `);
}
