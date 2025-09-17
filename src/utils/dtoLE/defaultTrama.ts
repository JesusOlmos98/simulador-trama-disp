import { TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO } from 'src/utils/LE/globals/constGlobales';
import {
  EnTipoEquipo,
  EnEstadisticosControladores,
  EnEstadisPeriodicidad,
  EnEstadoDatoEstadistico,
  EnGtUnidades,
  EnTipoDato,
  EnEstadisTipoRegistro,
  EnContadoresTipo,
  EnEeEventosApli,
  EnAlarmas,
  EnAlarmaEstado,
  EnAlarmasAccion,
} from 'src/utils/LE/globals/enums';
import { Tiempo, Fecha } from 'src/utils/tiposGlobales';
import {
  EstadisticoValorDto,
  EstadisticoDato,
  serializarDatosEstadisticoValor,
  EnviaEstadisticoDto,
  EstadisticoContadorDto,
  serializarDatosEstadisticoContador,
  EstadisticoActividadDto,
  serializarDatosEstadisticoActividad,
  EeInicioCrianzaDto,
  serializarDatosEstadisticoEvento,
  EstadisticoAlarmaDto,
  serializarDatosEstadisticoAlarma,
  serializarDatosEstadisticoCambioParametros,
  EstadisticoCambioParametroDto,
} from './tt_estadisticos.dto';
import { PresentacionDto } from './tt_sistema.dto';

// * Usados como ejemplos para enviar tramas.

// -------------------------------------------------- defaultPresentacionCTI40 --------------------------------------------------
export const defaultPresentacionCTI40: PresentacionDto = {
  nVariables: 6,
  versionPresentacion: 1,
  mac: 0x12345678,
  versionEquipo: 2,
  tipoEquipo: EnTipoEquipo.cti40, // OMEGA = 140, CTI40 = 115
  claveEquipo: 0,
  versionHw: 1,
};

// -------------------------------------------------- defaultPresentacionCTI40 --------------------------------------------------
// export const defaultPresentacionOMEGA: PresentacionDto = {
//   nVariables: 6,
//   versionPresentacion: 1,
//   mac: 0x16263646,
//   versionEquipo: 3,
//   tipoEquipo: EnTipoEquipo.omega,
//   claveEquipo: 0,
//   versionHw: 1,
// };

//* ------------------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------- defaultDataTempSonda1 -----------------------------------------------------
//* ------------------------------------------------------------------------------------------------------------------------------

export const defaultDatosValorTempSonda1: EstadisticoValorDto = {
  // Usa tu catálogo real. Si no existe, usa un ID fijo (p.ej. 0xFFFF)
  nombreEstadistico: EnEstadisticosControladores?.tempSonda1 ?? 0xffff,

  periodicidad: EnEstadisPeriodicidad.envioHoras,

  // ºC
  valorMedio: 23.12,
  valorMax: 24.5,
  valorMin: 21.8,

  // horas:min:seg
  horaValorMax: { hora: 14, min: 20, seg: 0 } as Tiempo, // 14:20:00
  horaValorMin: { hora: 6, min: 10, seg: 0 } as Tiempo, // 06:10:00

  estado: EnEstadoDatoEstadistico.correcto,
  unidad: EnGtUnidades.gradoCentigrado,

  // Por defecto los valores son FLOAT (como en tu ejemplo)
  valorTipo: EnTipoDato.float,
};

const datosTempSonda1: EstadisticoDato[] = serializarDatosEstadisticoValor(
  defaultDatosValorTempSonda1,
);

export const defaultDataTempSonda1: EnviaEstadisticoDto = {
  mac: 0x12345678,
  tipoDato: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO, // 47
  identificadorUnicoDentroDelSegundo: 0x12345678, // ACK
  version: 1,
  tipoRegistro: EnEstadisTipoRegistro.estadisticos, // 1
  res1: 0x00,
  res2: 0x00,
  res3: 0x00,
  res4: 0x00,

  fecha: { dia: 11, mes: 11, anyo: 2020 } as Fecha,
  hora: { hora: 11, min: 10, seg: 9 } as Tiempo,
  res5: 0x00,
  numeroDatos: 9,
  datos: datosTempSonda1,
};

