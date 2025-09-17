import { Fecha, Tiempo } from './tiposGlobales';

export function tuplasToString(tuplas: [number, number][]): string {
  try {
    return JSON.stringify(tuplas); // Convierte directamente el array de tuplas a un string JSON
  } catch (error) {
    console.error('Error convirtiendo tuplas a string:', error);
    return '[]'; // Devuelve un string vacío en caso de error
  }
}

export function stringToTuplas(tuplasString: string): [number, number][] {
  try {
    const parsed = JSON.parse(tuplasString); // Intenta parsear el string como JSON
    if (
      Array.isArray(parsed) &&
      parsed.every((t) => Array.isArray(t) && t.length === 2)
    ) {
      // Evalua que el array tiene elementos que son tuplas de dos elementos.
      return parsed as [number, number][]; // Asegura que todas las entradas son tuplas [number, number]
    } else {
      throw new Error('El formato no es válido para tuplas.');
    }
  } catch (error) {
    console.error('Error convirtiendo string a tuplas:', error);
    return []; // Devuelve un array vacío en caso de error
  }
}

export function listToString(list: Array<number>): string {
  try {
    return JSON.stringify(list); // Convierte directamente el array de números a un string JSON
  } catch (error) {
    console.error('Error convirtiendo lista a string:', error);
    return '[]';
  }
}

export function stringToList(listString: string): number[] {
  try {
    const parsed = JSON.parse(listString); // Pasamos el string a un objeto JSON.
    if (Array.isArray(parsed)) {
      return parsed as number[];
    } else {
      throw new Error('El formato no es válido para un array de números.');
    }
  } catch (error) {
    console.error('Error convirtiendo string a lista:', error);
    return [];
  }
}

// ------------ ↓ Funciones para parsear Fecha y Tiempo ↓ ------------

// Para los DATETIME, aun sin usar
export function fechaTiempoToString(fecha: Fecha, tiempo: Tiempo): string {
  const fechaString =
    `${fecha.dia.toString().padStart(2, '0')}/` +
    `${fecha.mes.toString().padStart(2, '0')}/` +
    `${fecha.anyo.toString().padStart(4, '0')}`;

  const tiempoString =
    `${tiempo.hora.toString().padStart(2, '0')}h` +
    `${tiempo.min.toString().padStart(2, '0')}m` +
    `${tiempo.seg.toString().padStart(2, '0')}s`;

  return `${fechaString}T${tiempoString}`;
}

// Para los DATETIME, aun sin usar
export function stringToFechaTiempo(fechaTiempo: string): {
  fecha: Fecha;
  tiempo: Tiempo;
} {
  const regexFecha = /(\d{2})\/(\d{2})\/(\d{4})/;
  const regexTiempo = /(\d{1,2})h(\d{1,2})m(\d{1,2})s/;

  const [fechaPart, tiempoPart] = fechaTiempo.split('T');

  const fechaMatch = fechaPart.match(regexFecha);
  const tiempoMatch = tiempoPart.match(regexTiempo);

  if (!fechaMatch || !tiempoMatch) {
    console.warn('ERROR: Formato incorrecto', fechaTiempo);
    return {
      fecha: { dia: 1, mes: 1, anyo: 1970 },
      tiempo: { hora: 0, min: 0, seg: 0 },
    };
  }

  const fecha: Fecha = {
    dia: Number(fechaMatch[1]),
    mes: Number(fechaMatch[2]),
    anyo: Number(fechaMatch[3]),
  };

  const tiempo: Tiempo = {
    hora: Number(tiempoMatch[1]),
    min: Number(tiempoMatch[2]),
    seg: Number(tiempoMatch[3]),
  };

  return { fecha, tiempo };
}

export function stringToFecha(fecha: string): Fecha {
  if (fecha.includes('/')) {
    const fechaSplit = fecha.split('/');
    return {
      dia: Number(fechaSplit[0]),
      mes: Number(fechaSplit[1]),
      anyo: Number(fechaSplit[2]),
    };
  } else {
    console.warn('ERROR convirtiendo ');
    return { dia: 1, mes: 1, anyo: 1970 };
  }
}

