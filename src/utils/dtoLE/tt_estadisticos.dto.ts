import { tiempoToSeg } from "src/utils/fnTiempo";
import { EnTipoDato, EnEstadisTipoRegistro, EnEstadisticosControladores, EnEstadisPeriodicidad, EnEstadoDatoEstadistico, EnGtUnidades, EnContadoresTipo, EnEeEventosApli, EnCrianzaTipoAnimal, EnCrianzaAltaBajaAccion, EnAlarmaEstado, EnAlarmasAccion } from "src/utils/LE/globals/enums";
import { Fecha, Tiempo } from "src/utils/tiposGlobales";
import { packByTipo, u32LE, u16LE, u8Old } from "src/utils/helpers";

// -------------------------------------------------- TM_ESTADISTICOS_envia_estadistico --------------------------------------------------

//* Frame = FrameDto ----> Data/Payload = EnviaEstadisticoDto ----> dato[] = EstadisticoDato ----> dato = EstadisticoValorDto

// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXX EnEstadisTipoRegistro.estadisticos XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

// -------------------------------------------------- EnviaEstadisticoDto --------------------------------------------------
export class EnviaEstadisticoDto {
  /** uint32 MAC (ID de equipo) */
  mac: number;
  /** uint8 tipo_dato (cabecera) */
  tipoDato: EnTipoDato;
  // El doc lo llama TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO. No aparece su enum específico;
  // aquí usamos EnTipoDato para mantener consistencia. Si el firmware espera otro catálogo, ajustarlo.

  /** uint8 identificador_unico_dentro_del_segundo (token de ACK mínimo) */
  identificadorUnicoDentroDelSegundo: number;

  /** uint8 VERSION (de la trama/registro) */
  version: number;

  /** uint8 tipo_registro (ENUM_ESTADIS_TIPO_REGISTRO) */
  tipoRegistro: EnEstadisTipoRegistro;

  /** uint8 reservado */
  res1: number; // Debe serializarse como 0 salvo indicación contraria.
  /** uint8 reservado */
  res2: number;
  /** uint8 reservado */
  res3: number;
  /** uint8 reservado */
  res4: number;

  /** Fecha fecha */
  fecha: Fecha;

  /** Tiempo hora */
  hora: Tiempo;

  /** uint8 reservado */
  res5: number;

  /** uint8 numero_datos (repeticiones del bloque tipo/tamaño/dato) */
  numeroDatos: number;

  /** Array de bloques [tipo_dato, size_dato_byte, dato[]] */
  datos: EstadisticoDato[];
}

// -------------------------------------------------- EstadisticoDato --------------------------------------------------
export interface EstadisticoDato {
  /** uint8 tipo_dato (ENUM_TIPO_DATO) */
  tipoDato: EnTipoDato;
  /** uint8 size_dato_byte (tamaño en bytes del dato siguiente) */
  sizeDatoByte: number;
  /** bytes crudos del dato; se tipará al decodificar según 'tipoDato' */
  dato: Buffer;
}

// -------------------------------------------------- EstadisticoValorDto --------------------------------------------------
// Doc: Nombre(TD_UINT16), Periodicidad(TD_UINT8), Valor_medio(TD_), Valor_max(TD_), Valor_min(TD_),
//      Hora_valor_max(TD_TIEMPO), Hora_valor_min(TD_TIEMPO), estado(TD_UINT8 {0/1}), unidad(TD_UINT8 EN_GT_UNIDADES).
export interface EstadisticoValorDto {
  /** TD_UINT16: identificador del estadístico (catálogo propio) */
  nombreEstadistico: EnEstadisticosControladores;
  /** TD_UINT8: periodicidad (flags) */
  periodicidad: EnEstadisPeriodicidad;
  /** TD_: valor medio (tipo configurable; para temperatura suele ser FLOAT) */
  valorMedio: number;
  /** TD_: valor máximo */
  valorMax: number;
  /** TD_: valor mínimo */
  valorMin: number;
  /** TD_TIEMPO: hora a la que se alcanzó el máximo */
  horaValorMax: Tiempo;
  /** TD_TIEMPO: hora a la que se alcanzó el mínimo */
  horaValorMin: Tiempo;
  /** TD_UINT8: 0 correcto, 1 no correcto */
  estado: EnEstadoDatoEstadistico;
  /** TD_UINT8: unidad del dato (EN_GT_UNIDADES) */
  unidad: EnGtUnidades;
  /**
   * Tipo base de los campos valorMedio/valorMax/valorMin.
   * Por defecto FLOAT (temperaturas); si tu estadístico usa enteros, cámbialo (p.ej. UINT16/INT16).
   */
  valorTipo?: EnTipoDato; // default: EnTipoDato.float
}

