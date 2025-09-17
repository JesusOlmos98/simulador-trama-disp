import { unpackNumberByTipo } from "src/utils/helpers";
import { ESTADIS_HEADER_LEN, TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD } from "../globals/constGlobales";
import { EnTipoDato, EnTipoTrama, EnTmEstadisticos, EnEstadisTipoRegistro, EnEeEventosApli, EnAlarmaEstado, EnAlarmasAccion, EnEstadisPeriodicidad, EnEstadisticosControladores, EnEstadoDatoEstadistico, EnGtUnidades, EnContadoresTipo, EnCrianzaAltaBajaAccion, EnCrianzaTipoAnimal } from "../globals/enums";
import { getTipoTrama, getTipoMensaje, getDataSection } from "./getTrama";
import { EstadisticoActividadDto, EstadisticoContadorDto, EstadisticoEventoDto, EstadisticoValorDto } from "src/utils/dtoLE/tt_estadisticos.dto";
import { Tiempo, Fecha } from "src/utils/tiposGlobales";

//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------------------------------- getters de estadísticos ---------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de HEADER de estadístico ----------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

const OFF_MAC = 0;                         // uint32 LE
const OFF_TIPO_DATO_HDR = 4;               // uint8
const OFF_ACK_ID = 5;                      // uint8
const OFF_VERSION = 6;                     // uint8
const OFF_TIPO_REGISTRO = 7;               // uint8
const OFF_RES1 = 8;                        // uint8
const OFF_RES2 = 9;                        // uint8
const OFF_RES3 = 10;                       // uint8
const OFF_RES4 = 11;                       // uint8
const OFF_FECHA_U32 = 12;                  // uint32 LE (paquete de fecha)
const OFF_HORA_U32 = 16;                   // uint32 LE (segundos del día u otra codificación LE)
const OFF_RES5 = 20;                       // uint8
const OFF_NDATOS = 21;                     // uint8
const OFF_ITEMS = ESTADIS_HEADER_LEN;      // inicio de items

/** Devuelve el payload de una TT_ESTADISTICOS / TM_envia_estadistico, o undefined si no cuadra. */
export function getEstadisticoPayload(frame: Buffer): Buffer | undefined {
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return undefined;
  const data = getDataSection(frame);
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;
  return data;
}

export function getEstadisHeaderMac(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt32LE(OFF_MAC);
}

export function getEstadisHeaderTipoDatoHdr(frame: Buffer): EnTipoDato | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_TIPO_DATO_HDR) as EnTipoDato;
}

export function getEstadisHeaderAckId(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_ACK_ID);
}

export function getEstadisHeaderVersion(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_VERSION);
}

export function getEstadisHeaderTipoRegistro(frame: Buffer): EnEstadisTipoRegistro | undefined {
  // ya tienes una función similar, la dejo por consistencia
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_TIPO_REGISTRO) as EnEstadisTipoRegistro;
}

export function getEstadisHeaderRes1(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_RES1);
}
export function getEstadisHeaderRes2(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_RES2);
}
export function getEstadisHeaderRes3(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_RES3);
}
export function getEstadisHeaderRes4(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_RES4);
}

export function getEstadisHeaderFechaRaw(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt32LE(OFF_FECHA_U32);
}
export function getEstadisHeaderFecha(frame: Buffer): Fecha | undefined {
  const raw = getEstadisHeaderFechaRaw(frame);
  if (raw === undefined) return undefined;
  return fechaU32ToFecha(raw);
}

export function getEstadisHeaderHoraRaw(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt32LE(OFF_HORA_U32);
}
export function getEstadisHeaderHora(frame: Buffer): Tiempo | undefined {
  const raw = getEstadisHeaderHoraRaw(frame);
  if (raw === undefined) return undefined;
  return secondsToTiempo(raw); // si tu hora va en otro packing, cambia aquí
}

export function getEstadisHeaderRes5(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_RES5);
}