export function fechaToString(fecha: Fecha): string {
  const fechaString =
    fecha.dia.toString().padStart(2, '0') +
    '/' +
    fecha.mes.toString().padStart(2, '0') +
    '/' +
    fecha.anyo.toString();
  return fechaString;
} //`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

export function stringToTiempo(tiempo: string): Tiempo {
  const regex = /(\d{1,2})h(\d{1,2})m(\d{1,2})s/;
  const match = tiempo.match(regex);

  if (!match) {
    console.warn('ERROR: Formato de tiempo incorrecto', tiempo);
    return { hora: 0, min: 0, seg: 0 };
  }

  return {
    hora: Number(match[1]),
    min: Number(match[2]),
    seg: Number(match[3]),
  };
}

export function tiempoToString(tiempo: Tiempo): string {
  const tiempoString =
    `${tiempo.hora.toString().padStart(2, '0')}h` +
    `${tiempo.min.toString().padStart(2, '0')}m` +
    `${tiempo.seg.toString().padStart(2, '0')}s`;
  return tiempoString;
}

// ------------ ↑ Funciones para parsear Fecha y Tiempo ↑ ------------

export function intToString(n: number): string {
  return n.toString();
}

export function uintToString(n: number): string {
  return n.toString();
}

export function stringToInt(str: string): number {
  const val = parseInt(str, 10);
  return isNaN(val) ? 0 : val;
}

export function uint64ToString(n: bigint): string {
  return n.toString();
}

export function redondeaFloat(valor: number, decimales: number): number {
  const multiplicador = Math.pow(10, decimales);
  return Math.round(valor * multiplicador) / multiplicador;
}

export function redondeaArribaAbajoFloat(
  valor: number,
  decimales: number,
): number {
  const multiplicador = Math.pow(10, decimales);
  return Math.round(valor * multiplicador) / multiplicador;
}

export function floatToString(n: number, nDecimales: number): string {
  return n.toFixed(nDecimales);
}

export function hexStringToUint32(hexStr: string): number {
  return parseInt(hexStr, 16);
}

// -------------------------------------------------- uint32ToStringHexUint16 --------------------------------------------------
export function uint32ToStringHexUint16(
  numero: number,
  maxString: number,
): string | null {
  if (maxString < 4) return null; // Error: no hay espacio suficiente

  const tempString = numero.toString();
  let hexString = '';

  for (let i = 0; i < tempString.length; i++) {
    if (maxString < 4) return null; // Error: no hay espacio suficiente
    hexString += hexNumeroToString(tempString.charCodeAt(i), 2, maxString);
    maxString -= 4;
  }

  return hexString;
}

// -------------------------------------------------- hexNumeroToString --------------------------------------------------
export function hexNumeroToString(
  numero: number,
  nBytes: number,
  maxString: number,
): string | null {
  if (nBytes === 1 && maxString < 3) return null;
  if (nBytes === 2 && maxString < 5) return null;
  if (nBytes === 4 && maxString < 9) return null;

  let hexString = '';
  switch (nBytes) {
    case 1:
      hexString = numero.toString(16).padStart(2, '0').toUpperCase();
      break;
    case 2:
      hexString = numero.toString(16).padStart(4, '0').toUpperCase();
      break;
    case 4:
      hexString = numero.toString(16).padStart(8, '0').toUpperCase();
      break;
    default:
      return null;
  }

  return hexString;
}

// -------------------------------------------------- hexNumeroToHexCaracter --------------------------------------------------
export function hexNumeroToHexCaracter(numero4Bits: number): string {
  if (numero4Bits >= 0 && numero4Bits <= 15) {
    return numero4Bits.toString(16).toUpperCase();
  }
  return 'X'; // Error
}

// -------------------------------------------------- hexCaracterToByte --------------------------------------------------
export function hexCaracterToByte(
  primerCaracter: string,
  segundoCaracter: string,
): number {
  let tempByte = parseInt(primerCaracter, 16) << 4;
  tempByte |= parseInt(segundoCaracter, 16);
  return tempByte;
}