// -------------------------------------------------- EstadisticoContadorDto --------------------------------------------------
/**
 * Estructura “estadístico contador” (doc 1.3):
 *  - nombreEstadistico: TD_UINT16
 *  - periodicidad:      TD_UINT8  (EN_ESTADIS_PERIODICIDAD)
 *  - tipoContador:      TD_UINT8  (EN_CONTADORES_TIPO)
 *  - unidad:            TD_UINT8  (EN_GT_UNIDADES)
 *  - multiplicador:     TD_FLOAT  (p.ej. 0.001, 0.01)
 *  - valor:             TD_       (tipo configurable)
 *  - estado:            TD_UINT8  (0 correcto, 1 no correcto)
 */
export interface EstadisticoContadorDto {
  /** TD_UINT16: identificador del estadístico (catálogo propio) */
  nombreEstadistico: EnEstadisticosControladores;
  /** TD_UINT8: periodicidad (flags) */
  periodicidad: EnEstadisPeriodicidad;
  /** TD_UINT8: tipo de contador (electricidad, agua, …) */
  tipoContador: EnContadoresTipo;
  /** TD_UINT8: unidad (litros, galones, …) */
  unidad: EnGtUnidades;
  /** TD_FLOAT: factor de escala aplicado al valor bruto */
  multiplicador: number;
  /**
   * TD_: valor del contador tras aplicar (o no) el multiplicador.
   * Por defecto usamos UINT32; cambia ‘valorTipo’ si tu firmware
   * espera otro tipo (INT32, FLOAT, …).
   */
  valor: number;
  /** TD_UINT8: 0 correcto, 1 no correcto */
  estado: EnEstadoDatoEstadistico;
  /**
   * Tipo base del campo ‘valor’.
   * Por defecto UINT32 (lo más común en contadores).
   */
  valorTipo?: EnTipoDato; // default: EnTipoDato.uint32
}

// -------------------------------------------------- EstadisticoActividadDto --------------------------------------------------
/**
 * Estructura “estadístico actividad” (doc 1.4):
 *  - nombreEstadistico: TD_UINT16
 *  - periodicidad:      TD_UINT8  (EN_ESTADIS_PERIODICIDAD)
 *  - valorSegundos:     TD_UINT32 (segundos encendido)
 *  - estado:            TD_UINT8  (0 correcto, 1 no correcto)
 */
export interface EstadisticoActividadDto {
  /** TD_UINT16: identificador del estadístico (catálogo propio) */
  nombreEstadistico: EnEstadisticosControladores;
  /** TD_UINT8: periodicidad (flags) */
  periodicidad: EnEstadisPeriodicidad;
  /** TD_UINT32: segundos que el componente ha permanecido conectado */
  valorSegundosConectado: number;
  /** TD_UINT8: 0 correcto, 1 no correcto */
  estado: EnEstadoDatoEstadistico;
}

// -------------------------------------------------- RtEstadisticoDto --------------------------------------------------
export class RtEstadisticoDto {
  /** uint8 identificador_unico_dentro_del_segundo (eco para ACK) */
  identificadorUnicoDentroDelSegundo: number;
}

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/** Convierte un EstadisticoValorDto a la lista de items (tipo/size/dato) que espera la trama. */
export function serializarDatosEstadisticoValor(
  d: EstadisticoValorDto,
): EstadisticoDato[] {
  const base = d.valorTipo ?? EnTipoDato.float;

  const medio = packByTipo(d.valorMedio, base);
  const max = packByTipo(d.valorMax, base);
  const min = packByTipo(d.valorMin, base);

  const horamax = u32LE(tiempoToSeg(d.horaValorMax));
  const horamin = u32LE(tiempoToSeg(d.horaValorMin));

  const out: EstadisticoDato[] = [
    // [0] nombre (TD_UINT16)
    {
      tipoDato: EnTipoDato.uint16,
      sizeDatoByte: 2,
      dato: u16LE(d.nombreEstadistico),
    },

    // [1] periodicidad (TD_UINT8)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: u8Old(d.periodicidad) },

    // [2..4] valores (TD_ según d.valorTipo)
    { tipoDato: base, sizeDatoByte: medio.length, dato: medio }, // valorMedio
    { tipoDato: base, sizeDatoByte: max.length, dato: max }, // valorMax
    { tipoDato: base, sizeDatoByte: min.length, dato: min }, // valorMin

    // [5..6] horas (TD_TIEMPO = uint32 segundos)
    { tipoDato: EnTipoDato.tiempo, sizeDatoByte: 4, dato: horamax }, // horaValorMax
    { tipoDato: EnTipoDato.tiempo, sizeDatoByte: 4, dato: horamin }, // horaValorMin

    // [7] estado (TD_UINT8)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: u8Old(d.estado) },

    // [8] unidad (TD_UINT8)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: u8Old(d.unidad) },
  ];

  return out;
}

