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

// // ------------------------------------------- getStart -------------------------------------------
// /**
//  * Verifica que el frame comienza con el delimitador START.
//  */
// export function getStart(frame: Buffer): Buffer {
//   return frame.subarray(0, START.length);
// }

// // ------------------------------------------- getEnd -------------------------------------------
// /**
//  * Verifica que el frame termina con el delimitador END.
//  */
// export function getEnd(frame: Buffer): Buffer {
//   return frame.subarray(frame.length - END.length);
// }

// //*  Validación de inicio y fin
// // ------------------------------------------- inicioCorrecto -------------------------------------------
// export function inicioCorrecto(buf: Buffer): boolean {
//   return getStart(buf).equals(START);
// }

// // ------------------------------------------- finalCorrecto -------------------------------------------
// export function finalCorrecto(buf: Buffer): boolean {
//   return getEnd(buf).equals(END);
// }

// // ------------------------------------------- getHeader -------------------------------------------
// /**
//  * Devuelve el header sin delimitadores ni CRC ni END.
//  * Header = versión + reserva + nodoOrigen + nodoDestino + tipoTrama + tipoMensaje + longitud
//  */
// export function getHeader(frame: Buffer): Buffer {
//   const startOffset = START.length;
//   // header es fijo de 1+1+2+2+1+1+2 = 10 bytes
//   return frame.subarray(startOffset, startOffset + 10);
// }

// // ------------------------------------------- getDataSection -------------------------------------------
// /**
//  * Extrae la sección de datos (payload).
//  */
// export function getDataSection(frame: Buffer): Buffer {
//   const dataLen = getLongitud(frame);
//   const dataStart = HEADER_OFFSET + HEADER_SIZE;
//   return frame.subarray(dataStart, dataStart + dataLen);
// }

// // ------------------------------------------- getIdentificadorUnicoDentroDelSegundo -------------------------------------------
// /**
//  * Extrae el identificador_unico_dentro_del_segundo de una trama de estadísticos.
//  * Regla: es el ÚLTIMO byte de la sección DATA (justo antes del CRC) cuando
//  * la trama es TT_ESTADISTICOS (especialmente en RT: longitud = 1).
//  * Si no es una TT_ESTADISTICOS o no hay datos, devuelve undefined.
//  */
// export function getIdentificadorUnicoDentroDelSegundo(
//   frame: Buffer,
// ): number | undefined {
//   if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined; // Evaluamos que sea una trama de estadísticos

//   const data = getDataSection(frame); // Obtenemos el payload
//   if (data.length < 1) return undefined; // Verirficamos que haya algo, no puede ser que el payload sólo tenga un byte

//   return data.readUInt8(data.length - 1); // Leemos el último byte del payload, que si es un estadístico debería ser el identificador_unico_dentro_del_segundo
//   // Opcional: si quieres acotar solo a RT (ACK), descomenta:
//   // if (getTipoMensaje(frame) !== EnTmEstadisticos.rtEstadistico) return undefined;
// }

// // ------------------------------------------- getCRCFromFrame -------------------------------------------
// /**
//  * Extrae el CRC recibido (últimos 2 bytes antes de END).
//  */
// export function getCRCFromFrame(frame: Buffer): number {
//   // const crcOffset = frame.length - END.length - 2;

//   const dataLen = frame.readUInt16LE(START.length + 8);
//   const crcOffset = START.length + 10 + dataLen;

//   return frame.readUInt16LE(crcOffset);
// }

// // ------------------------------------------- getCRC -------------------------------------------
// /**
//  * Recalcula el CRC sobre header+datos y lo compara con el recibido.
//  * Implementación CRC16 IBM/ARC (polinomio 0xA001).
//  */
// export function getCRC(frame: Buffer): {
//   ok: boolean;
//   expected: number;
//   received: number;
// } {
//   const header = getHeader(frame);
//   const data = getDataSection(frame);

//   const buf = Buffer.concat([header, data]);
//   const expected = crc16IBM(buf);
//   const received = getCRCFromFrame(frame);

