import { EnEventosEstadisFamilia, EnEventosEstadisPropiedades, EnEventosEstadisSubfamilia, EnEventosEstadisTipo, EnTipoDatoDFAccion } from "src/utils/BE_Old/globals/enumOld";
import { EnTextos } from "src/utils/enumTextos";
import { packValorDf4BE } from "src/utils/helpers";
import { Fecha, Tiempo } from "src/utils/tiposGlobales";

// ---------------------------------------- ParametroHistoricoOmegaDfDto ----------------------------------------
/** Estadístico de valor o cambio parámetro o alarma/warning. Payload de TM_envia_historico (caso: estadístico DF). */
export interface ParametroHistoricoValorOmegaDfDto {
  /** 8 bytes: MAC del equipo (crudo). */
  mac: number | Buffer;
  /**
   * 1 byte: tipo de dato DF (p.ej. estadisticoUint8=1 … estadisticoFloat3=9).
   * Usa tu enum: EnTipoDatoDf (o el nombre que tengas).
   */
  tipoDato: EnTipoDatoDFAccion;
  /** 3 bytes: fecha (representada como estructura lógica). */
  fecha: Fecha;
  /** 3 bytes: hora (representada como estructura lógica). */
  hora: Tiempo;
  /** 1 byte: identificador único dentro del segundo actual. */
  identificadorUnicoDentroDelSegundo: number;
  /** 2 bytes: identificador de cliente. */
  identificadorCliente: number;
  /** 2 bytes: nombre de la variable. */
  nombreVariable: number;
  /**
   * 4 bytes: valor de la variable.
   * Se interpreta según `tipoDato` (uint8/int8/uint16/int16/uint32/int32/float).
   * Puedes guardarlo ya interpretado como number o crudo como Buffer.
   */
  valorVariable: number | Buffer;
  /** 4 bytes: identificador único de crianza (0 si “no crianza”). */
  identificadorCrianzaUnico: number;
  /** 2 bytes (int16): día de crianza. */
  variable1DiaCrianza: number;
  /** 2 bytes: campo auxiliar (documento lo llama “variable1_2”). */
  variable1_2: number;
  /** 4 bytes: campo auxiliar “variable2”. */
  variable2: number;
  /** 4 bytes: campo auxiliar “variable3”. */
  variable3: number;
}

/**
 * Serializa la “data” de TM_envia_historico (caso DF estadístico/cambio parámetro) a Buffer (BE).
 * Layout (40 B):
 *  8B  mac
 *  1B  tipoDato
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  identificadorCliente                  (BE)
 *  2B  nombreVariable                        (BE)
 *  4B  valorVariable                         (BE; segun tipoDato)
 *  4B  identificadorCrianzaUnico             (BE)
 *  2B  variable1DiaCrianza (int16)           (BE)
 *  2B  variable1_2                           (BE)
 *  4B  variable2                             (BE)
 *  4B  variable3                             (BE)
 */
export function serializarParametroHistoricoValorOmegaDf(
  d: ParametroHistoricoValorOmegaDfDto
): Buffer {
  const out = Buffer.alloc(40);
  let offset = 0;

  // --- 8B MAC
  // if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
  //   throw new Error(`MAC inválida: se espera Buffer de 8 bytes`);
  // }
  // d.mac.copy(out, offset); offset += 8;
  const macAny = d.mac as unknown as number | bigint | Buffer;

  if (typeof macAny === 'number' || typeof macAny === 'bigint') {
    let macBig = typeof macAny === 'bigint' ? macAny : BigInt(macAny);

    // Validación de rango 0..2^64-1
    if (macBig < 0n || macBig > 0xFFFF_FFFF_FFFF_FFFFn) {
      throw new Error('MAC inválida: fuera de rango (0..2^64-1)');
    }

    // Si tu Node soporta writeBigUInt64BE, úsalo; si no, fallback manual
    if (typeof (out as any).writeBigUInt64BE === 'function') {
      (out as any).writeBigUInt64BE(macBig, offset);
    } else {
      // Fallback: escribir BigInt byte a byte en BE
      for (let i = 7; i >= 0; i--) {
        out[offset + i] = Number(macBig & 0xFFn);
        macBig >>= 8n;
      }
    }
    offset += 8;

  } else if (Buffer.isBuffer(macAny)) {
    if (macAny.length !== 8) {
      throw new Error('MAC inválida: se espera Buffer de 8 bytes');
    }
    macAny.copy(out, offset); offset += 8;

  } else {
    throw new Error('MAC inválida: se espera number|bigint o Buffer de 8 bytes');
  }

  // --- 1B tipoDato
  out.writeUInt8((d.tipoDato as number) & 0xff, offset++);

  // --- 3B fecha (dd, mm, yy)
  const yy = (d.fecha.anyo ?? 0) % 100;
  out.writeUInt8(d.fecha.dia & 0xff, offset++);
  out.writeUInt8(d.fecha.mes & 0xff, offset++);
  out.writeUInt8(yy & 0xff, offset++);

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, offset++);
  out.writeUInt8(d.hora.min & 0xff, offset++);
  out.writeUInt8(d.hora.seg & 0xff, offset++);

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, offset++);

  // --- 2B identificadorCliente (BE)
  out.writeUInt16BE(d.identificadorCliente & 0xffff, offset); offset += 2;

  // --- 2B nombreVariable (BE)
  out.writeUInt16BE(d.nombreVariable & 0xffff, offset); offset += 2;

  // --- 4B valorVariable (BE; según tipoDato)
  {
    const v4 = packValorDf4BE(d.tipoDato, d.valorVariable);
    v4.copy(out, offset); offset += 4;
  }

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE((d.identificadorCrianzaUnico >>> 0), offset); offset += 4;

  // --- 2B variable1DiaCrianza (int16 BE)
  out.writeInt16BE((d.variable1DiaCrianza | 0), offset); offset += 2;

  // --- 2B variable1_2 (BE)
  out.writeUInt16BE(d.variable1_2 & 0xffff, offset); offset += 2;

  // --- 4B variable2 (BE)
  out.writeUInt32BE((d.variable2 >>> 0), offset); offset += 4;

  // --- 4B variable3 (BE)
  out.writeUInt32BE((d.variable3 >>> 0), offset); offset += 4;

  // Seguridad: o debe ser 40
  // if (o !== 40) throw new Error(`Longitud inesperada al serializar (o=${o})`);
  return out;
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// TIPO DATO EVENTO
// ---------------------------------------- ParametroHistoricoOmegaEventoDto ----------------------------------------
/** 5.9.6.3 — TM_envia_historico: EVENTO */
export interface ParametroHistoricoOmegaEventoDto {
  /** 8 bytes: MAC del equipo (crudo). */
  mac: number | Buffer;
  /** 1 byte: tipo de dato (debería indicar “evento”). */
  tipoDato: EnTipoDatoDFAccion;
  /** 1 byte: identificador único dentro del segundo actual. */
  identificadorUnicoDentroDelSegundo: number;
  /** 1 byte: versión de la estructura de evento. */
  versionEstructura: number;
  /** 1 byte: tipo de evento. */
  tipo: EnEventosEstadisTipo;
  /** 2 bytes: familia del evento. */
  familia: EnEventosEstadisFamilia;
  /** 1 byte: subfamilia del evento. */
  subfamilia: EnEventosEstadisSubfamilia;
  /** 1 byte: reservado (reserva1). */
  reserva1: number;
  /** 2 bytes (bitmask): propiedades del evento. */
  propiedades: EnEventosEstadisPropiedades;
  /** Tiempo (3B): fecha del evento. */
  fecha: Fecha;
  /** Tiempo (3B): hora del evento. */
  hora: Tiempo;
  /** 2 bytes: nombre de la variable asociada. */
  nombreVariable: number;
  /** 2 bytes (int16): día de crianza. */
  diaCrianza: number;
  /** 4 bytes: identificador único de crianza. */
  identificadorCrianzaUnico: number;
  /** 8 bytes: zona reservada. */
  reserva: Buffer; // length = 8
}