export function getEstadisHeaderNumeroDatos(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  return data.readUInt8(OFF_NDATOS);
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de estadísticos VALOR (EnEstadisTipoRegistro.estadisticos) ------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

/** Índices fijos del EstadisticoValor */
const IDX_NOMBRE = 0; // TD_UINT16
const IDX_PERIODICIDAD = 1; // TD_UINT8
const IDX_VAL_MEDIO = 2; // TD_(según valorTipo)
const IDX_VAL_MAX = 3; // TD_(según valorTipo)
const IDX_VAL_MIN = 4; // TD_(según valorTipo)
const IDX_HORA_MAX = 5; // TD_TIEMPO (uint32 sec)
const IDX_HORA_MIN = 6; // TD_TIEMPO (uint32 sec)
const IDX_ESTADO = 7; // TD_UINT8
const IDX_UNIDAD = 8; // TD_UINT8

//done Muy parecida a readItemAt
/** Devuelve el item [i] del payload de datos (no del frame completo). */
export function getItemAtDatos(data: Buffer, index: number) {
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;
  const nDatos = data.readUInt8(OFF_NDATOS);
  if (index < 0 || index >= nDatos) return undefined;

  let offset = OFF_ITEMS;
  for (let i = 0; i < nDatos; i++) {
    const it = readItemAt(data, offset);
    if (!it) return undefined;
    if (i === index) return it;
    offset = it.next;
  }
  return undefined;
}

//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------- getters de variables de estadísticos VALOR (EnEstadisTipoRegistro.estadisticos) -------------------
//done ------------------------------------------------------------------------------------------------------------------------

/** EnEstadisticosControladores -> nombre (uint16 LE) */
export function getEVNombre(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_NOMBRE);
  if (!it) return undefined;
  // Preferimos verificar tipo, pero si size=2 leemos igualmente.
  if (it.tipo === EnTipoDato.uint16 && it.size >= 2) return it.value.readUInt16LE(0);
  if (it.size === 2) return it.value.readUInt16LE(0);
  return undefined;
}

/** EnEstadisPeriodicidad -> periodicidad (uint8 EnEstadisPeriodicidad) */
export function getEVPeriodicidad(frame: Buffer): EnEstadisPeriodicidad | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_PERIODICIDAD);
  if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnEstadisPeriodicidad;
  return undefined;
}

/** EnTipoDato -> tipo (EnTipoDato, inferido del item IDX_VAL_MEDIO) */
export function getEVValorTipo(frame: Buffer): EnTipoDato | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_VAL_MEDIO);
  if (!it) return undefined;
  return it.tipo as EnTipoDato;
}

/** valorMedio -> valor numérico (según EnTipoDato del item) */
export function getEVValorMedio(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_VAL_MEDIO);
  if (!it) return undefined;
  return itemToNumber(it.tipo, it.value);
}

/** valorMax -> valor numérico (según EnTipoDato del item) */
export function getEVValorMax(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_VAL_MAX);
  if (!it) return undefined;
  return itemToNumber(it.tipo, it.value);
}

/** valorMin -> valor numérico (según EnTipoDato del item) */
export function getEVValorMin(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_VAL_MIN);
  if (!it) return undefined;
  return itemToNumber(it.tipo, it.value);
}

/** Tiempo -> tiempo (uint32 seg -> Tiempo) */
export function getEVHoraValorMax(frame: Buffer): Tiempo | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_HORA_MAX);
  if (!it) return undefined;
  const sec = (it.tipo === EnTipoDato.tiempo && it.size >= 4)
    ? it.value.readUInt32LE(0)
    : undefined;
  return sec === undefined ? undefined : secondsToTiempo(sec);
}

/** Tiempo -> tiempo (uint32 seg -> Tiempo) */
export function getEVHoraValorMin(frame: Buffer): Tiempo | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_HORA_MIN);
  if (!it) return undefined;
  const sec = (it.tipo === EnTipoDato.tiempo && it.size >= 4)
    ? it.value.readUInt32LE(0)
    : undefined;
  return sec === undefined ? undefined : secondsToTiempo(sec);
}

/** EnEstadoDatoEstadistico -> estado (uint8) */
export function getEVEstado(frame: Buffer): EnEstadoDatoEstadistico | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_ESTADO);
  if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnEstadoDatoEstadistico;
  return undefined;
}

