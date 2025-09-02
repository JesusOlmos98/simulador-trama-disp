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

// --------------------------------------- EnTipoTrama ---------------------------------------
export enum EnTipoTrama {
  // TT
  omegaPantallaPlaca = 13, // TT_OMEGA_PANTALLA_PLACA (Pintado de pantallas)
  depuracion = 14, // TT_DEPURACION (Tramas depuración)
  serviciosClaveValor = 23, // TT_SERVICIOS_CLAVE_VALOR
  actualizacionServer = 24, // TT_ACTUALIZACION_SERVER (Actualización remota)
  sistema = 25, // TT_SISTEMA (Funciones de sistema)
  estadisticos = 26, // TT_ESTADISTICOS (Envío de estadísticos)
  comuniRadar = 27, // TT_COMUNI_RADAR (Comunicación radar)
  comuniBle = 28, // TT_COMUNI_BLE (Comunicación BLE)
  descargaFicherosFlash = 29, // TT_DESCARGA_FICHEROS_FLASH
  importacionExportacion = 30, // TT_IMPORTACION_EXPORTACION
  descargaSubidaFicheros = 31, // TT_DESCARGA_SUBIDA_FICHEROS
  actualizacionV2 = 32, // TT_ACTUALIZACION_V2
}

// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX TM (TipoMensaje) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

// --------------------------------------- TT_OMEGA_PANTALLA_PLACA ---------------------------------------
export enum EnTmOmegaPantallaPlaca {
  pidePantalla = 1, // TM_pide_pantalla
  rtPantalla = 2, // TM_rt_pantalla
  enviaEstadistico = 3, // TM_envia_estadistico
  rtEstadistico = 4, // TM_rt_estadistico
  pidePantallaPrincipal = 5, // TM_pide_pantalla_principal
  cambiaParametro = 6, // TM_cambia_parametro
  pideEstadisticoPantallaLocal = 7, // TM_OMEGA_PANTALLA_PLACA_pide_estadistico_pantalla_local
}

// --------------------------------------- TT_DEPURACION ---------------------------------------
export enum EnTmDepuracion {
  noMensaje = 0, // TM_DEPURACION_NO_mensaje
  peticionConsola = 1, // TM_DEPURACION_peticion_consola
  rtPeticionConsola = 2, // TM_DEPURACION_rt_peticion_consola
}

// --------------------------------------- TT_SERVICIOS_CLAVE_VALOR (SCV) ---------------------------------------
export enum EnTmServiciosClaveValor {
  peticionServidorFinal = 0, // TM_SCV_PETICION_SERVIDOR_FINAL
  rtPeticionServidorFinal = 1, // TM_SCV_RT_PETICION_SERVIDOR_FINAL
  peticionFinalServidor = 2, // TM_SCV_PETICION_FINAL_SERVIDOR
  rtPeticionFinalServidor = 3, // TM_SCV_RT_PETICION_FINAL_SERVIDOR
}

// --------------------------------------- TT_ESTADISTICOS ---------------------------------------
export enum EnTmEstadisticos {
  enviaEstadistico = 1, // TM_ESTADISTICOS_envia_estadistico
  rtEstadistico = 2, // TM_ESTADISTICOS_rt_estadistico
}

// --------------------------------------- TT_COMUNI_BLE ---------------------------------------
export enum EnTmComuniBle {
  peticionEnviarDatos = 1, // TM_COMUNI_BLE_PETICION_ENVIAR_DATOS
  envioDatos = 2, // TM_COMUNI_BLE_ENVIO_DATOS_
  envioDatosAck = 3, // TM_COMUNI_BLE_ENVIO_DATOS_ACK
}

