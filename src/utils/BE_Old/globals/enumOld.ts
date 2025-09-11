

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
// export enum EnTipoTramaOld {
//   ttNoConfigurada = 0,
//   ttConfiguracionRf = 1,
//   ttCentralDispositivo = 2,

//   ttDispositivoCentral = 3,
//   ttRtPeticionesCentral = 4,
//   ttServidorCentral = 5,
//   ttCentralServidor = 6,
//   ttConfiguracion = 7, // tipo trama central rf
//   ttRfCentral = 8,
//   ttRfDispositivo = 9,
//   ttDispositivoRf = 10,
//   ttRfRf = 11,
//   ttRedLocalDatos = 12,

//   ttOmegaPantallaPlaca = 13, // la central hace de pasarela (transparente)
//   ttDepuracion = 14,         // la central hace de pasarela (transparente)
//   ttActualizacionDesdePc = 15,
//   ttActualizacionDesdePcCom = 16, // actualizar placa de comunicaciones con boot
//   ttSincronizacionEbus = 17,      // sincronización 485 del EBUS
//   ttOmegaPantallaPlacaFinal = 18, // pasarela; esperar respuesta finales EBUS
//   ttOmegaPantallaPlacaFinalLocal = 19, // pasarela local
//   ttActualizacionDesdePcEbusFinal = 20, // actualizar placas finales
//   ttSincronizacionComInternos = 21,     // sincronización entre micros (p.ej. CTX DLG)

//   // ? (22) TT_CONTROL_ACCESOS estaba comentado en C; se mantiene el hueco numérico

//   ttServiciosClaveValor = 23,
//   ttActualizacionServer = 24,
// }

/** Tipos de trama (OLD) — según documentación */
export enum EnTipoTramaOld {
  /** (no aparece en doc; útil para default) */
  noConfigurada = 0,

  configuracionRf = 1,                 // TT_configuracion_RF
  centralDispositivo = 2,              // TT_central_dispositivo
  envioDispositivoFinal = 3,           // TT_envio_dispositivo_final
  rtPeticionesCentral = 4,             // TT_rt_peticiones_central
  envioServidor = 5,                   // TT_envio_servidor
  centralServidor = 6,                 // TT_central_servidor
  centralRf = 7,                       // TT_central_rf
  rfCentral = 8,                       // TT_rf_central
  rfDispositivo = 9,                   // TT_rf_dispositivo
  dispositivoRf = 10,                  // TT_dispositivo_rf
  rfRf = 11,                           // TT_rf_rf
  redLocalDatos = 12,                  // TT_RED_LOCAL_DATOS
  omegaPantallaPlaca = 13,             // TT_OMEGA_PANTALLA_PLACA
  depuracion = 14,                     // TT_depuracion
  actualizacionDesdePc = 15,           // TT_actualizacion_desde_pc
  actualizacionDesdePcCom = 16,        // TT_actualizacion_desde_pc_COM
  sincronizacionEbus = 17,             // TT_SINCRONIZACION_EBUS
  omegaPantallaPlacaFinal = 18,        // TT_OMEGA_PANTALLA_PLACA_FINAL
  omegaPantallaPlacaFinalLocal = 19,   // TT_OMEGA_PANTALLA_PLACA_FINAL_LOCAL
  actualizacionDesdePcEbusFinal = 20,  // TT_actualizacion_desde_pc_EBUS_final
  sincronizacionComInternos = 21,      // TT_SINCRONIZACION_COM_INTERNOS
  controlAccesos = 22,                 // TT_CONTROL_ACCESOS
  serviciosClaveValor = 23,            // TT_SERVICIOS_CLAVE_VALOR
  actualizacionServer = 24,            // TT_actualizacion_server
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
export enum EnTipoDatoDFAccion {
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

export enum EnEstadisticosNombres {
  vacio = 0,

  tempSonda1MediaHora = 1,
  tempSonda2MediaHora = 2,
  tempSonda3MediaHora = 3,
  tempSonda4MediaHora = 4,
  tempSonda5MediaHora = 5,
  tempSonda6MediaHora = 6,
  tempSonda7MediaHora = 7,
  tempSonda8MediaHora = 8,
  tempSonda9MediaHora = 9,
  tempSonda10MediaHora = 10,
  tempSonda11MediaHora = 11,
  tempSonda12MediaHora = 12,

  tempSonda1MediaDia = 15,
  tempSonda2MediaDia = 16,
  tempSonda3MediaDia = 17,
  tempSonda4MediaDia = 18,
  tempSonda5MediaDia = 19,
  tempSonda6MediaDia = 20,
  tempSonda7MediaDia = 21,
  tempSonda8MediaDia = 22,
  tempSonda9MediaDia = 23,
  tempSonda10MediaDia = 24,
  tempSonda11MediaDia = 25,
  tempSonda12MediaDia = 26,

  cont1EventosTiempoOnHora = 30,
  cont1EventosTiempoOnDia = 31,

  cont2EventosTiempoOnHora = 32,
  cont2EventosTiempoOnDia = 33,

  cont3EventosTiempoOnHora = 34,
  cont3EventosTiempoOnDia = 35,

