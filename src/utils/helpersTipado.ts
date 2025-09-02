
// Helpers de tipado

import { PresentacionDto } from "src/dto/tt_sistema.dto";
import { EnTipoTrama, EnTmOmegaPantallaPlaca, EnTmDepuracion, EnTmServiciosClaveValor, EnTmSistema, EnTmEstadisticos, EnTmComuniBle, EnTmDff, EnTmImportExport, EnTmDescargaSubidaFicheros, EnTmActualizacionV2, EnTmImportExportV2, EnScvTipo, EnTipoDato } from "./enums";

export const TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO = 47; // 0x2F
export const ACK_TTL_MS = 2000;  // vencimiento de pendientes (evitar colisiones entre segundos)

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isPresentacionDto(v: unknown): v is PresentacionDto {
  if (!isObject(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    isNumber(o.versionPresentacion) &&
    isNumber(o.mac) &&
    isNumber(o.versionEquipo) &&
    isNumber(o.tipoEquipo) &&
    isNumber(o.claveEquipo) &&
    isNumber(o.versionHw)
  );
}

export function readNodoOrigen(/*body: unknown,*/ def = 1): number {
  // if (!isObject(body)) 
  return def;
  // const raw = body['nodoOrigen'];
  // return isNumber(raw) ? raw : def;
}

export function readNodoDestino(/*body: unknown,*/ def = 0): number {
  // if (!isObject(body)) 
  return def;
  // const raw = body['nodoDestino'];
  // return isNumber(raw) ? raw : def;
}

export function readTempC(body: unknown, def = 25.0): number {
  if (!isObject(body)) return def;

  const top = body['tempC'];
  if (isNumber(top)) return top;

  const datos = body['datos'];
  if (isObject(datos)) {
    const nested = (datos as Record<string, unknown>)['tempC'];
    if (isNumber(nested)) return nested;
  }
  return def;
}

/** Si no hay presentación en el body, devuelve la default. */
export function readPresentacion(/*body: unknown,*/ def: PresentacionDto): PresentacionDto {
  // if (!isObject(body)) 
  return def;
  // const datos = body['datos'];
  // return isPresentacionDto(datos) ? (datos as PresentacionDto) : def;
}

/**
 * Devuelve el enum de Tipos de Mensaje (TM) correspondiente al Tipo de Trama (TT).
 * Si el TT no tiene un TM definido en tus enums actuales, devuelve undefined.
 */
export function getTMDeTT(tt: EnTipoTrama): TmEnumUnion | undefined {
  return TT2TM[tt] as TmEnumUnion | undefined;
}

export type TmEnumUnion = | typeof EnTmOmegaPantallaPlaca | typeof EnTmDepuracion | typeof EnTmServiciosClaveValor | typeof EnTmSistema | typeof EnTmEstadisticos | typeof EnTmComuniBle | typeof EnTmDff | typeof EnTmImportExport | typeof EnTmDescargaSubidaFicheros | typeof EnTmActualizacionV2 | typeof EnTmImportExportV2;

/** Mapa TT -> TM enum (los que no existen aún en tus enums quedan como undefined) */
export const TT2TM = {
  [EnTipoTrama.omegaPantallaPlaca]: EnTmOmegaPantallaPlaca,
  [EnTipoTrama.depuracion]: EnTmDepuracion,
  [EnTipoTrama.serviciosClaveValor]: EnTmServiciosClaveValor,
  [EnTipoTrama.actualizacionServer]: undefined, // ! No tienes definido EnTmActualizacionServer en tus enums
  [EnTipoTrama.sistema]: EnTmSistema,
  [EnTipoTrama.estadisticos]: EnTmEstadisticos,
  [EnTipoTrama.comuniRadar]: undefined, // ! No tienes definido EnTmComuniRadar en tus enums
  [EnTipoTrama.comuniBle]: EnTmComuniBle,
  [EnTipoTrama.descargaFicherosFlash]: EnTmDff,
  [EnTipoTrama.importacionExportacion]: EnTmImportExport,
  [EnTipoTrama.descargaSubidaFicheros]: EnTmDescargaSubidaFicheros,
  [EnTipoTrama.actualizacionV2]: EnTmActualizacionV2,
} as const;

// ----------------------------- Helpers de codificación de valores SCV -----------------------------
export function encodeScvValor(tipo: EnTipoDato, valor: number | string | Buffer): Buffer {
  if (Buffer.isBuffer(valor)) return valor;

  switch (tipo) {
    case EnTipoDato.uint8: {
      const b = Buffer.alloc(1);
      b.writeUInt8((Number(valor) >>> 0) & 0xFF, 0);
      return b;
    }
    case EnTipoDato.int8: {
      const b = Buffer.alloc(1);
      b.writeInt8(Number(valor) | 0, 0);
      return b;
    }
    case EnTipoDato.uint16: {
      const b = Buffer.alloc(2);
      b.writeUInt16LE((Number(valor) >>> 0) & 0xFFFF, 0);
      return b;
    }
    case EnTipoDato.int16: {
      const b = Buffer.alloc(2);
      b.writeInt16LE((Number(valor) | 0), 0);
      return b;
    }
    case EnTipoDato.uint32: {
      const b = Buffer.alloc(4);
      b.writeUInt32LE((Number(valor) >>> 0), 0);
      return b;
    }
    case EnTipoDato.int32: {
      const b = Buffer.alloc(4);
      b.writeInt32LE((Number(valor) | 0), 0);
      return b;
    }
    case EnTipoDato.float: {
      const b = Buffer.alloc(4);
      b.writeFloatLE(Number(valor), 0);
      return b;
    }
    case EnTipoDato.string4:
    case EnTipoDato.string32:
    case EnTipoDato.stringUnicode16:
    case EnTipoDato.stringUnicode32:
    case EnTipoDato.concatenado: {
      // Por simplicidad codificamos strings en UTF-8; si el server requiere Unicode-16, cambia aquí.
      return Buffer.from(String(valor), "utf8");
    }
    default: {
      // Fallback razonable: si nos llega un número lo empaquetamos como uint32; si no, utf8
      if (typeof valor === "number") {
        const b = Buffer.alloc(4);
        b.writeUInt32LE((valor >>> 0), 0);
        return b;
      }
      return Buffer.from(String(valor), "utf8");
    }
  }
}