// -------------------------------- serializarDatosEstadisticoContador --------------------------------
export function serializarDatosEstadisticoContador(
  dto: EstadisticoContadorDto,
): EstadisticoDato[] {
  const valorTipo = dto.valorTipo ?? EnTipoDato.uint32;

  const nombre = Buffer.alloc(2);
  nombre.writeUInt16LE(dto.nombreEstadistico >>> 0, 0);

  const periodicidad = Buffer.from([dto.periodicidad & 0xff]);
  const tipoContador = Buffer.from([dto.tipoContador & 0xff]);
  const unidad = Buffer.from([dto.unidad & 0xff]);

  const multiplicador = Buffer.alloc(4);
  multiplicador.writeFloatLE(dto.multiplicador, 0);

  const valor = packByTipo(dto.valor, valorTipo);
  const estado = Buffer.from([dto.estado & 0xff]);

  const out: EstadisticoDato[] = [
    { tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: nombre }, // nombreEstadistico
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: periodicidad }, // periodicidad
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: tipoContador }, // tipoContador
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: unidad }, // unidad
    { tipoDato: EnTipoDato.float, sizeDatoByte: 4, dato: multiplicador }, // multiplicador
    { tipoDato: valorTipo, sizeDatoByte: valor.length, dato: valor }, // valor (tipo configurable)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: estado }, // estado
  ];
  return out;
}

// -------------------------------- serializarDatosEstadisticoActividad --------------------------------
export function serializarDatosEstadisticoActividad(
  dto: EstadisticoActividadDto,
): EstadisticoDato[] {
  const nombre = Buffer.alloc(2);
  nombre.writeUInt16LE(dto.nombreEstadistico >>> 0, 0);

  const periodicidad = Buffer.from([dto.periodicidad & 0xff]);

  const valorSeg = Buffer.alloc(4);
  valorSeg.writeUInt32LE(dto.valorSegundosConectado >>> 0, 0);

  const estado = Buffer.from([dto.estado & 0xff]);

  const out: EstadisticoDato[] = [
    { tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: nombre }, // nombreEstadistico
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: periodicidad }, // periodicidad
    { tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: valorSeg }, // valorSegundosConectado
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: estado }, // estado
  ];
  return out;
}

// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXX EnEstadisTipoRegistro.eventos XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/** 1.2. INICIO_CRIANZA */
export interface EeInicioCrianzaDto {
  /** TD_UINT16: código de evento (fijo = inicioCrianza) */
  evento: EnEeEventosApli.inicioCrianza;
  /** TD_INT16 */
  diaCrianza: number;
  /** TD_UINT32 */
  idUnicoCrianza: number;
}

/** 1.3. ENTRADA_ANIMALES */
export interface EeEntradaAnimalesDto {
  /** TD_UINT16: código de evento (fijo = entradaAnimales) */
  evento: EnEeEventosApli.entradaAnimales;
  /** TD_UINT32 */
  idUnicoCrianza: number;
  /** TD_UINT8 (ENUM_CRIANZA_TIPO_ANIMAL) */
  inicioCrianzaTipoAnimal: EnCrianzaTipoAnimal;
  /** TD_INT16 */
  diaEntradaAnimales: number;
  /** TD_UINT32 */
  nAnimalesInicioCrianzaMachosMixtos: number;
  /** TD_UINT32 */
  nAnimalesInicioCrianzaHembras: number;
}

