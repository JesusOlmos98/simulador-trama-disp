import { START, END } from "src/utils/LE/globals/constGlobales";
import { PresentacionCentralOldDto, RtPresenciaCentralOldDto, RtTablaCentralMasOldDto, RtTablaCentralFinOldDto, EventoCambioEstadoNodoOldDto, RtEnviaParametroHistoricoOldDto } from "./tt_sistemaOld.dto";

// ---------------- Frame completo ----------------
export class FrameOldDto {
  inicioTrama: Buffer = START;

  // Cabecera
  versionProtocolo: number;
  nodoOrigen: number;
  nodoDestino: number;
  tipoTrama: number;
  tipoMensaje: number;
  longitud: number; // bytes del campo `datos` solamente

  // Datos
  datos: PresentacionCentralOldDto | RtPresenciaCentralOldDto | RtTablaCentralMasOldDto | RtTablaCentralFinOldDto | EventoCambioEstadoNodoOldDto | RtEnviaParametroHistoricoOldDto | Buffer;

  // CRC: 1 byte (LSB de CRC16 estándar sobre cabecera+datos)
  crc: number;

  finTrama: Buffer = END;
}


// === Cabecera (equivalente a HeaderFields) ===
// export interface HeaderFieldsBe {
//   versionProtocolo: number; // 1 byte si así lo define tu framing; numérico en código
//   reserva: number;          // conserva el campo 'reserva' como en tu DTO original
//   nodoOrigen: number;       // central
//   nodoDestino: number;      // servidor
//   tipoTrama: number;        // TT_central_servidor
//   tipoMensaje: number;      // TM_presentacion_central | TM_rt_presencia_central | ...
//   longitud: number;         // tamaño del bloque `datos`
// }

// export interface PresentacionCentralDto {
//   tipoDispositivo: number;  // 1 byte
//   mac: Buffer;              // 8 bytes (representación raw; si prefieres string, cámbialo a string "AA:BB:...")
//   versionEquipo: number;    // uint16 BE
//   password: string;         // hasta 16 bytes, null-terminated si <16
//   crcTabla: number;         // uint16 BE
// }

// export interface PresenciaNodoCrc {
//   direccionNodo: number;    // uint16 BE
//   crcTabla: number;         // uint16 BE
//   crcParametros: number;    // uint16 BE (en antiguo; 0 en nuevo)
//   crcAlarmas: number;       // uint16 BE
// }

// export interface PresenciaCentralDto {
//   nodos: PresenciaNodoCrc[]; // lista de nodos incluidos en la presencia
// }

// // Unión de “datos” posibles para central → servidor (puedes ampliarla con más TMs)
// export type DatosCentralServidor =
//   | PresentacionCentralDto
//   | PresenciaCentralDto
//   | Buffer; // para TMs que aún no hayas tipado

// === Frame BE (equivalente a tu FrameDto) ===
// export class FrameBeDto {
//   inicioTrama: Buffer = INICIO_TRAMA_BE;

//   versionProtocolo!: number;
//   reserva!: number;
//   nodoOrigen!: number;     // central
//   nodoDestino!: number;    // servidor
//   tipoTrama!: number;      // TT_central_servidor
//   tipoMensaje!: number;    // p.ej. EnTipoMensajeBE.presentacionCentral
//   longitud!: number;       // bytes del campo `datos` (no incluye CRC ni finales)

//   datos!: DatosCentralServidor;

//   crc!: number;            // uint16 BE del frame según tu algoritmo (defínelo donde corresponda)
//   finTrama: Buffer = FIN_TRAMA_BE;
// }
