import { TablaCentralItemOld } from 'src/utils/dtoBE/tt_sistemaOld.dto';
import { josLogger } from 'src/utils/josLogger';
import { EnTipoEquipo } from 'src/utils/LE/globals/enums';
import {
  EnTipoTramaOld,
  EnTipoMensajeCentralServidor,
} from '../globals/enumOld';
import {
  getTipoTramaOld,
  getTipoMensajeOld,
  getDataSectionOld,
  getStartOld,
  getParsedHeaderOld,
  getCRCFromFrameOld,
  getEndOld,
} from './getTrama';
import { ITEM_TABLA_LEN_OLD } from '../globals/constGlobales';

// ---------------------------------------- Payload (MAS/FIN) ----------------------------------------

// ============================ TABLA CENTRAL (OLD) ============================

// ------------------------------ Capa RAW (bytes) ------------------------------

export function isValidTablaPayloadOld(data?: Buffer): data is Buffer {
  return !!data && data.length > 0 && data.length % ITEM_TABLA_LEN_OLD === 0;
}

export function getTablaCentralPayloadOld(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.centralServidor)
    return undefined;
  const tm = getTipoMensajeOld(frame);
  if (
    tm !== EnTipoMensajeCentralServidor.tmRtTablaCentralMas &&
    tm !== EnTipoMensajeCentralServidor.tmRtTablaCentralFin &&
    tm !== EnTipoMensajeCentralServidor.tmEventoCambioEstadoNodo
  )
    return undefined;
  const data = getDataSectionOld(frame);
  return isValidTablaPayloadOld(data) ? data : undefined;
}

export function getTablaCentralRawItemOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const data = getTablaCentralPayloadOld(frame);
  if (!data) return undefined;
  const count = data.length / ITEM_TABLA_LEN_OLD;
  if (index < 0 || index >= count) return undefined;
  const off = index * ITEM_TABLA_LEN_OLD;
  return data.subarray(off, off + ITEM_TABLA_LEN_OLD);
}

export function getTablaCentralRawItemsOld(
  frame: Buffer,
): Buffer[] | undefined {
  const data = getTablaCentralPayloadOld(frame);
  if (!data) return undefined;
  const out: Buffer[] = [];
  for (let off = 0; off < data.length; off += ITEM_TABLA_LEN_OLD) {
    out.push(data.subarray(off, off + ITEM_TABLA_LEN_OLD));
  }
  return out;
}

// ---- RAW por campo (offsets dentro de cada item de 34B)
export function getBytesTablaItemMacOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(0, 8);
}
export function getBytesTablaItemNodoOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(8, 10); // u16 BE
}
export function getBytesTablaItemEstadoOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(10, 11); // u8
}
export function getBytesTablaItemTipoDispositivoOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(11, 12); // u8
}
export function getBytesTablaItemVersionOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(12, 14); // u16 BE
}
export function getBytesTablaItemPasswordOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(14, 30); // 16B
}
export function getBytesTablaItemCrcParametrosOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(30, 32); // u16 BE
}
export function getBytesTablaItemInfoEstadoOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(32, 33); // u8
}
export function getBytesTablaItemHayAlarmaOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(33, 34); // u8
}

// --------------------------- Capa VALOR (parseado) ---------------------------

export function decodePassword16(buf: Buffer): string {
  let end = buf.length;
  while (end > 0 && buf[end - 1] === 0x00) end--;
  return buf.subarray(0, end).toString('utf8');
}

export function getTablaCentralItemCountOld(frame: Buffer): number | undefined {
  const data = getTablaCentralPayloadOld(frame);
  if (!data) return undefined;
  return Math.floor(data.length / ITEM_TABLA_LEN_OLD);
}