/**
 * Serializa la “data” de TM_envia_historico (EVENTO) a Buffer (BE).
 * Layout (40 B):
 *  8B  mac
 *  1B  tipoDato
 *  1B  identificadorUnicoDentroDelSegundo
 *  1B  versionEstructura
 *  1B  tipo
 *  2B  familia                           (BE)
 *  1B  subfamilia
 *  1B  reserva1
 *  2B  propiedades                       (BE)
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  2B  nombreVariable                    (BE)
 *  2B  diaCrianza (int16)                (BE)
 *  4B  identificadorCrianzaUnico         (BE)
 *  8B  reserva
 */
export function serializarParametroHistoricoEventoOmegaDf(
  d: ParametroHistoricoOmegaEventoDto
): Buffer {
  const out = Buffer.alloc(40);
  let offset = 0;

  // --- 8B MAC
  // if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
  //   throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  // }
  // d.mac.copy(out, o); o += 8;

  const macAny = d.mac as unknown as number | bigint | Buffer;

  if (typeof macAny === 'number' || typeof macAny === 'bigint') {
    let macBig = typeof macAny === 'bigint' ? macAny : BigInt(macAny);

    // Validación de rango 0..2^64-1
    if (macBig < 0n || macBig > 0xFFFF_FFFF_FFFF_FFFFn) {
      throw new Error('MAC inválida: fuera de rango (0..2^64-1)');
    }

    // Si tu Node soporta writeBigUInt64BE, úsalo; si no, fallback manual
    if (typeof (out as any).writeBigUInt64BE === 'function') {
      (out as any).writeBigUInt64BE(macBig, offset);
    } else {
      // Fallback: escribir BigInt byte a byte en BE
      for (let i = 7; i >= 0; i--) {
        out[offset + i] = Number(macBig & 0xFFn);
        macBig >>= 8n;
      }
    }
    offset += 8;

  } else if (Buffer.isBuffer(macAny)) {
    if (macAny.length !== 8) {
      throw new Error('MAC inválida: se espera Buffer de 8 bytes');
    }
    macAny.copy(out, offset); offset += 8;

  } else {
    throw new Error('MAC inválida: se espera number|bigint o Buffer de 8 bytes');
  }




  // --- 1B tipoDato
  out.writeUInt8((d.tipoDato as number) & 0xff, offset++);

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, offset++);

  // --- 1B versión estructura
  out.writeUInt8(d.versionEstructura & 0xff, offset++);

  // --- 1B tipo (ENUM_EVENTOS_ESTADIS_TIPO)
  out.writeUInt8((d.tipo as number) & 0xff, offset++);

  // --- 2B familia (BE)
  out.writeUInt16BE((d.familia as number) & 0xffff, offset); offset += 2;

  // --- 1B subfamilia
  out.writeUInt8((d.subfamilia as number) & 0xff, offset++);

  // --- 1B reserva1
  out.writeUInt8(d.reserva1 & 0xff, offset++);

  // --- 2B propiedades (bitmask, BE)
  out.writeUInt16BE((d.propiedades as number) & 0xffff, offset); offset += 2;

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, offset++);
    out.writeUInt8(d.fecha.mes & 0xff, offset++);
    out.writeUInt8(yy & 0xff, offset++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, offset++);
  out.writeUInt8(d.hora.min & 0xff, offset++);
  out.writeUInt8(d.hora.seg & 0xff, offset++);

  // --- 2B nombreVariable (BE)
  out.writeUInt16BE(d.nombreVariable & 0xffff, offset); offset += 2;

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, offset); offset += 2;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, offset); offset += 4;

  // --- 8B reserva
  if (!Buffer.isBuffer(d.reserva) || d.reserva.length !== 8) {
    throw new Error('Reserva inválida: se espera Buffer de 8 bytes');
  }
  d.reserva.copy(out, offset); offset += 8;

  // Seguridad: o debe ser 40
  // if (o !== 40) throw new Error(`Longitud inesperada al serializar (o=${o})`);
  return out;
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// EVENTO CONCATENADO
// ---------------------------------------- ParametroHistoricoOmegaEventoConcatenadoDto ----------------------------------------
/** 5.9.6.4 — TM_envia_historico: EVENTO_CONCATENADO */
export interface ParametroHistoricoOmegaEventoConcatenadoDto {
  /** 8B: MAC del equipo. */
  mac: number | Buffer;
  /** 1B: tipo de dato (debería indicar “evento concatenado”). */
  tipoDato: EnTipoDatoDFAccion;
  /** 1B: identificador único dentro del segundo. */
  identificadorUnicoDentroDelSegundo: number;
  /** 2B: versión de alarma/evt concatenado. */
  versionAlarmaConcatenada: number;
  /** 1B: tipo (ENUM_EVENTOS_ESTADIS_TIPO). */
  tipo: EnEventosEstadisTipo;
  /** 1B: subfamilia (ENUM_EVENTOS_ESTADIS_SUBFAMILIA). */
  subfamilia: EnEventosEstadisSubfamilia;
  /** 2B: familia (ENUM_EVENTOS_ESTADIS_FAMILIA). */
  familia: EnEventosEstadisFamilia;
  /** 2B: propiedades (bitmask ENUM_EVENTOS_ESTADIS_PROPIEDADES). */
  propiedades: EnEventosEstadisPropiedades;
  /** 2B: identificador de la alarma/evento (texto). */
  nombreAlarma: number | EnTextos;
  /** 3B: fecha. */
  fecha: Fecha;
  /** 3B: hora. */
  hora: Tiempo;
  /** 2B (int16): día de crianza. */
  diaCrianza: number;
  /** 4B: identificador único de crianza. */
  identificadorCrianzaUnico: number;
  /** 1B: reservado. */
  reserva: number;
  /** 1B: nº de bytes válidos en ‘cadenaConcatenada’ (1..128). */
  numeroBytesCadena: number;
  /**
   * Hasta 40 *uint16* (máx. 80 bytes) con el texto concatenado (UTF-16LE habitual).
   * Se deben usar solo los primeros `numeroBytesCadena` bytes.
   */
  cadenaConcatenada: Buffer;
}