// --------------------------------------- TT_IMPORTACION_EXPORTACION (v1) ---------------------------------------
export enum EnTmImportExport {
  noMensaje = 0, // TM_IMPORT_EXPORT_NO_MENSAJE
  iniciaImportacion = 1, // TM_IMPORT_EXPORT_INICIA_IMPORTACION
  rtIniciaImportacion = 2, // TM_IMPORT_EXPORT_RT_INICIA_IMPORTACION
  datosImport = 3, // TM_IMPORT_EXPORT_DATOS_IMPORT
  rtDatosImport = 4, // TM_IMPORT_EXPORT_RT_DATOS_IMPORT
  inicioExport = 5, // TM_IMPORT_EXPORT_INICIO_EXPORT
  rtInicioExport = 6, // TM_IMPORT_EXPORT_RT_INICIO_EXPORT
  datosExport = 7, // TM_IMPORT_EXPORT_DATOS_EXPORT
  rtDatosExport = 8, // TM_IMPORT_EXPORT_RT_DATOS_EXPORT
  crcFichero = 9, // TM_IMPORT_EXPORT_CRC_FICHERO
  rtCrcFichero = 10, // TM_IMPORT_EXPORT_RT_CRC_FICHERO
  estadoImportacion = 11, // TM_IMPORT_EXPORT_ESTADO_IMPORTACION
  rtEstadoImportacion = 12, // TM_IMPORT_EXPORT_RT_ESTADO_IMPORTACION
}

// --------------------------------------- TT_DESCARGA_SUBIDA_FICHEROS (D/S) ---------------------------------------
export enum EnTmDescargaSubidaFicheros {
  noMensaje = 0, // TM_DESCARGA_FICHEROS_NO_MENSAJE
  descargaInicia = 1, // TM_DESCARGA_FICHEROS_INICIA
  descargaRtInicia = 2, // TM_DESCARGA_FICHEROS_RT_INICIA
  descargaDatos = 3, // TM_DESCARGA_FICHEROS_DATOS
  descargaRtDatos = 4, // TM_DESCARGA_FICHEROS_RT_DATOS
  subirInicia = 5, // TM_SUBIR_FICHEROS_INICIA
  subirRtInicia = 6, // TM_SUBIR_FICHEROS_RT_INICIA
}

// --------------------------------------- TT_DESCARGA_FICHEROS_FLASH (DFF) ---------------------------------------
export enum EnTmDff {
  noMensaje = 0, // TM_DFF_NO_MENSAJE
  // (1) no aparece en el listado
  borraFlash = 2, // TM_DFF_BORRA_FLASH
  rtBorraFlash = 3, // TM_DFF_RT_BORRA_FLASH
  writeFlash = 4, // TM_DFF_WRITE_FLASH
  readFlash = 5, // TM_DFF_READ_FLASH
  rtReadFlash = 6, // TM_DFF_RT_READ_FLASH
  verificaFichero = 7, // TM_DFF_VERIFICA_FICHERO
  rtVerificaFichero = 8, // TM_DFF_RT_VERIFICA_FICHERO
}

// --------------------------------------- TT_ACTUALIZACION_V2 ---------------------------------------
export enum EnTmActualizacionV2 {
  noMensaje = 0, // TM_ACTUALIZACION_V2_NO_MENSAJE
  informacion = 1, // TM_ACTUALIZACION_V2_INFORMACION
  informacionRt = 2, // TM_ACTUALIZACION_V2_INFORMACION_RT
}

// --------------------------------------- TT_IMPORT_EXPORT_V2 ---------------------------------------
export enum EnTmImportExportV2 {
  noMensaje = 0, // TM_IMPORT_EXPORT_V2_NO_MENSAJE
  importInfoUltimaCopiaSeguridad = 1, // TM_IMPORT_INFO_ULTIMA_COPIA_SEGURIDAD
  importInfoUltimaCopiaSeguridadRt = 2, // TM_IMPORT_INFO_ULTIMA_COPIA_SEGURIDAD_RT
  exportInicio = 3, // TM_EXPORT_INICIO
  exportRtInicio = 4, // TM_EXPORT_RT_INICIO
}

/** Tipos de mensaje dentro de TT_SISTEMA */
export enum EnTmSistema {
  noMensaje = 0,
  txPresentacion = 1,
  rtPresentacion = 2,
  rtAckTramaSinRespuesta = 3,
  txPresencia = 4,
  rtPresencia = 5,
  txUrlDescargaOta = 6,
  rtUrlDescargaOta = 7,
  txEstadoDispositivo = 8,
  rtEstadoDispositivo = 9,
  txProgresoActualizacion = 10,
  rtProgresoActualizacion = 11,
  txConfigFinal = 12,
  rtConfigFinal = 13,

  txMetricas = 254, //jos
  rtMetricas = 255, //jos
}