/** EnGtUnidades -> unidad (uint8 EN_GT_UNIDADES)  */
export function getEVUnidad(frame: Buffer): EnGtUnidades | undefined {
  const data = getEstadisticoPayload(frame);
  if (!data) return undefined;
  const it = getItemAtDatos(data, IDX_UNIDAD);
  if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnGtUnidades;
  return undefined;
}

/** Devuelve todas las variables decodificadas de la trama de un estadístico de valor. */
export function getEstadisticoValorCompleto(frame: Buffer): (EstadisticoValorDto & { valorTipo?: EnTipoDato }) | undefined {
  const nombre = getEVNombre(frame);
  const periodicidad = getEVPeriodicidad(frame);
  const valorTipo = getEVValorTipo(frame);
  const valorMedio = getEVValorMedio(frame);
  const valorMax = getEVValorMax(frame);
  const valorMin = getEVValorMin(frame);
  const horaValorMax = getEVHoraValorMax(frame);
  const horaValorMin = getEVHoraValorMin(frame);
  const estado = getEVEstado(frame);
  const unidad = getEVUnidad(frame);

  if (
    nombre === undefined || periodicidad === undefined ||
    valorMedio === undefined || valorMax === undefined || valorMin === undefined ||
    !horaValorMax || !horaValorMin || estado === undefined || unidad === undefined
  ) return undefined;

  return {
    nombreEstadistico: nombre as EnEstadisticosControladores,
    periodicidad: periodicidad as EnEstadisPeriodicidad,
    valorMedio, valorMax, valorMin,
    horaValorMax, horaValorMin,
    estado: estado as EnEstadoDatoEstadistico,
    unidad: unidad as EnGtUnidades,
    valorTipo: valorTipo as EnTipoDato,
  };
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de estadísticos CONTADOR (EnEstadisTipoRegistro.estadisticos) ---------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

const EC_IDX_NOMBRE = 0;
const EC_IDX_PERIODICIDAD = 1;
const EC_IDX_TIPO_CONTADOR = 2;
const EC_IDX_UNIDAD = 3;
const EC_IDX_MULTIPLICADOR = 4;
const EC_IDX_VALOR = 5;
const EC_IDX_ESTADO = 6;

/** EnEstadisticosControladores -> nombre (uint16 LE) */
export function getECNombre(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_NOMBRE); if (!it) return undefined;
  if (it.tipo === EnTipoDato.uint16 && it.size >= 2) return it.value.readUInt16LE(0);
  if (it.size === 2) return it.value.readUInt16LE(0);
  return undefined;
}

/** EnEstadisPeriodicidad -> periodicidad (uint8) */
export function getECPeriodicidad(frame: Buffer): EnEstadisPeriodicidad | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_PERIODICIDAD); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnEstadisPeriodicidad;
  return undefined;
}

/** EnContadoresTipo -> tipoContador (uint8) */
export function getECTipoContador(frame: Buffer): EnContadoresTipo | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_TIPO_CONTADOR); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnContadoresTipo;
  return undefined;
}

/** EnGtUnidades -> unidad (uint8) */
export function getECUnidad(frame: Buffer): EnGtUnidades | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_UNIDAD); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnGtUnidades;
  return undefined;
}

/** multiplicador (float LE) */
export function getECMultiplicador(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_MULTIPLICADOR); if (!it) return undefined;
  // Si el tipo está marcado como float, o al menos size=4, leemos float LE
  if (it.tipo === EnTipoDato.float && it.size >= 4) return it.value.readFloatLE(0);
  if (it.size === 4) return it.value.readFloatLE(0);
  return undefined;
}

/** Tipo del ‘valor’ (inferido del item 5) */
export function getECValorTipo(frame: Buffer): EnTipoDato | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_VALOR); if (!it) return undefined;
  return it.tipo as EnTipoDato;
}

/** valor (numérico según tipo del item 5) */
export function getECValor(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_VALOR); if (!it) return undefined;
  return itemToNumber(it.tipo, it.value);
}

/** estado (uint8) */
export function getECEstado(frame: Buffer): EnEstadoDatoEstadistico | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EC_IDX_ESTADO); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnEstadoDatoEstadistico;
  return undefined;
}

