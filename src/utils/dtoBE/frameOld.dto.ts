import { END_OLD, START_OLD } from "src/utils/BE_Old/globals/constGlobales";
import { PresentacionCentralOldDto, RtTablaCentralMasOldDto, RtTablaCentralFinOldDto, EventoCambioEstadoNodoOldDto, RtEnviaParametroHistoricoOldDto } from "./tt_sistemaOld.dto";

// ---------------- Frame completo ----------------
export class FrameOldDto {
  inicioTrama: Buffer = START_OLD;

  // Cabecera
  versionProtocolo: number;
  nodoOrigen: number;
  nodoDestino: number;
  tipoTrama: number;
  tipoMensaje: number;
  longitud: number; // bytes del campo `datos` solamente

  // Datos
  datos: PresentacionCentralOldDto  | RtTablaCentralMasOldDto | RtTablaCentralFinOldDto | EventoCambioEstadoNodoOldDto | RtEnviaParametroHistoricoOldDto | Buffer;

  // CRC: 1 byte (LSB de CRC16 estándar sobre cabecera+datos)
  crc: number;

  finTrama: Buffer = END_OLD;
}