/** EN_GCSPA_EVENTO_ACTUALIZACION_SERVER (doc) */
export enum EnGcspaEventoActualizacionServer {
  noDefinido = 0,
  iniciandoDescarga = 1,
  verificandoFichero = 2,
  descargaFicheroOk = 3,
  descargaCompletadaOkActualizacion = 4,
  errorConexionServer = 5,
  errorDescargaFichero = 6,
  errorDesconocido = 7,
  errorFlash = 8,
}

/** SCV: tipo de paquete (petición / respuesta). Fuente: “Servicios clave valor – Opción 1”. */
export enum EnScvTipo {
  peticion = 0, // ENUM_SCV_TIPO_PETICION
  respuesta = 1, // ENUM_SCV_TIPO_RESPUESTA
}

/** Import/Export v1 – RT inicio importación. Fuente: 1.4.2. */
export enum EnImportExportRtInicioImportacion {
  ok = 0,
  error = 1,
}

/** Import/Export v1 – RT inicio exportación. Fuente: 1.4.6. */
export enum EnImportExportRtInicioExportacion {
  ok = 0,
  nombreFicheroExiste = 1,
  usbNoDetectado = 2,
  noTienePermisos = 3,
  usbSinEspacioSuficiente = 4,
}

/** OK/ERROR genérico. Aparece en varios apartados (CRC, info última copia, etc.). Fuente: 1.4.10, 1.8.2, 1.8.4. */
export enum CtiOkError {
  ok = 0, // OK_c
  error = 1, // ERROR_c
}

/** Estado del proceso de importación. Fuente: 1.4.11. */
export enum EnImportExportEstadoProcesoImportacion {
  noIniciado = 0,
  iniciando = 1,
  errorBorradoFlash = 2,
  noUsb = 3,
  sinPermisos = 4,
  noRespondeDispositivo = 5,
  ficheroVersionSuperiorNecesitaActualizar = 6,
  versionImportacionDiferente = 7,
  tipoEquipoDiferenteFichero = 8,
  errorEeprom = 9,
  okCompletada = 10,
  errorDescarga = 11,
}

/** Descarga de ficheros – RT inicio. Fuente: 1.5.2. */
export enum EnDescargaFicheroRtInicio {
  ficheroListo = 0,
  error = 1,
  procesandoFicheroEspere = 2, // reintentar hasta que esté listo
}

/** Subida de ficheros – RT inicio. Fuente: 1.5.7. */
export enum EnSubirFicheroRtInicio {
  ok = 0,
  error = 1,
  procesandoFicheroEspere = 2, // reintentar
}

/** Subida de ficheros – estado CRC. Fuente: 1.5.11. */
export enum EnSubirFicheroCrc {
  ok = 0,
  error = 1,
  calculando = 2,
}

/** Actualización V2 – rutas de artefactos. Fuente: 1.7.1. */
export enum EnArRutaActualizacion {
  produccion = 0,
  preProduccion = 1,
  soporteProduccion = 2,
}

/** Import/Export V2 – tipo de exportación. Fuente: 1.8.6. */
export enum EnTipoExportacion {
  copiaSeguridad = 0,
  personalizada = 1,
}

/** Omega UI – catálogo de objetos. Fuente: listado ST_nombre_objetos (1. Objetos pinta pantallas OMEGA). */
export enum EnOmegaObjeto {
  vacio = 0,
  plantilla = 1,
  encabezado = 2,
  lineaTextVarVar = 3,
  lineaTextVar = 4,
  lineaText = 5,
  lineaInfoTextVar = 6,
  lineaInfoTextText = 7,
  editVariables = 8,
  cambioParametro = 9,
  camposMultiseleccion = 10,

  idUnicoEdicion = 12,
  pantallaRespuestaTrama = 13,

  tablaConfig = 14,
  tablaDatos = 15,
  lineaTextText = 16,
  textoConfirmacionCambioVariable = 17,
  lineaTextTextVarVar = 18,
  lineaInfoTextTextVarVar = 19,

  lineaGrafica = 20,
  ventilacionGrupoGrafico = 21,
  ventilacionGrupoGraficoEdit = 22,
  multiselecVentilacionGrupo = 23,

