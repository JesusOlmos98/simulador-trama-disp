import { EnTmEstadisticos, EnEstadisTipoRegistro, EnTipoDato, EnEstadisPeriodicidad, EnEstadoDatoEstadistico, EnGtUnidades } from "src/utils/enums";
import { Fecha, Tiempo } from "./frame.dto";

// -------------------------------------------------- TM_ESTADISTICOS_envia_estadistico --------------------------------------------------

//* Frame = FrameDto ----> Data/Payload = EnviaEstadisticoDto ----> dato[] = EstadisticoDato ----> dato = EstadisticoValorDto

// -------------------------------------------------- EnviaEstadisticoDto --------------------------------------------------
export class EnviaEstadisticoDto {
  /** uint32 MAC (ID de equipo) */
  mac: number;
  
  /** uint8 tipo_dato (cabecera) */
  tipoDato: EnTipoDato;
  // El doc lo llama TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO. No aparece su enum específico;
  // aquí usamos EnTipoDato para mantener consistencia. Si el firmware espera otro catálogo, ajustarlo.
  
  /** uint8 identificador_unico_dentro_del_segundo (token de ACK mínimo) */
  identificadorUnicoDentroDelSegundo: number;
  
  /** uint8 VERSION (de la trama/registro) */
  version: number;
  
  /** uint8 tipo_registro (ENUM_ESTADIS_TIPO_REGISTRO) */
  tipoRegistro: EnEstadisTipoRegistro;
  
  /** uint8 reservado */
  res1: number; // Debe serializarse como 0 salvo indicación contraria.
  /** uint8 reservado */
  res2: number;
  /** uint8 reservado */
  res3: number;
  /** uint8 reservado */
  res4: number;
  
  /** Fecha fecha */
  fecha: Fecha;
  
  /** Tiempo hora */
  hora: Tiempo;
  
  /** uint8 reservado */
  res5: number;
  
  /** uint8 numero_datos (repeticiones del bloque tipo/tamaño/dato) */
  numeroDatos: number;
  
  /** Array de bloques [tipo_dato, size_dato_byte, dato[]] */
  datos: EstadisticoDato[];
}

// -------------------------------------------------- EstadisticoDato --------------------------------------------------
export interface EstadisticoDato {
  /** uint8 tipo_dato (ENUM_TIPO_DATO) */
  tipoDato: EnTipoDato;
  /** uint8 size_dato_byte (tamaño en bytes del dato siguiente) */
  sizeDatoByte: number;
  /** bytes crudos del dato; se tipará al decodificar según 'tipoDato' */
  dato: Buffer;
}

// -------------------------------------------------- EstadisticoValorDto --------------------------------------------------
// Doc: Nombre(TD_UINT16), Periodicidad(TD_UINT8), Valor_medio(TD_), Valor_max(TD_), Valor_min(TD_),
//      Hora_valor_max(TD_TIEMPO), Hora_valor_min(TD_TIEMPO), estado(TD_UINT8 {0/1}), unidad(TD_UINT8 EN_GT_UNIDADES).
//jos 
export interface EstadisticoValorDto {
  /** TD_UINT16: identificador del estadístico (catálogo propio) */
  nombreEstadistico: number;

  /** TD_UINT8: periodicidad (flags) */
  periodicidad: EnEstadisPeriodicidad;

  /** TD_: valor medio (tipo configurable; para temperatura suele ser FLOAT) */
  valorMedio: number;

  /** TD_: valor máximo */
  valorMax: number;

  /** TD_: valor mínimo */
  valorMin: number;

  /** TD_TIEMPO: hora a la que se alcanzó el máximo */
  horaValorMax: Tiempo;

  /** TD_TIEMPO: hora a la que se alcanzó el mínimo */
  horaValorMin: Tiempo;

  /** TD_UINT8: 0 correcto, 1 no correcto */
  estado: EnEstadoDatoEstadistico;

  /** TD_UINT8: unidad del dato (EN_GT_UNIDADES) */
  unidad: EnGtUnidades;

  /**
   * Tipo base de los campos valorMedio/valorMax/valorMin.
   * Por defecto FLOAT (temperaturas); si tu estadístico usa enteros, cámbialo (p.ej. UINT16/INT16).
   */
  valorTipo?: EnTipoDato; // default: EnTipoDato.float
}









// -------------------------------------------------- RtEstadisticoDto --------------------------------------------------
export class RtEstadisticoDto {
  /** uint8 identificador_unico_dentro_del_segundo (eco para ACK) */
  identificadorUnicoDentroDelSegundo: number;
}

// -------------------------------------------------- MAPA TM → DTO TtEstadisticosPayloadMap --------------------------------------------------
export type TtEstadisticosPayloadMap = {
  [EnTmEstadisticos.enviaEstadistico]: EnviaEstadisticoDto;
  [EnTmEstadisticos.rtEstadistico]: RtEstadisticoDto;
};

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

