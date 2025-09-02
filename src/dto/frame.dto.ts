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

export enum DiasSemana {
  SABADO = 0,
  DOMINGO = 1,
  LUNES = 2,
  MARTES = 3,
  MIERCOLES = 4,
  JUEVES = 5,
  VIERNES = 6,
}

export interface Fecha {
  dia: number;
  mes: number;
  anyo: number;
  diaSemana?: DiasSemana; //Día de la semana opcional
}

export interface Tiempo {
  hora: number;
  min: number;
  seg: number;
}