// -------------------------------------------------- fechaToStringGuiones --------------------------------------------------
export function fechaToStringGuiones(fecha: Fecha): string {
  return `${fecha.dia.toString().padStart(2, '0')}-${fecha.mes.toString().padStart(2, '0')}-${fecha.anyo.toString().padStart(2, '0')}`;
}

// -------------------------------------------------- igualarTiempo --------------------------------------------------
export function igualarTiempo(destino: Tiempo, origen: Tiempo): void {
  Object.assign(destino, origen);
}

// -------------------------------------------------- igualarFecha --------------------------------------------------
export function igualarFecha(destino: Fecha, origen: Fecha): void {
  Object.assign(destino, origen);
}

// -------------------------------------------------- igualarVariable --------------------------------------------------
export function igualarVariable<T>(destino: T, origen: T): void {
  //Object.assign(destino, origen);
}

// -------------------------------------------------- montarUint64 --------------------------------------------------
export function montarUint64(parteAlta: number, parteBaja: number): bigint {
  return (BigInt(parteAlta) << 32n) | BigInt(parteBaja);
}

// -------------------------------------------------- galonesALitros --------------------------------------------------
export function galonesALitros(galones: number): number {
  return galones * 3.7854118;
}

// -------------------------------------------------- adaptarUint32ParaEnvioServer --------------------------------------------------
export function adaptarUint32ParaEnvioServer(temp32: number): number {
  return (
    ((temp32 & 0x000000ff) << 24) |
    ((temp32 & 0x0000ff00) << 8) |
    ((temp32 & 0x00ff0000) >> 8) |
    ((temp32 & 0xff000000) >> 24)
  );
}

// -------------------------------------------------- adaptarUint16ParaEnvioServer --------------------------------------------------
export function adaptarUint16ParaEnvioServer(temp16: number): number {
  return ((temp16 & 0x00ff) << 8) | ((temp16 & 0xff00) >> 8);
}

// -------------------------------------------------- copiarVariableParaEnvioServer --------------------------------------------------
export function copiarVariableParaEnvioServer(
  variable: number,
  numBytes: number,
): number {
  switch (numBytes) {
    case 2:
      return adaptarUint16ParaEnvioServer(variable);
    case 4:
      return adaptarUint32ParaEnvioServer(variable);
    default:
      return variable;
  }
}

// -------------------------------------------------- adaptarVariableRxServer --------------------------------------------------
export function adaptarVariableRxServer(
  variable: number,
  numBytes: number,
): number {
  return copiarVariableParaEnvioServer(variable, numBytes);
}

// -------------------------------------------------- adaptarVariableMemoriaRxServer --------------------------------------------------
export function adaptarVariableMemoriaRxServer(
  variable: number,
  numBytes: number,
): number {
  return copiarVariableParaEnvioServer(variable, numBytes);
}

// -------------------------------------------------- stringFecha010223 --------------------------------------------------
export function stringFecha010223(s: string): Fecha {
  return {
    dia: parseInt(s.substring(0, 2), 10),
    mes: parseInt(s.substring(3, 5), 10),
    anyo: parseInt(s.substring(6, 8), 10),
  };
}

/** Pasa un número (1-26) a letra mayúscula según ASCII -1, es decir, 1 = A, 2 = B ... 26 = Z */
export function numeroToLetra(n: number): string {
  if (n < 1 || n > 26) return '';
  return String.fromCharCode(65 + n - 1); // 65 es el código ASCII de "A"
}

/** Pasa una letra mayúscula (A-Z) a número según ASCII -65 -1, es decir, A = 1, B = 2 ... Z = 26 */
export function letraToNumero(letra: string): number {
  return letra.charCodeAt(0) - 65 + 1; // 65 es el código ASCII de "A"
}

/** Clona una asignación (array de tuplas) para que no compartan referencia y se modifiquen entre ellas indirectamente. */
export function clonarTuplas(arr: [number, number][]): [number, number][] {
  return arr.map(([a, b]) => [a, b]);
}

/** Clona recursivamente usando `structuredClone`. Es decir, clona el valor de un objeto y evita que compartan referencia y se modifiquen entre ellos indirectamente. */
export function clonarObjeto<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  // Date, Map, Set, funciones… no son compatibles
  return JSON.parse(JSON.stringify(value)) as T;
}
