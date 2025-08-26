
// --------------------------------------- EnTipoEquipo ---------------------------------------
export enum EnTipoEquipo {

  noDefinido = 0,

  // 0 al 100 no se pueden añadir equipos porque tenemos MAC de 9 y de 8 dígitos;
  // para que ANSI y uint32 coincidan se omite este rango.

  // DOSI_ELECTRONICO = 1, // ! Estaba comentado en C; referencia histórica no incluida como miembro

  tc3 = 101,
  v4 = 106,
  alpha = 107,
  v2 = 108,
  sigma = 109,
  silo1SinModem = 110,
  silos2SinModem = 111,
  silos2ConModem = 112,
  central = 113,
  cti80 = 114,
  cti40 = 115,
  radioEnlace = 116,
  cti70 = 117,
  cti30c2 = 118,
  cti41 = 119,
  cti33 = 120,
  silo1Digital = 121,
  silos2Digitales = 122,
  silos3Digitales = 123,
  silos2DigitalesConModem = 124,
  rade = 125,
  v42 = 126,
  sigma2 = 127,
  alpha2 = 128,
  v22 = 129,
  cti802 = 130,
  cti402 = 131,
  cti702 = 132,
  cti412 = 133,

  pw = 134,
  vx3 = 135,

  tc4 = 136,
  mrt20 = 137,

  vsdc2 = 138,

  vx1 = 139,

  omega = 140,
  comOmega = 141,
  tolva = 142,
  ctx = 143,
  dlg = 145,
  vdip = 146, // VDI_P

  ps30 = 147,

  ct2Vi = 148,

  vdik = 150,

  ps100 = 151,
  cht = 152,

  pontos4 = 153,

  silows3 = 154,

  feedium = 155,

  vxStage = 156,
  silows1 = 157,

  pontos8 = 158,

  hws30 = 159,
  hws100 = 160,
  hwsVisor = 161,
  titanioPro = 162,

  controlAccesos = 163,
  controlAccesosTerminal = 164,

  cti75 = 165,

  ctxV2 = 166, // CTX con micro mk40
  ct2ViV2 = 167,

  nivelLaser = 168, // es el mismo que silo_level
  laserOptico = 169, // es el equipo SL_sensor

  maquinaAlimentacion = 170, // es el equipo SL_sensor

  silows3V2 = 171, // VDI con micro k61
  silows1V2 = 172, // VDI con micro k61

  vdipV2 = 173, // VDI_ con micro k61
  vdikV2 = 174, // VDI_ con micro k61

  tc4V2 = 175,

  dosiElectronico = 200,
  pontos8Wifi = 201,
  cti40V2Wifi = 202,
  dosiElectronicoG = 203,
  dosiPower = 204,
}

// --------------------------------------- EnEstadisTipoRegistro ---------------------------------------
export enum EnEstadisTipoRegistro {
  cambioParametros = 1,
  estadisticos = 2,
  alarmas = 3,
  eventos = 4,
  debug = 5,
}

// --------------------------------------- EnTipoDato ---------------------------------------
export enum EnTipoDato {
  noVariable = 0,
  uint8 = 1,
  int8 = 2,
  uint16 = 3,
  int16 = 4,
  uint32 = 5,
  int32 = 6,
  float = 7,
  tiempo = 8,

  pUint8 = 9,
  pInt8 = 10,
  pUint16 = 11,
  pInt16 = 12,
  pUint32 = 13,
  pInt32 = 14,

  pFloat = 15,
  pTiempo = 16,

  fecha = 26,

  string4 = 30,
  string32 = 34,

  // ! Este tipo de dato está en desuso: se utiliza TIPO_P_STRING_unicode16_simple que está más optimizado
  pString32 = 36,

  pStringUnicode16 = 44,
  stringUnicode16 = 45,

  concatenado = 46,
  pStringUnicode32 = 47,

  stringUnicode32 = 48,

  int64 = 202,
  pUint64 = 205,
  pFecha = 206,
}

// --------------------------------------- EnTipoMensaje ---------------------------------------
export enum EnTipoMensaje {
  noMensaje = 0,                       // TM_SISTEMA_NO_MENSAJE
  txPresentacion = 1,                  // TM_SISTEMA_TX_PRESENTACION
  rtPresentacion = 2,                  // TM_SISTEMA_RT_PRESENTACION
  rtAckTramaSinRespuesta = 3,          // TM_SISTEMA_RT_ACK_TRAMA_SIN_RESPUESTA
  txPresencia = 4,                     // TM_SISTEMA_TX_PRESENCIA
  rtPresencia = 5,                     // TM_SISTEMA_RT_PRESENCIA
  txUrlDescargaOta = 6,                // TM_SISTEMA_TX_URL_DESCARGA_OTA
  rtUrlDescargaOta = 7,                // TM_SISTEMA_RT_URL_DESCARGA_OTA
  txEstadoDispositivo = 8,             // TM_SISTEMA_TX_ESTADO_DISPOSITIVO
  rtEstadoDispositivo = 9,             // TM_SISTEMA_RT_ESTADO_DISPOSITIVO
  txProgresoActualizacion = 10,        // TM_SISTEMA_TX_PROGRESO_ACTUALIZACION
  rtProgresoActualizacion = 11,        // TM_SISTEMA_RT_PROGRESO_ACTUALIZACION
  txConfigFinal = 12,                  // TM_SISTEMA_TX_CONFIG_FINAL
  rtConfigFinal = 13,                  // TM_SISTEMA_RT_CONFIG_FINAL
}

// --------------------------------------- EnTipoTrama ---------------------------------------
export enum EnTipoTrama {
  omegaPantallaPlaca = 13,     // TT_OMEGA_PANTALLA_PLACA (Pintado de pantallas)
  depuracion = 14,             // TT_DEPURACION (Tramas depuración)
  serviciosClaveValor = 23,    // TT_SERVICIOS_CLAVE_VALOR
  actualizacionServer = 24,    // TT_ACTUALIZACION_SERVER (Actualización remota)
  sistema = 25,                // TT_SISTEMA (Funciones de sistema)
  estadisticos = 26,           // TT_ESTADISTICOS (Envío de estadísticos)
  comuniRadar = 27,            // TT_COMUNI_RADAR (Comunicación radar)
  comuniBle = 28,              // TT_COMUNI_BLE (Comunicación BLE)
  descargaFicherosFlash = 29,  // TT_DESCARGA_FICHEROS_FLASH
  importacionExportacion = 30, // TT_IMPORTACION_EXPORTACION
  descargaSubidaFicheros = 31, // TT_DESCARGA_SUBIDA_FICHEROS
  actualizacionV2 = 32,        // TT_ACTUALIZACION_V2
}