  tempSonda1MaxHora = 40,
  tempSonda2MaxHora = 41,
  tempSonda3MaxHora = 42,
  tempSonda4MaxHora = 43,
  tempSonda5MaxHora = 44,
  tempSonda6MaxHora = 45,
  tempSonda7MaxHora = 46,
  tempSonda8MaxHora = 47,
  tempSonda9MaxHora = 48,
  tempSonda10MaxHora = 49,
  tempSonda11MaxHora = 50,
  tempSonda12MaxHora = 51,

  tempSonda1MaxDia = 55,
  tempSonda2MaxDia = 56,
  tempSonda3MaxDia = 57,
  tempSonda4MaxDia = 58,
  tempSonda5MaxDia = 59,
  tempSonda6MaxDia = 60,
  tempSonda7MaxDia = 61,
  tempSonda8MaxDia = 62,
  tempSonda9MaxDia = 63,
  tempSonda10MaxDia = 64,
  tempSonda11MaxDia = 65,
  tempSonda12MaxDia = 66,

  tempSonda1MinHora = 71,
  tempSonda2MinHora = 72,
  tempSonda3MinHora = 73,
  tempSonda4MinHora = 74,
  tempSonda5MinHora = 75,
  tempSonda6MinHora = 76,
  tempSonda7MinHora = 77,
  tempSonda8MinHora = 78,
  tempSonda9MinHora = 79,
  tempSonda10MinHora = 80,
  tempSonda11MinHora = 81,
  tempSonda12MinHora = 82,

  tempSonda1MinDia = 86,
  tempSonda2MinDia = 87,
  tempSonda3MinDia = 88,
  tempSonda4MinDia = 89,
  tempSonda5MinDia = 90,
  tempSonda6MinDia = 91,
  tempSonda7MinDia = 92,
  tempSonda8MinDia = 93,
  tempSonda9MinDia = 94,
  tempSonda10MinDia = 95,
  tempSonda11MinDia = 96,
  tempSonda12MinDia = 97,

  percentil52Bascula1 = 100,
  percentil57Bascula1 = 101,
  percentil62Bascula1 = 102,
  percentil67Bascula1 = 103,
  percentil72Bascula1 = 104,
  percentil77Bascula1 = 105,
  percentil82Bascula1 = 106,
  percentil87Bascula1 = 107,
  percentil92Bascula1 = 108,
  percentil97Bascula1 = 109,
  percentil102Bascula1 = 110,
  percentil107Bascula1 = 111,
  percentil112Bascula1 = 112,
  percentil117Bascula1 = 113,
  percentil122Bascula1 = 114,
  percentil127Bascula1 = 115,
  percentil132Bascula1 = 116,
  percentil137Bascula1 = 117,
  percentil142Bascula1 = 118,
  percentil147Bascula1 = 119,
  desviacionTipicaBascula1 = 120,
  uniformidadParvadaBascula1 = 121,
  coeficienteVariacionBascula1 = 122,
  desviacionObjetivoBascula1 = 123,
  pesoBascula1 = 124,
  pesoMedioBascula1 = 125,
  pesoMaxBascula1 = 126,
  pesoMinBascula1 = 127,
  numeroPesadasBascula1 = 128,
  pesoObjetivoBascula1 = 129,
  incrementoPesoMedioBascula1 = 130,
  incrementoPesoFifoBascula1 = 131,

  percentil52Bascula2 = 140,
  percentil57Bascula2 = 141,
  percentil62Bascula2 = 142,
  percentil67Bascula2 = 143,
  percentil72Bascula2 = 144,
  percentil77Bascula2 = 145,
  percentil82Bascula2 = 146,
  percentil87Bascula2 = 147,
  percentil92Bascula2 = 148,
  percentil97Bascula2 = 149,
  percentil102Bascula2 = 150,
  percentil107Bascula2 = 151,
  percentil112Bascula2 = 152,
  percentil117Bascula2 = 153,
  percentil122Bascula2 = 154,
  percentil127Bascula2 = 155,
  percentil132Bascula2 = 156,
  percentil137Bascula2 = 157,
  percentil142Bascula2 = 158,
  percentil147Bascula2 = 159,
  desviacionTipicaBascula2 = 160,
  uniformidadParvadaBascula2 = 161,
  coeficienteVariacionBascula2 = 162,
  desviacionObjetivoBascula2 = 163,
  pesoBascula2 = 164,
  pesoMedioBascula2 = 165,
  pesoMaxBascula2 = 166,
  pesoMinBascula2 = 167,
  numeroPesadasBascula2 = 168,
  pesoObjetivoBascula2 = 169,
  incrementoPesoMedioBascula2 = 170,
  incrementoPesoFifoBascula2 = 171,

  percentil52Bascula3 = 180,
  percentil57Bascula3 = 181,
  percentil62Bascula3 = 182,
  percentil67Bascula3 = 183,
  percentil72Bascula3 = 184,
  percentil77Bascula3 = 185,
  percentil82Bascula3 = 186,
  percentil87Bascula3 = 187,
  percentil92Bascula3 = 188,
  percentil97Bascula3 = 189,
  percentil102Bascula3 = 190,
  percentil107Bascula3 = 191,
  percentil112Bascula3 = 192,
  percentil117Bascula3 = 193,
  percentil122Bascula3 = 194,
  percentil127Bascula3 = 195,
  percentil132Bascula3 = 196,
  percentil137Bascula3 = 197,
  percentil142Bascula3 = 198,
  percentil147Bascula3 = 199,
  desviacionTipicaBascula3 = 200,
  uniformidadParvadaBascula3 = 201,
  coeficienteVariacionBascula3 = 202,
  desviacionObjetivoBascula3 = 203,
  pesoBascula3 = 204,
  pesoMedioBascula3 = 205,
  pesoMaxBascula3 = 206,
  pesoMinBascula3 = 207,
  numeroPesadasBascula3 = 208,
  pesoObjetivoBascula3 = 209,
  incrementoPesoMedioBascula3 = 210,
  incrementoPesoFifoBascula3 = 211,

