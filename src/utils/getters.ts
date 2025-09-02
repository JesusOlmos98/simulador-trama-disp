import { Buffer } from 'node:buffer';
import { crc16IBM } from 'src/utils/crc';
import {
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
  EnTipoTrama,
  EnTipoDato,
} from 'src/utils/enums';

export const START = Buffer.from([0xcc, 0xaa, 0xaa, 0xaa] as const);
export const END = Buffer.from([0xcc, 0xbb, 0xbb, 0xbb] as const);

const HEADER_OFFSET = START.length; // empieza justo después de START
const HEADER_SIZE = 10; // 1+1+2+2+1+1+2

export interface HeaderFields {
  versionProtocolo: number;
  reserva: number;
  nodoOrigen: number;
  nodoDestino: number;
  tipoTrama: number;
  tipoMensaje: number;
  longitud: number;
}

//jos Validación de inicio y fin
export function inicioCorrecto(buf: Buffer): boolean {
  // return buf.length >= inicioEsperado.length && buf.subarray(0, inicioEsperado.length).equals(inicioEsperado);p
  return getStart(buf).equals(START);
}

export function finalCorrecto(buf: Buffer): boolean {
  //   return buf.length >= finEsperado.length && buf.subarray(buf.length - finEsperado.length).equals(finEsperado);
  return getEnd(buf).equals(END);
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de frame general ------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

/**
 * Verifica que el frame comienza con el delimitador START.
 */
export function getStart(frame: Buffer): Buffer {
  return frame.subarray(0, START.length);
}

/**
 * Verifica que el frame termina con el delimitador END.
 */
export function getEnd(frame: Buffer): Buffer {
  return frame.subarray(frame.length - END.length);
}

/**
 * Devuelve el header sin delimitadores ni CRC ni END.
 * Header = versión + reserva + nodoOrigen + nodoDestino + tipoTrama + tipoMensaje + longitud
 */
export function getHeader(frame: Buffer): Buffer {
  const startOffset = START.length;
  // header es fijo de 1+1+2+2+1+1+2 = 10 bytes
  return frame.subarray(startOffset, startOffset + 10);
}

/**
 * Extrae la sección de datos (payload).
 */
export function getDataSection(frame: Buffer): Buffer {
  const dataLen = getLongitud(frame);
  const dataStart = HEADER_OFFSET + HEADER_SIZE;
  return frame.subarray(dataStart, dataStart + dataLen);
}

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

/**
 * Extrae el CRC recibido (últimos 2 bytes antes de END).
 */
export function getCRCFromFrame(frame: Buffer): number {
  // const crcOffset = frame.length - END.length - 2;

  const dataLen = frame.readUInt16LE(START.length + 8);
  const crcOffset = START.length + 10 + dataLen;

  return frame.readUInt16LE(crcOffset);
}

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

// jos Funciones para el Header
/** Lee todos los campos del header */
export function parseHeader(frame: Buffer): HeaderFields {
  const o = HEADER_OFFSET;

  const versionProtocolo = frame.readUInt8(o + 0);
  const reserva = frame.readUInt8(o + 1);
  const nodoOrigen = frame.readUInt16LE(o + 2);
  const nodoDestino = frame.readUInt16LE(o + 4);
  const tipoTrama = frame.readUInt8(o + 6);
  const tipoMensaje = frame.readUInt8(o + 7);
  const longitud = frame.readUInt16LE(o + 8);

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

/** Lectores puntuales por si quieres acceso directo */
export function getTipoTrama(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET + 6);
}
export function getTipoMensaje(frame: Buffer): number {
  return frame.readUInt8(HEADER_OFFSET + 7);
}
export function getLongitud(frame: Buffer): number {
  return frame.readUInt16LE(HEADER_OFFSET + 8);
}

/**
 * Devuelve el enum de Tipos de Mensaje (TM) correspondiente al Tipo de Trama (TT).
 * Si el TT no tiene un TM definido en tus enums actuales, devuelve undefined.
 */
export function getTMDeTT(tt: EnTipoTrama): TmEnumUnion | undefined {
  return TT2TM[tt] as TmEnumUnion | undefined;
}

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

/** Mapa TT -> TM enum (los que no existen aún en tus enums quedan como undefined) */
export const TT2TM = {
  [EnTipoTrama.omegaPantallaPlaca]: EnTmOmegaPantallaPlaca,
  [EnTipoTrama.depuracion]: EnTmDepuracion,
  [EnTipoTrama.serviciosClaveValor]: EnTmServiciosClaveValor,
  [EnTipoTrama.actualizacionServer]: undefined, // ! No tienes definido EnTmActualizacionServer en tus enums
  [EnTipoTrama.sistema]: EnTmSistema,
  [EnTipoTrama.estadisticos]: EnTmEstadisticos,
  [EnTipoTrama.comuniRadar]: undefined, // ! No tienes definido EnTmComuniRadar en tus enums
  [EnTipoTrama.comuniBle]: EnTmComuniBle,
  [EnTipoTrama.descargaFicherosFlash]: EnTmDff,
  [EnTipoTrama.importacionExportacion]: EnTmImportExport,
  [EnTipoTrama.descargaSubidaFicheros]: EnTmDescargaSubidaFicheros,
  [EnTipoTrama.actualizacionV2]: EnTmActualizacionV2,
} as const;

// ------------------------------------------- hexDump -------------------------------------------
/** Convierte un buffer en texto hexadecimal en columnas. */
export function hexDump(buf: Buffer, width = 16): string {
  const hex: string[] = buf.toString('hex').match(/.{1,2}/g) ?? []; // Divide en grupos de 2 bytes
  const lines: string[] = []; // Aquí irá el resultado

  for (let i = 0; i < hex.length; i += width) {
    const slice = hex.slice(i, i + width); // Toma un "ancho" de bytes
    lines.push(slice.join(' ')); // ok
  }
  return lines.join('\n');
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------------------------------- getters estadísticos ------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------


const ESTADIS_HEADER_LEN = 22; // MAC(4)+cabecera(4)+res(4)+fecha(4)+hora(4)+res5(1)+nDatos(1)

/** Lee un item (tipo,size,valor) en offset y devuelve también el nuevo offset. */
function readItemAt(data: Buffer, offset: number) {
  if (offset + 2 > data.length) return undefined;
  const tipo = data.readUInt8(offset);
  const size = data.readUInt8(offset + 1);
  const start = offset + 2;
  const end = start + size;
  if (end > data.length) return undefined;
  return { tipo, size, value: data.subarray(start, end), next: end };
}

/** Convierte el buffer de un item al número correspondiente según EnTipoDato (LE). */
function itemToNumber(tipo: number, value: Buffer): number | undefined {
  switch (tipo) {
    case EnTipoDato.uint8:  return value.readUInt8(0);
    case EnTipoDato.int8:   return value.readInt8(0);
    case EnTipoDato.uint16: return value.readUInt16LE(0);
    case EnTipoDato.int16:  return value.readInt16LE(0);
    case EnTipoDato.uint32: return value.readUInt32LE(0);
    case EnTipoDato.int32:  return value.readInt32LE(0);
    case EnTipoDato.float:  return value.readFloatLE(0);
    case EnTipoDato.tiempo: return value.readUInt32LE(0); // segundos del día (convenio local)
    default:                return undefined;             // otros tipos no numéricos/soportados
  }
}

/**
 * Devuelve el valorMedio de un “estadístico valor”.
 * Asume el layout: [0]nombre, [1]periodicidad, [2]valorMedio, ...
 */
export function getValorMedioEstadisValor(data: Buffer): number | undefined {
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  let offset = ESTADIS_HEADER_LEN;

  for (let i = 0; i < nDatos; i++) {
    const it = readItemAt(data, offset);
    if (!it) return undefined;
    if (i === 2) return itemToNumber(it.tipo, it.value); // valorMedio
    offset = it.next;
  }
  return undefined;
}

/**
 * Devuelve el “valor” de un “estadístico contador”.
 * Layout doc: [0]nombre, [1]periodicidad, [2]tipoContador, [3]unidad, [4]multiplicador, [5]valor, [6]estado
 */
export function getValorEstadisContador(data: Buffer): number | undefined {
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  let offset = ESTADIS_HEADER_LEN;

  for (let i = 0; i < nDatos; i++) {
    const it = readItemAt(data, offset);
    if (!it) return undefined;
    if (i === 5) return itemToNumber(it.tipo, it.value); // valor
    offset = it.next;
  }
  return undefined;
}

/**
 * Devuelve el valorSegundosConectado de un “estadístico actividad”.
 * Layout doc: [0]nombre, [1]periodicidad, [2]valorSegundos (uint32), [3]estado
 */
export function getValorSegConectEstadisActividad(data: Buffer): number | undefined {
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  let offset = ESTADIS_HEADER_LEN;

  for (let i = 0; i < nDatos; i++) {
    const it = readItemAt(data, offset);
    if (!it) return undefined;
    if (i === 2) return itemToNumber(it.tipo, it.value); // valorSegundosConectado
    offset = it.next;
  }
  return undefined;
}

/**
 * Devuelve el nombreEstadistico (uint16 LE) de una trama TT_ESTADISTICOS / TM_envia_estadistico.
 * Si la trama no es de ese tipo, o el payload no cumple el formato esperado, devuelve undefined.
 */
export function getNombreEstadistico(frame: Buffer): number | undefined {
  // 1) Verificar TT y TM
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return undefined;

  // 2) Cargar payload
  const data = getDataSection(frame);
  const HEADER_LEN = 22; // MAC(4)+cabecera(4)+res(4)+fecha(4)+hora(4)+res5(1)+nDatos(1)
  if (!data || data.length < HEADER_LEN + 4) return undefined; // mínimo para primer item: tipo(1)+size(1)+dato(>=2)

  // 3) Debe existir al menos 1 item
  const nDatos = data.readUInt8(HEADER_LEN - 1);
  if (nDatos < 1) return undefined;

  // 4) Primer item = nombreEstadistico
  const tipo = data.readUInt8(HEADER_LEN + 0);
  const size = data.readUInt8(HEADER_LEN + 1);
  const start = HEADER_LEN + 2;
  const end = start + size;
  if (end > data.length) return undefined;

  // Por documento, nombreEstadistico = TD_UINT16 (LE).
  // Si por lo que sea el tipo no coincide, intentamos leer 2 bytes LE si el size=2.
  if (tipo === EnTipoDato.uint16 && size >= 2) {
    return data.readUInt16LE(start);
  }
  if (size === 2) {
    return data.readUInt16LE(start);
  }

  // Tipos no esperados para nombre (evitamos suposiciones).
  return undefined;
}
