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

// ------------------------------------------- readNodoOrigen -------------------------------------------
// export function readNodoOrigen(/*body: unknown,*/ def = 1): number {
//   // if (!isObject(body))
//   return def;
//   // const raw = body['nodoOrigen'];
//   // return isNumber(raw) ? raw : def;
// }

// // ------------------------------------------- readNodoDestino -------------------------------------------
// export function readNodoDestino(/*body: unknown,*/ def = 0): number {
//   // if (!isObject(body))
//   return def;
//   // const raw = body['nodoDestino'];
//   // return isNumber(raw) ? raw : def;
// }

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

// ------------------------------------------- readPresentacion -------------------------------------------
/** Si no hay presentación en el body, devuelve la default. */
// export function readPresentacion(
//   /*body: unknown,*/ def: PresentacionDto,
// ): PresentacionDto {
//   // if (!isObject(body))
//   return def;
//   // const datos = body['datos'];
//   // return isPresentacionDto(datos) ? (datos as PresentacionDto) : def;
// }

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
      return u8(v);
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

// export function coerceEnum<T extends Record<string, number>>(val: string | number, E: T): T[keyof T] {
//   if (typeof val === 'number') {
//     if (Object.values(E).includes(val as any)) return val as any;
//     throw new Error('Valor numérico fuera del enum');
//   }
//   const s = String(val).trim();
//   if (/^-?\d+$/.test(s)) {
//     const n = Number(s);
//     if (Object.values(E).includes(n as any)) return n as any;
//     throw new Error('Valor numérico fuera del enum');
//   }
//   const key = Object.keys(E).find(k => k.toLowerCase() === s.toLowerCase());
//   if (key) return (E as any)[key];
//   throw new Error(`Valor "${val}" no pertenece al enum`);
// }

// // ----------------------------- Helpers de codificación de valores SCV -----------------------------
// export function encodeScvValor(
//   tipo: EnTipoDato,
//   valor: number | string | Buffer,
// ): Buffer {
//   if (Buffer.isBuffer(valor)) return valor;

//   switch (tipo) {
//     case EnTipoDato.uint8: {
//       const b = Buffer.alloc(1);
//       b.writeUInt8((Number(valor) >>> 0) & 0xff, 0);
//       return b;
//     }
//     case EnTipoDato.int8: {
//       const b = Buffer.alloc(1);
//       b.writeInt8(Number(valor) | 0, 0);
//       return b;
//     }
//     case EnTipoDato.uint16: {
//       const b = Buffer.alloc(2);
//       b.writeUInt16LE((Number(valor) >>> 0) & 0xffff, 0);
//       return b;
//     }
//     case EnTipoDato.int16: {
//       const b = Buffer.alloc(2);
//       b.writeInt16LE(Number(valor) | 0, 0);
//       return b;
//     }
//     case EnTipoDato.uint32: {
//       const b = Buffer.alloc(4);
//       b.writeUInt32LE(Number(valor) >>> 0, 0);
//       return b;
//     }
//     case EnTipoDato.int32: {
//       const b = Buffer.alloc(4);
//       b.writeInt32LE(Number(valor) | 0, 0);
//       return b;
//     }
//     case EnTipoDato.float: {
//       const b = Buffer.alloc(4);
//       b.writeFloatLE(Number(valor), 0);
//       return b;
//     }
//     case EnTipoDato.string4:
//     case EnTipoDato.string32:
//     case EnTipoDato.stringUnicode16:
//     case EnTipoDato.stringUnicode32:
//     case EnTipoDato.concatenado: {
//       // Por simplicidad codificamos strings en UTF-8; si el server requiere Unicode-16, cambia aquí.
//       return Buffer.from(String(valor), 'utf8');
//     }
//     default: {
//       // Fallback razonable: si nos llega un número lo empaquetamos como uint32; si no, utf8
//       if (typeof valor === 'number') {
//         const b = Buffer.alloc(4);
//         b.writeUInt32LE(valor >>> 0, 0);
//         return b;
//       }
//       return Buffer.from(String(valor), 'utf8');
//     }
//   }
// }