  pesadaIndividualBascula = 219,

  cargaAutomaticaSilo1 = 220,
  cargaAutomaticaSilo2 = 221,
  cargaAutomaticaSilo3 = 222,
  cargaAutomaticaSilo4 = 223,
  cargaAutomaticaSilo5 = 224,
  cargaAutomaticaSilo6 = 225,
  cargaAutomaticaSilo7 = 226,

  cargaManualSilo1 = 227,
  cargaManualSilo2 = 228,
  cargaManualSilo3 = 229,
  cargaManualSilo4 = 230,
  cargaManualSilo5 = 231,
  cargaManualSilo6 = 232,
  cargaManualSilo7 = 233,

  calibracionConCargaSilo1 = 234,
  calibracionConCargaSilo2 = 235,
  calibracionConCargaSilo3 = 236,
  calibracionConCargaSilo4 = 237,
  calibracionConCargaSilo5 = 238,
  calibracionConCargaSilo6 = 239,
  calibracionConCargaSilo7 = 240,

  consumoHoraSilo1 = 241,
  consumoHoraSilo2 = 242,
  consumoHoraSilo3 = 243,
  consumoHoraSilo4 = 244,
  consumoHoraSilo5 = 245,
  consumoHoraSilo6 = 246,
  consumoHoraSilo7 = 247,

  consumoDiaSilo1 = 248,
  consumoDiaSilo2 = 249,
  consumoDiaSilo3 = 250,
  consumoDiaSilo4 = 251,
  consumoDiaSilo5 = 252,
  consumoDiaSilo6 = 253,
  consumoDiaSilo7 = 254,

  pesoHoraSilo1 = 255,
  pesoHoraSilo2 = 256,
  pesoHoraSilo3 = 257,
  pesoHoraSilo4 = 258,
  pesoHoraSilo5 = 259,
  pesoHoraSilo6 = 260,
  pesoHoraSilo7 = 261,

  pesoDiaSilo1 = 262,
  pesoDiaSilo2 = 263,
  pesoDiaSilo3 = 264,
  pesoDiaSilo4 = 265,
  pesoDiaSilo5 = 266,
  pesoDiaSilo6 = 267,
  pesoDiaSilo7 = 268,

  consumoHoraTotal = 269,
  consumoDiaTotal = 270,

  ordenyoLecheLotes = 271,
  volumenDepositoLecheLotesDiario = 272,
  volumenDepositoLecheLotesHorario = 273,
  descargasLecheLotes = 274,
  ordenyoLecheDepositoDiario = 275,
  ordenyoLecheDepositoHorario = 276,
  cantidadPorLoteDiaria = 277,
  cantidadTotalLotesDiaria = 278,

  pesoDiaSiloGenericoSustraccion = 280,
  pesoHoraSiloGenericoSustraccion = 281,
  consumoDiaSiloGenericoSustraccion = 282,
  consumoHoraSiloGenericoSustraccion = 283,
  consumoTotalDiaSiloGenericoSustraccion = 284,
  consumoTotalHoraSiloGenericoSustraccion = 285,
  cargasSiloGenericoSustraccion = 286,

  volumenDiaDepositoGenericoSustraccion = 287,
  volumenHoraDepositoGenericoSustraccion = 288,
  consumoDiaDepositoGenericoSustraccion = 289,
  consumoHoraDepositoGenericoSustraccion = 290,
  consumoTotalDiaDepositoGenericoSustraccion = 291,
  consumoTotalHoraDepositoGenericoSustraccion = 292,
  cargasDepositoGenericoSustraccion = 293,

  pesoDiaTolvaSustraccion = 294,
  pesoHoraTolvaSustraccion = 295,
  consumoDiaTolvaSustraccion = 296,
  consumoHoraTolvaSustraccion = 297,
  consumoTotalDiaTolvaSustraccion = 298,
  consumoTotalHoraTolvaSustraccion = 299,
  cargasTolvaSustraccion = 300,

  volumenDiarioDepositoGenericoAdicion = 301,
  volumenHorarioDepositoGenericoAdicion = 302,
  cargasDiariaDepositoGenericoAdicion = 303,
  cargasHorariaDepositoGenericoAdicion = 304,
  cargasTotalDiaDepositoGenericoAdicion = 305,
  cargasTotalHoraDepositoGenericoAdicion = 306,
  descargasDepositoGenericoAdicion = 307,

  pesoDiarioSiloGenericoAdicion = 308,
  pesoHorarioSiloGenericoAdicion = 309,
  cargasDiariaSiloGenericoAdicion = 310,
  cargasHorariaSiloGenericoAdicion = 311,
  cargasTotalDiaSiloGenericoAdicion = 312,
  cargasTotalHoraSiloGenericoAdicion = 313,
  descargasSiloGenericoAdicion = 314,

