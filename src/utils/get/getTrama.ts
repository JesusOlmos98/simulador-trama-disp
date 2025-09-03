import { HeaderFields } from 'src/dto/frame.dto';
import { crc16IBM } from '../crc';
import {
  START,
  END,
  HEADER_OFFSET,
  HEADER_SIZE,
} from '../globals/constGlobales';
import {
  EnTipoTrama,
  EnTmOmegaPantallaPlaca,
  EnTmDepuracion,
  EnTmServiciosClaveValor,
  EnTmSistema,
  EnTmEstadisticos,
  EnTmComuniBle,
  EnTmDff,
  EnTmImportExport,
  EnTmDescargaSubidaFicheros,
  EnTmActualizacionV2,
  EnTmImportExportV2,
} from '../globals/enums';

//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de frame general ------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getStart -------------------------------------------
/**
 * Verifica que el frame comienza con el delimitador START.
 */
export function getStart(frame: Buffer): Buffer {
  return frame.subarray(0, START.length);
}

// ------------------------------------------- getEnd -------------------------------------------
/**
 * Verifica que el frame termina con el delimitador END.
 */
export function getEnd(frame: Buffer): Buffer {
  return frame.subarray(frame.length - END.length);
}

//*  Validación de inicio y fin
// ------------------------------------------- inicioCorrecto -------------------------------------------
export function inicioCorrecto(buf: Buffer): boolean {
  return getStart(buf).equals(START);
}

// ------------------------------------------- finalCorrecto -------------------------------------------
export function finalCorrecto(buf: Buffer): boolean {
  return getEnd(buf).equals(END);
}

// ------------------------------------------- getHeader -------------------------------------------
/**
 * Devuelve el header sin delimitadores ni CRC ni END.
 * Header = versión + reserva + nodoOrigen + nodoDestino + tipoTrama + tipoMensaje + longitud
 */
export function getHeader(frame: Buffer): Buffer {
  const startOffset = START.length;
  // header es fijo de 1+1+2+2+1+1+2 = 10 bytes
  return frame.subarray(startOffset, startOffset + 10);
}

// ------------------------------------------- getDataSection -------------------------------------------
/**
 * Extrae la sección de datos (payload).
 */
export function getDataSection(frame: Buffer): Buffer {
  const dataLen = getLongitud(frame);
  const dataStart = HEADER_OFFSET + HEADER_SIZE;
  return frame.subarray(dataStart, dataStart + dataLen);
}

// ------------------------------------------- getIdentificadorUnicoDentroDelSegundo -------------------------------------------
/**
 * Extrae el identificador_unico_dentro_del_segundo de una trama de estadísticos.
 * Regla: es el ÚLTIMO byte de la sección DATA (justo antes del CRC) cuando
 * la trama es TT_ESTADISTICOS (especialmente en RT: longitud = 1).
 * Si no es una TT_ESTADISTICOS o no hay datos, devuelve undefined.
 */
export function getIdentificadorUnicoDentroDelSegundo(
  frame: Buffer,
): number | undefined {
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined; // Evaluamos que sea una trama de estadísticos

  const data = getDataSection(frame); // Obtenemos el payload
  if (data.length < 1) return undefined; // Verirficamos que haya algo, no puede ser que el payload sólo tenga un byte

  return data.readUInt8(data.length - 1); // Leemos el último byte del payload, que si es un estadístico debería ser el identificador_unico_dentro_del_segundo
  // Opcional: si quieres acotar solo a RT (ACK), descomenta:
  // if (getTipoMensaje(frame) !== EnTmEstadisticos.rtEstadistico) return undefined;
}

// ------------------------------------------- getCRCFromFrame -------------------------------------------
/**
 * Extrae el CRC recibido (últimos 2 bytes antes de END).
 */
export function getCRCFromFrame(frame: Buffer): number {
  // const crcOffset = frame.length - END.length - 2;

  const dataLen = frame.readUInt16LE(START.length + 8);
  const crcOffset = START.length + 10 + dataLen;

  return frame.readUInt16LE(crcOffset);
}