/** Extractor completo (Contador) */
export function getEstadisticoContadorCompleto(frame: Buffer): (EstadisticoContadorDto & { valorTipo?: EnTipoDato }) | undefined {
  const nombre = getECNombre(frame);
  const periodicidad = getECPeriodicidad(frame);
  const tipoContador = getECTipoContador(frame);
  const unidad = getECUnidad(frame);
  const multiplicador = getECMultiplicador(frame);
  const valorTipo = getECValorTipo(frame);
  const valor = getECValor(frame);
  const estado = getECEstado(frame);

  if (
    nombre === undefined || periodicidad === undefined || tipoContador === undefined ||
    unidad === undefined || multiplicador === undefined || valor === undefined || estado === undefined
  ) return undefined;

  return {
    nombreEstadistico: nombre as EnEstadisticosControladores,
    periodicidad: periodicidad as EnEstadisPeriodicidad,
    tipoContador: tipoContador as EnContadoresTipo,
    unidad: unidad as EnGtUnidades,
    multiplicador,
    valor,
    estado: estado as EnEstadoDatoEstadistico,
    valorTipo: valorTipo as EnTipoDato,
  };
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de estadísticos ACTIVIDAD (EnEstadisTipoRegistro.estadisticos) --------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

const EA_IDX_NOMBRE = 0;
const EA_IDX_PERIODICIDAD = 1;
const EA_IDX_VALOR_SEGS = 2;
const EA_IDX_ESTADO = 3;

/** EnEstadisticosControladores -> nombre (uint16 LE) */
export function getEActivNombre(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EA_IDX_NOMBRE); if (!it) return undefined;
  if (it.tipo === EnTipoDato.uint16 && it.size >= 2) return it.value.readUInt16LE(0);
  if (it.size === 2) return it.value.readUInt16LE(0);
  return undefined;
}

/** EnEstadisPeriodicidad -> periodicidad (uint8) */
export function getEActivPeriodicidad(frame: Buffer): EnEstadisPeriodicidad | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EA_IDX_PERIODICIDAD); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnEstadisPeriodicidad;
  return undefined;
}

/** valorSegundosConectado (uint32 LE) */
export function getEActivValorSegundos(frame: Buffer): number | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EA_IDX_VALOR_SEGS); if (!it) return undefined;
  // Permitimos leer por tamaño si el tipo no viene marcado
  if (it.tipo === EnTipoDato.uint32 && it.size >= 4) return it.value.readUInt32LE(0);
  if (it.size === 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** estado (uint8) */
export function getEActivEstado(frame: Buffer): EnEstadoDatoEstadistico | undefined {
  const data = getEstadisticoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatos(data, EA_IDX_ESTADO); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnEstadoDatoEstadistico;
  return undefined;
}

/** Extractor completo (Actividad) */
export function getEstadisticoActividadCompleto(frame: Buffer): EstadisticoActividadDto | undefined {
  const nombre = getEActivNombre(frame);
  const periodicidad = getEActivPeriodicidad(frame);
  const valorSegundosConectado = getEActivValorSegundos(frame);
  const estado = getEActivEstado(frame);

  if (
    nombre === undefined || periodicidad === undefined ||
    valorSegundosConectado === undefined || estado === undefined
  ) return undefined;

  return {
    nombreEstadistico: nombre as EnEstadisticosControladores,
    periodicidad: periodicidad as EnEstadisPeriodicidad,
    valorSegundosConectado,
    estado: estado as EnEstadoDatoEstadistico,
  };
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de estadísticos eventos (EnEstadisTipoRegistro.eventos) ---------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

/** Devuelve el payload (data) de un estadístico tipo EVENTOS o undefined si no cuadra. */
export function getEventoPayload(frame: Buffer): Buffer | undefined {
  if (getTipoTrama(frame) !== EnTipoTrama.estadisticos) return undefined;
  if (getTipoMensaje(frame) !== EnTmEstadisticos.enviaEstadistico) return undefined;

  const data = getDataSection(frame);
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;

  const tipoReg = data.readUInt8(OFF_TIPO_REGISTRO) as EnEstadisTipoRegistro;
  if (tipoReg !== EnEstadisTipoRegistro.eventos) return undefined;

  return data;
}

/** Lee item[i] del área de datos (sin validar tipoRegistro). Úsala con `getEventoPayload()` */
function getItemAtDatosEventos(data: Buffer, index: number) {
  if (!data || data.length < ESTADIS_HEADER_LEN) return undefined;
  const nDatos = data.readUInt8(OFF_NDATOS);
  if (index < 0 || index >= nDatos) return undefined;

  let offset = OFF_ITEMS;
  for (let i = 0; i < nDatos; i++) {
    const it = readItemAt(data, offset);
    if (!it) return undefined;
    if (i === index) return it; // { tipo, size, value, next }
    offset = it.next;
  }
  return undefined;
}

// -------------------------------
// Genérico: código de evento
// -------------------------------

/** Item[0] → evento (TD_UINT16) */
export function getEEventoTipoEvento(frame: Buffer): EnEeEventosApli | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  const it = getItemAtDatosEventos(data, 0); if (!it) return undefined;
  if (it.size >= 2) return it.value.readUInt16LE(0) as EnEeEventosApli;
  return undefined;
}

// =======================================
// INICIO_CRIANZA (EnEeEventosApli.inicioCrianza)
// =======================================

/** Item[1] → diaCrianza (TD_INT16) */
export function getEEInicioCrianzaDiaCrianza(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.inicioCrianza) return undefined;

  const it = getItemAtDatosEventos(data, 1); if (!it) return undefined;
  if (it.size >= 2) return it.value.readInt16LE(0);
  return undefined;
}