//   return {
//     ok: expected === received,
//     expected,
//     received,
//   };
// }

// // ------------------------------------------- parseHeader -------------------------------------------
// // jos Funciones para el Header
// /** Lee todos los campos del header */
// export function parseHeader(frame: Buffer): HeaderFields {
//   const offset = HEADER_OFFSET;

//   const versionProtocolo = frame.readUInt8(offset + 0);
//   const reserva = frame.readUInt8(offset + 1);
//   const nodoOrigen = frame.readUInt16LE(offset + 2);
//   const nodoDestino = frame.readUInt16LE(offset + 4);
//   const tipoTrama = frame.readUInt8(offset + 6);
//   const tipoMensaje = frame.readUInt8(offset + 7);
//   const longitud = frame.readUInt16LE(offset + 8);

//   return {
//     versionProtocolo,
//     reserva,
//     nodoOrigen,
//     nodoDestino,
//     tipoTrama,
//     tipoMensaje,
//     longitud,
//   };
// }

// // ------------------------------------------- getTipoTrama -------------------------------------------
// /** Lectores puntuales por si quieres acceso directo */
// export function getTipoTrama(frame: Buffer): number {
//   return frame.readUInt8(HEADER_OFFSET + 6);
// }

// // ------------------------------------------- getTipoMensaje -------------------------------------------
// export function getTipoMensaje(frame: Buffer): number {
//   return frame.readUInt8(HEADER_OFFSET + 7);
// }

// // ------------------------------------------- getLongitud -------------------------------------------
// export function getLongitud(frame: Buffer): number {
//   return frame.readUInt16LE(HEADER_OFFSET + 8);
// }

// ------------------------------------------- getTMDeTT -------------------------------------------
/**
 * Devuelve el enum de Tipos de Mensaje (TM) correspondiente al Tipo de Trama (TT).
 * Si el TT no tiene un TM definido en tus enums actuales, devuelve undefined.
 */
// export function getTMDeTT(tt: EnTipoTrama): TmEnumUnion | undefined {
//   return TT2TM[tt] as TmEnumUnion | undefined;
// }

// // ------------------------------------------- TmEnumUnion -------------------------------------------
// export type TmEnumUnion =
//   | typeof EnTmOmegaPantallaPlaca
//   | typeof EnTmDepuracion
//   | typeof EnTmServiciosClaveValor
//   | typeof EnTmSistema
//   | typeof EnTmEstadisticos
//   | typeof EnTmComuniBle
//   | typeof EnTmDff
//   | typeof EnTmImportExport
//   | typeof EnTmDescargaSubidaFicheros
//   | typeof EnTmActualizacionV2
//   | typeof EnTmImportExportV2;

// ------------------------------------------- TT2TM -------------------------------------------
/** Mapa TT -> TM enum (los que no existen aún en tus enums quedan como undefined) */
// export const TT2TM = {
//   [EnTipoTrama.omegaPantallaPlaca]: EnTmOmegaPantallaPlaca,
//   [EnTipoTrama.depuracion]: EnTmDepuracion,
//   [EnTipoTrama.serviciosClaveValor]: EnTmServiciosClaveValor,
//   [EnTipoTrama.actualizacionServer]: undefined, // ? No tienes definido EnTmActualizacionServer en tus enums
//   [EnTipoTrama.sistema]: EnTmSistema,
//   [EnTipoTrama.estadisticos]: EnTmEstadisticos,
//   [EnTipoTrama.comuniRadar]: undefined, // ? No tienes definido EnTmComuniRadar en tus enums
//   [EnTipoTrama.comuniBle]: EnTmComuniBle,
//   [EnTipoTrama.descargaFicherosFlash]: EnTmDff,
//   [EnTipoTrama.importacionExportacion]: EnTmImportExport,
//   [EnTipoTrama.descargaSubidaFicheros]: EnTmDescargaSubidaFicheros,
//   [EnTipoTrama.actualizacionV2]: EnTmActualizacionV2,
// } as const;
