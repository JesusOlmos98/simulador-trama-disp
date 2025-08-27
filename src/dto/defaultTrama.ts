import { EnTipoEquipo } from "src/utils/enums";
import { EstadisticoDto, PresenciaDto, PresentacionDto } from "./frame.dto";

export const defaultPresentacion: PresentacionDto = {
    nVariables: 6,
    versionPresentacion: 1,
    mac: 0x12345678,
    versionEquipo: 1234,
    tipoEquipo: EnTipoEquipo.cti40,   // OMEGA = 140, CTI40 = 115
    claveEquipo: 0,
    versionHw: 1,
};

// export const defaultFrame = (data: Buffer | PresentacionDto | PresenciaDto | EstadisticoDto) => {



// }