//* ------------------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------- defaultDataContadorAgua ---------------------------------------------------
//* ------------------------------------------------------------------------------------------------------------------------------

export const defaultDatosContadorAgua: EstadisticoContadorDto = {
  nombreEstadistico: EnEstadisticosControladores.contadorAgua,
  periodicidad: EnEstadisPeriodicidad.variable,
  tipoContador: EnContadoresTipo.agua,
  unidad: EnGtUnidades.litros,
  multiplicador: 0.01,
  valor: 123456,
  estado: EnEstadoDatoEstadistico.correcto,
  // valorTipo: EnTipoDato.uint32, // (opcional, es el default)
};

const datosContadorAgua: EstadisticoDato[] = serializarDatosEstadisticoContador(
  defaultDatosContadorAgua,
);

export const defaultDataContadorAgua: EnviaEstadisticoDto = {
  mac: 0x12345678,
  tipoDato: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO, // 47
  identificadorUnicoDentroDelSegundo: 0x00, // se rellena en runtime con nextStatId()
  version: 1,
  tipoRegistro: EnEstadisTipoRegistro.estadisticos,
  res1: 0x00,
  res2: 0x00,
  res3: 0x00,
  res4: 0x00,

  fecha: { dia: 11, mes: 11, anyo: 2020 } as Fecha,
  hora: { hora: 11, min: 11, seg: 11 } as Tiempo,
  res5: 0x00,

  numeroDatos: datosContadorAgua.length,
  datos: datosContadorAgua,
};

//* ------------------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------- defaultDataActividadCalefaccion1 -------------------------------------------
//* ------------------------------------------------------------------------------------------------------------------------------

export const defaultDatosActividadCalefaccion1: EstadisticoActividadDto = {
  nombreEstadistico: EnEstadisticosControladores.actividadCalefaccion1,
  periodicidad: EnEstadisPeriodicidad.envioHoras,
  valorSegundosConectado: 3600,
  estado: EnEstadoDatoEstadistico.correcto,
};

const datosActividadCalefaccion1: EstadisticoDato[] =
  serializarDatosEstadisticoActividad(defaultDatosActividadCalefaccion1);

export const defaultDataActividadCalefaccion1: EnviaEstadisticoDto = {
  mac: 0x12345678,
  tipoDato: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO, // 47
  identificadorUnicoDentroDelSegundo: 0x00, // se rellena en runtime con nextStatId()
  version: 1,
  tipoRegistro: EnEstadisTipoRegistro.estadisticos,
  res1: 0x00,
  res2: 0x00,
  res3: 0x00,
  res4: 0x00,

  fecha: { dia: 11, mes: 11, anyo: 2020 } as Fecha,
  hora: { hora: 11, min: 11, seg: 11 } as Tiempo,
  res5: 0x00,

  numeroDatos: datosActividadCalefaccion1.length,
  datos: datosActividadCalefaccion1,
};

//* ------------------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------- defaultDataEventoInicioCrianza -------------------------------------------
//* ------------------------------------------------------------------------------------------------------------------------------

export const defaultEventoInicioCrianza: EeInicioCrianzaDto = {
  evento: EnEeEventosApli.inicioCrianza, // TD_UINT16
  diaCrianza: 0, // TD_INT16
  idUnicoCrianza: 0xa1b2c3d4, // TD_UINT32
};

// Serializamos a la lista de items (tipo/size/dato)
const datosEventoInicioCrianza: EstadisticoDato[] =
  serializarDatosEstadisticoEvento(defaultEventoInicioCrianza);

