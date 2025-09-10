import { PresentacionDto } from 'src/dtoLE/tt_sistema.dto';
import { EnTipoDato } from './LE/globals/enums';
import { Fecha } from './tiposGlobales';

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
      throw new Error(
        `Tipo de valor no soportado en estadístico valor: ${EnTipoDato[tipo]} (${tipo})`,
      );
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

export const u8Old = (n: number) => Buffer.from([n & 0xFF]);
export const u16BE = (n: number) => {
  const b = Buffer.allocUnsafe(2);
  b.writeUInt16BE(n >>> 0, 0);
  return b;
};

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