  cargasAcumuladoDiaSiloPienso = 315,
  cargasAcumuladoHoraSiloPienso = 316,

  cargasAcumuladoDiaSiloGenericoSustraccion = 317,
  cargasAcumuladoHoraSiloGenericoSustraccion = 318,

  cargasAcumuladoDiaTolvaSustraccion = 319,
  cargasAcumuladoHoraTolvaSustraccion = 320,

  cargasAcumuladoDiaDepositoGenericoSustraccion = 321,
  cargasAcumuladoHoraDepositoGenericoSustraccion = 322,

  descargasAcumuladoDiaSiloGenericoAdicion = 323,
  descargasAcumuladoHoraSiloGenericoAdicion = 324,

  descargasAcumuladoDiaDepositoGenericoAdicion = 325,
  descargasAcumuladoHoraDepositoGenericoAdicion = 326,

  descargasAcumuladoDiaLecheLotes = 327,
  descargasAcumuladoHoraLecheLotes = 328,

  humedadSonda1MediaHora = 329,
  humedadSonda2MediaHora = 330,
  humedadSonda3MediaHora = 331,
  humedadSonda4MediaHora = 332,
  humedadSonda5MediaHora = 333,
  humedadSonda6MediaHora = 334,

  humedadSonda1MediaDia = 335,
  humedadSonda2MediaDia = 336,
  humedadSonda3MediaDia = 337,
  humedadSonda4MediaDia = 338,
  humedadSonda5MediaDia = 339,
  humedadSonda6MediaDia = 340,

  humedadSonda1MaxHora = 341,
  humedadSonda2MaxHora = 342,
  humedadSonda3MaxHora = 343,
  humedadSonda4MaxHora = 344,
  humedadSonda5MaxHora = 345,
  humedadSonda6MaxHora = 346,

  humedadSonda1MaxDia = 347,
  humedadSonda2MaxDia = 348,
  humedadSonda3MaxDia = 349,
  humedadSonda4MaxDia = 350,
  humedadSonda5MaxDia = 351,
  humedadSonda6MaxDia = 352,

  humedadSonda1MinHora = 353,
  humedadSonda2MinHora = 354,
  humedadSonda3MinHora = 355,
  humedadSonda4MinHora = 356,
  humedadSonda5MinHora = 357,
  humedadSonda6MinHora = 358,

  humedadSonda1MinDia = 359,
  humedadSonda2MinDia = 360,
  humedadSonda3MinDia = 370,
  humedadSonda4MinDia = 371,
  humedadSonda5MinDia = 372,
  humedadSonda6MinDia = 373,

  tempContadorAguaMediaHora = 500,
  tempContadorAguaMediaDia = 501,
  tempContadorAguaHoraMax = 502,
  tempContadorAguaHoraMin = 503,
  tempContadorAguaDiaMax = 504,
  tempContadorAguaDiaMin = 505,

  phMediaHora = 506,
  phMediaDia = 507,
  phHoraMax = 508,
  phHoraMin = 509,
  phDiaMax = 510,
  phDiaMin = 511,

  n2oMediaHora = 512,
  n2oMediaDia = 513,
  n2oHoraMax = 514,
  n2oHoraMin = 515,
  n2oDiaMax = 516,
  n2oDiaMin = 517,

  velocidadVientoExteriorMediaHora = 518,
  velocidadVientoExteriorMediaDia = 519,
  velocidadVientoExteriorHoraMax = 520,
  velocidadVientoExteriorHoraMin = 521,
  velocidadVientoExteriorDiaMax = 522,
  velocidadVientoExteriorDiaMin = 523,

  direccionVientoExteriorMediaHora = 524,
  direccionVientoExteriorMediaDia = 525,
  direccionVientoExteriorHoraMax = 526,
  direccionVientoExteriorHoraMin = 527,
  direccionVientoExteriorDiaMax = 528,
  direccionVientoExteriorDiaMin = 529,

  radiacionSolarExteriorMediaHora = 530,
  radiacionSolarExteriorMediaDia = 531,
  radiacionSolarExteriorHoraMax = 532,
  radiacionSolarExteriorHoraMin = 533,
  radiacionSolarExteriorDiaMax = 534,
  radiacionSolarExteriorDiaMin = 535,

  nMovimientosVentana1Hora = 536,
  nMovimientosVentana2Hora = 537,
  nMovimientosVentana3Hora = 538,
  nMovimientosVentana4Hora = 539,
  nMovimientosVentana5Hora = 540,
  nMovimientosVentana6Hora = 541,

  nMovimientosVentana1Dia = 542,
  nMovimientosVentana2Dia = 543,
  nMovimientosVentana3Dia = 544,
  nMovimientosVentana4Dia = 545,
  nMovimientosVentana5Dia = 546,
  nMovimientosVentana6Dia = 547,

  actividadVentana1Hora = 548,
  actividadVentana2Hora = 549,
  actividadVentana3Hora = 550,
  actividadVentana4Hora = 551,
  actividadVentana5Hora = 552,
  actividadVentana6Hora = 553,

  actividadVentana1Dia = 554,
  actividadVentana2Dia = 555,
  actividadVentana3Dia = 556,
  actividadVentana4Dia = 557,
  actividadVentana5Dia = 558,
  actividadVentana6Dia = 559,

  actividadHumidificacionHora = 560,
  actividadHumidificacionDia = 561,

