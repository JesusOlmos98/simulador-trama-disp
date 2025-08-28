import { EnTipoEquipo } from "src/utils/enums";
import { PresentacionDto } from "./frame.dto";

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

// export const defaultFrame = (data: Buffer | PresentacionDto | PresenciaDto | EstadisticoDto) => {

// }