/** Item[2] → idUnicoCrianza (TD_UINT32) */
export function getEEInicioCrianzaIdUnico(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.inicioCrianza) return undefined;

  const it = getItemAtDatosEventos(data, 2); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

// =======================================
// ENTRADA_ANIMALES (EnEeEventosApli.entradaAnimales)
// =======================================

/** Item[1] → idUnicoCrianza (TD_UINT32) */
export function getEEEntradaAnimalesIdUnico(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.entradaAnimales) return undefined;

  const it = getItemAtDatosEventos(data, 1); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** Item[2] → inicioCrianzaTipoAnimal (TD_UINT8) */
export function getEEEntradaAnimalesTipoAnimal(frame: Buffer): EnCrianzaTipoAnimal | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.entradaAnimales) return undefined;

  const it = getItemAtDatosEventos(data, 2); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnCrianzaTipoAnimal;
  return undefined;
}

/** Item[3] → diaEntradaAnimales (TD_INT16) */
export function getEEEntradaAnimalesDiaEntrada(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.entradaAnimales) return undefined;

  const it = getItemAtDatosEventos(data, 3); if (!it) return undefined;
  if (it.size >= 2) return it.value.readInt16LE(0);
  return undefined;
}

/** Item[4] → nAnimalesInicioCrianzaMachosMixtos (TD_UINT32) */
export function getEEEntradaAnimalesNMachosMixtos(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.entradaAnimales) return undefined;

  const it = getItemAtDatosEventos(data, 4); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** Item[5] → nAnimalesInicioCrianzaHembras (TD_UINT32) */
export function getEEEntradaAnimalesNHembras(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.entradaAnimales) return undefined;

  const it = getItemAtDatosEventos(data, 5); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

// =======================================
// FIN_CRIANZA (EnEeEventosApli.finCrianza)
// =======================================

/** Item[1] → idUnicoCrianza (TD_UINT32) */
export function getEEFinCrianzaIdUnico(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.finCrianza) return undefined;

  const it = getItemAtDatosEventos(data, 1); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** Item[2] → diaCrianza (TD_INT16) */
export function getEEFinCrianzaDiaCrianza(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.finCrianza) return undefined;

  const it = getItemAtDatosEventos(data, 2); if (!it) return undefined;
  if (it.size >= 2) return it.value.readInt16LE(0);
  return undefined;
}