  actividadRecirculacionHora = 562,
  actividadRecirculacionDia = 563,

  nMovimientosPantallaHora = 564,
  nMovimientosPantallaDia = 565,

  actividadPantallaHora = 566,
  actividadPantallaDia = 567,

  lluviaSiNoHora = 568,
  lluviaSiNoDia = 569,

  posicionMediaVentana1Hora = 570,
  posicionMediaVentana2Hora = 571,
  posicionMediaVentana3Hora = 572,
  posicionMediaVentana4Hora = 573,
  posicionMediaVentana5Hora = 574,
  posicionMediaVentana6Hora = 575,

  posicionMediaVentana1Dia = 576,
  posicionMediaVentana2Dia = 577,
  posicionMediaVentana3Dia = 578,
  posicionMediaVentana4Dia = 579,
  posicionMediaVentana5Dia = 580,
  posicionMediaVentana6Dia = 581,

  posicionMediaPantallaHora = 582,
  posicionMediaPantallaDia = 583,

  posicionMaximaVentana1Hora = 584,
  posicionMaximaVentana2Hora = 585,
  posicionMaximaVentana3Hora = 586,
  posicionMaximaVentana4Hora = 587,
  posicionMaximaVentana5Hora = 588,
  posicionMaximaVentana6Hora = 589,

  posicionMaximaVentana1Dia = 590,
  posicionMaximaVentana2Dia = 591,
  posicionMaximaVentana3Dia = 592,
  posicionMaximaVentana4Dia = 593,
  posicionMaximaVentana5Dia = 594,
  posicionMaximaVentana6Dia = 595,

  posicionMaximaPantallaHora = 596,
  posicionMaximaPantallaDia = 597,

  posicionMinimaVentana1Hora = 598,
  posicionMinimaVentana2Hora = 599,
  posicionMinimaVentana3Hora = 600,
  posicionMinimaVentana4Hora = 601,
  posicionMinimaVentana5Hora = 602,
  posicionMinimaVentana6Hora = 603,

  posicionMinimaVentana1Dia = 604,
  posicionMinimaVentana2Dia = 605,
  posicionMinimaVentana3Dia = 606,
  posicionMinimaVentana4Dia = 607,
  posicionMinimaVentana5Dia = 608,
  posicionMinimaVentana6Dia = 609,

  posicionMinimaPantallaHora = 610,
  posicionMinimaPantallaDia = 611,

  tempInteriorMediaHora = 1848,
  tempInteriorMediaDia = 1849,
  tempInteriorHoraMax = 1850,
  tempInteriorHoraMin = 1851,
  tempInteriorDiaMax = 1852,
  tempInteriorDiaMin = 1853,

  tempConsignaMediaHora = 1854,
  tempConsignaMediaDia = 1855,

  tempExteriorMediaHora = 1856,
  tempExteriorMediaDia = 1857,
  tempExteriorHoraMax = 1858,
  tempExteriorHoraMin = 1859,
  tempExteriorDiaMax = 1860,
  tempExteriorDiaMin = 1861,

  humInteriorMediaHora = 1862,
  humInteriorMediaDia = 1863,
  humInteriorHoraMax = 1864,
  humInteriorHoraMin = 1865,
  humInteriorDiaMax = 1866,
  humInteriorDiaMin = 1867,

  humConsignaMediaHora = 1868,
  humConsignaMediaDia = 1869,

  humExteriorMediaHora = 1870,
  humExteriorMediaDia = 1871,
  humExteriorHoraMax = 1872,
  humExteriorHoraMin = 1873,
  humExteriorDiaMax = 1874,
  humExteriorDiaMin = 1875,

  co2InteriorMediaHora = 1876,
  co2InteriorMediaDia = 1877,
  co2InteriorHoraMax = 1878,
  co2InteriorHoraMin = 1879,
  co2InteriorDiaMax = 1880,
  co2InteriorDiaMin = 1881,

  nh3InteriorMediaHora = 1882,
  nh3InteriorMediaDia = 1883,
  nh3InteriorHoraMax = 1884,
  nh3InteriorHoraMin = 1885,
  nh3InteriorDiaMax = 1886,
  nh3InteriorDiaMin = 1887,

  actividadCal1Hora = 1888,
  actividadCal2Hora = 1889,
  actividadCal3Hora = 1890,
  actividadCal4Hora = 1891,
  actividadCal5Hora = 1892,
  actividadCal6Hora = 1893,
  actividadCal7Hora = 1894,
  actividadCal8Hora = 1895,

  actividadCal1Dia = 1896,
  actividadCal2Dia = 1897,
  actividadCal3Dia = 1898,
  actividadCal4Dia = 1899,
  actividadCal5Dia = 1900,
  actividadCal6Dia = 1901,
  actividadCal7Dia = 1902,
  actividadCal8Dia = 1903,

  actividadCt1Hora = 1904,
  actividadCt2Hora = 1905,
  actividadCt3Hora = 1906,
  actividadCt4Hora = 1907,

  actividadCt1Dia = 1908,
  actividadCt2Dia = 1909,
  actividadCt3Dia = 1910,
  actividadCt4Dia = 1911,

  actividadRefrigeracionPHora = 1912,
  actividadRefrigeracionAuxHora = 1913,

  actividadRefrigeracionPDia = 1914,
  actividadRefrigeracionAuxDia = 1915,