  paginaMasMenos = 25,
  tablaColorFilas = 26,
  tablaNavegacionFilas = 27,
  tablaDatosSinEdicion = 28,
  cambioParametroVentilacionGrupo = 29,
  trasEditPantallaAtras = 30,
  encabezadoEditIcono = 31,
  ptrObjetoMasTamano = 32,

  editVariablesString = 33,
  cambioParametroString = 34,

  lineaTextString = 35,
  varIndividual = 36,
  varIndividualNavegacionOEdit = 37,

  encabezado3Iconos = 38,

  etapasVentiladoresVisual = 39,
  popup = 40,
  vineta = 41,
  graficaProgresionRangos = 42,
  panelControlComponentes = 43, // el doc tiene una errata “componenetes”
  graficaProgresionIcon = 44,
  representacionSondas = 45,

  encabezado4Iconos = 46,
  etapasVentiladoresVisualSize = 47,
  lineaTextTextVarVarVar = 48,
  lineaInfoTextVarVarVar = 49,
  panelControlComponentesMotor = 50,
  refrescoPantalla = 51,
  camposMultiseleccionConTextoCambio = 52,
  claveParaEntrar = 53,
  pintaIconoBloquearEquipo = 54,
  popupAccion = 55,
  descripcionPantallaCambioParametro = 56,
  lineaTextTextEbusFinal = 57,
  stringPlantilla = 58,
  cambiaParametroTituloPersonalizado = 59,
  lineaTextTextText = 60,
  lineaTextTextVar = 61,
  libreIcon = 62,
  libreTexto = 63,
  libreVariable = 64,
  libreLineas = 65,
  barraAccesoDirectoIcon = 66,
  textoConcatenadoPlantilla = 67,
  cambioParametroConcatenado = 68,
  stringPlantillaV3 = 69,

  tablaDinamicaInit = 70,
  tablaDinamicaFila = 71,

  posXyLibreResolucion = 72, // el doc escribe “RESOSUCION” en una parte
  posXyLibreIcon = 73,
  posXyLibreTexto = 74,
  posXyLibreVariable = 75,
  posXyLibreLineas = 76,

  // ! Conflicto en el documento: para el valor 77 se citan dos objetos distintos.
  varBuffer = 77, // listado global (pág. de catálogo)
  pintaEstadisticosColumna = 77, // sección 1.65 OBJ_PINTA_ESTADISTICOS_COLUMNA  // ! El doc duplica el ID 77.

  ptrObjetoMedioTamano = 78,

  nombreFin = 1000, // separador de rango
}

/** OBJ_POPUP_ACCION – acciones del popup. Fuente: 1.47. */
export enum EnPopupAccion {
  noAccion = 0,
  resetTotalEquipo = 1,
  reiniciaEquipo = 2,
}

/** Objetos libres (icono/texto/variable/líneas) – acciones. Fuente: 1.61, 1.62, 1.63, 1.64. */
export enum EnAccionesObjetoLibre {
  sinAccion = 0,
  parpadea = 1,
}

/** Objetos libres (texto/variable) – justificación. Fuente: 1.62, 1.63. */
export enum EnJustificacionObjetoLibre {
  izquierda = 0,
  derecha = 1,
  centro = 2,
}

/** OBJ_POS_XY_LIBRE_LINEAS – tipo de gráfico. Fuente: 1.64. */
export enum EnTipoGraficoLineas {
  linea = 0,
  rectangulo = 1,
}

/** OBJ_PINTA_ESTADISTICOS_COLUMNA – tipo de columna. Fuente: 1.65. */
export enum EnTipoColumnaEstadisticos {
  fecha = 0,
  hora = 1,
  diaCrianza = 2,
  iconoNavegacion = 3,
  coleccionIconos = 4,
  coleccionTextos = 5,
  estadistico = 6,
  idCrianza = 7,
  fechaHora = 8,
}

/** OBJ_TABLA_DINAMICA_INIT – flags de propiedades. Fuente: 1.58. */
export enum EnTablaDinamicaPropiedades {
  filasNavegables = 0x0001,
  filasConColor = 0x0002,
  filasDatosConUnidades = 0x0004,
}

// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Registros_Estadisticos.pdf XXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/** Estadísticos de controladores (sensores, contadores, actividades, etc.) */
export enum EnEstadisticosControladores {
  vacio = 0,

