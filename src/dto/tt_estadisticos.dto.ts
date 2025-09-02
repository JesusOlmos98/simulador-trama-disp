import {
  EnTmEstadisticos,
  EnEstadisTipoRegistro,
  EnTipoDato,
  EnEstadisPeriodicidad,
  EnEstadoDatoEstadistico,
  EnGtUnidades,
  EnContadoresTipo,
  EnEstadisticosControladores,
} from 'src/utils/enums';
import { Fecha, Tiempo } from './frame.dto';

// -------------------------------------------------- TM_ESTADISTICOS_envia_estadistico --------------------------------------------------

//* Frame = FrameDto ----> Data/Payload = EnviaEstadisticoDto ----> dato[] = EstadisticoDato ----> dato = EstadisticoValorDto

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

// -------------------------------------------------- MAPA TM → DTO TtEstadisticosPayloadMap --------------------------------------------------
export type TtEstadisticosPayloadMap = {
  [EnTmEstadisticos.enviaEstadistico]: EnviaEstadisticoDto;
  [EnTmEstadisticos.rtEstadistico]: RtEstadisticoDto;
};

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

const u8 = (v: number) => Buffer.from([v & 0xFF]);
const i8 = (v: number) => { const b = Buffer.alloc(1); b.writeInt8(v); return b; };
const u16LE = (v: number) => { const b = Buffer.alloc(2); b.writeUInt16LE(v >>> 0, 0); return b; };
const i16LE = (v: number) => { const b = Buffer.alloc(2); b.writeInt16LE(v | 0, 0); return b; };
const u32LE = (v: number) => { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0, 0); return b; };
const i32LE = (v: number) => { const b = Buffer.alloc(4); b.writeInt32LE(v | 0, 0); return b; };
const f32LE = (v: number) => { const b = Buffer.alloc(4); b.writeFloatLE(v); return b; };

const tiempoToSegundos = (t: Tiempo) => ((t.hora ?? 0) * 3600 + (t.min ?? 0) * 60 + (t.seg ?? 0)) >>> 0;

function packByTipo(v: number, tipo: EnTipoDato): Buffer {
  switch (tipo) {
    case EnTipoDato.uint8:  return u8(v);
    case EnTipoDato.int8:   return i8(v);
    case EnTipoDato.uint16: return u16LE(v);
    case EnTipoDato.int16:  return i16LE(v);
    case EnTipoDato.uint32: return u32LE(v);
    case EnTipoDato.int32:  return i32LE(v);
    case EnTipoDato.float:  return f32LE(v);
    default:
      throw new Error(`Tipo de valor no soportado en estadístico valor: ${EnTipoDato[tipo]} (${tipo})`);
  }
}

/** Convierte un EstadisticoValorDto a la lista de items (tipo/size/dato) que espera la trama. */
export function serializarDatosEstadisticoValor(d: EstadisticoValorDto): EstadisticoDato[] {
  const base = d.valorTipo ?? EnTipoDato.float;

  const medio = packByTipo(d.valorMedio, base);
  const max   = packByTipo(d.valorMax,   base);
  const min   = packByTipo(d.valorMin,   base);

  const horamax = u32LE(tiempoToSegundos(d.horaValorMax));
  const horamin = u32LE(tiempoToSegundos(d.horaValorMin));

  const out: EstadisticoDato[] = [
    // [0] nombre (TD_UINT16)
    { tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: u16LE(d.nombreEstadistico) },

    // [1] periodicidad (TD_UINT8)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: u8(d.periodicidad) },

    // [2..4] valores (TD_ según d.valorTipo)
    { tipoDato: base, sizeDatoByte: medio.length, dato: medio }, // valorMedio
    { tipoDato: base, sizeDatoByte: max.length,   dato: max   }, // valorMax
    { tipoDato: base, sizeDatoByte: min.length,   dato: min   }, // valorMin

    // [5..6] horas (TD_TIEMPO = uint32 segundos)
    { tipoDato: EnTipoDato.tiempo, sizeDatoByte: 4, dato: horamax }, // horaValorMax
    { tipoDato: EnTipoDato.tiempo, sizeDatoByte: 4, dato: horamin }, // horaValorMin

    // [7] estado (TD_UINT8)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: u8(d.estado) },

    // [8] unidad (TD_UINT8)
    { tipoDato: EnTipoDato.uint8, sizeDatoByte: 1, dato: u8(d.unidad) },
  ];

  return out;
}


// -------------------------------- serializarDatosEstadisticoContador --------------------------------
export function serializarDatosEstadisticoContador(dto: EstadisticoContadorDto): EstadisticoDato[] {
  const valorTipo = dto.valorTipo ?? EnTipoDato.uint32;

  const nombre = Buffer.alloc(2);
  nombre.writeUInt16LE(dto.nombreEstadistico >>> 0, 0);

  const periodicidad = Buffer.from([dto.periodicidad & 0xFF]);
  const tipoContador = Buffer.from([dto.tipoContador & 0xFF]);
  const unidad = Buffer.from([dto.unidad & 0xFF]);

  const multiplicador = Buffer.alloc(4);
  multiplicador.writeFloatLE(dto.multiplicador, 0);

  const valor = packByTipo(dto.valor, valorTipo);
  const estado = Buffer.from([dto.estado & 0xFF]);

  const out: EstadisticoDato[] = [
    { tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: nombre },           // nombreEstadistico
    { tipoDato: EnTipoDato.uint8,  sizeDatoByte: 1, dato: periodicidad },     // periodicidad
    { tipoDato: EnTipoDato.uint8,  sizeDatoByte: 1, dato: tipoContador },     // tipoContador
    { tipoDato: EnTipoDato.uint8,  sizeDatoByte: 1, dato: unidad },           // unidad
    { tipoDato: EnTipoDato.float,  sizeDatoByte: 4, dato: multiplicador },    // multiplicador
    { tipoDato: valorTipo,         sizeDatoByte: valor.length, dato: valor }, // valor (tipo configurable)
    { tipoDato: EnTipoDato.uint8,  sizeDatoByte: 1, dato: estado },           // estado
  ];
  return out;
}

// -------------------------------- serializarDatosEstadisticoActividad --------------------------------
export function serializarDatosEstadisticoActividad(dto: EstadisticoActividadDto): EstadisticoDato[] {
  const nombre = Buffer.alloc(2);
  nombre.writeUInt16LE(dto.nombreEstadistico >>> 0, 0);

  const periodicidad = Buffer.from([dto.periodicidad & 0xFF]);

  const valorSeg = Buffer.alloc(4);
  valorSeg.writeUInt32LE(dto.valorSegundosConectado >>> 0, 0);

  const estado = Buffer.from([dto.estado & 0xFF]);

  const out: EstadisticoDato[] = [
    { tipoDato: EnTipoDato.uint16, sizeDatoByte: 2, dato: nombre },       // nombreEstadistico
    { tipoDato: EnTipoDato.uint8,  sizeDatoByte: 1, dato: periodicidad }, // periodicidad
    { tipoDato: EnTipoDato.uint32, sizeDatoByte: 4, dato: valorSeg },     // valorSegundosConectado
    { tipoDato: EnTipoDato.uint8,  sizeDatoByte: 1, dato: estado },       // estado
  ];
  return out;
}