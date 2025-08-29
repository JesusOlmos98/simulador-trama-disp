import { EnTmEstadisticos, EnEstadisTipoRegistro, EnTipoDato } from "src/utils/enums";
import { Fecha, Tiempo } from "./frame.dto";

// -------------------------------------------------- TM_ESTADISTICOS_envia_estadistico --------------------------------------------------
export interface EstadisticoDato {
  /** uint8 tipo_dato (ENUM_TIPO_DATO) */
  tipoDato: EnTipoDato;
  /** uint8 size_dato_byte (tamaño en bytes del dato siguiente) */
  sizeDatoByte: number;
  /** bytes crudos del dato; se tipará al decodificar según 'tipoDato' */
  dato: Buffer;
}

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

// -------------------------------------------------- TM_ESTADISTICOS_rt_estadistico --------------------------------------------------
export class RtEstadisticoDto {
  /** uint8 identificador_unico_dentro_del_segundo (eco para ACK) */
  identificadorUnicoDentroDelSegundo: number;
}

// -------------------------------------------------- MAPA TM → DTO --------------------------------------------------
export type TtEstadisticosPayloadMap = {
  [EnTmEstadisticos.enviaEstadistico]: EnviaEstadisticoDto;
  [EnTmEstadisticos.rtEstadistico]: RtEstadisticoDto;
};
