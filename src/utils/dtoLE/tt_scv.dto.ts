import { EnScvTipo } from 'src/utils/LE/globals/enums';

//! WIP: Servicios Clave Valor

// export type ScvPar = {
//   clave: number;                  // uint16
//   tipo: EnTipoDato;               // uint8 (usamos EnTipoDato como ENUM_SCV_TIPO_VALOR)
//   valor: number | string | Buffer;
// };

// export type ScvDto = {
//   uidEnvioTrama: number;          // uint16
//   servicio: number;               // uint16
//   tipo: EnScvTipo;                // uint8 (peticion|respuesta)
//   claves: ScvPar[];               // N_claves = claves.length
// };

export type ScvDto = {
  uidEnvioTrama: number; // uint16
  servicio: number; // uint16
  tipo: EnScvTipo; // uint8 (peticion|respuesta)
  nClaves: number; // uint16
  clave: number; // uint16

  claves: []; // N_claves = claves.length
};