// ------------------------------------------- getCRC -------------------------------------------
/**
 * Recalcula el CRC sobre header+datos y lo compara con el recibido.
 * Implementación CRC16 IBM/ARC (polinomio 0xA001).
 */
export function getCRC(frame: Buffer): {
  ok: boolean;
  expected: number;
  received: number;
} {
  const header = getHeader(frame);
  const data = getDataSection(frame);

  const buf = Buffer.concat([header, data]);
  const expected = crc16IBM(buf);
  const received = getCRCFromFrame(frame);

  return {
    ok: expected === received,
    expected,
    received,
  };
}

// ------------------------------------------- parseHeader -------------------------------------------
// jos Funciones para el Header
/** Lee todos los campos del header */
export function parseHeader(frame: Buffer): HeaderFields {
  const offset = HEADER_OFFSET;

  const versionProtocolo = frame.readUInt8(offset + 0);
  const reserva = frame.readUInt8(offset + 1);
  const nodoOrigen = frame.readUInt16LE(offset + 2);
  const nodoDestino = frame.readUInt16LE(offset + 4);
  const tipoTrama = frame.readUInt8(offset + 6);
  const tipoMensaje = frame.readUInt8(offset + 7);
  const longitud = frame.readUInt16LE(offset + 8);

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

// ------------------------------------------- getTipoTrama -------------------------------------------
/** Lectores puntuales por si quieres acceso directo */
export function getTipoTrama(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET + 6);
}

// ------------------------------------------- getTipoMensaje -------------------------------------------
export function getTipoMensaje(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET + 7);
}

// ------------------------------------------- getLongitud -------------------------------------------
export function getLongitud(frame: Buffer): number {
  return frame.readUInt16LE(HEADER_OFFSET + 8);
}

// ------------------------------------------- getTMDeTT -------------------------------------------
/**
 * Devuelve el enum de Tipos de Mensaje (TM) correspondiente al Tipo de Trama (TT).
 * Si el TT no tiene un TM definido en tus enums actuales, devuelve undefined.
 */
export function getTMDeTT(tt: EnTipoTrama): TmEnumUnion | undefined {
  return TT2TM[tt] as TmEnumUnion | undefined;
}

// ------------------------------------------- TmEnumUnion -------------------------------------------
export type TmEnumUnion =
  | typeof EnTmOmegaPantallaPlaca
  | typeof EnTmDepuracion
  | typeof EnTmServiciosClaveValor
  | typeof EnTmSistema
  | typeof EnTmEstadisticos
  | typeof EnTmComuniBle
  | typeof EnTmDff
  | typeof EnTmImportExport
  | typeof EnTmDescargaSubidaFicheros
  | typeof EnTmActualizacionV2
  | typeof EnTmImportExportV2;

// ------------------------------------------- TT2TM -------------------------------------------
/** Mapa TT -> TM enum (los que no existen aún en tus enums quedan como undefined) */
export const TT2TM = {
  [EnTipoTrama.omegaPantallaPlaca]: EnTmOmegaPantallaPlaca,
  [EnTipoTrama.depuracion]: EnTmDepuracion,
  [EnTipoTrama.serviciosClaveValor]: EnTmServiciosClaveValor,
  [EnTipoTrama.actualizacionServer]: undefined, // ? No tienes definido EnTmActualizacionServer en tus enums
  [EnTipoTrama.sistema]: EnTmSistema,
  [EnTipoTrama.estadisticos]: EnTmEstadisticos,
  [EnTipoTrama.comuniRadar]: undefined, // ? No tienes definido EnTmComuniRadar en tus enums
  [EnTipoTrama.comuniBle]: EnTmComuniBle,
  [EnTipoTrama.descargaFicherosFlash]: EnTmDff,
  [EnTipoTrama.importacionExportacion]: EnTmImportExport,
  [EnTipoTrama.descargaSubidaFicheros]: EnTmDescargaSubidaFicheros,
  [EnTipoTrama.actualizacionV2]: EnTmActualizacionV2,
} as const;
