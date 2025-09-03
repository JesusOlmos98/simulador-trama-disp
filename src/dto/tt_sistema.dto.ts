import {
  EnGcspaEventoActualizacionServer,
  EnTmSistema,
} from 'src/utils/globals/enums';

// * DTOs de los posibles mensajes enviados en las tramas TT_SISTEMA, cada uno de
// * estos DTOs sería el "payload" o "data" de la trama, que contempla un máximo de 2480 bytes.

// -------------------------------------------------- TM_SISTEMA_TX_PRESENTACION --------------------------------------------------
export class PresentacionDto {
  /** uint32 N_variables */
  nVariables: number;
  /** uint32 version_presentacion */
  versionPresentacion: number;
  /** uint32 MAC */
  mac: number;
  /** uint32 VERSION_EQUIPO */
  versionEquipo: number;
  /** uint32 tipo_equipo (usa tu enum EnTipoEquipo si ya lo tienes) */
  tipoEquipo: number;
  /** uint32 clave_equipo */
  claveEquipo: number;
  /** uint32 VERSION_HW */
  versionHw: number;
}

// -------------------------------------------------- TM_SISTEMA_RT_PRESENTACION --------------------------------------------------
export class RtPresentacionDto {}

// -------------------------------------------------- TM_SISTEMA_RT_ACK_TRAMA_SIN_RESPUESTA --------------------------------------------------
export class RtAckTramaSinRespuestaDto {}

// -------------------------------------------------- TM_SISTEMA_TX_PRESENCIA --------------------------------------------------
export class PresenciaTxDto {}

// -------------------------------------------------- TM_SISTEMA_RT_PRESENCIA --------------------------------------------------
export class PresenciaRtDto {}

// -------------------------------------------------- TM_SISTEMA_TX_URL_DESCARGA_OTA --------------------------------------------------
export class UrlDescargaOtaTxDto {
  /** uint32 VERSION_TRAMA_OTA (normalmente = 1) */
  versionTramaOta: number;
  /** uint32 tipo_equipo */
  tipoEquipo: number;
}

// -------------------------------------------------- TM_SISTEMA_RT_URL_DESCARGA_OTA --------------------------------------------------
export class UrlDescargaOtaRtDto {
  /** Cadena con la URL (se codifica como bytes; aquí la modelamos como string) */
  urlDescarga: string;
}

// -------------------------------------------------- TM_SISTEMA_TX_ESTADO_DISPOSITIVO --------------------------------------------------
export class EstadoDispositivoTxDto {
  /** uint32 N_variables */
  nVariables: number;
  /** uint32 version */
  version: number;
  /** uint32 ID_ENVIO (lo usa el servidor para correlación) */
  idEnvio: number;
  /** uint32 Alarma_equipo (0 = sin alarma; ≠0 indica alarma / posix de último cambio) */
  alarmaEquipo: number;
}

// -------------------------------------------------- TM_SISTEMA_RT_ESTADO_DISPOSITIVO --------------------------------------------------
export class EstadoDispositivoRtDto {
  /** uint32 N_variables */
  nVariables: number;
  /** uint32 version */
  version: number;
  /** uint32 ID_ENVIO (eco para correlación) */
  idEnvio: number;
}

// -------------------------------------------------- TM_SISTEMA_TX_CONFIG_FINAL --------------------------------------------------
export class ConfigFinalTxDto {
  /** uint32 version (inicialmente 0) */
  version: number;
  /**
   * uint32 Envia_estadisticos:
   * 0 -> no envía estadísticos; 1 -> intenta enviar hasta infinito
   */
  enviaEstadisticos: number;
}

// -------------------------------------------------- TM_SISTEMA_RT_CONFIG_FINAL --------------------------------------------------
export class ConfigFinalRtDto {}

// -------------------------------------------------- TM_SISTEMA_TX_PROGRESO_ACTUALIZACION --------------------------------------------------
export class ProgresoActualizacionTxDto {
  /** uint32 N_variables */
  nVariables: number;
  /** uint32 version */
  version: number;
  /** uint32 estado_progreso (usar EnGcspaEventoActualizacionServer) */
  estadoProgreso: EnGcspaEventoActualizacionServer;
}

// -------------------------------------------------- TM_SISTEMA_RT_PROGRESO_ACTUALIZACION --------------------------------------------------
export class ProgresoActualizacionRtDto {}

// -------------------------------------------------- MAPA TM → DTO --------------------------------------------------
export type TtSistemaPayloadMap = {
  [EnTmSistema.noMensaje]: undefined;
  [EnTmSistema.txPresentacion]: PresentacionDto;
  [EnTmSistema.rtPresentacion]: RtPresentacionDto;
  [EnTmSistema.rtAckTramaSinRespuesta]: RtAckTramaSinRespuestaDto;
  [EnTmSistema.txPresencia]: PresenciaTxDto;
  [EnTmSistema.rtPresencia]: PresenciaRtDto;
  [EnTmSistema.txUrlDescargaOta]: UrlDescargaOtaTxDto;
  [EnTmSistema.rtUrlDescargaOta]: UrlDescargaOtaRtDto;
  [EnTmSistema.txEstadoDispositivo]: EstadoDispositivoTxDto;
  [EnTmSistema.rtEstadoDispositivo]: EstadoDispositivoRtDto;
  [EnTmSistema.txProgresoActualizacion]: ProgresoActualizacionTxDto;
  [EnTmSistema.rtProgresoActualizacion]: ProgresoActualizacionRtDto;
  [EnTmSistema.txConfigFinal]: ConfigFinalTxDto;
  [EnTmSistema.rtConfigFinal]: ConfigFinalRtDto;
};