/**
 * Serializa la “data” de TM_envia_historico (EVENTO_CONCATENADO) a Buffer (BE).
 * Layout (114 B):
 *  8B  mac
 *  1B  tipoDato
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  versionAlarmaConcatenada          (BE)
 *  1B  tipo                              
 *  1B  subfamilia
 *  2B  familia                           (BE)
 *  2B  propiedades                       (BE, bitmask)
 *  2B  nombreAlarma                      (BE)
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  2B  diaCrianza (int16)                (BE)
 *  4B  identificadorCrianzaUnico         (BE)
 *  1B  reserva
 *  1B  numeroBytesCadena                 (1..80) *
 * 80B  cadenaConcatenada (máx. 80 bytes; UTF-16LE habitual)
 *
 * *La doc menciona 1..128 bytes, pero el array definido es de 40 * uint16 = 80 bytes.
 *  Aquí validamos contra 80 para mantener coherencia con el tamaño real del bloque.
 */
export function serializarParametroHistoricoEventoConcatenadoOmegaDf(
  d: ParametroHistoricoOmegaEventoConcatenadoDto
): Buffer {
  const OUT_LEN = 114;
  const CADENA_MAX_BYTES = 80; // 40 * uint16

  const out = Buffer.alloc(OUT_LEN);
  let offset = 0;

  // --- 8B MAC
  // if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
  //   throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  // }
  // d.mac.copy(out, offset); offset += 8;


  const macAny = d.mac as unknown as number | bigint | Buffer;

  if (typeof macAny === 'number' || typeof macAny === 'bigint') {
    let macBig = typeof macAny === 'bigint' ? macAny : BigInt(macAny);

    // Validación de rango 0..2^64-1
    if (macBig < 0n || macBig > 0xFFFF_FFFF_FFFF_FFFFn) { throw new Error('MAC inválida: fuera de rango (0..2^64-1)'); }

    // Si tu Node soporta writeBigUInt64BE, úsalo; si no, fallback manual
    if (typeof (out as any).writeBigUInt64BE === 'function') {
      (out as any).writeBigUInt64BE(macBig, offset);
    } else {
      // Fallback: escribir BigInt byte a byte en BE
      for (let i = 7; i >= 0; i--) {
        out[offset + i] = Number(macBig & 0xFFn);
        macBig >>= 8n;
      }
    }
    offset += 8;

  } else if (Buffer.isBuffer(macAny)) {
    if (macAny.length !== 8) { throw new Error('MAC inválida: se espera Buffer de 8 bytes'); }
    macAny.copy(out, offset); offset += 8;

  } else { throw new Error('MAC inválida: se espera number|bigint o Buffer de 8 bytes'); }

  // --- 1B tipoDato
  out.writeUInt8((d.tipoDato as number) & 0xff, offset++);

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, offset++);

  // --- 2B versión alarma concatenada (BE)
  out.writeUInt16BE(d.versionAlarmaConcatenada & 0xffff, offset); offset += 2;

  // --- 1B tipo (ENUM_EVENTOS_ESTADIS_TIPO)
  out.writeUInt8((d.tipo as number) & 0xff, offset++);

  // --- 1B subfamilia
  out.writeUInt8((d.subfamilia as number) & 0xff, offset++);

  // --- 2B familia (BE)
  out.writeUInt16BE((d.familia as number) & 0xffff, offset); offset += 2;

  // --- 2B propiedades (bitmask, BE)
  out.writeUInt16BE((d.propiedades as number) & 0xffff, offset); offset += 2;

  // --- 2B nombreAlarma (BE)
  out.writeUInt16BE((d.nombreAlarma as number) & 0xffff, offset); offset += 2;

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, offset++);
    out.writeUInt8(d.fecha.mes & 0xff, offset++);
    out.writeUInt8(yy & 0xff, offset++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, offset++);
  out.writeUInt8(d.hora.min & 0xff, offset++);
  out.writeUInt8(d.hora.seg & 0xff, offset++);

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, offset); offset += 2;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, offset); offset += 4;

  // --- 1B reserva
  out.writeUInt8(d.reserva & 0xff, offset++);

  // --- 1B numeroBytesCadena (1..80)
  if (!Buffer.isBuffer(d.cadenaConcatenada)) { throw new Error('cadenaConcatenada inválida: se espera Buffer'); }
  if (d.cadenaConcatenada.length > CADENA_MAX_BYTES) { throw new Error(`cadenaConcatenada demasiado larga: máx ${CADENA_MAX_BYTES} bytes (40 uint16)`); }

  // Usamos el mínimo entre lo indicado y lo disponible, acotado a 80.
  let nBytes = d.numeroBytesCadena;
  if (typeof nBytes !== 'number' || !Number.isInteger(nBytes)) { throw new Error('numeroBytesCadena inválido: se espera entero'); }
  nBytes = Math.min(nBytes, d.cadenaConcatenada.length, CADENA_MAX_BYTES);

  if (nBytes < 1 || nBytes > CADENA_MAX_BYTES) { throw new Error(`numeroBytesCadena fuera de rango: 1..${CADENA_MAX_BYTES}`); }

  out.writeUInt8(nBytes & 0xff, offset++);

  // --- 80B cadenaConcatenada (relleno con ceros si sobra)
  d.cadenaConcatenada.copy(out, offset, 0, nBytes);
  offset += CADENA_MAX_BYTES; // reservamos el bloque completo

  // Seguridad: offset debe ser 114
  if (offset !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${offset}, esperado=${OUT_LEN})`);
  }
  return out;
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// ---------------------------------------- ParametroHistoricoOmegaEstadisticoGenericoDto ----------------------------------------
/** 5.9.6.5 — TM_envia_historico: ESTADISTICO_GENERICO (misma estructura que el concatenado) */
export interface ParametroHistoricoOmegaEstadisticoGenericoDto {
  /** 8B: MAC del equipo. */
  mac: Buffer;
  /** 1B: tipo de dato (debería indicar “estadístico genérico”). */
  tipoDato: EnTipoDatoDFAccion;
  /** 1B: identificador único dentro del segundo. */
  identificadorUnicoDentroDelSegundo: number;
  /** 2B: versión de “alarma/estadístico concatenado”. */
  versionAlarmaConcatenada: number;
  /** 1B: tipo (ENUM_EVENTOS_ESTADIS_TIPO). */
  tipo: EnEventosEstadisTipo;
  /** 1B: subfamilia (ENUM_EVENTOS_ESTADIS_SUBFAMILIA). */
  subfamilia: EnEventosEstadisSubfamilia;
  /** 2B: familia (ENUM_EVENTOS_ESTADIS_FAMILIA). */
  familia: EnEventosEstadisFamilia;
  /** 2B: propiedades (bitmask ENUM_EVENTOS_ESTADIS_PROPIEDADES). */
  propiedades: EnEventosEstadisPropiedades;
  /** 2B: identificador del “nombre de alarma/estadístico”. */
  nombreAlarma: number;
  /** 3B: fecha. */
  fecha: Fecha;
  /** 3B: hora. */
  hora: Tiempo;
  /** 2B (int16): día de crianza. */
  diaCrianza: number;
  /** 4B: identificador único de crianza. */
  identificadorCrianzaUnico: number;
  /** 1B: reservado. */
  reserva: number;
  /** 1B: nº de bytes válidos en ‘cadenaConcatenada’ (1..128). */
  numeroBytesCadena: number;
  /** Hasta 40 *uint16* (máx. 80 bytes) con el texto concatenado. */
  cadenaConcatenada: Buffer;
}

// =================== Serialización ESTADISTICO_GENERICO (misma estructura que EVENTO_CONCATENADO) ===================

/**
 * Serializa la “data” de TM_envia_historico (ESTADISTICO_GENERICO) a Buffer (BE).
 * Layout (114 B), idéntico al EVENTO_CONCATENADO:
 *  8B  mac
 *  1B  tipoDato
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  versionAlarmaConcatenada         (BE)
 *  1B  tipo
 *  1B  subfamilia
 *  2B  familia                          (BE)
 *  2B  propiedades                      (BE, bitmask)
 *  2B  nombreAlarma                     (BE)   // aquí se mapea 'nombre_estadistico'
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  2B  diaCrianza (int16)               (BE)
 *  4B  identificadorCrianzaUnico        (BE)
 *  1B  reserva
 *  1B  numeroBytesCadena                (1..80)
 * 80B  cadenaConcatenada (UTF-16LE; se usan solo los primeros n bytes)
 */
export function serializarParametroHistoricoEstadisticoGenericoOmegaDf(
  d: ParametroHistoricoOmegaEstadisticoGenericoDto
): Buffer {
  const OUT_LEN = 114;
  const CADENA_MAX_BYTES = 80; // 40 * uint16
  const out = Buffer.alloc(OUT_LEN);
  let offset = 0;

  // --- 8B MAC
  if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
    throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  }
  d.mac.copy(out, offset); offset += 8;

  // --- 1B tipoDato
  out.writeUInt8((d.tipoDato as number) & 0xff, offset++);

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, offset++);

  // --- 2B versión “alarma/estadístico concatenado” (BE)
  out.writeUInt16BE(d.versionAlarmaConcatenada & 0xffff, offset); offset += 2;

  // --- 1B tipo
  out.writeUInt8((d.tipo as number) & 0xff, offset++);

  // --- 1B subfamilia
  out.writeUInt8((d.subfamilia as number) & 0xff, offset++);

  // --- 2B familia (BE)
  out.writeUInt16BE((d.familia as number) & 0xffff, offset); offset += 2;

  // --- 2B propiedades (bitmask, BE)
  out.writeUInt16BE((d.propiedades as number) & 0xffff, offset); offset += 2;

  // --- 2B nombreAlarma / nombre_estadistico (BE)
  out.writeUInt16BE((d.nombreAlarma as number) & 0xffff, offset); offset += 2;

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, offset++);
    out.writeUInt8(d.fecha.mes & 0xff, offset++);
    out.writeUInt8(yy & 0xff, offset++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, offset++);
  out.writeUInt8(d.hora.min & 0xff, offset++);
  out.writeUInt8(d.hora.seg & 0xff, offset++);

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, offset); offset += 2;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, offset); offset += 4;

  // --- 1B reserva
  out.writeUInt8(d.reserva & 0xff, offset++);

  // --- 1B numeroBytesCadena (1..80)
  if (!Buffer.isBuffer(d.cadenaConcatenada)) {
    throw new Error('cadenaConcatenada inválida: se espera Buffer');
  }
  if (d.cadenaConcatenada.length > CADENA_MAX_BYTES) {
    throw new Error(`cadenaConcatenada demasiado larga: máx ${CADENA_MAX_BYTES} bytes (40 uint16)`);
  }
  let nBytes = d.numeroBytesCadena | 0;
  nBytes = Math.min(Math.max(nBytes, 1), CADENA_MAX_BYTES);
  nBytes = Math.min(nBytes, d.cadenaConcatenada.length);
  out.writeUInt8(nBytes & 0xff, offset++);

  // --- 80B cadenaConcatenada (relleno con ceros si sobra)
  d.cadenaConcatenada.copy(out, offset, 0, nBytes);
  offset += CADENA_MAX_BYTES;

  if (offset !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${offset}, esperado=${OUT_LEN})`);
  }
  return out;
}



// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



// ---------------------------------------- ParametroHistoricoOmegaCambioParametroDfDto ----------------------------------------
/** 5.9.6.6 — TM_envia_historico: DF_CAMBIO_PARAMETRO */
export interface ParametroHistoricoOmegaCambioParametroDfDto {
  /** 8B: MAC del equipo */
  mac: Buffer;
  /** 1B: tipo de dato DF (UINT8/INT8/…/FECHA/TIEMPO*), ver EnTipoDatoDf */
  tipoDato: EnTipoDatoDFAccion;
  /** 3B: fecha */
  fecha: Fecha;
  /** 3B: hora */
  hora: Tiempo;
  /** 1B: identificador único dentro del segundo */
  identificadorUnicoDentroDelSegundo: number;
  /** 2B: identificador cliente */
  identificadorCliente: number;
  /** 2B: TEXT_variable (id de texto/catálogo) */
  textVariable: number;
  /** 4B: valor variable (numérico según ‘tipoDato’ o crudo si aplica) */
  valorVariable: number | Buffer;
  /** 4B: identificador crianza único (0 ⇒ no crianza) */
  identificadorCrianzaUnico: number;
  /** 2B (int16): día de crianza */
  diaCrianza: number;
  /** 2B: TEXT_Titulo_variable (id de texto/catálogo) */
  textTituloVariable: number;
  /** 4B: variable2 (uso genérico) */
  variable2: number | Buffer;
  /** 4B: TEXT_titulo_personalizado (id/valor; se deja genérico) */
  variable3TextTituloPersonalizado: number | Buffer;
}

// =================== Serialización DF_CAMBIO_PARAMETRO (Omega) ===================

/**
 * Serializa la “data” de TM_envia_historico (DF_CAMBIO_PARAMETRO) a Buffer (BE).
 * Layout (40 B):
 *  8B  mac
 *  1B  tipoDato                              (EnTipoDatoDFAccion: 10..18, 20..23)
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  identificadorCliente                  (BE)
 *  2B  textVariable                          (BE)
 *  4B  valorVariable                         (BE, ver decodificación por tipo)
 *  4B  identificadorCrianzaUnico             (BE)
 *  2B  diaCrianza (int16)                    (BE)
 *  2B  textTituloVariable                    (BE)
 *  4B  variable2                             (BE / crudo 4B)
 *  4B  variable3TextTituloPersonalizado      (BE / crudo 4B)
 */
