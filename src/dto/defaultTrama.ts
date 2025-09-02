import { EnEstadisTipoRegistro, EnTipoDato, EnTipoEquipo } from "src/utils/enums";
import { PresentacionDto } from "./tt_sistema.dto";
import { EnviaEstadisticoDto, EstadisticoDato } from "./tt_estadisticos.dto";
import { Fecha, Tiempo } from "./frame.dto";
import { TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO } from "src/utils/helpersTipado";

// * Usados como ejemplo rápido para enviar tramas.

export const defaultPresentacionCTI40: PresentacionDto = {
    nVariables: 6,
    versionPresentacion: 1,
    mac: 0x12345678,
    versionEquipo: 2,
    tipoEquipo: EnTipoEquipo.cti40,   // OMEGA = 140, CTI40 = 115
    claveEquipo: 0,
    versionHw: 1,
};

export const defaultPresentacionOMEGA: PresentacionDto = {
    nVariables: 6,
    versionPresentacion: 1,
    mac: 0x16263646,
    versionEquipo: 3,
    tipoEquipo: EnTipoEquipo.omega,
    claveEquipo: 0,
    versionHw: 1,
};

const datosTempSonda1: EstadisticoDato[] = [
  { // [0] nombreEstadistico (TD_UINT16)
    tipoDato: EnTipoDato.uint16,
    sizeDatoByte: 2,
    dato: Buffer.from([0xFF, 0xFF]), // 65535 = ID (tu valor)
  },
  { // [1] EnEstadisPeriodicidad (TD_UINT8)
    tipoDato: EnTipoDato.uint8,
    sizeDatoByte: 1,
    dato: Buffer.from([0x00]), // noConfig (lo dejas así)
  },

  // [2] valorMedio (TD_FLOAT) = 23.12 ºC
  { 
    tipoDato: EnTipoDato.float,
    sizeDatoByte: 4,
    dato: Buffer.from([0xC3, 0xF5, 0xB8, 0x41]), // 23.12 LE
  },
  // [3] valorMax (TD_FLOAT) = 24.50 ºC
  { 
    tipoDato: EnTipoDato.float,
    sizeDatoByte: 4,
    dato: Buffer.from([0x00, 0x00, 0xC4, 0x41]), // 24.50 LE
  },
  // [4] valorMin (TD_FLOAT) = 21.80 ºC
  { 
    tipoDato: EnTipoDato.float,
    sizeDatoByte: 4,
    dato: Buffer.from([0x66, 0x66, 0xAE, 0x41]), // 21.80 LE
  },

  // [5] horaValorMax (TD_TIEMPO) = 14:20:00 -> 51600s -> 0x0000C990 LE
  { 
    tipoDato: EnTipoDato.tiempo,
    sizeDatoByte: 4,
    dato: Buffer.from([0x90, 0xC9, 0x00, 0x00]),
  },
  // [6] horaValorMin (TD_TIEMPO) = 06:10:00 -> 22200s -> 0x000056B8 LE
  { 
    tipoDato: EnTipoDato.tiempo,
    sizeDatoByte: 4,
    dato: Buffer.from([0xB8, 0x56, 0x00, 0x00]),
  },

  // [7] estado (TD_UINT8) = 0 (correcto)
  { 
    tipoDato: EnTipoDato.uint8,
    sizeDatoByte: 1,
    dato: Buffer.from([0x00]),
  },

  // [8] unidad (TD_UINT8) = 1 (ºC)
  { 
    tipoDato: EnTipoDato.uint8,
    sizeDatoByte: 1,
    dato: Buffer.from([0x01]), // EnGtUnidades.gradoCentigrado
  },
];

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
    hora: { hora: 11, min: 11, seg: 11 } as Tiempo,
    res5: 0x00,
    numeroDatos: 9,
    datos: datosTempSonda1,

}

//         export interface EstadisticoDato {
//   /** uint8 tipo_dato (ENUM_TIPO_DATO) */
//   tipoDato: EnTipoDato;
//   /** uint8 size_dato_byte (tamaño en bytes del dato siguiente) */
//   sizeDatoByte: number;
//   /** bytes crudos del dato; se tipará al decodificar según 'tipoDato' */
//   dato: Buffer;
// }