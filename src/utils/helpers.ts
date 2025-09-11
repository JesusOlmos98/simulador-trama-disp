import { PresentacionDto } from 'src/dtoLE/tt_sistema.dto';
import { EnTipoDato } from './LE/globals/enums';
import { Fecha } from './tiposGlobales';
import { EnEstadisticosNombres, EnTipoDatoDFAccion, EnTipoDatoOld } from './BE_Old/globals/enumOld';

// ------------------------------------------- isObject -------------------------------------------
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

// ------------------------------------------- isNumber -------------------------------------------
export function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// ------------------------------------------- isPresentacionDto -------------------------------------------
export function isPresentacionDto(v: unknown): v is PresentacionDto {
  if (!isObject(v)) return false;
  const o = v;
  return (
    isNumber(o.versionPresentacion) &&
    isNumber(o.mac) &&
    isNumber(o.versionEquipo) &&
    isNumber(o.tipoEquipo) &&
    isNumber(o.claveEquipo) &&
    isNumber(o.versionHw)
  );
}

// ------------------------------------------- readTempC -------------------------------------------
export function readTempC(body: unknown, def = 25.0): number {
  if (!isObject(body)) return def;

  const top = body['tempC'];
  if (isNumber(top)) return top;

  const datos = body['datos'];
  if (isObject(datos)) {
    const nested = datos['tempC'];
    if (isNumber(nested)) return nested;
  }
  return def;
}

// ------------------------------------------- hexDump -------------------------------------------
/** Convierte un buffer en texto hexadecimal en columnas. */
export function hexDump(buf: Buffer, width = 16): string {
  const hex: string[] = buf.toString('hex').match(/.{1,2}/g) ?? []; // Divide en grupos de 2 bytes
  const lines: string[] = []; // Aquí irá el resultado

  for (let i = 0; i < hex.length; i += width) {
    const slice = hex.slice(i, i + width); // Toma un "ancho" de bytes
    lines.push(slice.join(' ')); // ok
  }
  return lines.join('\n');
}

// ------------------------------------------- number to buffer (bytes) -------------------------------------------
export const u8 = (v: number) => {
  const b = Buffer.allocUnsafe(1);
  b.writeUInt8(v, 0);
  return b;
};
export const i8 = (v: number) => {
  const b = Buffer.allocUnsafe(1);
  b.writeInt8(v, 0);
  return b;
};
export const u16LE = (v: number) => {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16LE(v, 0);
  return b;
};
export const i16LE = (v: number) => {
  const b = Buffer.allocUnsafe(2);
  b.writeInt16LE(v, 0);
  return b;
};
export const u32LE = (v: number) => {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32LE(v, 0);
  return b;
};
export const i32LE = (v: number) => {
  const b = Buffer.allocUnsafe(4);
  b.writeInt32LE(v, 0);
  return b;
};
export const f32LE = (v: number) => {
  const b = Buffer.allocUnsafe(4);
  b.writeFloatLE(v, 0);
  return b;
};

// ------------------------------------------- packByTipo -------------------------------------------
export function packByTipo(v: number, tipo: EnTipoDato): Buffer {
  switch (tipo) {
    case EnTipoDato.uint8:
      return u8Old(v);
    case EnTipoDato.int8:
      return i8(v);
    case EnTipoDato.uint16:
      return u16LE(v);
    case EnTipoDato.int16:
      return i16LE(v);
    case EnTipoDato.uint32:
      return u32LE(v);
    case EnTipoDato.int32:
      return i32LE(v);
    case EnTipoDato.float:
      return f32LE(v);
    default:
      throw new Error(`Tipo de valor no soportado en estadístico valor: ${EnTipoDato[tipo]} (${tipo})`,);
  }
}