/** 1.4. FIN_CRIANZA */
export interface EeFinCrianzaDto {
  /** TD_UINT16: código de evento (fijo = finCrianza) */
  evento: EnEeEventosApli.finCrianza;
  /** TD_UINT32 */
  idUnicoCrianza: number;
  /** TD_INT16 */
  diaCrianza: number;
  /** TD_UINT32 */
  nAnimalesActualesMachosMixtos: number;
  /** TD_UINT32 */
  nAnimalesActualesHembras: number;
}

/** 1.5. ALTA_BAJA_RETIRADA */
export interface EeAltaBajaRetiradaDto {
  /** TD_UINT16: código de evento (fijo = altaBajaRetirada) */
  evento: EnEeEventosApli.altaBajaRetirada;
  /** TD_UINT32 */
  idUnicoCrianza: number;
  /** TD_UINT8 (ENUM_CRIANZA_ALTA_BAJA_ACCION) */
  accion: EnCrianzaAltaBajaAccion;
  /** TD_INT16 */
  diaCrianza: number;
  /** TD_FECHA */
  fechaIntroducirAccion: Fecha;
  /** TD_UINT32 */
  nAnimalesAccionMachosMixtos: number;
  /** TD_UINT32 */
  nAnimalesAccionHembras: number;
}

/** Unión útil si necesitas un tipo común */
export type EstadisticoEventoDto =
  | EeInicioCrianzaDto
  | EeEntradaAnimalesDto
  | EeFinCrianzaDto
  | EeAltaBajaRetiradaDto;

/** (Opcional) Mapa evento -> DTO para tipar routers/clasificadores */
// export type EeEventosPayloadMap = {
//   [EnEeEventosApli.inicioCrianza]: EeInicioCrianzaDto;
//   [EnEeEventosApli.entradaAnimales]: EeEntradaAnimalesDto;
//   [EnEeEventosApli.finCrianza]: EeFinCrianzaDto;
//   [EnEeEventosApli.altaBajaRetirada]: EeAltaBajaRetiradaDto;
// };

