import { EnEventosEstadisFamilia, EnEventosEstadisPropiedades, EnEventosEstadisSubfamilia, EnEventosEstadisTipo, EnTipoDatoDFAccion } from "src/utils/BE_Old/globals/enumOld";
import { packValorDf4BE } from "src/utils/helpers";
import { EnAlarmaEstado } from "src/utils/LE/globals/enums";
import { Fecha, Tiempo } from "src/utils/tiposGlobales";

// ---------------------------------------- ParametroHistoricoOmegaDfDto ----------------------------------------
/** Estadístico de valor o cambio parámetro. Payload de TM_envia_historico (caso: estadístico DF). */
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
































// ---------------------------------------- ParametroHistoricoOmegaAlarmaWarningDto ----------------------------------------
/** 5.9.6.2 — TM_envia_historico: ALARMAS / WARNING */
export interface ParametroHistoricoOmegaAlarmaWarningDto {
  /** 8 bytes: MAC del equipo (crudo). */
  mac: Buffer;
  /** 1 byte: tipo de dato DF (debería ser ‘alarmas’ o ‘warning’). */
  tipoDato: EnTipoDatoDFAccion;
  /** 3 bytes: fecha. */
  fecha: Fecha;
  /** 3 bytes: hora. */
  hora: Tiempo;
  /** 1 byte: identificador único dentro del segundo actual. */
  identificadorUnicoDentroDelSegundo: number;
  /** 2 bytes: identificador de cliente. */
  identificadorCliente: number;
  /** 2 bytes: nombre de la variable (alarma). */
  nombreVariable: number;
  /**
   * 4 bytes: acción de la alarma (ON/OFF).
   * Normalmente mapeable a EnAlarmaEstado (off=0, on=1).
   * Si prefieres el crudo, usa Buffer.
   */
  valorVariable: EnAlarmaEstado | number | Buffer;
  /** 4 bytes: identificador único de crianza (0 si no aplica). */
  identificadorCrianzaUnico: number;
  /** 2 bytes (int16): día de crianza. */
  variable1DiaCrianza: number;
  /** 2 bytes: campo auxiliar (variable1_2). */
  variable1_2: number;
  /** 4 bytes: campo auxiliar (variable2). */
  variable2: number;
  /** 4 bytes: campo auxiliar (variable3). */
  variable3: number;
}

// ---------------------------------------- ParametroHistoricoOmegaEventoDto ----------------------------------------
/** 5.9.6.3 — TM_envia_historico: EVENTO */
export interface ParametroHistoricoOmegaEventoDto {
  /** 8 bytes: MAC del equipo (crudo). */
  mac: Buffer;
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

// ---------------------------------------- ParametroHistoricoOmegaEventoConcatenadoDto ----------------------------------------
/** 5.9.6.4 — TM_envia_historico: EVENTO_CONCATENADO */
export interface ParametroHistoricoOmegaEventoConcatenadoDto {
  /** 8B: MAC del equipo. */
  mac: Buffer;
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
  /**
   * Hasta 40 *uint16* (máx. 80 bytes) con el texto concatenado (UTF-16LE habitual).
   * Se deben usar solo los primeros `numeroBytesCadena` bytes.
   */
  cadenaConcatenada: Buffer;
}


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

// ---------------------------------------- ParametroHistoricoOmegaFinCrianzaDto ----------------------------------------
/** 5.9.6.10 — TM_envia_historico: DF_FIN_CRIANZA
 *  Especifica campos semánticos: tipo_animal y nº animales por sexo.
 */
export interface ParametroHistoricoOmegaFinCrianzaDto {
  /** 8B: MAC del equipo */
  mac: Buffer;

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
