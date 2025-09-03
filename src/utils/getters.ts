import { HeaderFields } from "src/dto/frame.dto";
import { START, END, HEADER_OFFSET, HEADER_SIZE, ESTADIS_HEADER_LEN, TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD } from "./constGlobales";
import { crc16IBM } from "./crc";
import { EnTipoTrama, EnTmOmegaPantallaPlaca, EnTmDepuracion, EnTmServiciosClaveValor, EnTmSistema, EnTmEstadisticos, EnTmComuniBle, EnTmDff, EnTmImportExport, EnTmDescargaSubidaFicheros, EnTmActualizacionV2, EnTmImportExportV2, EnTipoDato, EnEstadisTipoRegistro, EnEeEventosApli, EnAlarmaEstado, EnAlarmasAccion } from "./enums";

//*  Validación de inicio y fin
export function inicioCorrecto(buf: Buffer): boolean {
  return getStart(buf).equals(START);
}

export function finalCorrecto(buf: Buffer): boolean {
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
    case EnTipoDato.uint8: return value.readUInt8(0);
    case EnTipoDato.int8: return value.readInt8(0);
    case EnTipoDato.uint16: return value.readUInt16LE(0);
    case EnTipoDato.int16: return value.readInt16LE(0);
    case EnTipoDato.uint32: return value.readUInt32LE(0);
    case EnTipoDato.int32: return value.readInt32LE(0);
    case EnTipoDato.float: return value.readFloatLE(0);
    case EnTipoDato.tiempo: return value.readUInt32LE(0); // segundos del día (convenio local)
    default: return undefined;             // otros tipos no numéricos/soportados
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

/** Devuelve el tipoRegistro (ENUM_ESTADIS_TIPO_REGISTRO) del payload de un estadístico TX.
 *  Si la trama no es TT=estadisticos o TM!=enviaEstadistico, devuelve undefined.
 */
export function getTipoRegistroEstadistico(frame: Buffer): EnEstadisTipoRegistro | undefined {
  // Solo aplica a TT_ESTADISTICOS + TM_ENVIA_ESTADISTICO
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return undefined;

  const data = getDataSection(frame); // payload del estadístico
  if (data.length < TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD + 1) return undefined;

  const tipoReg = data.readUInt8(TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD);
  return tipoReg as EnEstadisTipoRegistro;
}

/** Devuelve el tipo de evento (ENUM_EE_EVENTOS_APLI) del primer item de un estadístico de EVENTOS. */
export function getTipoEventoEstadistico(frame: Buffer): EnEeEventosApli | undefined {
  // 1) Verifica TT y TM
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return undefined;

  // 2) Verifica que el payload sea de tipoRegistro EVENTOS
  const tipoReg = getTipoRegistroEstadistico(frame);
  if (tipoReg !== EnEstadisTipoRegistro.eventos) return undefined;

  // 3) Carga payload y comprueba mínimos
  const data = getDataSection(frame);
  if (!data || data.length < ESTADIS_HEADER_LEN + 4) return undefined; // tipo(1)+size(1)+al menos 2 bytes de dato

  // 4) Debe existir al menos 1 item
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (nDatos < 1) return undefined;

  // 5) Primer item => código de evento (TD_UINT16 LE)
  const tipo0 = data.readUInt8(ESTADIS_HEADER_LEN + 0);
  const size0 = data.readUInt8(ESTADIS_HEADER_LEN + 1);
  const start0 = ESTADIS_HEADER_LEN + 2;
  const end0 = start0 + size0;
  if (end0 > data.length) return undefined;

  // Por doc debe ser uint16; si no coincide el 'tipo', mientras el size sea 2 lo leemos igual.
  if (tipo0 === EnTipoDato.uint16 && size0 >= 2) {
    return data.readUInt16LE(start0) as EnEeEventosApli;
  }
  if (size0 === 2) {
    return data.readUInt16LE(start0) as EnEeEventosApli;
  }

  return undefined;
}

/** Item[0] = textoAlarma (TD_UINT16 LE) */
export function getTextoAlarma(frame: Buffer): number | undefined {
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.alarmas) return undefined;
  
  const data = getDataSection(frame);
  if (!data) return undefined;
  
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (nDatos < 1) return undefined;
  
  let offset = ESTADIS_HEADER_LEN; // comienzo de items
  const tipo0 = data.readUInt8(offset + 0);
  const size0 = data.readUInt8(offset + 1);
  const start0 = offset + 2;
  const end0 = start0 + size0;
  if (end0 > data.length) return undefined;
  
  // Esperado: uint16 (size 2). Si no, intentamos LE si hay 2 bytes.
  if (size0 >= 2) {
    return data.readUInt16LE(start0);
  }
  return undefined;
}

/** Item[1] = estadoAlarma (TD_UINT8) */
export function getEstadoAlarma(frame: Buffer): EnAlarmaEstado | undefined {
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.alarmas) return undefined;
  
  const data = getDataSection(frame);
  if (!data) return undefined;
  
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (nDatos < 2) return undefined;
  
  // Saltar primer item
  let offset = ESTADIS_HEADER_LEN;
  const size0 = data.readUInt8(offset + 1);
  offset = offset + 2 + size0;
  
  const tipo1 = data.readUInt8(offset + 0);
  const size1 = data.readUInt8(offset + 1);
  const start1 = offset + 2;
  const end1 = start1 + size1;
  if (end1 > data.length || size1 < 1) return undefined;
  
  const v = data.readUInt8(start1);
  return v as EnAlarmaEstado;
}

/** Item[2] = accionConfigurada (TD_UINT8) */
export function getAccionConfigurada(frame: Buffer): EnAlarmasAccion | undefined {
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.alarmas) return undefined;
  
  const data = getDataSection(frame);
  if (!data) return undefined;
  
  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (nDatos < 3) return undefined;
  
  // Saltar item[0]
  let offset = ESTADIS_HEADER_LEN;
  const size0 = data.readUInt8(offset + 1);
  offset = offset + 2 + size0;
  
  // Saltar item[1]
  const size1 = data.readUInt8(offset + 1);
  offset = offset + 2 + size1;
  
  // Leer item[2]
  const tipo2 = data.readUInt8(offset + 0);
  const size2 = data.readUInt8(offset + 1);
  const start2 = offset + 2;
  const end2 = start2 + size2;
  if (end2 > data.length || size2 < 1) return undefined;
  
  const v = data.readUInt8(start2);
  return v as EnAlarmasAccion;
}

// Valida que sea TT=ESTADISTICOS, TM=enviaEstadistico y tipoRegistro=ALARMAS
// function isFrameEstadisticoAlarma(frame: Buffer): boolean {
//   if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return false;
//   if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return false;

//   const data = getDataSection(frame);
//   if (!data || data.length < ESTADIS_HEADER_LEN) return false;

//   const tipoRegistro = data.readUInt8(7); // offset dentro del payload
//   return tipoRegistro === EnEstadisTipoRegistro.alarmas;
// }