  etapa1Hora = 1916,
  etapa2Hora = 1917,
  etapa3Hora = 1918,
  etapa4Hora = 1919,
  etapa5Hora = 1920,
  etapa6Hora = 1921,
  etapa7Hora = 1922,
  etapa8Hora = 1923,
  etapa9Hora = 1924,
  etapa10Hora = 1925,
  etapa11Hora = 1926,
  etapa12Hora = 1927,
  etapa13Hora = 1928,
  etapa14Hora = 1929,
  etapa15Hora = 1930,
  etapa16Hora = 1931,
  etapa17Hora = 1932,
  etapa18Hora = 1933,
  etapa19Hora = 1934,
  etapa20Hora = 1935,
  etapa21Hora = 1936,
  etapa22Hora = 1937,
  etapa23Hora = 1938,
  etapa24Hora = 1939,
  etapa25Hora = 1940,
  etapa26Hora = 1941,
  etapa27Hora = 1942,
  etapa28Hora = 1943,
  etapa29Hora = 1944,
  etapa30Hora = 1945,
  etapa31Hora = 1946,
  etapa32Hora = 1947,

  etapa1Dia = 1948,
  etapa2Dia = 1949,
  etapa3Dia = 1950,
  etapa4Dia = 1951,
  etapa5Dia = 1952,
  etapa6Dia = 1953,
  etapa7Dia = 1954,
  etapa8Dia = 1955,
  etapa9Dia = 1956,
  etapa10Dia = 1957,
  etapa11Dia = 1958,
  etapa12Dia = 1959,
  etapa13Dia = 1960,
  etapa14Dia = 1961,
  etapa15Dia = 1962,
  etapa16Dia = 1963,
  etapa17Dia = 1964,
  etapa18Dia = 1965,
  etapa19Dia = 1966,
  etapa20Dia = 1967,
  etapa21Dia = 1968,
  etapa22Dia = 1969,
  etapa23Dia = 1970,
  etapa24Dia = 1971,
  etapa25Dia = 1972,
  etapa26Dia = 1973,
  etapa27Dia = 1974,
  etapa28Dia = 1975,
  etapa29Dia = 1976,
  etapa30Dia = 1977,
  etapa31Dia = 1978,
  etapa32Dia = 1979,

  actividadEaAHora = 1980,
  actividadEaBHora = 1981,
  actividadEaCHora = 1982,
  actividadEaDHora = 1983,
  actividadEaEHora = 1984,
  actividadEaTHora = 1985,

  actividadEaADia = 1986,
  actividadEaBDia = 1987,
  actividadEaCDia = 1988,
  actividadEaDDia = 1989,
  actividadEaEDia = 1990,
  actividadEaTDia = 1991,

  contadorGeneralAguaDia = 2304,
  contadorGeneralAguaHora = 2305,

  contadorLinea1AguaDia = 2306,
  contadorLinea1AguaHora = 2307,

  contadorLinea2AguaDia = 2308,
  contadorLinea2AguaHora = 2309,

  contadorLinea3AguaDia = 2310,
  contadorLinea3AguaHora = 2311,

  contadorLinea4AguaDia = 2312,
  contadorLinea4AguaHora = 2313,

  contadorLinea5AguaDia = 2314,
  contadorLinea5AguaHora = 2315,

  contadorLinea6AguaDia = 2316,
  contadorLinea6AguaHora = 2317,

  contadorLinea7AguaDia = 2318,
  contadorLinea7AguaHora = 2319,

  contadorLinea8AguaDia = 2320,
  contadorLinea8AguaHora = 2321,

  actividadCal9Hora = 2322,
  actividadCal10Hora = 2323,
  actividadCal11Hora = 2324,
  actividadCal12Hora = 2325,

  actividadCal9Dia = 2326,
  actividadCal10Dia = 2327,
  actividadCal11Dia = 2328,
  actividadCal12Dia = 2329,

  contadorGeneralIncrementoDiaAnterior = 2330,
  contadorGeneralPorAnimalHora = 2331,
  contadorGeneralPorAnimalDia = 2332,

  etapaCriadero1Hora = 2591,
  etapaCriadero2Hora = 2592,
  etapaS0Hora = 2593,
  etapaNaturalHora = 2594,

  etapaCriadero1Dia = 2597,
  etapaCriadero2Dia = 2598,
  etapaS0Dia = 2599,
  etapaNaturalDia = 2600,

  consumoSilo1Hora = 2637,
  consumoSilo2Hora = 2638,
  consumoSilo3Hora = 2639,

  consumoSilo1Dia = 2640,
  consumoSilo2Dia = 2641,
  consumoSilo3Dia = 2642,

  consumoTotalHora = 2643,
  consumoTotalDia = 2644,

  pesoBascula1Dia = 2645,
  pesoBascula2Dia = 2646,
  pesoBascula3Dia = 2647,

  pesoAnimalDia = 2648,

  gananciaPesoDia = 2649,
  consumoPorAnimalDia = 2650,

  acumuladoConsumoPorAnimalCrianzaDia = 2651,
  acumuladoConsumoTotalCrianzaDia = 2652,

  variacionConsumoPorcentaDiaAnteriorDia = 2653,
  indiceConversionAlimenticiaDia = 2654,

  kgCarneM2Dia = 2655,

  gananciaPesoMediaDia = 2656,
  factorEficienciaDia = 2657,