export function serializarParametroHistoricoCambioParametroOmegaDf(
  d: ParametroHistoricoOmegaCambioParametroDfDto
): Buffer {
  const OUT_LEN = 40;
  const out = Buffer.alloc(OUT_LEN);
  let o = 0;

  // --- 8B MAC
  if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
    throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  }
  d.mac.copy(out, o); o += 8;

  // --- 1B tipoDato
  out.writeUInt8((d.tipoDato as number) & 0xff, o++);

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, o++);
    out.writeUInt8(d.fecha.mes & 0xff, o++);
    out.writeUInt8(yy & 0xff, o++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, o++);
  out.writeUInt8(d.hora.min & 0xff, o++);
  out.writeUInt8(d.hora.seg & 0xff, o++);

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, o++);

  // --- 2B identificador cliente (BE)
  out.writeUInt16BE(d.identificadorCliente & 0xffff, o); o += 2;

  // --- 2B TEXT_variable (BE)
  out.writeUInt16BE(d.textVariable & 0xffff, o); o += 2;

  // --- 4B valorVariable (BE o crudo)
  writeValor4BPorTipo(out, o, d.tipoDato, d.valorVariable);
  o += 4;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, o); o += 4;

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, o); o += 2;

  // --- 2B TEXT_Titulo_variable (BE)
  out.writeUInt16BE(d.textTituloVariable & 0xffff, o); o += 2;

  // --- 4B variable2 (BE o crudo)
  writeU32OrBuf4(out, o, d.variable2);
  o += 4;

  // --- 4B variable3 TEXT_titulo_personalizado (BE o crudo)
  writeU32OrBuf4(out, o, d.variable3TextTituloPersonalizado);
  o += 4;

  if (o !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${o}, esperado=${OUT_LEN})`);
  }
  return out;
}

/** Escribe 4 bytes según tipoDato; permite Buffer crudo de 4B para casos especiales (FECHA/TIEMPO empaquetados, etc.). */
function writeValor4BPorTipo(
  buf: Buffer,
  off: number,
  tipoDato: EnTipoDatoDFAccion,
  valor: number | Buffer
) {
  if (Buffer.isBuffer(valor)) {
    if (valor.length !== 4) throw new Error('valorVariable Buffer debe ser de 4 bytes');
    valor.copy(buf, off);
    return;
  }
  const n = Number(valor);

  switch (tipoDato) {
    // Numéricos 8/16/32 bits
    case EnTipoDatoDFAccion.cambioParametroUint8:
      if (n < 0 || n > 0xFF) throw new Error('uint8 fuera de rango');
      buf.writeUInt32BE(n, off);
      break;
    case EnTipoDatoDFAccion.cambioParametroInt8:
      if (n < -128 || n > 127) throw new Error('int8 fuera de rango');
      buf.writeInt32BE(n | 0, off);
      break;
    case EnTipoDatoDFAccion.cambioParametroUint16:
      if (n < 0 || n > 0xFFFF) throw new Error('uint16 fuera de rango');
      buf.writeUInt32BE(n, off);
      break;
    case EnTipoDatoDFAccion.cambioParametroInt16:
      if (n < -32768 || n > 32767) throw new Error('int16 fuera de rango');
      buf.writeInt32BE(n | 0, off);
      break;
    case EnTipoDatoDFAccion.cambioParametroUint32:
      if (n < 0 || n > 0xFFFF_FFFF) throw new Error('uint32 fuera de rango');
      buf.writeUInt32BE(n >>> 0, off);
      break;
    case EnTipoDatoDFAccion.cambioParametroInt32:
      // int32 firmado
      if (n < -0x8000_0000 || n > 0x7FFF_FFFF) throw new Error('int32 fuera de rango');
      buf.writeInt32BE(n | 0, off);
      break;

    // Flotantes: asumimos IEEE754 32-bit (confirmar si existen escalados x10/x100 en tu firmware)
    case EnTipoDatoDFAccion.cambioParametroFloat1:
    case EnTipoDatoDFAccion.cambioParametroFloat2:
    case EnTipoDatoDFAccion.cambioParametroFloat3:
      buf.writeFloatBE(n, off);
      break;

    // Tiempo/Fecha: si llega number, lo escribimos tal cual como u32;
    // si necesitas empaquetado dd/mm/yy o hh/mm/ss, pasa un Buffer de 4B (p.ej. [dd,mm,yy,0]).
    case EnTipoDatoDFAccion.cambioParametroTiempo:
    case EnTipoDatoDFAccion.cambioParametroTiempoHM:
    case EnTipoDatoDFAccion.cambioParametroTiempoMS:
    case EnTipoDatoDFAccion.cambioParametroFecha:
      buf.writeUInt32BE(n >>> 0, off);
      break;

    default:
      // Por si aparece algún tipo no contemplado aquí
      buf.writeUInt32BE(n >>> 0, off);
      break;
  }
}

/** Escribe 4B como UInt32BE o copia 4B crudos si se proporciona Buffer. */
function writeU32OrBuf4(buf: Buffer, off: number, v: number | Buffer) {
  if (Buffer.isBuffer(v)) {
    if (v.length !== 4) throw new Error('Buffer debe ser de 4 bytes');
    v.copy(buf, off);
  } else {
    buf.writeUInt32BE((v as number) >>> 0, off);
  }
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// ---------------------------------------- ParametroHistoricoOmegaEbusFinalesDto ----------------------------------------
/** 5.9.6.7 — TM_envia_historico: DATOS_EBUS_FINALES
 * Igual que DF_CAMBIO_PARAMETRO, pero ‘variable2’ lleva en su PRIMER byte un EnTipoDatoDf.
 */
export interface ParametroHistoricoOmegaEbusFinalesDto {
  /** 8B: MAC del equipo */
  mac: Buffer;

  /** 1B: tipo de dato (constante “DATOS_EBUS_FINALES”) */
  tipoDato: EnTipoDatoDFAccion;

  /** 3B: fecha */
  fecha: Fecha;

  /** 3B: hora */
  hora: Tiempo;

  /** 1B: identificador único dentro del segundo */
  identificadorUnicoDentroDelSegundo: number;

  /** 2B: identificador cliente */
  identificadorCliente: number;

  /** 2B: TEXT_variable (id de texto/catálogo) */
  textVariable: number;

  /** 4B: valor variable principal */
  valorVariable: number | Buffer;

  /** 4B: identificador crianza único */
  identificadorCrianzaUnico: number;

  /** 2B (int16): día de crianza */
  diaCrianza: number;

  /** 2B: TEXT_Titulo_variable (id de texto/catálogo) */
  textTituloVariable: number;

  /** 4B: variable2: primer byte = EnTipoDatoDf; resto = valor/metadata */
  variable2Raw: Buffer;
  /** Conveniencia: tipo embebido en el primer byte de variable2 */
  variable2TipoDato?: EnTipoDatoDFAccion;
  /** Conveniencia: los 3 bytes restantes interpretados según variable2TipoDato (si aplica) */
  variable2Valor?: number | Buffer;

  /** 4B: TEXT_titulo_personalizado (id/valor; se deja genérico) */
  variable3TextTituloPersonalizado: number | Buffer;
}

// =================== Serialización DATOS_EBUS_FINALES (Omega) ===================

/**
 * Serializa la “data” de TM_envia_historico (DATOS_EBUS_FINALES) a Buffer (BE).
 * Layout (40 B) — igual que DF_CAMBIO_PARAMETRO, con la particularidad de variable2:
 *  8B  mac
 *  1B  tipoDato                                (constante: EnTipoDatoDFAccion.datosEbusFinales)
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  identificadorCliente                    (BE)
 *  2B  textVariable                            (BE)
 *  4B  valorVariable                           (BE / crudo 4B)
 *  4B  identificadorCrianzaUnico               (BE)
 *  2B  diaCrianza (int16)                      (BE)
 *  2B  textTituloVariable                      (BE)
 *  4B  variable2Raw                            (primer byte = EnTipoDatoDFAccion; resto 3B valor/meta)
 *  4B  variable3TextTituloPersonalizado        (BE / crudo 4B)
 */
export function serializarParametroHistoricoEbusFinalesOmegaDf(
  d: ParametroHistoricoOmegaEbusFinalesDto
): Buffer {
  const OUT_LEN = 40;
  const out = Buffer.alloc(OUT_LEN);
  let o = 0;

  // --- 8B MAC
  if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
    throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  }
  d.mac.copy(out, o); o += 8;

  // --- 1B tipoDato (constante DATOS_EBUS_FINALES)
  out.writeUInt8((d.tipoDato as number) & 0xff, o++);

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, o++);
    out.writeUInt8(d.fecha.mes & 0xff, o++);
    out.writeUInt8(yy & 0xff, o++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, o++);
  out.writeUInt8(d.hora.min & 0xff, o++);
  out.writeUInt8(d.hora.seg & 0xff, o++);

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, o++);

  // --- 2B identificador cliente (BE)
  out.writeUInt16BE(d.identificadorCliente & 0xffff, o); o += 2;

  // --- 2B TEXT_variable (BE)
  out.writeUInt16BE(d.textVariable & 0xffff, o); o += 2;

  // --- 4B valorVariable (si es Buffer de 4B, copia; si es number, UInt32BE)
  if (Buffer.isBuffer(d.valorVariable)) {
    if (d.valorVariable.length !== 4) throw new Error('valorVariable Buffer debe ser de 4 bytes');
    d.valorVariable.copy(out, o);
  } else {
    out.writeUInt32BE((d.valorVariable as number) >>> 0, o);
  }
  o += 4;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, o); o += 4;

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, o); o += 2;

  // --- 2B TEXT_Titulo_variable (BE)
  out.writeUInt16BE(d.textTituloVariable & 0xffff, o); o += 2;

  // --- 4B variable2Raw: primer byte = tipo; resto 3B = valor/meta
  if (Buffer.isBuffer(d.variable2Raw)) {
    if (d.variable2Raw.length !== 4) throw new Error('variable2Raw debe ser Buffer de 4 bytes');
    d.variable2Raw.copy(out, o);
  } else {
    // Si no se proporciona un Buffer crudo (poco probable según el DTO), construimos a partir de los campos de conveniencia
    const v2 = Buffer.alloc(4, 0x00);
    v2[0] = (d.variable2TipoDato ?? 0) & 0xff;
    // Interpretamos variable2Valor numérico en 24-bit BE o copiamos los primeros 3 bytes si es Buffer
    if (typeof d.variable2Valor === 'number') {
      const n = (d.variable2Valor as number) >>> 0;
      v2[1] = (n >>> 16) & 0xff;
      v2[2] = (n >>> 8) & 0xff;
      v2[3] = n & 0xff;
    } else if (Buffer.isBuffer(d.variable2Valor)) {
      v2[1] = d.variable2Valor[0] ?? 0;
      v2[2] = d.variable2Valor[1] ?? 0;
      v2[3] = d.variable2Valor[2] ?? 0;
    }
    v2.copy(out, o);
  }
  o += 4;

  // --- 4B variable3TextTituloPersonalizado
  if (Buffer.isBuffer(d.variable3TextTituloPersonalizado)) {
    if (d.variable3TextTituloPersonalizado.length !== 4) {
      throw new Error('variable3TextTituloPersonalizado Buffer debe ser de 4 bytes');
    }
    d.variable3TextTituloPersonalizado.copy(out, o);
  } else {
    out.writeUInt32BE((d.variable3TextTituloPersonalizado as number) >>> 0, o);
  }
  o += 4;

  if (o !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${o}, esperado=${OUT_LEN})`);
  }
  return out;
}









// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// ---------------------------------------- ParametroHistoricoOmegaCambioParametroConcatenadoDto ----------------------------------------
/** 5.9.6.8 — TM_envia_historico: CAMBIO_PARAMETRO_CONCATENADO */
export interface ParametroHistoricoOmegaCambioParametroConcatenadoDto {
  /** 8B: MAC del equipo */
  mac: Buffer;

  /** 1B: identificador único dentro del segundo */
  identificadorUnicoDentroDelSegundo: number;

  /** 2B: versión del cambio de parámetro concatenado */
  versionCambioParametroConcatenado: number;

  /** 2B: identificador cliente */
  identificadorCliente: number;

  /** 1B: tipo de equipo donde se realizó el cambio */
  tipoEquipo: number;

  /** 1B: nodo EBUS (0 si no es cambio en EBUS) */
  ebusNodo: number;

  /** 3B: fecha */
  fecha: Fecha;

  /** 3B: hora */
  hora: Tiempo;

  /** 2B (int16): día de crianza */
  diaCrianza: number;

  /** 4B: identificador crianza único */
  identificadorCrianzaUnico: number;

  /** 1B: bytes efectivos del título dentro de la cadena concatenada */
  numeroByteTitulo: number;

  /** 1B: bytes efectivos de la opción dentro de la cadena concatenada */
  numeroByteOpcion: number;

  /** 1B: bytes efectivos del valor; 0 ⇒ el valor es numérico (no cadena) */
  numeroByteValor: number;

  /** 1B: tipo de dato del cambio de parámetro cuando el valor es numérico (EnTipoDatoDf) */
  tipoDatoCambioParametro: EnTipoDatoDFAccion;

  /** 4B: valor numérico cuando ‘numeroByteValor’=0; si no, ignorar */
  valorVariable: number | Buffer;

  /**
   * Cadena concatenada hasta 80 *uint16* (máx. 160 bytes).
   * Orden: título + opción + valor (si es texto). Usar junto con los tamaños.
   */
  cadenaConcatenada: Buffer;
}

// =================== Serialización CAMBIO_PARAMETRO_CONCATENADO (Omega) ===================

/**
 * Serializa la “data” de TM_envia_historico (CAMBIO_PARAMETRO_CONCATENADO) a Buffer (BE).
 * Layout (195 B):
 *  8B  mac
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  versionCambioParametroConcatenado      (BE)
 *  2B  identificadorCliente                   (BE)
 *  1B  tipoEquipo
 *  1B  ebusNodo
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  2B  diaCrianza (int16)                     (BE)
 *  4B  identificadorCrianzaUnico              (BE)
 *  1B  numeroByteTitulo
 *  1B  numeroByteOpcion
 *  1B  numeroByteValor                        (0 ⇒ valor numérico)
 *  1B  tipoDatoCambioParametro                (EnTipoDatoDFAccion; relevante si numeroByteValor=0)
 *  4B  valorVariable                          (BE / crudo 4B)      // siempre presente; se ignora si numeroByteValor>0
 * 160B cadenaConcatenada (UTF-16LE habitual; título+opción+valor texto)
 */
