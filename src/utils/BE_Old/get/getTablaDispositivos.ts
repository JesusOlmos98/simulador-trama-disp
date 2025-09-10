import { TablaCentralItemOld } from "src/dtoBE/tt_sistemaOld.dto";
import { josLogger } from "src/utils/josLogger";
import { EnTipoEquipo } from "src/utils/LE/globals/enums";
import { EnTipoTramaOld, EnTipoMensajeCentralServidor } from "../globals/enumOld";
import { getTipoTramaOld, getTipoMensajeOld, getDataSectionOld, getStartOld, getParsedHeaderOld, getCRCFromFrameOld, getEndOld } from "./getTrama";

// ---------------------------------------- Payload (MAS/FIN) ----------------------------------------

// ---------------------------------------- Constantes / helpers ----------------------------------------
const ITEM_TABLA_LEN_OLD = 34; // bytes por item en TM_rt_tabla_central_{mas,fin}

/** Valida que el payload parezca de tabla central (tamaño múltiplo de 34). */
function isValidTablaPayloadOld(data?: Buffer): data is Buffer {
  return !!data && data.length > 0 && (data.length % ITEM_TABLA_LEN_OLD) === 0;
}

/** Decodifica password de 16 bytes (trim de 0x00 al final). */
function decodePassword16(buf: Buffer): string {
  let end = buf.length;
  while (end > 0 && buf[end - 1] === 0x00) end--;
  return buf.subarray(0, end).toString("utf8");
}


/** Devuelve el payload de una TT_CENTRAL_SERVIDOR / TM_rt_tabla_central_{mas|fin}, o undefined si no cuadra. */
export function getTablaCentralPayloadOld(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.centralServidor) return undefined;

  const tm = getTipoMensajeOld(frame);
  if (
    tm !== EnTipoMensajeCentralServidor.tmRtTablaCentralMas &&
    tm !== EnTipoMensajeCentralServidor.tmRtTablaCentralFin &&
    tm !== EnTipoMensajeCentralServidor.tmEventoCambioEstadoNodo
  ) return undefined;

  // const data = getDataSection(frame); //! ...
  const data = getDataSectionOld(frame);
  if (!isValidTablaPayloadOld(data)) return undefined;
  return data;
}

/** Devuelve el número de dispositivos (items) en el payload de tabla. */
export function getTablaCentralItemCountOld(frame: Buffer): number | undefined {
  const data = getTablaCentralPayloadOld(frame);
  if (!data) return undefined;
  return Math.floor(data.length / ITEM_TABLA_LEN_OLD);
}

/** Lee el item [index] del payload (sin deserializar a DTO), o undefined si no existe. */
export function getTablaCentralRawItemOld(frame: Buffer, index: number): Buffer | undefined {
  const data = getTablaCentralPayloadOld(frame);
  if (!data) return undefined;
  const count = data.length / ITEM_TABLA_LEN_OLD;
  if (index < 0 || index >= count) return undefined;
  const off = index * ITEM_TABLA_LEN_OLD;
  return data.subarray(off, off + ITEM_TABLA_LEN_OLD);
}

/** Devuelve todos los items (raw) del payload. */
export function getTablaCentralRawItemsOld(frame: Buffer): Buffer[] | undefined {
  const data = getTablaCentralPayloadOld(frame);
  if (!data) return undefined;
  const out: Buffer[] = [];
  for (let off = 0; off < data.length; off += ITEM_TABLA_LEN_OLD) {
    out.push(data.subarray(off, off + ITEM_TABLA_LEN_OLD));
  }
  return out;
}

// ---------------------------------------- Getters de campos por índice ----------------------------------------

/** MAC (8 bytes) del item[index]. */
export function getTablaItemMacOld(frame: Buffer, index: number): Buffer | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.subarray(0, 8);
}

/** NODO (uint16 BE) del item[index]. */
export function getTablaItemNodoOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt16BE(8);
}

/** ESTADO (uint8) del item[index]. */
export function getTablaItemEstadoOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt8(10);
}

