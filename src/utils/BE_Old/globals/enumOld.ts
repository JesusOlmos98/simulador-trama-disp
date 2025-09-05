

/** Direcciones de red */
export enum EnDireccionNodosRed {
  direccionRedServidor = 0,
  direccionRedCentralAsincronas = 1,
  direccionRedCentralSincronas = 2,
  direccionRedServidor2 = 3,
  direccionRedRadioSincronas = 5,
  direccionRedRadioAsincronas = 6,
  direccionRedRedLocalAsinControla = 7,
  direccionRedRedLocalAsinFinal = 8,
}

/** Tipos trama */
export enum EnTipoTramaOld {
  ttNoConfigurada = 0,
  ttConfiguracionRf = 1,
  ttCentralDispositivo = 2,
  ttDispositivoCentral = 3,
  ttRtPeticionesCentral = 4,
  ttServidorCentral = 5,
  ttCentralServidor = 6,
  ttConfiguracion = 7, // tipo trama central rf
  ttRfCentral = 8,
  ttRfDispositivo = 9,
  ttDispositivoRf = 10,
  ttRfRf = 11,
  ttRedLocalDatos = 12,

  ttOmegaPantallaPlaca = 13, // la central hace de pasarela (transparente)
  ttDepuracion = 14,         // la central hace de pasarela (transparente)
  ttActualizacionDesdePc = 15,
  ttActualizacionDesdePcCom = 16, // actualizar placa de comunicaciones con boot
  ttSincronizacionEbus = 17,      // sincronización 485 del EBUS
  ttOmegaPantallaPlacaFinal = 18, // pasarela; esperar respuesta finales EBUS
  ttOmegaPantallaPlacaFinalLocal = 19, // pasarela local
  ttActualizacionDesdePcEbusFinal = 20, // actualizar placas finales
  ttSincronizacionComInternos = 21,     // sincronización entre micros (p.ej. CTX DLG)

  // ? (22) TT_CONTROL_ACCESOS estaba comentado en C; se mantiene el hueco numérico

  ttServiciosClaveValor = 23,
  ttActualizacionServer = 24,
}

/** Tipo de trama asíncrona */
export enum EnTipoTramaAsincronas {
  ttaAlarma = 0,
  ttaCambioParametros = 1,
  ttaDispositivoDescubierto = 2,
  ttaNodoPresenteCrcParam = 3,
  ttaNodoPresenteCrcAlarm = 4,
  ttaEventosHistoricos = 5,
  ttaEventosBaseDatosHistoricos = 6,
  ttaPeticionDatosRedLocal = 8,
  ttaPeticionCargasSilosRedLocal = 9,
  ttaPeticionEnvioDatosHistoricos = 10,
  ttaPuedoPedirNServiciosRl = 11,
  ttaEnviaNServiciosRl = 12,
  ttaPresenciaNodoFinalRl = 13,
  ttaPidePrimeraSincronizacion = 14,
  ttaFuerzaSincronizacion = 15,
  ttaFuerzaPrimeraSincronizacion = 16,
  ttaPermisoAccesoEnviarTramaServidor = 17,
}

/** TM Servidor ← Central */
export enum EnTipoMensajeServidorCentral {
  tmPeticionNServicios = 0,
  tmPeticionInstantaneos = 1,
  tmPeticionRangoServicios = 2,
  tmPeticionParametros = 3,
  tmPeticionAlarmas = 4,
  tmPresenciaCentral = 5,
  tmAceptacionCentral = 6,
  tmCambioParametros = 7,
  tmPeticionOtros = 8,
  tmPeticionBaseDatos = 9,
  tmEventosServidorCentral = 10,
  tmPeticionTablaCentral = 11,
  tmRtIdRespuesta = 12,

  tmPeticionServiciosCentral = 50,

  // a partir de 100: la central hace pasarela hacia el CAN
  tmPeticionAlarmasActivas = 102,
}

