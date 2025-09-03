import { PresentacionDto } from './tt_sistema.dto';
import { EnviaEstadisticoDto } from './tt_estadisticos.dto';

export class FrameDto {
  inicioTrama: Buffer;
  versionProtocolo: number;
  reserva: number;
  nodoOrigen: number;
  nodoDestino: number;
  tipoTrama: number;
  tipoMensaje: number;
  longitud: number; // Tamaño trama datos
  datos: Buffer | PresentacionDto | PresenciaDto | EnviaEstadisticoDto; // Datos a enviar
  crc: number;
  finTrama: Buffer;
}

export class PresenciaDto {
  presencia: number; // Puede ser cualquier cosa o nada
}

export interface HeaderFields {
  versionProtocolo: number;
  reserva: number;
  nodoOrigen: number;
  nodoDestino: number;
  tipoTrama: number;
  tipoMensaje: number;
  longitud: number;
}