/** Item[3] → nAnimalesActualesMachosMixtos (TD_UINT32) */
export function getEEFinCrianzaNMachosMixtos(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.finCrianza) return undefined;

  const it = getItemAtDatosEventos(data, 3); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** Item[4] → nAnimalesActualesHembras (TD_UINT32) */
export function getEEFinCrianzaNHembras(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.finCrianza) return undefined;

  const it = getItemAtDatosEventos(data, 4); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

// =======================================
// ALTA_BAJA_RETIRADA (EnEeEventosApli.altaBajaRetirada)
// =======================================

/** Item[1] → idUnicoCrianza (TD_UINT32) */
export function getEEAltaBajaRetiradaIdUnico(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.altaBajaRetirada) return undefined;

  const it = getItemAtDatosEventos(data, 1); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** Item[2] → accion (TD_UINT8) */
export function getEEAltaBajaRetiradaAccion(frame: Buffer): EnCrianzaAltaBajaAccion | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.altaBajaRetirada) return undefined;

  const it = getItemAtDatosEventos(data, 2); if (!it) return undefined;
  if (it.size >= 1) return it.value.readUInt8(0) as EnCrianzaAltaBajaAccion;
  return undefined;
}

/** Item[3] → diaCrianza (TD_INT16) */
export function getEEAltaBajaRetiradaDiaCrianza(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.altaBajaRetirada) return undefined;

  const it = getItemAtDatosEventos(data, 3); if (!it) return undefined;
  if (it.size >= 2) return it.value.readInt16LE(0);
  return undefined;
}

/** Decodifica fecha yyyymmdd (uint32 LE) → Fecha */
function fechaYYYYMMDDToFecha(u: number): Fecha {
  const yyyy = Math.floor(u / 10000);
  const mm = Math.floor((u % 10000) / 100);
  const dd = u % 100;
  return { dia: dd, mes: mm, anyo: yyyy } as Fecha;
}

/** Item[4] → fechaIntroducirAccion (TD_FECHA yyyymmdd LE) */
export function getEEAltaBajaRetiradaFecha(frame: Buffer): Fecha | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.altaBajaRetirada) return undefined;

  const it = getItemAtDatosEventos(data, 4); if (!it) return undefined;
  if (it.size >= 4) {
    const raw = it.value.readUInt32LE(0);
    return fechaYYYYMMDDToFecha(raw);
  }
  return undefined;
}

/** Item[5] → nAnimalesAccionMachosMixtos (TD_UINT32) */
export function getEEAltaBajaRetiradaNMachosMixtos(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.altaBajaRetirada) return undefined;

  const it = getItemAtDatosEventos(data, 5); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

/** Item[6] → nAnimalesAccionHembras (TD_UINT32) */
export function getEEAltaBajaRetiradaNHembras(frame: Buffer): number | undefined {
  const data = getEventoPayload(frame); if (!data) return undefined;
  if (getEEventoTipoEvento(frame) !== EnEeEventosApli.altaBajaRetirada) return undefined;

  const it = getItemAtDatosEventos(data, 6); if (!it) return undefined;
  if (it.size >= 4) return it.value.readUInt32LE(0);
  return undefined;
}

