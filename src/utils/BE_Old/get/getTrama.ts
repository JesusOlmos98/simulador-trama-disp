import { crc16IBM } from "src/utils/crc";
import { EnTipoMensajeCentralServidor, EnTipoTramaOld } from "../globals/enumOld";
import { START_OLD, END_OLD, HEADER_OFFSET_OLD, HEADER_SIZE_OLD } from "../globals/constGlobales";

// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------- getters de frame general (OLD / BE) -------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getStartOld -------------------------------------------
/**
 * Verifica que el frame comienza con el delimitador START_OLD.
 */
export function getStartOld(frame: Buffer): Buffer {
  return frame.subarray(0, START_OLD.length);
}

// ------------------------------------------- getEndOld -------------------------------------------
/**
 * Verifica que el frame termina con el delimitador END_OLD.
 */
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
 * Devuelve el header sin delimitadores ni CRC ni END.
 * Header = versión(1) + reserva(1) + nodoOrigen(2 BE) + nodoDestino(2 BE) + tipoTrama(1) + tipoMensaje(1) + longitud(2 BE)
 */
export function getHeaderOld(frame: Buffer): Buffer {
  const startOffset = START_OLD.length;
  // header fijo: 1+1+2+2+1+1+2 = 10 bytes
  return frame.subarray(startOffset, startOffset + 10);
}

// ------------------------------------------- getDataSectionOld -------------------------------------------
/**
 * Extrae la sección de datos (payload) del frame OLD.
 */
export function getDataSectionOld(frame: Buffer): Buffer {
  const dataLen = getLongitudOld(frame); // BE
  const dataStart = HEADER_OFFSET_OLD + HEADER_SIZE_OLD; // normalmente START.len + 10
  return frame.subarray(dataStart, dataStart + dataLen);
}

// ------------------------------------------- getCRCFromFrameOld -------------------------------------------
/**
 * Extrae el CRC recibido (2 bytes) justo después de header+datos y antes de END_OLD.
 * En OLD leemos el CRC en **Big-Endian** (si tu implementación usa LE, cambia a readUInt16LE).
 */
export function getCRCFromFrameOld(frame: Buffer): number {
  const dataLen = frame.readUInt16BE(START_OLD.length + 8); // offset del campo longitud en header OLD
  const crcOffset = START_OLD.length + 10 + dataLen;       // 10 = header size
  return frame.readUInt16BE(crcOffset);
}

// ------------------------------------------- getCROld -------------------------------------------
/**
 * Recalcula el CRC sobre header+datos y lo compara con el recibido.
 * Implementación CRC16 IBM/ARC (polinomio 0xA001).
 */
export function getCROld(frame: Buffer): {
  ok: boolean;
  expected: number;
  received: number;
} {
  const header = getHeaderOld(frame);
  const data = getDataSectionOld(frame);

  const buf = Buffer.concat([header, data]);
  const expected = crc16IBM(buf);
  const received = getCRCFromFrameOld(frame);

  return {
    ok: expected === received,
    expected,
    received,
  };
}

// ------------------------------------------- parseHeaderOld -------------------------------------------
// jos Funciones para el Header (OLD/BE)

export interface HeaderFieldsOld {
  versionProtocolo: number;
  reserva: number;
  nodoOrigen: number;   // u16 BE
  nodoDestino: number;  // u16 BE
  tipoTrama: number;    // u8
  tipoMensaje: number;  // u8
  longitud: number;     // u16 BE (bytes de la sección datos)
}

/** Lee todos los campos del header OLD (Big-Endian donde corresponda). */
export function parseHeaderOld(frame: Buffer): HeaderFieldsOld {
  const offset = HEADER_OFFSET_OLD;

  const versionProtocolo = frame.readUInt8(offset + 0);
  const reserva = frame.readUInt8(offset + 1);
  const nodoOrigen = frame.readUInt16BE(offset + 2);
  const nodoDestino = frame.readUInt16BE(offset + 4);
  const tipoTrama = frame.readUInt8(offset + 6);
  const tipoMensaje = frame.readUInt8(offset + 7);
  const longitud = frame.readUInt16BE(offset + 8);

  return {
    versionProtocolo,
    reserva,
    nodoOrigen,
    nodoDestino,
    tipoTrama,
    tipoMensaje,
    longitud,
  };
}

// ------------------------------------------- getTipoTramaOld -------------------------------------------
/** Lectores puntuales por si quieres acceso directo */
export function getTipoTramaOld(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET_OLD + 6);
}

// ------------------------------------------- getTipoMensajeOld -------------------------------------------
export function getTipoMensajeOld(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET_OLD + 7);
}

// ------------------------------------------- getLongitudOld -------------------------------------------
export function getLongitudOld(frame: Buffer): number {
  return frame.readUInt16BE(HEADER_OFFSET_OLD + 8);
}

// ------------------------------------------- getTMDeTT_Old -------------------------------------------
/**
 * Devuelve el enum de Tipos de Mensaje (TM) correspondiente al Tipo de Trama (TT) OLD.
 * Si el TT no tiene un TM definido en tus enums OLD, devuelve undefined.
 */
export type TmEnumUnionOld =
  | typeof EnTipoMensajeCentralServidor
  // añade aquí otros enums de mensajes OLD si los tienes, p.ej.:
  // | typeof EnTmDepuracionOld
  // | typeof EnTmSistemaOld
  ;

export const TT2TM_OLD: Partial<Record<EnTipoTramaOld, TmEnumUnionOld | undefined>> = {
  [EnTipoTramaOld.ttCentralServidor]: EnTipoMensajeCentralServidor,
  // añade otros mapeos TT->TM OLD si existen en tu protocolo:
  // [EnTipoTramaOld.ttDepuracion]: EnTmDepuracionOld,
  // ...
};

/** Mapa TT(OLD) -> TM enum (OLD) */
export function getTMDeTT_Old(tt: EnTipoTramaOld): TmEnumUnionOld | undefined {
  return TT2TM_OLD[tt];
}