/** TT Central - Servidor */
export enum EnTipoMensajeCentralServidor {
  tmRtPeticionNServicios = 0,
  tmRtPeticionInstantaneos = 1, // no se utiliza
  tmRtPeticionRangoServicios = 2,
  tmRtPeticionParametrosFin = 3, // no
  tmRtPeticionParametrosMas = 4, // no
  tmRtPeticionAlarmasFin = 5,
  tmRtPeticionAlarmasMas = 6,
  tmRtPresenciaCentral = 7,
  tmTramaPresentacionCentral = 8,
  tmAlarmasAsincronas = 9,
  tmParametrosAsincronos = 10, // no
  tmRtCambioParametros = 11,
  tmDispositivoDescubierto = 12,
  tmRtPeticionOtrosFin = 13, // no
  tmRtPeticionOtrosMas = 14, // no
  tmRtPeticionBaseDatosFin = 15,
  tmRtPeticionBaseDatosMas = 16,
  tmEventoDispositivo = 17,
  tmRtTablaCentralMas = 18,
  tmRtTablaCentralFin = 19,
  tmEventoCambioEstadoNodo = 20,
  tmAlarmasAsincronas2 = 21, // no

  tmTramaAckAPeticionSinRespuesta = 22,

  tmRtPeticionServiciosCentral = 50, // no

  tmRtPresenciaCentralWifi = 104,
  tmCambioEstadoCentralWifi = 105,
}

/** TT Central - Dispositivo */
export enum EnTipoMensajeCentralDispositivo {
  tmPeticionParametrosCd = 1,     // no se usa
  tmPeticionParametrosMasCd = 2,  // no
  tmPeticionNServiciosCd = 3,
  tmPeticionAlarmasCd = 4,
  tmPeticionAlarmasMasCd = 5,
  tmPeticionEventosCd = 6,        // no
  tmPeticionDescubrimientoCd = 7,
  tmConfigServiciosCd = 8,        // no
  tmConfigNodoCd = 9,
  tmPeticionInstantaneosCd = 10,
  tmPeticionRangoServiciosCd = 11, // no
  tmCambioParametrosCd = 12,
  tmPeticionBaseDatosCd = 13,
  tmPeticionEventosHistoricosCd = 16, // no
  tmRtIdRespuestaCd = 17,

  tmRtEnviaParametroHistorico = 100,
  tmAccesoEnviarParametroHistorico = 101,
  tmConfirmaNodoConfigurado = 104,

  tmAccesoEnviarTramaServidor = 105,
}

/** TT Dispositivo - Central */
export enum EnTipoMensajeDispositivoCentral {
  tmRtPeticionParametrosMasDc = 1,  // no
  tmRtPeticionParametrosFinDc = 2,  // no
  tmRtPeticionNServiciosDc = 0,
  tmRtPeticionAlarmasMasDc = 4,
  tmRtPeticionAlarmasFinDc = 5,
  tmRtPeticionEventosDc = 6,        // no
  tmRtPeticionDescubrimientoDc = 7,
  tmRtConfigServiciosDc = 8,        // no
  tmRtConfigNodoDc = 9,
  tmRtPeticionInstantaneosDc = 10,  // no
  tmRtPeticionRangoServiciosDc = 11, // no
  tmRtCambioParametrosDc = 12,
  tmRtPeticionBaseDatosDc = 13,
  tmRtPeticionAlarmasMas2Dc = 14,
  tmRtPeticionAlarmasFin2Dc = 15,
  tmRtEventosHistoricosDc = 16,

  tmEnviaParametroHistorico = 100,
  tmRtPeticionAlarmasActivas = 103,
  tmFuerzaPresentacionDispositivo = 104,
}

/** TT Central - RF */
export enum EnTipoMensajeCentralRf {
  tmInicioAsociacion = 1,
  tmFinAsociacion = 2,
  tmRtIncorporacion = 3,
  tmPeticionEventosAsin = 4,
}

/** TT RF - Central */
export enum EnTipoMensajeRfCentral {
  tmIncorporacion = 1,
  tmFinPeticionEventosAsin = 2,
  tmEventosAsincronosNodos = 3,
}

/** TT Red Local (RF ↔ Central) */
export enum EnTipoMensajeRedLocal {
  tmPeticionServiciosRl = 4,
  tmRtPeticionServiciosRl = 5,
  tmSincronizacionNodoRl = 6,
}

/** TT RF - RF */
export enum EnTipoMensajeRfRf {
  tmCompruebaRssi = 1,
  tmRtCompruebaRssi = 2,
  tmPeticionEventosRf = 3,
}

/** TT Omega Pantalla - Placa */
export enum EnTipoMensajeOmegaPantallaPlaca {
  tmOmegaPantallaPlacaNoMensaje = 0,
  tmOmegaPantallaPlacaPidePantalla = 1,
  tmOmegaPantallaPlacaRtPantalla = 2,
  tmOmegaPantallaPlacaEnviaEstadistico = 3, // lo envía el final
  tmOmegaPantallaPlacaRtEstadistico = 4,    // confirma que se insertó el estadístico
  tmOmegaPantallaPlacaPidePantallaPrincipal = 5,
  tmOmegaPantallaPlacaCambioParametro = 6,
  tmOmegaPantallaPlacaPideEstadisticoPantallaLocal = 7, // solo pantalla local