export function serializarDatosEstadisticoEvento(
  dto: EstadisticoEventoDto,
): EstadisticoDato[] {
  const out: EstadisticoDato[] = [];

  // [0] ENUM_EE_EVENTOS_* (TD_UINT16)
  const ev = Buffer.alloc(2);
  ev.writeUInt16LE(dto.evento >>> 0, 0);
  out.push({ tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: ev });

  switch (dto.evento) {
    case EnEeEventosApli.inicioCrianza: {
      // dia_crianza (TD_INT16)
      const dia = Buffer.alloc(2);
      dia.writeInt16LE(dto.diaCrianza ?? 0, 0);
      out.push({ tipoDato: EnTipoDato.int16, sizeDatoByte: 2, dato: dia });

      // ID_unico_crianza (TD_UINT32)
      const id = Buffer.alloc(4);
      id.writeUInt32LE(dto.idUnicoCrianza >>> 0, 0);
      out.push({ tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: id });
      break;
    }

    case EnEeEventosApli.entradaAnimales: {
      // ID_unico_crianza (TD_UINT32)
      const id = Buffer.alloc(4);
      id.writeUInt32LE(dto.idUnicoCrianza >>> 0, 0);
      out.push({ tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: id });

      // inicio_crianza_tipo_animal (TD_UINT8)
      const tipoAnimal = Buffer.from([
        (dto.inicioCrianzaTipoAnimal ?? 0) & 0xff,
      ]);
      out.push({
        tipoDato: EnTipoDato.uint8,
        sizeDatoByte: 1,
        dato: tipoAnimal,
      });

      // dia_entrada_animales (TD_INT16)
      const diaEntrada = Buffer.alloc(2);
      diaEntrada.writeInt16LE(dto.diaEntradaAnimales ?? 0, 0);
      out.push({
        tipoDato: EnTipoDato.int16,
        sizeDatoByte: 2,
        dato: diaEntrada,
      });

      // N_animales_inicio_crianza_machos_mixtos (TD_UINT32)
      const nMachosMixtos = Buffer.alloc(4);
      nMachosMixtos.writeUInt32LE(
        (dto.nAnimalesInicioCrianzaMachosMixtos ?? 0) >>> 0,
        0,
      );
      out.push({
        tipoDato: EnTipoDato.uint32,
        sizeDatoByte: 4,
        dato: nMachosMixtos,
      });

      // N_animales_inicio_crianza_hembras (TD_UINT32)
      const nHembras = Buffer.alloc(4);
      nHembras.writeUInt32LE((dto.nAnimalesInicioCrianzaHembras ?? 0) >>> 0, 0);
      out.push({
        tipoDato: EnTipoDato.uint32,
        sizeDatoByte: 4,
        dato: nHembras,
      });
      break;
    }

    case EnEeEventosApli.finCrianza: {
      // ID_unico_crianza (TD_UINT32)
      const id = Buffer.alloc(4);
      id.writeUInt32LE(dto.idUnicoCrianza >>> 0, 0);
      out.push({ tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: id });

      // dia_crianza (TD_INT16)
      const dia = Buffer.alloc(2);
      dia.writeInt16LE(dto.diaCrianza ?? 0, 0);
      out.push({ tipoDato: EnTipoDato.int16, sizeDatoByte: 2, dato: dia });

      // N_animales_actuales_machos_mixtos (TD_UINT32)
      const nMachosMixtos = Buffer.alloc(4);
      nMachosMixtos.writeUInt32LE(
        (dto.nAnimalesActualesMachosMixtos ?? 0) >>> 0,
        0,
      );
      out.push({
        tipoDato: EnTipoDato.uint32,
        sizeDatoByte: 4,
        dato: nMachosMixtos,
      });

      // N_animales_actuales_hembras (TD_UINT32)
      const nHembras = Buffer.alloc(4);
      nHembras.writeUInt32LE((dto.nAnimalesActualesHembras ?? 0) >>> 0, 0);
      out.push({
        tipoDato: EnTipoDato.uint32,
        sizeDatoByte: 4,
        dato: nHembras,
      });
      break;
    }

    case EnEeEventosApli.altaBajaRetirada: {
      // ID_unico_crianza (TD_UINT32)
      const id = Buffer.alloc(4);
      id.writeUInt32LE(dto.idUnicoCrianza >>> 0, 0);
      out.push({ tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: id });

      // accion (TD_UINT8)
      const accion = Buffer.from([(dto.accion ?? 0) & 0xff]);
      out.push({ tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: accion });

      // dia_crianza (TD_INT16)
      const dia = Buffer.alloc(2);
      dia.writeInt16LE(dto.diaCrianza ?? 0, 0);
      out.push({ tipoDato: EnTipoDato.int16, sizeDatoByte: 2, dato: dia });

      // fecha_introducir_accion (TD_FECHA) -> yyyymmdd (uint32 LE)
      const yyyy = dto.fechaIntroducirAccion?.anyo ?? 0;
      const mm = dto.fechaIntroducirAccion?.mes ?? 0;
      const dd = dto.fechaIntroducirAccion?.dia ?? 0;
      const fechaNum = (yyyy * 10000 + mm * 100 + dd) >>> 0;
      const fechaBuf = Buffer.alloc(4);
      fechaBuf.writeUInt32LE(fechaNum, 0);
      out.push({ tipoDato: EnTipoDato.fecha, sizeDatoByte: 4, dato: fechaBuf });

      // N_animales_accion_machos_mixtos (TD_UINT32)
      const nMachosMixtos = Buffer.alloc(4);
      nMachosMixtos.writeUInt32LE(
        (dto.nAnimalesAccionMachosMixtos ?? 0) >>> 0,
        0,
      );
      out.push({
        tipoDato: EnTipoDato.uint32,
        sizeDatoByte: 4,
        dato: nMachosMixtos,
      });

      // N_animales_accion_hembras (TD_UINT32)
      const nHembras = Buffer.alloc(4);
      nHembras.writeUInt32LE((dto.nAnimalesAccionHembras ?? 0) >>> 0, 0);
      out.push({
        tipoDato: EnTipoDato.uint32,
        sizeDatoByte: 4,
        dato: nHembras,
      });
      break;
    }

    default: {
      // por seguridad, aunque no debería entrar aquí
      throw new Error(`Evento no soportado: ${(dto as any)?.evento}`);
    }
  }

  return out;
}

// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXX EnEstadisTipoRegistro.alarmas XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/** Estadístico: Alarma */
export interface EstadisticoAlarmaDto {
  /** TD_UINT16: identificador/texto de la alarma */
  textoAlarma: number;
  /** TD_UINT8: estado actual (encendida/apagada) */
  estadoAlarma: EnAlarmaEstado;
  /**
   * TD_UINT8: configuración de la alarma (desconectada/aviso/alarma)
   * EN_ALARMAS_ACCION
   */
  accionConfigurada: EnAlarmasAccion;
}