/** TIPO DISPOSITIVO (uint8) del item[index]. */
export function getTablaItemTipoDispositivoOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt8(11);
}

/** VERSION (uint16 BE) del item[index]. */
export function getTablaItemVersionOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt16BE(12);
}

/** PASSWORD (16 bytes, string UTF-8 sin 0x00 finales) del item[index]. */
export function getTablaItemPasswordOld(frame: Buffer, index: number): string | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return decodePassword16(it.subarray(14, 30));
}

/** CRC_PARAMETROS (uint16 BE) del item[index]. (en la tabla antigua suele ser 0) */
export function getTablaItemCrcParametrosOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt16BE(30);
}

/** INFO_ESTADO (uint8) del item[index]. */
export function getTablaItemInfoEstadoOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt8(32);
}

/** HAY_ALARMA (uint8) del item[index]. */
export function getTablaItemHayAlarmaOld(frame: Buffer, index: number): number | undefined {
  const it = getTablaCentralRawItemOld(frame, index);
  if (!it) return undefined;
  return it.readUInt8(33);
}

// ======== Decodificación a DTO (por item y completa) ========

/** Devuelve el item[index] decodificado como TablaCentralItemOld. */
export function getTablaItemOld(frame: Buffer, index: number): TablaCentralItemOld | undefined {
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
    nodo === undefined || estado === undefined || tipoDispositivo === undefined ||
    version === undefined || password === undefined ||
    crcParametros === undefined || infoEstado === undefined || hayAlarma === undefined
  ) return undefined;

  return {
    mac,
    nodo,
    estado,
    tipoDispositivo,
    version,
    password,
    crcParametros,
    infoEstado,
    hayAlarma,
  };
}

/** Devuelve todos los items decodificados como TablaCentralItemOld[]. */
export function getTablaItemsOld(frame: Buffer): TablaCentralItemOld[] | undefined {
  const count = getTablaCentralItemCountOld(frame);
  if (count === undefined) return undefined;
  const out: TablaCentralItemOld[] = [];
  for (let i = 0; i < count; i++) {
    const it = getTablaItemOld(frame, i);
    if (!it) return undefined; // si cualquiera falla, devolvemos undefined
    out.push(it);
  }
  return out;
}

/** Sólo en level Trace de Pino. */
export function logTramaCompletaTablaDispositivosOld(frame: Buffer): void {
  josLogger.trace(`DECODIFICAMOS TRAMA EN BYTES:`);
  josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
  josLogger.trace(`Versión protocolo: ${getParsedHeaderOld(frame).versionProtocolo} `);
  josLogger.trace(`Nodo origen: ${getParsedHeaderOld(frame).nodoOrigen} `);
  josLogger.trace(`Nodo destino: ${getParsedHeaderOld(frame).nodoDestino} `);
  josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[getParsedHeaderOld(frame).tipoTrama]} `);
  josLogger.trace(`Tipo Mensaje TM: ${EnTipoMensajeCentralServidor[getParsedHeaderOld(frame).tipoMensaje]} `);
  josLogger.trace(`Longitud: ${getParsedHeaderOld(frame).longitud} `);
  josLogger.trace(`DATA:`);
  josLogger.trace(`Cantidad de dispositivos: ${getTablaCentralItemCountOld(frame)}`);
  josLogger.trace(`| MAC              | NODO |EST| TipoDisp | VER |     PASSWORD     | CRC PAR | INFO EST | ALARMA |`);
  const l = getTablaCentralItemCountOld(frame);
  for (let i = 0; i < l!; i++) {
    const item = getTablaItemOld(frame, i);
    josLogger.trace(`| ${item?.mac.toString('hex')} | ${item?.nodo} | ${item?.estado} | ${EnTipoEquipo[item?.tipoDispositivo!]} | ${item?.version} | ${item?.password.toString()} | ${item?.crcParametros} | ${item?.infoEstado} | ${item?.hayAlarma} |`);
  }
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}