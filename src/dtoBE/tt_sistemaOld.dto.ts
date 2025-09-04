import { START, END } from "src/utils/LE/globals/constGlobales";

// export enum EnTipoMensajeOld {
//   tmRtPresenciaCentral          = 7,   // 5.2.1
//   tmPresentacionCentral         = 8,   // 5.2.2
//   tmRtTablaCentralMas           = 18,  // 5.2.3
//   tmRtTablaCentralFin           = 19,  // 5.2.3
//   tmEventoCambioEstadoNodo      = 20,  // 5.2.4
//   tmRtEnviaParametroHistorico   = 100, // 5.1.9 (origen central, TT_central_servidor)
// }

// ---------------- Cabecera ----------------
// export interface HeaderFieldsOld {
//   versionProtocolo: number; // uint8
//   nodoOrigen: number;       // uint16 BE
//   nodoDestino: number;      // uint16 BE
//   tipoTrama: number;        // uint8
//   tipoMensaje: number;      // uint8
//   longitud: number;         // uint16 BE -> bytes del bloque `datos`
// }


//* Datos por tipo de mensaje (central → servidor)

// ---------- 5.2.2 TM_presentacion_central ----------
export interface PresentacionCentralOldDto {
  /** "Tipo dispositivo" en la doc y NO Tipo Equipo */
  tipoEquipo: number;      // uint8
  mac: number;             // 8 bytes
  versionEquipo: number;   // uint16 BE
  password: string;        // 16 bytes, null-terminated si <16
  crcTabla: number;        // uint16 BE (va dentro de datos)
}

// ---------- 5.2.1 TM_rt_presencia_central ----------
export interface PresenciaNodoCrcOld {
  crcTabla: number;        // uint16 BE
  direccionNodo: number;   // uint16 BE
  crcParametros: number;   // uint16 BE (antiguo: se envía 0 si no se usa)
  crcAlarmas: number;      // uint16 BE
}

export interface RtPresenciaCentralOldDto {
  // Repetido N veces (8 bytes por nodo en el método antiguo)
  nodos: PresenciaNodoCrcOld[];
}

// ---------- 5.2.3 TM_rt_tabla_central_mas / _fin ----------
export interface TablaCentralItemOld {
  mac: Buffer;            // 8 bytes
  nodo: number;           // uint16 BE
  estado: number;         // uint8
  tipoDispositivo: number;// uint8
  version: number;        // uint16 BE
  password: string;       // 16 bytes
  crcParametros: number;  // uint16 BE (no se usa -> 0)
  infoEstado: number;     // uint8
  hayAlarma: number;      // uint8
}

export interface RtTablaCentralMasOldDto {
  items: TablaCentralItemOld[];
}
export interface RtTablaCentralFinOldDto {
  items: TablaCentralItemOld[];
}

// ---------- 5.2.4 TM_evento_cambio_estado_nodo ----------
export interface EventoCambioEstadoNodoItemOld {
  mac: Buffer;            // 8 bytes
  nodo: number;           // uint16 BE
  estado: number;         // uint8
  tipoDispositivo: number;// uint8
  version: number;        // uint16 BE
  password: string;       // 15 bytes (ojo, aquí 15)
  crcParametros: number;  // uint16 BE (no se usa -> 0)
  noSeUtiliza: number;    // uint8 (padding)
  hayAlarma: number;      // uint8
}
export interface EventoCambioEstadoNodoOldDto {
  items: EventoCambioEstadoNodoItemOld[];
}

// ---------- 5.1.9 TM_rt_envia_parametro_historico ----------
export interface RtEnviaParametroHistoricoOldDto {
  id: number; // uint8 (identificador eco)
}

// Unión de datos posibles (central → servidor, protocolo antiguo)
// export type DatosCentralServidorOld =
//   | PresentacionCentralOldDto
//   | RtPresenciaCentralOldDto
//   | RtTablaCentralMasOldDto
//   | RtTablaCentralFinOldDto
//   | EventoCambioEstadoNodoOldDto
//   | RtEnviaParametroHistoricoOldDto
//   | Buffer; // fallback para TMs no modelados todavía