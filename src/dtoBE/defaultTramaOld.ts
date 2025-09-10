import { EnTipoEquipo } from "src/utils/LE/globals/enums";
import { PresentacionCentralOldDto, TablaCentralItemOld } from "./tt_sistemaOld.dto";

// Presentación (Omega) – protocolo antiguo (Big Endian)
export const defaultPresentacionOmegaOld: PresentacionCentralOldDto = {
  tipoEquipo: EnTipoEquipo.omega,                              // ? Código de equipo OMEGA (1 byte). Mantén el mismo enum; se serializa como uint8 BE
  mac: 11223344, //Buffer.from([0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77]), // ? MAC de 8 bytes leído del hardware; aquí un placeholder
  versionEquipo: 2,                                            // ? Versión de equipo (uint16 BE)
  password: "12345678",                                        // ? Hasta 16 bytes; al serializar se rellena con '\0' hasta 16
  crcTabla: 0,                                                 // ? uint16 BE. Se calcula a partir de la tabla; 0 como valor por defecto
};

export function crearDefaultDispositivoTablaOld(seed: number): TablaCentralItemOld {
  const mac = genMac8(seed);
  const nodo = genNodo(seed);
  const estado = genEstado();
  const tipoDispositivo = genTipoDispositivo();
  const version = genVersionU16(seed);
  const password = genPassword(seed);
  const crcParametros = genCrcParametros();
  const infoEstado = genInfoEstado(seed);
  const hayAlarma = genHayAlarma();

  const dispositivo: TablaCentralItemOld = {
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

  return dispositivo;
}

export function crearTablaCambioEstadoDispositivoOld(m: number|bigint, nod: number, est: number, td: number, v: number, alarm: number): TablaCentralItemOld {

  // const macBuf = Buffer.alloc(8);
  // macBuf.writeUIntBE(m, 0, 8);
  const macBuf = Buffer.alloc(8);
  const macBig = typeof m === "bigint" ? m : BigInt(m >>> 0); // OJO: si te cabe
  macBuf.writeBigUInt64BE(macBig);
  const mac = macBuf;
  const nodo = nod;
  const estado = est;
  const tipoDispositivo = td;
  const version = v; // lo usamos también como seed

  const password = genPassword(v);
  const crcParametros = genCrcParametros();
  const infoEstado = genInfoEstado(v);

  const hayAlarma = alarm;

  const dispositivo: TablaCentralItemOld = {
    mac,
    nodo,
    estado,
    tipoDispositivo,
    version,
    password,
    crcParametros,
    infoEstado,
    hayAlarma
  }

  return dispositivo;
}

//* -------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------------------------------------------------------------------------
//* ------------------------ Generadores de valores para dispositivos de la tabla (Old) -------------------------------
//* -------------------------------------------------------------------------------------------------------------------
//* -------------------------------------------------------------------------------------------------------------------

// Helpers
const rnd = () => Math.random();
const rndInt = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const clampU8 = (n: number) => (n & 0xFF);
const clampU16 = (n: number) => (n & 0xFFFF);

/** Genera una MAC de 8 bytes (primeros 3 bytes OUI "creíble", resto pseudoaleatorio). */
function genMac8(seed: number): Buffer {
  const b = Buffer.alloc(8);
  // OUI conocido-ish (0x00-1A-79 suele verse en hardware antiguo). Marcamos "unicast, globally unique" (LSB del primer byte = 0).
  b[0] = 0x00; b[1] = 0x1A; b[2] = 0x79;
  // 5 bytes restantes: mezclamos seed y random para que “parezca” único
  let mix = (seed * 2654435761) >>> 0; // Knuth
  for (let i = 3; i < 8; i++) {
    mix = (mix ^ Math.floor(rnd() * 0xFFFFFFFF)) >>> 0;
    b[i] = (mix >>> ((i - 3) * 5)) & 0xFF;
  }
  return b;
}

/** Version “creíble”: mayor y menor de versión empaquetados en u16 (ej: 1.23 -> 0x0117). */
function genVersionU16(seed: number): number {
  const major = clampU8(1 + Math.floor((seed * 0.13 + rnd() * 3)));         // 1..4-ish
  const minor = clampU8(5 + Math.floor((seed * 0.37 + rnd() * 40)));        // 5..~45
  return ((major << 8) | minor) & 0xFFFF;
}

/** Password hasta 16 chars ASCII plausibles (si luego lo serializas, ya se rellenará a 16 bytes). */
function genPassword(seed: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";
  const len = Math.max(6, Math.min(16, 8 + Math.floor((seed % 5) + rnd() * 6))); // 8..14 aprox
  let out = "";
  let x = (seed * 1103515245 + 12345) >>> 0;
  for (let i = 0; i < len; i++) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out += alphabet[x % alphabet.length];
  }
  return out;
}

/** InfoEstado: simulamos flags (bit0=presente, bit1=energía OK, bit2=radio OK...) */
function genInfoEstado(seed: number): number {
  const base =
    (1 << 0) |                                     // presente
    ((seed % 2 ? 1 : rndInt(0, 1)) << 1) |         // energía
    ((seed % 3 ? 1 : rndInt(0, 1)) << 2) |         // radio enlazada
    (rndInt(0, 1) << 3);                           // algún flag extra esporádico
  return clampU8(base);
}

/** Hay alarma: baja probabilidad */
function genHayAlarma(): number {
  return rnd() < 0.12 ? 1 : 0; // ~12%
}

/** Estado: 0 OK, 1 aviso, 2 fallo leve (distribución sesgada) */
function genEstado(): number {
  const r = rnd();
  return r < 0.80 ? 1 : 0;
  // return r < 0.78 ? 0 : (r < 0.93 ? 1 : 2);
}

/** Elige un valor aleatorio del enum de tipos (por sus *values*). */
function genTipoDispositivo(): number {
  const values = [
    101, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129,
    130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 145, 146, 147, 148, 150, 151, 152, 153, 154, 155, 156,
    157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 200, 201, 202, 203, 204
  ];
  return values[rndInt(0, values.length - 1)];
}

/** Nodo (u16) con rango plausible (1..4000 aprox) */
function genNodo(seed: number): number {
  const base = 1 + Math.floor((seed * 17) % 3000);
  return clampU16(base + rndInt(0, 1000)); // 1..~4000
}

/** CRC parámetros: en la tabla antigua no se usa -> 0 */
function genCrcParametros(): number {
  return 0;
}