  tempSonda1 = 1,
  tempSonda2 = 2,
  tempSonda3 = 3,
  tempSonda4 = 4,
  // tempSonda5 = 5,
  // tempSonda6 = 6,
  // tempSonda7 = 7,
  // tempSonda8 = 8,
  // tempSonda9 = 9,
  // tempSonda10 = 10,
  // tempSonda11 = 11,
  // tempSonda12 = 12,

  actividadHumidificar = 15,
  actividadDeshumidificar = 16,

  actividadCalefaccion1 = 20,
  actividadCalefaccion2 = 21,
  // actividadCalefaccion3 = 22,
  // actividadCalefaccion4 = 23,
  // actividadCalefaccion5 = 24,
  // actividadCalefaccion6 = 25,

  temperaturaInterior = 30,
  temperaturaExterior = 31,
  temperaturaConsigna = 32,

  humedadInterior = 33,
  humedadExterior = 34,
  humedadConsigna = 35,

  co2Interior = 36,
  co2Consigna = 37,

  nh3Interior = 38,
  nh3Consigna = 39,

  actividadEa1 = 50,
  // actividadEa2 = 51,
  // actividadEa3 = 52,
  // actividadEa4 = 53,
  // actividadEa5 = 54,
  // actividadEa6 = 55,
  // actividadEa7 = 56,
  // actividadEa8 = 57,
  // actividadEa9 = 58,
  // actividadEa10 = 59,

  contadorAgua = 60,

  contador1 = 70,
  contador2 = 71,
  // contador3 = 22,
  // contador4 = 23,

  actividadContactoTermico1 = 80,
  actividadContactoTermico2 = 81,

  actividadRefrigeracion1 = 90,

  actividadEtapaVent1 = 100,
  actividadEtapaVent2 = 101,
  actividadEtapaVent3 = 102,
  actividadEtapaVent4 = 103,
  actividadEtapaVent5 = 104,
  actividadEtapaVent6 = 105,
  actividadEtapaVent7 = 106,
  actividadEtapaVent8 = 107,

  // actividadEtapaVent7 = 150,
}

// --------------------------------------------------------------------------------------------------------------

// 2.1 / 1.1 EN_ESTADIS_PERIODICIDAD (flags)
export enum EnEstadisPeriodicidad {
  noConfig = 0, // EN_ESTADIS_PERIODICIDAD_NO_CONFIG
  variable = 0b00000001, // EN_ESTADIS_PERIODICIDAD_VARIABLE
  envioHoras = 0b00000010, // EN_ESTADIS_PERIODICIDAD_ENVIO_HORAS
  envioDia = 0b00000100, // EN_ESTADIS_PERIODICIDAD_ENVIO_DIA
  variableInstantaneo = 0b00001000, // EN_ESTADIS_PERIODICIDAD_VARIABLE_INSTANTANEO (aparece en 1.1 y 2.1)
}

export enum EnContadoresTipo {
  otros = 0,
  electricidad = 1,
  agua = 2,
  max,
}

// 2.2 EN_GT_UNIDADES (lista extendida con %/Pa/ppm)
export enum EnGtUnidades {
  noUnidad = 0, // EN_GT_UNID_NO_UNIDAD
  gradoCentigrado = 1, // EN_GT_UNID_GRADO_CENTIGRADO
  gradoFahrenheit = 2, // EN_GT_UNID_GRADO_Fahrenheit
  litros = 3, // EN_GT_UNID_LITROS
  galones = 4, // EN_GT_UNID_GALONES
  kilos = 5, // EN_GT_UNID_KILOS
  libra = 6, // EN_GT_UNID_LIBRA
  m3h = 7, // EN_GT_UNID_M3H
  cfm = 8, // EN_GT_UNID_CFM
  vatio = 9, // EN_GT_UNID_VATIO
  porcentaje = 10, // EN_GT_UNID_PORCENTAJE
  pascales = 11, // EN_GT_UNID_PASCALES
  ppm = 12, // EN_GT_UNID_PPM
  max = 13, // EN_GT_UNID_MAX (marcador final)
}

// No aparece como enum en el doc, pero el campo 'estado' usa 0/1:
export enum EnEstadoDatoEstadistico {
  correcto = 0, // dato correcto
  noCorrecto = 1, // el dato no es correcto
}