  indiceProduccionDia = 2658,
  litrosAnimalAguaAcumuladoCrianzaDia = 2659,

  actividadEaA3Hora = 2913,
  actividadEaB3Hora = 2914,

  actividadEaA3Dia = 2918,
  actividadEaB3Dia = 2919,

  contador1Hora = 2986,
  contador1Dia = 2987,

  contador2Hora = 2988,
  contador2Dia = 2989,

  contador3Hora = 2990,
  contador3Dia = 2991,

  contador4Hora = 2992,
  contador4Dia = 2993,

  contador5Hora = 2994,
  contador5Dia = 2995,

  contador6Hora = 2996,
  contador6Dia = 2997,

  ch4MediaHora = 3250,
  ch4MediaDia = 3251,

  ch4MediaHoraMax = 3255,
  ch4MediaDiaMax = 3256,

  ch4MediaHoraMin = 3257,
  ch4MediaDiaMin = 3258,

  consumoOrigen1AlimentacionHora = 3259,
  consumoOrigen2AlimentacionHora = 3260,
  consumoOrigen3AlimentacionHora = 3261,
  consumoOrigen4AlimentacionHora = 3262,

  consumoOrigen1AlimentacionDia = 3270,
  consumoOrigen2AlimentacionDia = 3271,
  consumoOrigen3AlimentacionDia = 3272,
  consumoOrigen4AlimentacionDia = 3273,

  datalogTempSonda1Media = 3300,
  datalogTempSonda2Media = 3301,
  datalogTempSonda3Media = 3302,
  datalogTempSonda4Media = 3303,
  datalogTempSonda5Media = 3304,
  datalogTempSonda6Media = 3305,
  datalogTempSonda7Media = 3306,
  datalogTempSonda8Media = 3307,
  datalogTempSonda9Media = 3308,
  datalogTempSonda10Media = 3309,
  datalogTempSonda11Media = 3310,
  datalogTempSonda12Media = 3311,

  datalogTempInterior = 3312,
  datalogTempExterior = 3313,

  datalogHumedadInterior = 3314,
  datalogHumedadExterior = 3315,

  datalogCo2 = 3316,
  datalogNh3 = 3317,

  actividadVentilacionHora = 3318,
  actividadVentilacionDia = 3319,

  numeroMovimientosHoraEaA = 3320,
  numeroMovimientosDiaEaA = 3321,

  numeroMovimientosHoraEaB = 3322,
  numeroMovimientosDiaEaB = 3323,

  numeroMovimientosHoraEaC = 3324,
  numeroMovimientosDiaEaC = 3325,

  tempEaAMediaHora = 3326,
  tempEaAMediaDia = 3327,

  tempEaBMediaHora = 3328,
  tempEaBMediaDia = 3329,

  tempEaCMediaHora = 3330,
  tempEaCMediaDia = 3331,

  tempEaAMaxHora = 3332,
  tempEaAMaxDia = 3333,

  tempEaBMaxHora = 3334,
  tempEaBMaxDia = 3335,

  tempEaCMaxHora = 3336,
  tempEaCMaxDia = 3337,

  tempEaAMinHora = 3338,
  tempEaAMinDia = 3339,

  tempEaBMinHora = 3340,
  tempEaBMinDia = 3341,

  tempEaCMinHora = 3342,
  tempEaCMinDia = 3343,

  tempVentilacionMediaHora = 3344,
  tempVentilacionMediaDia = 3345,

  tempVentilacionMaxHora = 3346,
  tempVentilacionMaxDia = 3347,

  tempVentilacionMinHora = 3348,
  tempVentilacionMinDia = 3349,

  alimentacionAvanzadaTotalDiaD1 = 3350,
  alimentacionAvanzadaTotalDiaD2 = 3351,
  alimentacionAvanzadaTotalDiaD3 = 3352,
  alimentacionAvanzadaTotalDiaD4 = 3353,
  alimentacionAvanzadaTotalDiaD5 = 3354,
  alimentacionAvanzadaTotalDiaD6 = 3355,
  alimentacionAvanzadaTotalDiaD7 = 3356,
  alimentacionAvanzadaTotalDiaD8 = 3357,
  alimentacionAvanzadaTotalDiaD9 = 3358,
  alimentacionAvanzadaTotalDiaD10 = 3359,
  alimentacionAvanzadaTotalDiaD11 = 3360,
  alimentacionAvanzadaTotalDiaD12 = 3361,
  alimentacionAvanzadaTotalDiaD13 = 3362,
  alimentacionAvanzadaTotalDiaD14 = 3363,
  alimentacionAvanzadaTotalDiaD15 = 3364,
  alimentacionAvanzadaTotalDiaD16 = 3365,

  alimentacionAvanzadaTotalAcumD1 = 3366,
  alimentacionAvanzadaTotalAcumD2 = 3367,
  alimentacionAvanzadaTotalAcumD3 = 3368,
  alimentacionAvanzadaTotalAcumD4 = 3369,
  alimentacionAvanzadaTotalAcumD5 = 3370,
  alimentacionAvanzadaTotalAcumD6 = 3371,
  alimentacionAvanzadaTotalAcumD7 = 3372,
  alimentacionAvanzadaTotalAcumD8 = 3373,
  alimentacionAvanzadaTotalAcumD9 = 3374,
  alimentacionAvanzadaTotalAcumD10 = 3375,
  alimentacionAvanzadaTotalAcumD11 = 3376,
  alimentacionAvanzadaTotalAcumD12 = 3377,
  alimentacionAvanzadaTotalAcumD13 = 3378,
  alimentacionAvanzadaTotalAcumD14 = 3379,
  alimentacionAvanzadaTotalAcumD15 = 3380,
  alimentacionAvanzadaTotalAcumD16 = 3381,