// ------------------------------------------- unpackNumberByTipo -------------------------------------------
/** Decodifica un número según el tipo de dato. Devuelve undefined si el tipo/size no encaja. */
export function unpackNumberByTipo(buf: Buffer, tipo: EnTipoDato): number | undefined {
  try {
    switch (tipo) {
      case EnTipoDato.uint8: return buf.length === 1 ? buf.readUInt8(0) : undefined;
      case EnTipoDato.int8: return buf.length === 1 ? buf.readInt8(0) : undefined;
      case EnTipoDato.uint16: return buf.length === 2 ? buf.readUInt16LE(0) : undefined;
      case EnTipoDato.int16: return buf.length === 2 ? buf.readInt16LE(0) : undefined;
      case EnTipoDato.uint32: return buf.length === 4 ? buf.readUInt32LE(0) : undefined;
      case EnTipoDato.int32: return buf.length === 4 ? buf.readInt32LE(0) : undefined;
      case EnTipoDato.float: return buf.length === 4 ? buf.readFloatLE(0) : undefined;
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

export function parseDmYToFecha(input: string): Fecha {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/.exec(input.trim());
  if (!m) throw new Error('Formato de fecha inválido. Usa DD-MM-YYYY');
  let [, d, M, y] = m;
  const dia = parseInt(d, 10);
  const mes = parseInt(M, 10);
  let anyo = parseInt(y, 10);
  if (anyo < 100) anyo = 2000 + anyo;
  // Validación simple
  if (!(dia >= 1 && dia <= 31) || !(mes >= 1 && mes <= 12) || anyo < 2000 || anyo > 2099) {
    throw new Error('Fecha fuera de rango');
  }
  return { dia, mes, anyo } as Fecha;
}

//! --------------------------------------------------------------------------------------------------------------------------------
//! --------------------------------------------------------------------------------------------------------------------------------
//! ------------------------------------------- Helpers para dispositivos antiguos (Old) -------------------------------------------
//! --------------------------------------------------------------------------------------------------------------------------------
//! --------------------------------------------------------------------------------------------------------------------------------

// export const u8Old = (n: number) => Buffer.from([n & 0xFF]);
// export const u16BE = (n: number) => {
//   const b = Buffer.allocUnsafe(2);
//   b.writeUInt16BE(n >>> 0, 0);
//   return b;
// };
// export const u32BE = (n: number) => {
//   const b = Buffer.allocUnsafe(4);
//   b.writeUInt32BE(n >>> 0, 0);
//   return b;
// };

/** Asegura un buffer de exactamente N bytes (trunca o padding con 0x00). */
export function toFixedBuffer(src: Buffer, size: number): Buffer {
  if (src.length === size) return src;
  if (src.length > size) return src.subarray(0, size);
  const out = Buffer.alloc(size, 0x00);
  src.copy(out, 0);
  return out;
}

/** PASSWORD de 16 bytes. Por defecto: ASCII/UTF-8 truncado y padding con 0x00. */
export function encodePassword16(pwd: string): Buffer {
  const raw = Buffer.from(pwd ?? "", "utf8");
  const out = Buffer.alloc(16, 0x00);
  raw.subarray(0, 16).copy(out, 0);
  return out;
}

//done 

export const u8Old = (n: number) => Buffer.from([n & 0xff]);
export const u16BE = (n: number) => {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16BE((n >>> 0) & 0xffff, 0);
  return b;
};
export const u32BE = (n: number) => {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE((n >>> 0) >>> 0, 0);
  return b;
};
export const i32BE = (n: number) => {
  const b = Buffer.allocUnsafe(4);
  b.writeInt32BE(n | 0, 0);
  return b;
};
export const f32BE = (x: number) => {
  const b = Buffer.allocUnsafe(4);
  b.writeFloatBE(x, 0);
  return b;
};
export const toFixed = (buf: Buffer, size: number) => {
  if (!buf) return Buffer.alloc(size);
  if (buf.length === size) return buf;
  if (buf.length > size) return buf.subarray(0, size);
  const out = Buffer.alloc(size, 0x00);
  buf.copy(out, 0);
  return out;
};

/** number|bigint -> u64 BE (8 bytes) */
export function u64FromNumberBE(n: number): Buffer {
  // OJO: si n > 2^53-1 habrá pérdida en JS; si necesitas más, cambia a BigInt en el DTO
  let v = BigInt(n >>> 0);
  // si n es mayor que 2^32, intenta coger también la parte alta (aprox)
  if (n > 0xffffffff) v = BigInt(n);
  const out = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

/** number|Buffer -> 8 bytes BE */
export function packMac8BE(mac: number | Buffer): Buffer {
  if (Buffer.isBuffer(mac)) return toFixed(mac, 8);
  return u64FromNumberBE(mac);
}

/** number|Buffer -> 4 bytes BE, según tipoDato (enteros/floats). */
// export function packDatos4BE(tipoDato: EnTipoDatoDFAccion, datos: number | Buffer): Buffer {
//   if (Buffer.isBuffer(datos)) return toFixed(datos, 4);

//   switch (tipoDato) {
//     // Estadísticos (enteros)
//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoUint8:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroUint8:
//       return u32BE(datos & 0xff);

//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoInt8:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroInt8:
//       // Sign-extend a 32 bits
//       return i32BE((datos << 24) >> 24);

//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoUint16:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroUint16:
//       return u32BE(datos & 0xffff);

//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoInt16:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroInt16:
//       return i32BE((datos << 16) >> 16);

//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoUint32:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroUint32:
//       return u32BE(datos >>> 0);

//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoInt32:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroInt32:
//       return i32BE(datos | 0);

//     // Floats (0/1/2/3 → tratamos como float32 BE; si necesitas escalados, ajústalo aquí)
//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat0:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat1:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat2:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat3:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat0:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat1:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat2:
//     case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat3:
//       return f32BE(datos);

//     // Tipos “tiempo/fecha/string/evento…” NO deberían venir por este campo de 4B como número puro:
//     // si llegan como número, los mandamos como u32 (mejor que fallar en runtime).
//     default:
//       return u32BE(datos >>> 0);
//   }
// }

/** number|Buffer -> 4 bytes BE, mapeando por EnTipoDatoOld. */
export function packDatos4BE(tipoDato: EnTipoDatoOld, datos: number | Buffer): Buffer {
  if (Buffer.isBuffer(datos)) return toFixed(datos, 4);

  switch (tipoDato) {
    // Valores de métricas y parámetros: enviamos como float32 BE
    case EnTipoDatoOld.datoEstadisticas:
    case EnTipoDatoOld.cambioParametro:
    case EnTipoDatoOld.cambioParametroValoresCalculados:
      return f32BE(datos);

    // IDs, contadores, códigos de evento/alarma/log: enviamos como uint32 BE
    case EnTipoDatoOld.alarmas:
    case EnTipoDatoOld.tablaLog:
    case EnTipoDatoOld.altasBajasRetiradas:
    case EnTipoDatoOld.inicioFinCrianza:
      return u32BE(datos >>> 0);

    default:
      return u32BE(datos >>> 0);
  }
}

export function mac8FromParam(macParam?: string): Buffer {
  // Acepta: "001a79d30d53d9da", "00:1a:79:d3:0d:53:d9:da", "0x001a79d30d53d9da"
  let s = (macParam ?? "").trim().toLowerCase();
  if (s.startsWith("0x")) s = s.slice(2);
  s = s.replace(/[^0-9a-f]/g, ""); // fuera separadores
  if (s.length === 0) {
    // valor por defecto reproducible
    return Buffer.from("001a790000000000", "hex").subarray(0, 8);
  }
  if (s.length > 16) s = s.slice(-16);       // nos quedamos con los 8 bytes menos significativos
  if (s.length < 16) s = s.padStart(16, "0"); // pad a 8 bytes
  return Buffer.from(s, "hex");
}










export function rngInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function rngFloat(min: number, max: number, decimals = 2): number {
  const p = 10 ** decimals;
  // +Number.EPSILON para que el extremo superior sea alcanzable tras el redondeo
  const n = min + Math.random() * (max - min + Number.EPSILON);
  return Math.round(n * p) / p;
}

/** Devuelve un valor simulado acorde al nombre del estadístico. Ejemplo: Si contiene la palabra "temp" devuelve un valor entre 22 y 32. */
export function valorSimuladoPorNombre(estadisticoNombre: EnEstadisticosNombres): number {
  const key = EnEstadisticosNombres[estadisticoNombre] ?? "";

  // Reglas por palabra clave (orden importa: la primera que coincida gana)
  // Puedes añadir o ajustar patrones sin tocar lógica.
  const rules: Array<[RegExp, () => number]> = [
    // Temperatura
    [/(^|_)temp|temperatura|sonda/, () => rngFloat(22, 32)],
    // Humedad relativa
    [/humedad|hr/, () => rngInt(40, 60)],
    // CO2 (ppm)
    [/co2/, () => rngInt(400, 999)],
    // NH3 (ppm)
    [/nh3|amoniaco|amon[ií]aco/, () => rngInt(0, 25)],
    // Actividad (segundos): si contiene 'dia' usamos 0–86400; si 'hora' 0–3600
    [/(actividad|etapa|actividad_)/, () => key.includes("dia") ? rngInt(0, 86400) : rngInt(0, 3600)],
    // Contadores (agua/energía)
    [/contador|litro|kwh|energia|energ[ií]a/, () => rngFloat(10_000, 500_000)],
    // Consumo (kg)
    [/consumo|carga(s)?(_|$)|descarga(s)?/, () => rngFloat(50, 800)],
    // Peso (kg)
    [/peso|bascula|b[aá]scula|animal/, () => rngFloat(20, 130)],
  ];

  for (const [re, gen] of rules) {
    if (re.test(key)) return gen();
  }

  // Fallback por si no coincide nada: temp
  return rngInt(15, 35);
}