  tmOmegaPantallaPlacaPideFicheroConfiguracionExportacion = 8,   // pedir fichero configuración (export)
  tmOmegaPantallaPlacaPideFicheroConfiguracionExportacionRt = 9, // respuesta datos de exportación

  tmOmegaPantallaPlacaPideFicheroConfiguracionImportacion = 10,  // pedir datos a pantalla/servidor (import)
  tmOmegaPantallaPlacaPideFicheroConfiguracionImportacionRtPantallas = 11, // envío variables a importar

  tmOmegaPantallaPlacaPideEstadosVpad = 12,  // estado leds/acciones pulsadores Vpad
  tmOmegaPantallaPlacaRtPideEstadosVpad = 13,

  tmOmegaPantallaPlacaConsolaPantalla = 14,

  tmOmegaPantallaPidePantallaSincronizacion = 15,
  tmOmegaPantallaRtPantallaSincronizacion = 16,
}

/** TT Depuración */
export enum EnTipoMensajeDepuracion {
  tmDepuracionNoMensaje = 0,
  tmDepuracionPeticionConsola = 1,
  tmDepuracionRtPeticionConsola = 2,
}

/** TT Actualización desde PC / COM / EBUS */
export enum EnTmActualiPc {
  tmActualipcDescubrimientoPlaca = 1,
  tmActualipcRtDescubrimientoPlaca = 2,
  tmActualipcInicioActualizacion = 3,
  tmActualipcPideFicheroTrama = 4,
  // (5 no definido en el C original)
  tmActualipcRtDatosFichero = 6,
  tmActualipcRtDatosFicheroFin = 7,
  tmEnvioActualizacionErrorReinicia = 8,
  tmCpuNoRespondePlacaCom = 9,
  tmRtInformacionPlaca = 10,
  tmPeticionInformacion = 11,
}

/** TT Actualiza Server */
export enum EnTmActualizaServer {
  tmAsSinPeticion = 0,
  tmAsPeticionUltimaVersion = 1,
  tmAsRtPeticionUltimaVersion = 2,
  tmAsPeticionFichero = 3,
  tmAsRtPeticionFichero = 4,
  tmAsPeticionCrcFichero = 5,
  tmAsRtPeticionCrcFichero = 6,
  tmAsTxPantallaInicioActualizacion = 7,
  tmAsRxPantallaInicioActualizacion = 8,
  tmAsTxPantallaFichero = 9,
  tmAsRxPantallaFichero = 10,
  tmAsTxPantallaFinFichero = 11,
  tmAsRxPantallaFinFichero = 12,
  tmAsTxPantallaInfo = 13,
  tmAsRxPantallaInfo = 14,
  tmAsTxIniciaAcualizacionRemota = 15, // “acualizacion” tal cual en el original
}

/** EBUS – Dispositivos */
export enum EnBcTipoMensajeOld {
  tmAccionEnvioCt = 0,
  tmRespuestaFin = 1,
  tmRespuestaErrorEstructura = 2,      // la placa recibió menos bytes de los esperados
  tmRespuestaCtSincronizacion = 3,     // confirma que el controlador recibió la trama
  tmPideEstadisticos = 4,
  tmRtPideEstadisticos = 5,
  tmRtPideEstadisticosPilaVacia = 6,
  tmRespuestaFinalEnBoot = 7,          // el final está en boot
}

/** Sincro COM Internos */
export enum EnSincroComInternosTipoMensaje {
  tmEnviaSincronizacion = 0,
  tmRtEnviaSincronizacion = 1,
}

/** TT Servicios Clave-Valor */
export enum EnTipoMensajeServiciosClaveValor {
  tmScvPeticionServidorFinal = 0,
  tmScvRtPeticionServidorFinal = 1,
  tmScvPeticionFinalServidor = 2,
  tmScvRtPeticionFinalServidor = 3,
}

/** GTDETEC – Detección de trama */
export enum EnGtdetecTrama {
  gtdetecStTrama = 0,
  gtdetecStTramaAsin = 1,
  gtdetecStTramaSimple = 2,
}