export const defaultDataEventoInicioCrianza: EnviaEstadisticoDto = {
  mac: 0x12345678,
  tipoDato: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO, // 47
  identificadorUnicoDentroDelSegundo: 0x00, // se rellena con nextStatId()
  version: 1,
  tipoRegistro: EnEstadisTipoRegistro.eventos, // 👈 evento
  res1: 0x00,
  res2: 0x00,
  res3: 0x00,
  res4: 0x00,

  fecha: { dia: 11, mes: 11, anyo: 2020 } as Fecha,
  hora: { hora: 11, min: 11, seg: 11 } as Tiempo,
  res5: 0x00,

  numeroDatos: datosEventoInicioCrianza.length,
  datos: datosEventoInicioCrianza,
};

//* ------------------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------- defaultDataAlarmaTempAlta ------------------------------------------------
//* ------------------------------------------------------------------------------------------------------------------------------

export const defaultDatosAlarmaTempAlta: EstadisticoAlarmaDto = {
  textoAlarma: EnAlarmas.temperaturaRelativaMaxima, // TD_UINT16 (ID de texto/alarma)
  estadoAlarma: EnAlarmaEstado.on, // TD_UINT8 (estado actual: OFF/ON_ALARMA/ON_AVISO)
  accionConfigurada: EnAlarmasAccion.onAlarma, // TD_UINT8 (config: OFF/ALARM/AVISO)
};

// Serializamos a la lista de items (tipo/size/dato)
const datosAlarmaTempAlta: EstadisticoDato[] = serializarDatosEstadisticoAlarma(
  defaultDatosAlarmaTempAlta,
);

export const defaultDataAlarmaTempAlta: EnviaEstadisticoDto = {
  mac: 0x12345678,
  tipoDato: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO, // 47
  identificadorUnicoDentroDelSegundo: 0x00, // se rellena con nextStatId()
  version: 1,
  tipoRegistro: EnEstadisTipoRegistro.alarmas, // 👈 alarma
  res1: 0x00,
  res2: 0x00,
  res3: 0x00,
  res4: 0x00,

  fecha: { dia: 11, mes: 11, anyo: 2020 } as Fecha,
  hora: { hora: 11, min: 11, seg: 11 } as Tiempo,
  res5: 0x00,

  numeroDatos: datosAlarmaTempAlta.length,
  datos: datosAlarmaTempAlta,
};

//* ------------------------------------------------------------------------------------------------------------------------------
//* ---------------------------------------- defaultDataCambioParametro (ejemplo) -----------------------------------------------
//* ------------------------------------------------------------------------------------------------------------------------------

export const defaultDatosCambioParametro: EstadisticoCambioParametroDto = {
  idCliente: 0x11223344, // TD_UINT32
  tituloOpcion: 'Consigna temperatura', // TD_CONCATENADO
  opcionLinea: 'Nave 1', // TD_CONCATENADO
  valorNumero: 23.5, // valor numérico...
  valorTipo: EnTipoDato.float, // ...como FLOAT (alternativa: usa valorTexto si es string)
  // valorTexto: "23.5 ºC"                       // <- si prefieres texto, usa esto y quita valorNumero/valorTipo
};

// Serializamos a la lista de items (tipo/size/dato)
const datosCambioParametro: EstadisticoDato[] =
  serializarDatosEstadisticoCambioParametros(defaultDatosCambioParametro);

export const defaultDataCambioParametro: EnviaEstadisticoDto = {
  mac: 0x12345678,
  tipoDato: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO, // 47
  identificadorUnicoDentroDelSegundo: 0x00, // se rellena con nextStatId()
  version: 1,
  tipoRegistro: EnEstadisTipoRegistro.cambioParametros, // 👈 cambio parámetro
  res1: 0x00,
  res2: 0x00,
  res3: 0x00,
  res4: 0x00,

  fecha: { dia: 11, mes: 11, anyo: 2020 } as Fecha,
  hora: { hora: 11, min: 11, seg: 11 } as Tiempo,
  res5: 0x00,

  numeroDatos: datosCambioParametro.length,
  datos: datosCambioParametro,
};
