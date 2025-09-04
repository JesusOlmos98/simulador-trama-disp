import { unpackNumberByTipo } from "src/utils/helpers";
import { ESTADIS_HEADER_LEN, TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD } from "../globals/constGlobales";
import { EnTipoDato, EnTipoTrama, EnTmEstadisticos, EnEstadisTipoRegistro, EnEeEventosApli, EnAlarmaEstado, EnAlarmasAccion } from "../globals/enums";
import { getTipoTrama, getTipoMensaje, getDataSection } from "./getTrama";

//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------------------------------- getters de estadísticos ---------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- readItemAt -------------------------------------------
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

// ------------------------------------------- itemToNumber -------------------------------------------
/** Convierte el buffer de un item al número correspondiente según EnTipoDato (LE). */
function itemToNumber(tipo: number, value: Buffer): number | undefined {
  switch (tipo) {
    case EnTipoDato.uint8:
      return value.readUInt8(0);
    case EnTipoDato.int8:
      return value.readInt8(0);
    case EnTipoDato.uint16:
      return value.readUInt16LE(0);
    case EnTipoDato.int16:
      return value.readInt16LE(0);
    case EnTipoDato.uint32:
      return value.readUInt32LE(0);
    case EnTipoDato.int32:
      return value.readInt32LE(0);
    case EnTipoDato.float:
      return value.readFloatLE(0);
    case EnTipoDato.tiempo:
      return value.readUInt32LE(0); // segundos del día (convenio local)
    default:
      return undefined; // otros tipos no numéricos/soportados
  }
}

/** Devuelve el item N (0-based) del área de items del payload de estadísticos. */
export function getEstadisticoItem(frame: Buffer, index: number):
  | { tipo: number; size: number; body: Buffer }
  | undefined {
  // Validaciones de TT/TM/tipoRegistro
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return undefined;
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.cambioParametros) return undefined;

  const data = getDataSection(frame);
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;

  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (index < 0 || index >= nDatos) return undefined;

  let p = ESTADIS_HEADER_LEN; // comienzo de items
  for (let i = 0; i < nDatos; i++) {
    if (p + 2 > data.length) return undefined;
    const tipo = data.readUInt8(p + 0);
    const size = data.readUInt8(p + 1);
    const start = p + 2;
    const end = start + size;
    if (end > data.length) return undefined;

    if (i === index) {
      return { tipo, size, body: data.subarray(start, end) };
    }
    p = end; // siguiente item
  }
  return undefined;
}

// ------------------------------------------- getNombreEstadistico -------------------------------------------
/**
 * Devuelve el nombreEstadistico (uint16 LE) de una trama TT_ESTADISTICOS / TM_envia_estadistico.
 * Si la trama no es de ese tipo, o el payload no cumple el formato esperado, devuelve undefined.
 */
export function getNombreEstadistico(frame: Buffer): number | undefined {
  // 1) Verificar TT y TM
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico)
    return undefined;

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

// ------------------------------------------- getTipoRegistroEstadistico -------------------------------------------
/** Devuelve el tipoRegistro (ENUM_ESTADIS_TIPO_REGISTRO) del payload de un estadístico TX.
 *  Si la trama no es TT=estadisticos o TM!=enviaEstadistico, devuelve undefined.
 */
export function getTipoRegistroEstadistico(
  frame: Buffer,
): EnEstadisTipoRegistro | undefined {
  // Solo aplica a TT_ESTADISTICOS + TM_ENVIA_ESTADISTICO
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico)
    return undefined;

  const data = getDataSection(frame); // payload del estadístico
  if (data.length < TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD + 1)
    return undefined;

  const tipoReg = data.readUInt8(TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD);
  return tipoReg as EnEstadisTipoRegistro;
}

//done ------------------------------------------------------------------------------------------------------------------------
//done --------------------------------------- getters valores de estadísticos normales ---------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getValorMedioEstadisValor -------------------------------------------
/**
 * Devuelve el valorMedio de un “estadístico valor”.
 * Asume el layout: [0]nombre, [1]periodicidad, [2]valorMedio, ...
 */
