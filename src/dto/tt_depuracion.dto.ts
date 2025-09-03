import { EnTmDepuracion } from 'src/utils/globals/enums';

// -------------------------------------------------- TM_DEPURACION_peticion_consola --------------------------------------------------
export class PeticionConsolaDto {
  /** uint16 identificador_cliente */
  identificadorCliente: number;
}

// -------------------------------------------------- TM_DEPURACION_rt_peticion_consola --------------------------------------------------
export class RtPeticionConsolaDto {
  /** uint16 identificador_cliente */
  identificadorCliente: number;
  /** String de datos para pintar (longitud variable) */
  datos: string;
}

// -------------------------------------------------- MAPA TM → DTO --------------------------------------------------
export type TtDepuracionPayloadMap = {
  [EnTmDepuracion.noMensaje]: undefined;
  [EnTmDepuracion.peticionConsola]: PeticionConsolaDto;
  [EnTmDepuracion.rtPeticionConsola]: RtPeticionConsolaDto;
};