// -----------------------------------------------
// Extractor “completo” (opcional, por conveniencia)
// -----------------------------------------------
export function getEstadisticoEventoCompleto(frame: Buffer): EstadisticoEventoDto | undefined {
  const ev = getEEventoTipoEvento(frame);
  if (ev === undefined) return undefined;

  switch (ev) {
    case EnEeEventosApli.inicioCrianza: {
      const diaCrianza = getEEInicioCrianzaDiaCrianza(frame);
      const idUnicoCrianza = getEEInicioCrianzaIdUnico(frame);
      if (diaCrianza === undefined || idUnicoCrianza === undefined) return undefined;
      return { evento: ev, diaCrianza, idUnicoCrianza };
    }

    case EnEeEventosApli.entradaAnimales: {
      const idUnicoCrianza = getEEEntradaAnimalesIdUnico(frame);
      const inicioCrianzaTipoAnimal = getEEEntradaAnimalesTipoAnimal(frame);
      const diaEntradaAnimales = getEEEntradaAnimalesDiaEntrada(frame);
      const nAnimalesInicioCrianzaMachosMixtos = getEEEntradaAnimalesNMachosMixtos(frame);
      const nAnimalesInicioCrianzaHembras = getEEEntradaAnimalesNHembras(frame);
      if (
        idUnicoCrianza === undefined || inicioCrianzaTipoAnimal === undefined ||
        diaEntradaAnimales === undefined ||
        nAnimalesInicioCrianzaMachosMixtos === undefined ||
        nAnimalesInicioCrianzaHembras === undefined
      ) return undefined;
      return {
        evento: ev,
        idUnicoCrianza,
        inicioCrianzaTipoAnimal,
        diaEntradaAnimales,
        nAnimalesInicioCrianzaMachosMixtos,
        nAnimalesInicioCrianzaHembras,
      };
    }

    case EnEeEventosApli.finCrianza: {
      const idUnicoCrianza = getEEFinCrianzaIdUnico(frame);
      const diaCrianza = getEEFinCrianzaDiaCrianza(frame);
      const nAnimalesActualesMachosMixtos = getEEFinCrianzaNMachosMixtos(frame);
      const nAnimalesActualesHembras = getEEFinCrianzaNHembras(frame);
      if (
        idUnicoCrianza === undefined || diaCrianza === undefined ||
        nAnimalesActualesMachosMixtos === undefined ||
        nAnimalesActualesHembras === undefined
      ) return undefined;
      return {
        evento: ev,
        idUnicoCrianza,
        diaCrianza,
        nAnimalesActualesMachosMixtos,
        nAnimalesActualesHembras,
      };
    }

    case EnEeEventosApli.altaBajaRetirada: {
      const idUnicoCrianza = getEEAltaBajaRetiradaIdUnico(frame);
      const accion = getEEAltaBajaRetiradaAccion(frame);
      const diaCrianza = getEEAltaBajaRetiradaDiaCrianza(frame);
      const fechaIntroducirAccion = getEEAltaBajaRetiradaFecha(frame);
      const nAnimalesAccionMachosMixtos = getEEAltaBajaRetiradaNMachosMixtos(frame);
      const nAnimalesAccionHembras = getEEAltaBajaRetiradaNHembras(frame);
      if (
        idUnicoCrianza === undefined || accion === undefined ||
        diaCrianza === undefined || !fechaIntroducirAccion ||
        nAnimalesAccionMachosMixtos === undefined ||
        nAnimalesAccionHembras === undefined
      ) return undefined;
      return {
        evento: ev,
        idUnicoCrianza,
        accion,
        diaCrianza,
        fechaIntroducirAccion,
        nAnimalesAccionMachosMixtos,
        nAnimalesAccionHembras,
      };
    }

    default:
      return undefined;
  }
}

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------- getters de estadísticos alarmas (EnEstadisTipoRegistro.alarmas) ---------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getTextoAlarma -------------------------------------------
/** Item[0] = textoAlarma (TD_UINT16 LE) */
export function getEAlarmTextoAlarma(frame: Buffer): number | undefined {
  if (getEstadisHeaderTipoRegistro(frame) !== EnEstadisTipoRegistro.alarmas)
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
export function getEAlarmEstadoAlarma(frame: Buffer): EnAlarmaEstado | undefined {
  if (getEstadisHeaderTipoRegistro(frame) !== EnEstadisTipoRegistro.alarmas)
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
export function getEAlarmAccionConfigurada(
  frame: Buffer,
): EnAlarmasAccion | undefined {
  if (getEstadisHeaderTipoRegistro(frame) !== EnEstadisTipoRegistro.alarmas)
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
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done -------------------- getters de estadísticos cambio parámetros (EnEstadisTipoRegistro.cambioParametros) ----------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------- getEstadisCambioParametroIdCliente -------------------------------------------
/** (EnEstadisTipoRegistro.cambioParametros) Item[0] → idCliente (TD_UINT32) */
export function getECPIdCliente(frame: Buffer): number | undefined {
  const it = getEstadisticoItem(frame, 0);
  if (!it) return undefined;
  // Permitimos que el tipo no venga marcado y priorizamos el size=4
  if (it.size === 4) return it.body.readUInt32LE(0);
  // Si viene marcado correctamente:
  if (it.tipo === EnTipoDato.uint32) return unpackNumberByTipo(it.body, EnTipoDato.uint32);
  return undefined;
}

// ------------------------------------------- getEstadisCambioParametroTituloOpcion -------------------------------------------
/** (EnEstadisTipoRegistro.cambioParametros) Item[1] → tituloOpcion (TD_CONCATENADO) */
export function getECPTituloOpcion(frame: Buffer): string | undefined {
  const it = getEstadisticoItem(frame, 1);
  if (!it) return undefined;
  // Para concatenado usamos directamente los bytes del item (size indica la longitud).
  return it.body.toString('utf8');
}

// ------------------------------------------- getEstadisCambioParametroOpcionLinea -------------------------------------------
/** (EnEstadisTipoRegistro.cambioParametros) Item[2] → opcionLinea (TD_CONCATENADO) */
export function getECPOpcionLinea(frame: Buffer): string | undefined {
  const it = getEstadisticoItem(frame, 2);
  if (!it) return undefined;
  return it.body.toString('utf8');
}

// ------------------------------------------- getEstadisCambioParametroValorTipo -------------------------------------------
/** (EnEstadisTipoRegistro.cambioParametros) Item[3] → valorTipo (si es numérico). Si es texto (concatenado), devuelve undefined. */
export function getECPValorTipo(frame: Buffer): EnTipoDato | undefined {
  const it = getEstadisticoItem(frame, 3);
  if (!it) return undefined;

  const t = it.tipo as EnTipoDato;
  const isConcat = (EnTipoDato as any).concatenado !== undefined && t === (EnTipoDato as any).concatenado;
  if (isConcat) return undefined; // texto → no hay valorTipo numérico

  // Tipos numéricos soportados
  switch (t) {
    case EnTipoDato.uint8:
    case EnTipoDato.int8:
    case EnTipoDato.uint16:
    case EnTipoDato.int16:
    case EnTipoDato.uint32:
    case EnTipoDato.int32:
    case EnTipoDato.float:
    case EnTipoDato.tiempo:
      return t;
    default:
      // Fallback por tamaño si el tipo no vino marcado (heurística):
      if (it.size === 1) return EnTipoDato.uint8;
      if (it.size === 2) return EnTipoDato.uint16;
      if (it.size === 4) return EnTipoDato.float; // por defecto de tu serializer
      return undefined;
  }
}

// ------------------------------------------- getEstadisCambioParametroValor -------------------------------------------
/**
 * (EnEstadisTipoRegistro.cambioParametros) 
 * Item[3] → valor (numérico o texto).
 * - Si el tipo de item es 'concatenado' → string
 * - Si es numérico (uint8/16/32, int8/16/32, float) → number
 */
export function getECPValor(
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

//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ---------------------------------------------------- HELPERS -----------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------
//done ------------------------------------------------------------------------------------------------------------------------

/** Convierte segundos del día a Tiempo {hora,min,seg}. */
export function secondsToTiempo(total: number): Tiempo {
  const t = Math.max(0, Math.floor(total));
  const hora = Math.floor(t / 3600) % 24;
  const min = Math.floor((t % 3600) / 60);
  const seg = t % 60;
  return { hora, min, seg } as Tiempo;
}

/** Decodifica una fecha empaquetada en 32 bits LE.
 *  Convención usada: dia(8b) | mes(8b) | año(16b) -> LE
 *  Si tu serializer usa otra convención, ajusta este decoder.
 */
export function fechaU32ToFecha(u: number): Fecha {
  const dia = u & 0xff;
  const mes = (u >>> 8) & 0xff;
  let anyo = (u >>> 16) & 0xffff;
  if (anyo < 100) anyo = 2000 + anyo; // tolerancia si sólo guardas 2 dígitos
  return { dia, mes, anyo } as Fecha;
}
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
  if (getEstadisHeaderTipoRegistro(frame) !== EnEstadisTipoRegistro.cambioParametros) return undefined;

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

