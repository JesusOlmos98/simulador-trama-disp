import { EnTipoEquipo } from "src/utils/LE/globals/enums";
import { PresentacionCentralOldDto } from "./tt_sistemaOld.dto";

// Presentación (Omega) – protocolo antiguo (Big Endian)
export const defaultPresentacionOmegaOld: PresentacionCentralOldDto = {
  tipoEquipo: EnTipoEquipo.omega,                              // ! Código de equipo OMEGA (1 byte). Mantén el mismo enum; se serializa como uint8 BE
  mac: 11223344, //Buffer.from([0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77]), // ! MAC de 8 bytes leído del hardware; aquí un placeholder
  versionEquipo: 2,                                            // ! Versión de equipo (uint16 BE)
  password: "12345678",                                        // ! Hasta 16 bytes; al serializar se rellena con '\0' hasta 16
  crcTabla: 0,                                                 // ! uint16 BE. Se calcula a partir de la tabla; 0 como valor por defecto
};