export function getEstadisValorValorMedio(data: Buffer): number | undefined {
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

// ------------------------------------------- getValorEstadisContador -------------------------------------------
/**
 * Devuelve el “valor” de un “estadístico contador”.
 * Layout doc: [0]nombre, [1]periodicidad, [2]tipoContador, [3]unidad, [4]multiplicador, [5]valor, [6]estado
 */
export function getEstadisContadorValor(data: Buffer): number | undefined {
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

// ------------------------------------------- getValorSegConectEstadisActividad -------------------------------------------
/**
 * Devuelve el valorSegundosConectado de un “estadístico actividad”.
 * Layout doc: [0]nombre, [1]periodicidad, [2]valorSegundos (uint32), [3]estado
 */
export function getEstadisActividadValorSegConect(
  data: Buffer,
): number | undefined {
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

//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------------------------------- getters de estadísticos eventos -------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getTipoEventoEstadistico -------------------------------------------
/** Devuelve el tipo de evento (ENUM_EE_EVENTOS_APLI) del primer item de un estadístico de EVENTOS. */
export function getEstadisEventoTipoEvento(
  frame: Buffer,
): EnEeEventosApli | undefined {
  // 1) Verifica TT y TM
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico)
    return undefined;

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

//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------------------------------- getters de estadísticos alarmas -------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getTextoAlarma -------------------------------------------
/** Item[0] = textoAlarma (TD_UINT16 LE) */
export function getEstadisAlarmaTextoAlarma(frame: Buffer): number | undefined {
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.alarmas)
    return undefined;

  const data = getDataSection(frame);
  if (!data) return undefined;

  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (nDatos < 1) return undefined;

  const offset = ESTADIS_HEADER_LEN; // comienzo de items
  // const tipo0 = data.readUInt8(offset + 0);
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

// ------------------------------------------- getEstadoAlarma -------------------------------------------
/** Item[1] = estadoAlarma (TD_UINT8) */
export function getEstadisAlarmaEstadoAlarma(frame: Buffer): EnAlarmaEstado | undefined {
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.alarmas)
    return undefined;

  const data = getDataSection(frame);
  if (!data) return undefined;

  const nDatos = data.readUInt8(ESTADIS_HEADER_LEN - 1);
  if (nDatos < 2) return undefined;

  // Saltar primer item
  let offset = ESTADIS_HEADER_LEN;
  const size0 = data.readUInt8(offset + 1);
  offset = offset + 2 + size0;

  // const tipo1 = data.readUInt8(offset + 0);
  const size1 = data.readUInt8(offset + 1);
  const start1 = offset + 2;
  const end1 = start1 + size1;
  if (end1 > data.length || size1 < 1) return undefined;

  const v = data.readUInt8(start1);
  return v as EnAlarmaEstado;
}

// ------------------------------------------- getAccionConfigurada -------------------------------------------
/** Item[2] = accionConfigurada (TD_UINT8) */
export function getEstadisAlarmaAccionConfigurada(
  frame: Buffer,
): EnAlarmasAccion | undefined {
  if (getTipoRegistroEstadistico(frame) !== EnEstadisTipoRegistro.alarmas)
    return undefined;

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
  // const tipo2 = data.readUInt8(offset + 0);
  const size2 = data.readUInt8(offset + 1);
  const start2 = offset + 2;
  const end2 = start2 + size2;
  if (end2 > data.length || size2 < 1) return undefined;

  const v = data.readUInt8(start2);
  return v as EnAlarmasAccion;
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de estadísticos cambio parámetros -------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getEstadisCambioParametroIdCliente -------------------------------------------
/** Item[0] → idCliente (TD_UINT32) */
export function getEstadisCambioParametroIdCliente(frame: Buffer): number | undefined {
  const it = getEstadisticoItem(frame, 0);
  if (!it) return undefined;
  // Permitimos que el tipo no venga marcado y priorizamos el size=4
  if (it.size === 4) return it.body.readUInt32LE(0);
  // Si viene marcado correctamente:
  if (it.tipo === EnTipoDato.uint32) return unpackNumberByTipo(it.body, EnTipoDato.uint32);
  return undefined;
}

// ------------------------------------------- getEstadisCambioParametroTituloOpcion -------------------------------------------
/** Item[1] → tituloOpcion (TD_CONCATENADO) */
export function getEstadisCambioParametroTituloOpcion(frame: Buffer): string | undefined {
  const it = getEstadisticoItem(frame, 1);
  if (!it) return undefined;
  // Para concatenado usamos directamente los bytes del item (size indica la longitud).
  return it.body.toString('utf8');
}

// ------------------------------------------- getEstadisCambioParametroOpcionLinea -------------------------------------------
/** Item[2] → opcionLinea (TD_CONCATENADO) */
export function getEstadisCambioParametroOpcionLinea(frame: Buffer): string | undefined {
  const it = getEstadisticoItem(frame, 2);
  if (!it) return undefined;
  return it.body.toString('utf8');
}

// ------------------------------------------- getEstadisCambioParametroValor -------------------------------------------
/**
 * Item[3] → valor (numérico o texto).
 * - Si el tipo de item es 'concatenado' → string
 * - Si es numérico (uint8/16/32, int8/16/32, float) → number
 */
export function getEstadisCambioParametroValor(
  frame: Buffer,
): number | string | undefined {
  const it = getEstadisticoItem(frame, 3);
  if (!it) return undefined;

  // Caso texto (TD_CONCATENADO)
  if (it.tipo === (EnTipoDato as any).concatenado /* si existe en tu enum */
      || it.size > 0 && it.tipo !== EnTipoDato.uint8 && it.tipo !== EnTipoDato.int8
      && it.tipo !== EnTipoDato.uint16 && it.tipo !== EnTipoDato.int16
      && it.tipo !== EnTipoDato.uint32 && it.tipo !== EnTipoDato.int32
      && it.tipo !== EnTipoDato.float) {
    return it.body.toString('utf8');
  }

  // Caso numérico (decodificamos según tipo)
  const num = unpackNumberByTipo(it.body, it.tipo as EnTipoDato);
  return num;
}