export function serializarParametroHistoricoCambioParametroConcatenadoOmegaDf(
  d: ParametroHistoricoOmegaCambioParametroConcatenadoDto
): Buffer {
  const OUT_LEN = 195;
  const CADENA_MAX = 160; // 80 * uint16
  const out = Buffer.alloc(OUT_LEN);
  let o = 0;

  // --- 8B MAC
  if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
    throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  }
  d.mac.copy(out, o); o += 8;

  // --- 1B identificador único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, o++);

  // --- 2B versión cambio parámetro concatenado (BE)
  out.writeUInt16BE(d.versionCambioParametroConcatenado & 0xffff, o); o += 2;

  // --- 2B identificador cliente (BE)
  out.writeUInt16BE(d.identificadorCliente & 0xffff, o); o += 2;

  // --- 1B tipoEquipo
  out.writeUInt8(d.tipoEquipo & 0xff, o++);

  // --- 1B ebusNodo
  out.writeUInt8(d.ebusNodo & 0xff, o++);

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, o++);
    out.writeUInt8(d.fecha.mes & 0xff, o++);
    out.writeUInt8(yy & 0xff, o++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, o++);
  out.writeUInt8(d.hora.min & 0xff, o++);
  out.writeUInt8(d.hora.seg & 0xff, o++);

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, o); o += 2;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, o); o += 4;

  // --- Bytes efectivos (título/opción/valor)
  // Clampeamos para que no excedan el tamaño real de cadenaConcatenada ni el máximo 160.
  if (!Buffer.isBuffer(d.cadenaConcatenada)) {
    throw new Error('cadenaConcatenada inválida: se espera Buffer');
  }
  const cadLen = Math.min(d.cadenaConcatenada.length, CADENA_MAX);

  let nTitulo = (d.numeroByteTitulo | 0);
  let nOpcion = (d.numeroByteOpcion | 0);
  let nValor  = (d.numeroByteValor  | 0);

  if (nTitulo < 0) nTitulo = 0;
  if (nOpcion < 0) nOpcion = 0;
  if (nValor  < 0) nValor  = 0;

  if (nTitulo > cadLen) { nTitulo = cadLen; nOpcion = 0; nValor = 0; }
  if (nTitulo + nOpcion > cadLen) { nOpcion = cadLen - nTitulo; nValor = 0; }
  if (nTitulo + nOpcion + nValor > cadLen) { nValor = cadLen - (nTitulo + nOpcion); }

  out.writeUInt8(nTitulo & 0xff, o++);
  out.writeUInt8(nOpcion & 0xff, o++);
  out.writeUInt8(nValor  & 0xff, o++);

  // --- 1B tipoDatoCambioParametro
  out.writeUInt8((d.tipoDatoCambioParametro as number) & 0xff, o++);

  // --- 4B valorVariable (si Buffer 4B, copia; si number, UInt32BE)
  if (Buffer.isBuffer(d.valorVariable)) {
    if (d.valorVariable.length !== 4) throw new Error('valorVariable Buffer debe ser de 4 bytes');
    d.valorVariable.copy(out, o);
  } else {
    out.writeUInt32BE((d.valorVariable as number) >>> 0, o);
  }
  o += 4;

  // --- 160B cadenaConcatenada (relleno con ceros si sobra)
  d.cadenaConcatenada.copy(out, o, 0, cadLen);
  o += CADENA_MAX;

  if (o !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${o}, esperado=${OUT_LEN})`);
  }
  return out;
}
























// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// ---------------------------------------- ParametroHistoricoOmegaInicioCrianzaDto ----------------------------------------
/** 5.9.6.9 — TM_envia_historico: DF_INICIO_CRIANZA */
export interface ParametroHistoricoOmegaInicioCrianzaDto {
  /** 8B: MAC del equipo */
  mac: Buffer;

  /** 1B: tipo de dato (esperado: EnTipoDatoDf.inicioCrianza) */
  tipoDato: EnTipoDatoDFAccion;

  /** 3B: fecha (yyyymmdd compactado en 3 bytes según tu helper) */
  fecha: Fecha;

  /** 3B: hora (hh:mm:ss compactado en 3 bytes) */
  hora: Tiempo;

  /** 1B: identificador único dentro del segundo */
  identificadorUnicoDentroDelSegundo: number;

  /** 2B: identificador cliente */
  identificadorCliente: number;

  /** 2B: nombre de la variable (catálogo interno) */
  nombreVariable: number;

  /** 4B: valor de la variable (numérico) */
  valorVariable: number | Buffer;

  /** 4B: identificador único de crianza (0 ⇒ no crianza) */
  identificadorCrianzaUnico: number;

  /** 2B (int16): día de crianza */
  diaCrianza: number;

  /** 2B: variable1_2 (reservado/uso específico) */
  variable1_2: number;

  /** 4B: variable2 (reservado/uso específico) */
  variable2: number | Buffer;

  /** 4B: variable3 (reservado/uso específico) */
  variable3: number | Buffer;
}

// =================== Serialización DF_INICIO_CRIANZA (Omega) ===================

/**
 * Serializa la “data” de TM_envia_historico (DF_INICIO_CRIANZA) a Buffer (BE).
 * Layout (40 B):
 *  8B  mac
 *  1B  tipoDato                                (EnTipoDatoDFAccion.inicioCrianza)
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  identificadorCliente                    (BE)
 *  2B  nombreVariable                          (BE)
 *  4B  valorVariable                           (UInt32BE o 4B crudos)
 *  4B  identificadorCrianzaUnico               (BE)
 *  2B  diaCrianza (int16)                      (BE)
 *  2B  variable1_2                             (BE)
 *  4B  variable2                               (UInt32BE o 4B crudos)
 *  4B  variable3                               (UInt32BE o 4B crudos)
 */
export function serializarParametroHistoricoInicioCrianzaOmegaDf(
  d: ParametroHistoricoOmegaInicioCrianzaDto
): Buffer {
  const OUT_LEN = 40;
  const out = Buffer.alloc(OUT_LEN);
  let o = 0;

  // --- 8B MAC
  if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
    throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  }
  d.mac.copy(out, o); o += 8;

  // --- 1B tipoDato (esperado: inicioCrianza)
  out.writeUInt8((d.tipoDato as number) & 0xff, o++);

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, o++);
    out.writeUInt8(d.fecha.mes & 0xff, o++);
    out.writeUInt8(yy & 0xff, o++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, o++);
  out.writeUInt8(d.hora.min & 0xff, o++);
  out.writeUInt8(d.hora.seg & 0xff, o++);

  // --- 1B id único segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, o++);

  // --- 2B identificador cliente (BE)
  out.writeUInt16BE(d.identificadorCliente & 0xffff, o); o += 2;

  // --- 2B nombreVariable (BE)
  out.writeUInt16BE(d.nombreVariable & 0xffff, o); o += 2;

  // --- 4B valorVariable
  if (Buffer.isBuffer(d.valorVariable)) {
    if (d.valorVariable.length !== 4) throw new Error('valorVariable Buffer debe ser de 4 bytes');
    d.valorVariable.copy(out, o);
  } else {
    out.writeUInt32BE((d.valorVariable as number) >>> 0, o);
  }
  o += 4;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, o); o += 4;

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, o); o += 2;

  // --- 2B variable1_2 (BE)
  out.writeUInt16BE(d.variable1_2 & 0xffff, o); o += 2;

  // --- 4B variable2
  if (Buffer.isBuffer(d.variable2)) {
    if (d.variable2.length !== 4) throw new Error('variable2 Buffer debe ser de 4 bytes');
    d.variable2.copy(out, o);
  } else {
    out.writeUInt32BE((d.variable2 as number) >>> 0, o);
  }
  o += 4;

  // --- 4B variable3
  if (Buffer.isBuffer(d.variable3)) {
    if (d.variable3.length !== 4) throw new Error('variable3 Buffer debe ser de 4 bytes');
    d.variable3.copy(out, o);
  } else {
    out.writeUInt32BE((d.variable3 as number) >>> 0, o);
  }
  o += 4;

  if (o !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${o}, esperado=${OUT_LEN})`);
  }
  return out;
}












// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// ---------------------------------------- ParametroHistoricoOmegaFinCrianzaDto ----------------------------------------
/** 5.9.6.10 — TM_envia_historico: DF_FIN_CRIANZA
 *  Especifica campos semánticos: tipo_animal y nº animales por sexo.
 */
export interface ParametroHistoricoOmegaFinCrianzaDto {
  /** 8B: MAC del equipo */
  mac: number|Buffer;

  /** 1B: tipo de dato (esperado: EnTipoDatoDf.finCrianza) */
  tipoDato: EnTipoDatoDFAccion;

  /** 3B: fecha */
  fecha: Fecha;

  /** 3B: hora */
  hora: Tiempo;

  /** 1B: identificador único dentro del segundo */
  identificadorUnicoDentroDelSegundo: number;

  /** 2B: identificador cliente */
  identificadorCliente: number;

  /** 2B: “nombre variable” ⇒ aquí indica ‘tipo_animal’ (catálogo) */
  nombreVariableTipoAnimal: number; // puede mapearse a EnCrianzaTipoAnimal si procede

  /** 4B: “valor variable” ⇒ n_animales_machos_mixtos */
  valorVariableNAnimalesMachosMixtos: number;

  /** 4B: identificador único de crianza (0 ⇒ no crianza) */
  identificadorCrianzaUnico: number;

  /** 2B (int16): día de crianza */
  diaCrianza: number;

  /** 2B: variable1_2 (reservado/uso específico) */
  variable1_2: number;

  /** 4B: variable2 ⇒ n_animales_hembras */
  variable2NAnimalesHembras: number;

  /** 4B: variable3 (reservado/uso específico) */
  variable3: number | Buffer;
}

// =================== Serialización DF_FIN_CRIANZA (Omega) ===================

/**
 * Serializa la “data” de TM_envia_historico (DF_FIN_CRIANZA) a Buffer (BE).
 * Layout (40 B):
 *  8B  mac
 *  1B  tipoDato                                   (EnTipoDatoDFAccion.finCrianza)
 *  3B  fecha (dd, mm, yy)
 *  3B  hora  (hh, mm, ss)
 *  1B  identificadorUnicoDentroDelSegundo
 *  2B  identificadorCliente                       (BE)
 *  2B  nombreVariableTipoAnimal                   (BE)  // EnCrianzaTipoAnimal.*
 *  4B  valorVariableNAnimalesMachosMixtos         (UInt32BE)
 *  4B  identificadorCrianzaUnico                  (BE)
 *  2B  diaCrianza (int16)                         (BE)
 *  2B  variable1_2                                (BE)
 *  4B  variable2NAnimalesHembras                  (UInt32BE)
 *  4B  variable3                                  (UInt32BE o 4B crudos)
 */
export function serializarParametroHistoricoFinCrianzaOmegaDf(
  d: ParametroHistoricoOmegaFinCrianzaDto
): Buffer {
  const OUT_LEN = 40;
  const out = Buffer.alloc(OUT_LEN);
  let o = 0;

  // --- 8B MAC
  if (!Buffer.isBuffer(d.mac) || d.mac.length !== 8) {
    throw new Error('MAC inválida: se espera Buffer de 8 bytes');
  }
  d.mac.copy(out, o); o += 8;

  // --- 1B tipoDato (esperado finCrianza)
  out.writeUInt8((d.tipoDato as number) & 0xff, o++);

  // --- 3B fecha (dd, mm, yy)
  {
    const yy = (d.fecha.anyo ?? 0) % 100;
    out.writeUInt8(d.fecha.dia & 0xff, o++);
    out.writeUInt8(d.fecha.mes & 0xff, o++);
    out.writeUInt8(yy & 0xff, o++);
  }

  // --- 3B hora (hh, mm, ss)
  out.writeUInt8(d.hora.hora & 0xff, o++);
  out.writeUInt8(d.hora.min & 0xff, o++);
  out.writeUInt8(d.hora.seg & 0xff, o++);

  // --- 1B id único dentro del segundo
  out.writeUInt8(d.identificadorUnicoDentroDelSegundo & 0xff, o++);

  // --- 2B identificador cliente (BE)
  out.writeUInt16BE(d.identificadorCliente & 0xffff, o); o += 2;

  // --- 2B nombreVariableTipoAnimal (BE)
  out.writeUInt16BE(d.nombreVariableTipoAnimal & 0xffff, o); o += 2;

  // --- 4B n_animales_machos_mixtos (UInt32BE)
  out.writeUInt32BE(d.valorVariableNAnimalesMachosMixtos >>> 0, o); o += 4;

  // --- 4B identificadorCrianzaUnico (BE)
  out.writeUInt32BE(d.identificadorCrianzaUnico >>> 0, o); o += 4;

  // --- 2B diaCrianza (int16, BE)
  out.writeInt16BE(d.diaCrianza | 0, o); o += 2;

  // --- 2B variable1_2 (BE)
  out.writeUInt16BE(d.variable1_2 & 0xffff, o); o += 2;

  // --- 4B n_animales_hembras (UInt32BE)
  out.writeUInt32BE(d.variable2NAnimalesHembras >>> 0, o); o += 4;

  // --- 4B variable3 (UInt32BE o crudo)
  if (Buffer.isBuffer(d.variable3)) {
    if (d.variable3.length !== 4) throw new Error('variable3 Buffer debe ser de 4 bytes');
    d.variable3.copy(out, o);
  } else {
    out.writeUInt32BE((d.variable3 as number) >>> 0, o);
  }
  o += 4;

  if (o !== OUT_LEN) {
    throw new Error(`Longitud inesperada al serializar (offset=${o}, esperado=${OUT_LEN})`);
  }
  return out;
}










































