import { toFixedBuffer, u16BE, u8Old, encodePassword16 } from "src/utils/helpers";

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

/**
 * Serializa el array de items de la tabla (layout 34 bytes/ítem) en BIG-ENDIAN.
 * Válido tanto para TM_rt_tabla_central_mas como para TM_rt_tabla_central_fin.
 *
 * Layout por item (34 bytes):
 *  - 8  bytes  MAC
 *  - 2  bytes  NODO (u16 BE)
 *  - 1  byte   ESTADO (u8)
 *  - 1  byte   TIPO_DISPOSITIVO (u8)
 *  - 2  bytes  VERSION (u16 BE)
 *  - 16 bytes  PASSWORD (padding 0x00)
 *  - 2  bytes  CRC_PARAMETROS (u16 BE)  [normalmente 0]
 *  - 1  byte   INFO_ESTADO (u8)
 *  - 1  byte   HAY_ALARMA (u8)
 */
export function serializarRtTablaCentralPayloadOld(
  items: TablaCentralItemOld[],
): Buffer {
  const chunks: Buffer[] = [];

  for (const it of items) {
    const mac = toFixedBuffer(it.mac ?? Buffer.alloc(0), 8);        // 8
    const nodo = u16BE(it.nodo);                                   // 2
    const estado = u8Old(it.estado);                                  // 1
    const tipo = u8Old(it.tipoDispositivo);                           // 1
    const version = u16BE(it.version);                             // 2
    const password = encodePassword16(it.password ?? "");          // 16
    const crcPar = u16BE(it.crcParametros ?? 0);                   // 2
    const info = u8Old(it.infoEstado ?? 0);                           // 1
    const alarma = u8Old(it.hayAlarma ?? 0);                          // 1

    chunks.push(mac, nodo, estado, tipo, version, password, crcPar, info, alarma);
  }

  return Buffer.concat(chunks);
}

/**
   * Serializa un array de items (layout 34 bytes/ítem) a Buffer en BIG-ENDIAN.
   * Válido tanto para TM_rt_tabla_central_mas como para TM_rt_tabla_central_fin.
   */
export function serializarTablaCentralItemsOld(items: TablaCentralItemOld[]): Buffer {
  const u8 = (n: number) => Buffer.from([n & 0xff]);
  const u16BE = (n: number) => {
    const b = Buffer.allocUnsafe(2);
    b.writeUInt16BE((n >>> 0) & 0xffff, 0);
    return b;
  };
  const toFixed = (buf: Buffer, size: number) => {
    if (!buf) return Buffer.alloc(size);
    if (buf.length === size) return buf;
    if (buf.length > size) return buf.subarray(0, size);
    const out = Buffer.alloc(size, 0x00);
    buf.copy(out, 0);
    return out;
  };
  const encodePwd16 = (s: string) => {
    const raw = Buffer.from(s ?? "", "utf8");
    const out = Buffer.alloc(16, 0x00);
    raw.subarray(0, 16).copy(out, 0);
    return out;
  };

  const parts: Buffer[] = [];
  for (const it of items) {
    parts.push(
      toFixed(it.mac, 8),              // MAC (8)
      u16BE(it.nodo),                  // NODO (2)
      u8(it.estado),                   // ESTADO (1)
      u8(it.tipoDispositivo),          // TIPO DISPOSITIVO (1)
      u16BE(it.version),               // VERSION (2)
      encodePwd16(it.password),        // PASSWORD (16)
      u16BE(it.crcParametros ?? 0),    // CRC_PARAMETROS (2)
      u8(it.infoEstado ?? 0),          // INFO_ESTADO (1)
      u8(it.hayAlarma ?? 0),           // HAY_ALARMA (1)
    );
  }
  return Buffer.concat(parts);
}

// ========== (Opcional) Troceo en paquetes de hasta 13 ítems ==========

/**
 * Corta los items en grupos de hasta 13 para ajustarse al máximo de “Datos”
 * por trama. Devuelve una lista de grupos; todos serían MAS excepto el último FIN.
 */
export function splitTablaCentralInFrames(
  items: TablaCentralItemOld[],
  maxPerFrame = 13,
): TablaCentralItemOld[][] {
  const out: TablaCentralItemOld[][] = [];
  for (let i = 0; i < items.length; i += maxPerFrame) {
    out.push(items.slice(i, i + maxPerFrame));
  }
  return out;
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