export function serializarDatosEstadisticoAlarma(
  dto: EstadisticoAlarmaDto,
): EstadisticoDato[] {
  // Texto alarma (TD_UINT16)
  const texto = Buffer.alloc(2);
  texto.writeUInt16LE(dto.textoAlarma >>> 0, 0);

  // Estado alarma (TD_UINT8)
  const estado = Buffer.from([(dto.estadoAlarma ?? 0) & 0xff]);

  // EN_ALARMAS_ACCION (config) (TD_UINT8)
  const config = Buffer.from([(dto.accionConfigurada ?? 0) & 0xff]);

  const out: EstadisticoDato[] = [
    { tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: texto }, // textoAlarma
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: estado }, // estadoAlarma (OFF/ON_ALARMA/ON_AVISO)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: config }, // configAccion (OFF/ALARM/AVISO)
  ];

  return out;
}

// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXX EnEstadisTipoRegistro.cambioParametros XXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// done XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

/**
 * Estadístico: Cambio de parámetro (doc 1.1)
 * - idCliente:        TD_UINT32
 * - tituloOpcion:     TD_CONCATENADO
 * - opcionLinea:      TD_CONCATENADO
 * - valor:            Tipo de datos variable (si es numérico) o TD_CONCATENADO (si es texto)
 */
export interface EstadisticoCambioParametroDto { 
  /** TD_UINT32: Identificación cliente */
  idCliente: number;

  /** TD_CONCATENADO: Título de la opción */
  tituloOpcion: string;

  /** TD_CONCATENADO: Opción (línea) */
  opcionLinea: string;

  /**
   * Variable valor: Si el valor es NUMÉRICO, indica el tipo base (uint8/uint16/uint32/int16/int32/float…)
   * y rellena 'valorNumero'. Si es TEXTO, deja 'valorTipo' y 'valorNumero' undefined
   * y rellena 'valorTexto' (TD_CONCATENADO).
   */
  valorTipo?: EnTipoDato;   // ← sólo si valor es numérico
  valorNumero?: number;     // ← sólo si valor es numérico
  valorTexto?: string;      // ← sólo si valor es texto (TD_CONCATENADO)
}

// Serializa "Cambio de parámetro" → lista de items { tipoDato, sizeDatoByte, dato }
export function serializarDatosEstadisticoCambioParametros(
  dto: EstadisticoCambioParametroDto,
): EstadisticoDato[] {
  // [0] idCliente (TD_UINT32)
  const idClienteBuf = Buffer.alloc(4);
  idClienteBuf.writeUInt32LE(dto.idCliente >>> 0, 0);

  // [1] tituloOpcion (TD_CONCATENADO)
  const tituloBuf = Buffer.from(dto.tituloOpcion ?? "", "utf8");

  // [2] opcionLinea (TD_CONCATENADO)
  const opcionBuf = Buffer.from(dto.opcionLinea ?? "", "utf8");

  // [3] valor (numérico con tipo o concatenado si es texto)
  let valorItem: EstadisticoDato;
  if (dto.valorTipo !== undefined && dto.valorNumero !== undefined) {
    const vbuf = packByTipo(dto.valorNumero, dto.valorTipo);
    valorItem = {
      tipoDato: dto.valorTipo,
      sizeDatoByte: vbuf.length,
      dato: vbuf,
    };
  } else if (dto.valorTexto !== undefined) {
    const vbuf = Buffer.from(dto.valorTexto, "utf8");
    valorItem = {
      // Asegúrate de tener este miembro en tu enum EnTipoDato (TD_CONCATENADO)
      tipoDato: EnTipoDato.concatenado,
      sizeDatoByte: vbuf.length,
      dato: vbuf,
    };
  } else {
    throw new Error("CambioParametro: debes indicar valorNumero+valorTipo o valorTexto.");
  }

  const out: EstadisticoDato[] = [
    { tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: idClienteBuf },      // idCliente
    { tipoDato: EnTipoDato.concatenado, sizeDatoByte: tituloBuf.length, dato: tituloBuf }, // tituloOpcion
    { tipoDato: EnTipoDato.concatenado, sizeDatoByte: opcionBuf.length, dato: opcionBuf }, // opcionLinea
    valorItem,                                                                 // valor (numérico o texto)
  ];

  return out;
}