  tempCTermicoMediaHora = 3382,
  tempCTermicoMediaDia = 3383,

  tempCTermicoMaxHora = 3384,
  tempCTermicoMaxDia = 3385,

  tempCTermicoMinHora = 3386,
  tempCTermicoMinDia = 3387,

  chtPruebasHumMediaHora = 3390,
  chtPruebasHumMaxHora = 3391,
  chtPruebasHumMinHora = 3392,

  chtPruebasCo2MediaHora = 3393,
  chtPruebasCo2MaxHora = 3394,
  chtPruebasCo2MinHora = 3395,

  nMovimientosEaAHora = 3396,
  nMovimientosEaBHora = 3397,
  nMovimientosEaCHora = 3398,
  nMovimientosEaDHora = 3399,
  nMovimientosEaEHora = 3400,
  nMovimientosEaTHora = 3401,
  nMovimientosEaA3Hora = 3402,
  nMovimientosEaB3Hora = 3403,

  nMovimientosEaADia = 3404,
  nMovimientosEaBDia = 3405,
  nMovimientosEaCDia = 3406,
  nMovimientosEaDDia = 3407,
  nMovimientosEaEDia = 3408,
  nMovimientosEaTDia = 3409,
  nMovimientosEaA3Dia = 3410,
  nMovimientosEaB3Dia = 3411,

  eventosEventosControlAcceso = 3412,

  consumoSilo4Hora = 3413,
  consumoSilo5Hora = 3414,
  consumoSilo6Hora = 3415,
  consumoSilo7Hora = 3416,

  consumoSilo4Dia = 3417,
  consumoSilo5Dia = 3418,
  consumoSilo6Dia = 3419,
  consumoSilo7Dia = 3420,

  datalogCh4 = 3421,
  datalogN2o = 3422,
  datalogPh = 3423,

  // Nota: en el original aparece “POCENTAJE”; mantengo el literal para no perder trazabilidad
  pocentajeHoraSilo = 3424,
  cargaAutomaticaSilo = 3425,

  eventosMaquinaAlimentacion = 3426,
  alarmaGenerica = 3427,
  registroGenerico = 3428,

  eaATempInicio = 3429,
  eaATempDestino = 3430,
  eaADireccionMov = 3431,
  eaAPosInicio = 3432,
  eaAPosDestino = 3433,
  eaATiempoMov = 3434,
  eaARazonMov = 3435,

  eaBTempInicio = 3436,
  eaBTempDestino = 3437,
  eaBDireccionMov = 3438,
  eaBPosInicio = 3439,
  eaBPosDestino = 3440,
  eaBTiempoMov = 3441,
  eaBRazonMov = 3442,

  eaCTempInicio = 3443,
  eaCTempDestino = 3444,
  eaCDireccionMov = 3445,
  eaCPosInicio = 3446,
  eaCPosDestino = 3447,
  eaCTiempoMov = 3448,
  eaCRazonMov = 3449,

  eaAPosMediaHora = 3450,
  eaAPosMediaDia = 3451,
  eaAPosHoraMax = 3452,
  eaAPosHoraMin = 3453,
  eaAPosDiaMax = 3454,
  eaAPosDiaMin = 3455,

  eaBPosMediaHora = 3456,
  eaBPosMediaDia = 3457,
  eaBPosHoraMax = 3458,
  eaBPosHoraMin = 3459,
  eaBPosDiaMax = 3460,
  eaBPosDiaMin = 3461,

  eaCPosMediaHora = 3462,
  eaCPosMediaDia = 3463,
  eaCPosHoraMax = 3464,
  eaCPosHoraMin = 3465,
  eaCPosDiaMax = 3466,
  eaCPosDiaMin = 3467,

  actividadRefrigeracionAux2Hora = 3468,
  actividadRefrigeracionAux2Dia = 3469,

  // En el original: “POCENTAJE … INSTANTANEO”
  pocentajeHoraSiloInstantaneo = 3470,
}

// Para envío de estadísticos (históricos)
export enum EnTipoDatoOld {
  datoEstadisticas = 1,                 // Estadísticos
  cambioParametro = 2,                  // Cambio de parámetro
  alarmas = 3,                          // Alarmas
  tablaLog = 4,                         // Tabla de LOG
  altasBajasRetiradas = 5,              // Altas / bajas / retiradas
  cambioParametroValoresCalculados = 6, // Cambios de parámetros “calculados”
  inicioFinCrianza = 7,                 // Inicio o fin de crianza
}

export enum EnTipoAccionAltasBajasRetiradasCrianzaOld {
  bajaAnadir = 0,
  altaAnadir = 1,
  retiradaAnadir = 2,
  bajaEditandoUltimoRegistro = 3,
  altaEditandoUltimoRegistro = 4,
  retiradaEditandoUltimoRegistro = 5,
  eliminaUltimoRegistro = 6,
}

export enum EnTipoAccionInicioFinCrianzaOld {
  inicio,
  fin
}