// Valores por campo (usando la capa RAW)
export function getTablaItemMacOld(
  frame: Buffer,
  index: number,
): Buffer | undefined {
  return getBytesTablaItemMacOld(frame, index);
}
export function getTablaItemNodoOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemNodoOld(frame, index);
  if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getTablaItemEstadoOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemEstadoOld(frame, index);
  if (!b) return undefined;
  return b.readUInt8(0);
}
export function getTablaItemTipoDispositivoOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemTipoDispositivoOld(frame, index);
  if (!b) return undefined;
  return b.readUInt8(0);
}
export function getTablaItemVersionOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemVersionOld(frame, index);
  if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getTablaItemPasswordOld(
  frame: Buffer,
  index: number,
): string | undefined {
  const b = getBytesTablaItemPasswordOld(frame, index);
  if (!b) return undefined;
  return decodePassword16(b);
}
export function getTablaItemCrcParametrosOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemCrcParametrosOld(frame, index);
  if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getTablaItemInfoEstadoOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemInfoEstadoOld(frame, index);
  if (!b) return undefined;
  return b.readUInt8(0);
}
export function getTablaItemHayAlarmaOld(
  frame: Buffer,
  index: number,
): number | undefined {
  const b = getBytesTablaItemHayAlarmaOld(frame, index);
  if (!b) return undefined;
  return b.readUInt8(0);
}

// -------------------- Decodificación a DTO (item y lista) --------------------

export function getTablaItemOld(
  frame: Buffer,
  index: number,
): TablaCentralItemOld | undefined {
  const mac = getTablaItemMacOld(frame, index);
  if (!mac) return undefined;
  const nodo = getTablaItemNodoOld(frame, index);
  const estado = getTablaItemEstadoOld(frame, index);
  const tipoDispositivo = getTablaItemTipoDispositivoOld(frame, index);
  const version = getTablaItemVersionOld(frame, index);
  const password = getTablaItemPasswordOld(frame, index);
  const crcParametros = getTablaItemCrcParametrosOld(frame, index);
  const infoEstado = getTablaItemInfoEstadoOld(frame, index);
  const hayAlarma = getTablaItemHayAlarmaOld(frame, index);
  if (
    [
      nodo,
      estado,
      tipoDispositivo,
      version,
      password,
      crcParametros,
      infoEstado,
      hayAlarma,
    ].some((v) => v === undefined)
  )
    return undefined;
  return {
    mac,
    nodo: nodo!,
    estado: estado!,
    tipoDispositivo: tipoDispositivo!,
    version: version!,
    password: password!,
    crcParametros: crcParametros!,
    infoEstado: infoEstado!,
    hayAlarma: hayAlarma!,
  };
}

export function getTablaItemsOld(
  frame: Buffer,
): TablaCentralItemOld[] | undefined {
  const count = getTablaCentralItemCountOld(frame);
  if (count === undefined) return undefined;
  const out: TablaCentralItemOld[] = [];
  for (let i = 0; i < count; i++) {
    const it = getTablaItemOld(frame, i);
    if (!it) return undefined;
    out.push(it);
  }
  return out;
}

// ------------------------------------- Log -----------------------------------

export function logTramaCompletaTablaDispositivosOld(frame: Buffer): void {
  josLogger.trace(`DECODIFICAMOS TRAMA EN BYTES:`);
  const hdr = getParsedHeaderOld(frame);
  josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
  josLogger.trace(`Versión protocolo: ${hdr.versionProtocolo}`);
  josLogger.trace(`Nodo origen: ${hdr.nodoOrigen}`);
  josLogger.trace(`Nodo destino: ${hdr.nodoDestino}`);
  josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[hdr.tipoTrama]}`);
  josLogger.trace(
    `Tipo Mensaje TM: ${EnTipoMensajeCentralServidor[hdr.tipoMensaje]}`,
  );
  josLogger.trace(`Longitud: ${hdr.longitud}`);
  josLogger.trace(
    `Cantidad de dispositivos: ${getTablaCentralItemCountOld(frame)}`,
  );
  josLogger.trace(
    `| MAC              | NODO |EST| TipoDisp | VER |     PASSWORD     | CRC PAR | INFO EST | ALARMA |`,
  );
  const l = getTablaCentralItemCountOld(frame) ?? 0;
  for (let i = 0; i < l; i++) {
    const it = getTablaItemOld(frame, i)!;
    josLogger.trace(
      `| ${it.mac.toString('hex')} | ${it.nodo} | ${it.estado} | ${EnTipoEquipo[it.tipoDispositivo]} | ${it.version} | ${it.password} | ${it.crcParametros} | ${it.infoEstado} | ${it.hayAlarma} |`,
    );
  }
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}