/** DF – Tipo de dato / acción */
export enum EnTipoDatoDfAccion {
  tipoDatoAccionDfEstadisticoUint8 = 1,
  tipoDatoAccionDfEstadisticoInt8 = 2,
  tipoDatoAccionDfEstadisticoUint16 = 3,
  tipoDatoAccionDfEstadisticoInt16 = 4,
  tipoDatoAccionDfEstadisticoUint32 = 5,
  tipoDatoAccionDfEstadisticoInt32 = 6,
  tipoDatoAccionDfEstadisticoFloat1 = 7,
  tipoDatoAccionDfEstadisticoFloat2 = 8,
  tipoDatoAccionDfEstadisticoFloat3 = 9,

  tipoDatoAccionDfCambioParametroUint8 = 10,
  tipoDatoAccionDfCambioParametroInt8 = 11,
  tipoDatoAccionDfCambioParametroUint16 = 12,
  tipoDatoAccionDfCambioParametroInt16 = 13,
  tipoDatoAccionDfCambioParametroUint32 = 14,
  tipoDatoAccionDfCambioParametroInt32 = 15,
  tipoDatoAccionDfCambioParametroFloat1 = 16,
  tipoDatoAccionDfCambioParametroFloat2 = 17,
  tipoDatoAccionDfCambioParametroFloat3 = 18,

  tipoDatoAccionDfAlarmas = 19,

  tipoDatoAccionDfCambioParametroTiempo = 20,
  tipoDatoAccionDfCambioParametroTiempoHm = 21,
  tipoDatoAccionDfCambioParametroTiempoMs = 22,
  tipoDatoAccionDfCambioParametroFecha = 23,

  tipoDatoAccionDfEstadisticoTiempo = 24,
  tipoDatoAccionDfEstadisticoTiempoHm = 25,
  tipoDatoAccionDfEstadisticoTiempoMs = 26,
  tipoDatoAccionDfEstadisticoFecha = 27,

  tipoDatoAccionDfEstadisticoString = 28,
  tipoDatoAccionDfCambioParametroString = 29,

  tipoDatoAccionDfInicioCrianza = 30,
  tipoDatoAccionDfFinCrianza = 31,

  tipoDatoAccionAltasBajas = 32,   // contine altas/bajas/retiradas/eliminar
  tipoDatoAccionWarning = 33,      // warnings
  tipoDatoAccionEntradaAnimales = 34,

  tipoDatoAccionDfCambioParametroTexto = 35,
  tipoDatoAccionCambioParametroSincronizacion = 36,

  tipoDatoAccionDfEstadisticoFloat0 = 37,
  tipoDatoAccionDfCambioParametroFloat0 = 38,

  tipoDatoAccionDatosEbusFinales = 39,
  tipoDatoAccionDebugString = 40,

  // pila DataFlash: no se envía a pantallas/servidor
  tipoDatoAccionPdDatoCompuestoInicio = 41,
  tipoDatoAccionPdDatoCompuesto = 42,

  // eventos/cambios concatenados
  tipoDatoAccionEventoConcatenado = 43,
  tipoDatoAccionCambioParametroConcatenado = 44,

  // método unificado para eventos (sustituye WARNING / ALARMAS)
  tipoDatoAccionEvento = 45,

  // estadístico genérico (rellenado desde aplicación)
  tipoDatoAccionEstadisticoGenerico = 46,
}

/** Tipos de evento de introducción (bitmask) */
export enum EnTipoEventoIntroduccion {
  introduccionAlarmasGeneral = 0x00000001,
  introduccionWarning = 0x00000002,
  introduccionDosificacion = 0x00000004,
}

/** Eventos/Estadísticos – Tipo */
export enum EnEventosEstadisTipo {
  alarmas = 0,
  warning = 1,
  evento = 2,
}

/** Eventos/Estadísticos – Familia */
export enum EnEventosEstadisFamilia {
  noDefinido = 0,
  alimentacion = 1,        // Esta familia es para los eventos de la alimentación avanzada
  alimentacionSimple = 2,
}

/** Eventos/Estadísticos – Subfamilia */
export enum EnEventosEstadisSubfamilia {
  noDefinido = 0,
}

/** Eventos/Estadísticos – Propiedades (bitmask) */
export enum EnEventosEstadisPropiedades {
  noDefinido = 0x0000,
  accionEventoOn = 0x0001,   // si el bit0=1 el evento está conectado; si 0, desconectado
  eventoSonoro = 0x0002,     // si es alarma/warning y bit1=1 indica que es sonoro
}
