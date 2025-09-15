import { EnCrianzaTipoAnimal, EnTipoEquipo } from "src/utils/LE/globals/enums";
import { PresentacionCentralOldDto, TablaCentralItemOld } from "./tt_sistemaOld.dto";
import { ParametroHistoricoOldDto } from "./tt_estadisticosOld.dto";
import { EnEstadisticosNombres, EnEventosEstadisFamilia, EnEventosEstadisPropiedades, EnEventosEstadisSubfamilia, EnEventosEstadisTipo, EnTipoAccionAltasBajasRetiradasCrianzaOld, EnTipoAccionInicioFinCrianzaOld, EnTipoDatoDFAccion, EnTipoDatoOld } from "src/utils/BE_Old/globals/enumOld";
import { ParametroHistoricoOmegaCambioParametroConcatenadoDto, ParametroHistoricoOmegaCambioParametroDfDto, ParametroHistoricoOmegaEbusFinalesDto, ParametroHistoricoOmegaEstadisticoGenericoDto, ParametroHistoricoOmegaEventoConcatenadoDto, ParametroHistoricoOmegaEventoDto, ParametroHistoricoOmegaFinCrianzaDto, ParametroHistoricoOmegaInicioCrianzaDto, ParametroHistoricoValorOmegaDfDto } from "./tt_estadisticosOldDF.dto";
import { EnTextos } from "src/utils/enumTextos";
import { packHora4, packFecha4 } from "src/utils/helpers";

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

export function crearTablaCambioEstadoDispositivoOld(m: number | bigint, nod: number, est: number, td: number, v: number, alarm: number): TablaCentralItemOld {

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

export const defaultEstadisticoValorOld: ParametroHistoricoOldDto = {
  //done El tipoDato usa el enum EnTipoDatoOld, no EnTipoDatoDFAccion
  //done Segun el tipoDato, se usa un TipoAccion u otro en identificadorCliente
  tipoDato: EnTipoDatoOld.datoEstadisticas,  // EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat1,
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  mac: 12345678,
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: 0,
  numeroServicio: EnEstadisticosNombres.tempSonda1MediaHora,
  datos: 25.55,
  identificadorCrianzaUnico: 0,
  diaCrianza: 0

}

export const defaultEstadisticoAltasBajasRetiradasCrianzaOld: ParametroHistoricoOldDto = {
  tipoDato: EnTipoDatoOld.altasBajasRetiradas,
  fecha: { dia: 1, mes: 1, anyo: 2023 }, // fecha alta-baja-retirada
  mac: 12345678,
  hora: { hora: 0, min: 0, seg: 0 }, // vacío
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: EnTipoAccionAltasBajasRetiradasCrianzaOld.altaAnadir, // tipoAccion
  numeroServicio: 0, // vacío 
  datos: 20, // nAnimales
  identificadorCrianzaUnico: 0,
  diaCrianza: 0 // vacío
}

export const defaultEstadisticoInicioFinCrianzaOld: ParametroHistoricoOldDto = {
  tipoDato: EnTipoDatoOld.inicioFinCrianza,
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  mac: 12345678,
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: EnTipoAccionInicioFinCrianzaOld.inicio, // tipoAccion
  numeroServicio: 0, // vacío
  datos: 20, // nAnimales
  identificadorCrianzaUnico: 0,
  diaCrianza: 12
}

export const defaultEstadisticoAlarmasOld: ParametroHistoricoOldDto = {
  tipoDato: EnTipoDatoOld.alarmas,
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  mac: 12345678,
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: 1,
  numeroServicio: 10087, // nombre alarma (ENUM_textos)
  datos: 1, // 0 o 1
  identificadorCrianzaUnico: 0,
  diaCrianza: 0
}

// TipoDato:  
// Dato_Estadisticas: 1 (El que solemos usar de base)
// Cambio parámetro : 2 
// Alarmas : 3 
// Tabla LOG : 4 
// Altas  bajas y retiradas : 5   
// TipoAccion (en vez de idCliente) (altas, bajas, retiradas):
//  0: baja añadir 
//  1: alta añadir 
//  2: retirada añadir 
//  3: baja editando último registro 
//  4: alta editando último registro 
//  5: retirada editando último registró 
//  6: elimina último registro 
// Cambio parámetro valores calculados: 6 
// Inicio crianza o fin_crianza: 7
// TipoAccion (en vez de idCliente) (inicio, fin):
// 0: inicio 
// 1: fin

//? EnTipoDatoDFAccion

/** Objeto de ejemplo para enviar una temperatura (OmegaDf). */
export const defaultParametroHistoricoValorOmegaDf: ParametroHistoricoValorOmegaDfDto = {
  mac: 12345678,                                          // 8B MAC del equipo (ejemplo típico XBee de 64 bits)
  tipoDato: EnTipoDatoDFAccion.estadisticoFloat1,         // ejemplo: valor DF como float (32 bits)
  fecha: { dia: 1, mes: 1, anyo: 2023 },                  // fecha de la muestra
  hora: { hora: 0, min: 0, seg: 0 },                      // hora de la muestra
  identificadorUnicoDentroDelSegundo: 0,                  // si hay varias tramas en el mismo segundo
  identificadorCliente: 1,                                // 2B: id cliente / explotación
  nombreVariable: EnEstadisticosNombres.tempSonda6MaxDia, // 2B: código de variable (p.ej. "temperatura ambiente" en tu ENUM)
  valorVariable: 28.45,                                   // 4B float: 25 °C leídos de una sonda de temperatura
  identificadorCrianzaUnico: 0,                           // 4B: 0 = sin crianza asociada
  variable1DiaCrianza: 0,                                 // 2B int16: día de crianza (0 si no aplica)
  variable1_2: 0,                                         // 2B auxiliar (reservado / no aplica)
  variable2: 0,                                           // 4B auxiliar (reservado / no aplica)
  variable3: 0,                                           // 4B auxiliar (reservado / no aplica)
};

/** Objeto para enviar estadístico alarma o warning (OmegaDf). */
export const defaultParametroHistoricoAlarmaOmegaDf: ParametroHistoricoValorOmegaDfDto = {
  mac: 12345678,                                          // 8B MAC del equipo (ejemplo típico XBee de 64 bits)
  tipoDato: EnTipoDatoDFAccion.alarmas,                   // ejemplo: valor DF como float (32 bits)
  fecha: { dia: 1, mes: 1, anyo: 2023 },                  // fecha de la muestra
  hora: { hora: 0, min: 0, seg: 0 },                      // hora de la muestra
  identificadorUnicoDentroDelSegundo: 0,                  // si hay varias tramas en el mismo segundo
  identificadorCliente: 1,                                // 2B: id cliente / explotación
  nombreVariable: EnEstadisticosNombres.alarmaGenerica,   // 2B: código de variable (p.ej. "temperatura ambiente" en tu ENUM)
  valorVariable: 1,                                       // 4B float: 25 °C leídos de una sonda de temperatura
  identificadorCrianzaUnico: 0,                           // 4B: 0 = sin crianza asociada
  variable1DiaCrianza: 0,                                 // 2B int16: día de crianza (0 si no aplica)
  variable1_2: 0,                                         // 2B auxiliar (reservado / no aplica)
  variable2: 0,                                           // 4B auxiliar (reservado / no aplica)
  variable3: 0,                                           // 4B auxiliar (reservado / no aplica)
};





/** Objeto de ejemplo para enviar un EVENTO (Omega). */
export const defaultParametroHistoricoOmegaEventoNormal: ParametroHistoricoOmegaEventoDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]), // 8B MAC del equipo (ejemplo típico 64 bits)
  tipoDato: EnTipoDatoDFAccion.evento,                                 // tipo de dato DF = EVENTO (45)
  identificadorUnicoDentroDelSegundo: 0,                               // si hay varias tramas en el mismo segundo
  versionEstructura: 1,                                                // versión de la estructura de evento
  tipo: EnEventosEstadisTipo.evento,                                   // 0=alarmas,1=warning,2=evento → elegimos EVENTO
  familia: EnEventosEstadisFamilia.alimentacion,                       // p.ej. familia Alimentación Avanzada
  subfamilia: EnEventosEstadisSubfamilia.noDefinido,                   // sin subfamilia específica
  reserva1: 0,                                                         // reservado (0 por defecto)
  propiedades: (
    EnEventosEstadisPropiedades.accionEventoOn |                       // bit0=1 → evento activo/ON
    EnEventosEstadisPropiedades.eventoSonoro                           // bit1=1 → sonoro
  ) as EnEventosEstadisPropiedades,
  fecha: { dia: 1, mes: 1, anyo: 2023 },                               // fecha del evento
  hora: { hora: 0, min: 0, seg: 0 },                                   // hora del evento
  nombreVariable: EnTextos.textEventos,                                // variable asociada al evento (ejemplo)
  diaCrianza: 12,                                                      // día de crianza (int16)
  identificadorCrianzaUnico: 0,                                        // 0 si no hay crianza asociada
  reserva: Buffer.alloc(8, 0x00),                                      // 8B reservados (relleno a cero)
};

export const defaultParametroHistoricoOmegaEventoAlarma: ParametroHistoricoOmegaEventoDto = {
  ...defaultParametroHistoricoOmegaEventoNormal,
  tipo: EnEventosEstadisTipo.alarmas,
  propiedades: EnEventosEstadisPropiedades.eventoSonoro,
  nombreVariable: EnTextos.textAlarma4,
};

export const defaultParametroHistoricoOmegaEventoWarning: ParametroHistoricoOmegaEventoDto = {
  ...defaultParametroHistoricoOmegaEventoNormal,
  tipo: EnEventosEstadisTipo.warning,
  propiedades: EnEventosEstadisPropiedades.accionEventoOn,
  nombreVariable: EnTextos.textWarningProg3NoFinalizadoSolapamiento,
};





const MAX_CADENA_BYTES_CONCAT = 80;
const toCadena80 = (s: string) => {
  const b = Buffer.from(s, 'utf16le');
  return b.length > MAX_CADENA_BYTES_CONCAT ? b.subarray(0, MAX_CADENA_BYTES_CONCAT) : b;
};

// Cadenas por defecto (ejemplos)
const cadenaConcatNormal = toCadena80('Evento: Alimentación iniciada');
const cadenaConcatAlarma = toCadena80('Alarma: Agua derrame detectado');
const cadenaConcatWarning = toCadena80('Warning: Programación 3 no finalizada (solape)');

// ---------------------------------------- EVENTO_CONCATENADO: NORMAL ----------------------------------------
export const defaultParametroHistoricoOmegaEventoConcatenadoNormal: ParametroHistoricoOmegaEventoConcatenadoDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),     // 8B MAC
  tipoDato: EnTipoDatoDFAccion.eventoConcatenado,                          // 43
  identificadorUnicoDentroDelSegundo: 0,                                   // si hay varias tramas en el mismo segundo
  versionAlarmaConcatenada: 1,                                             // versión de estructura concatenada
  tipo: EnEventosEstadisTipo.evento,                                       // NORMAL = evento
  subfamilia: EnEventosEstadisSubfamilia.noDefinido,
  familia: EnEventosEstadisFamilia.alimentacion,                           // p.ej. Alimentación avanzada
  propiedades: (
    EnEventosEstadisPropiedades.accionEventoOn |                           // ON/activo
    EnEventosEstadisPropiedades.eventoSonoro                               // sonoro
  ) as EnEventosEstadisPropiedades,
  nombreAlarma: EnTextos.textEventos,                                      // identificador texto asociado
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  diaCrianza: 12,
  identificadorCrianzaUnico: 0,
  reserva: 0,
  numeroBytesCadena: cadenaConcatNormal.length,                            // máx. 80 bytes
  cadenaConcatenada: cadenaConcatNormal,
};

// ---------------------------------------- EVENTO_CONCATENADO: ALARMA ----------------------------------------
export const defaultParametroHistoricoOmegaEventoConcatenadoAlarma: ParametroHistoricoOmegaEventoConcatenadoDto = {
  ...defaultParametroHistoricoOmegaEventoConcatenadoNormal,
  tipo: EnEventosEstadisTipo.alarmas,
  propiedades: EnEventosEstadisPropiedades.eventoSonoro,                   // como tu patrón en alarma simple
  nombreAlarma: EnTextos.textAlarma4,
  numeroBytesCadena: cadenaConcatAlarma.length,
  cadenaConcatenada: cadenaConcatAlarma,
};

// ---------------------------------------- EVENTO_CONCATENADO: WARNING ----------------------------------------
export const defaultParametroHistoricoOmegaEventoConcatenadoWarning: ParametroHistoricoOmegaEventoConcatenadoDto = {
  ...defaultParametroHistoricoOmegaEventoConcatenadoNormal,
  tipo: EnEventosEstadisTipo.warning,
  propiedades: EnEventosEstadisPropiedades.accionEventoOn,                 // como tu patrón en warning simple
  nombreAlarma: EnTextos.textWarningProg3NoFinalizadoSolapamiento,
  numeroBytesCadena: cadenaConcatWarning.length,
  cadenaConcatenada: cadenaConcatWarning,
};






// =================== Defaults ESTADISTICO_GENERICO ===================

// Ejemplo de cadena: valores genéricos (dominio agro-ganadero)
const cadenaEstadGenerico = toCadena80('EG: Agua=25 L; Temp=25 °C; Comedero=OK');

/** Objeto default para enviar un ESTADISTICO_GENERICO (layout concatenado, 114B). */
export const defaultParametroHistoricoOmegaEstadisticoGenerico: ParametroHistoricoOmegaEstadisticoGenericoDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),         // 8B MAC
  tipoDato: EnTipoDatoDFAccion.estadisticoGenerico,                           // (=46)
  identificadorUnicoDentroDelSegundo: 0,
  versionAlarmaConcatenada: 1,                                                // versión de la estructura
  tipo: EnEventosEstadisTipo.evento,                                          // por coherencia con concatenado
  subfamilia: EnEventosEstadisSubfamilia.noDefinido,
  familia: EnEventosEstadisFamilia.alimentacion,
  propiedades: EnEventosEstadisPropiedades.noDefinido,                        // estadístico: sin flags por defecto
  nombreAlarma: EnTextos.textEventos,                                         // mapea a “nombre_estadistico”
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  diaCrianza: 12,
  identificadorCrianzaUnico: 0,
  reserva: 0,
  numeroBytesCadena: cadenaEstadGenerico.length,                              // máx. 80
  cadenaConcatenada: cadenaEstadGenerico,
};





// ---------- DEFAULT: NUMÉRICO (uint16) ----------
export const defaultParametroHistoricoOmegaCambioParametroUint16: ParametroHistoricoOmegaCambioParametroDfDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),
  tipoDato: EnTipoDatoDFAccion.cambioParametroUint16,
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: 1,
  textVariable: EnTextos.textEventos as unknown as number,          // ajusta a tu catálogo
  valorVariable: 25,                                                // p.ej. “nuevo setpoint” = 25
  identificadorCrianzaUnico: 0,
  diaCrianza: 12,
  textTituloVariable: EnTextos.textHistoricoCambioParametros as unknown as number,    // ajusta a tu catálogo
  variable2: 0,
  variable3TextTituloPersonalizado: 0,
};

// ---------- DEFAULT: TIEMPO (HH:MM:SS → 12:30:00) ----------
export const defaultParametroHistoricoOmegaCambioParametroTiempo: ParametroHistoricoOmegaCambioParametroDfDto = {
  ...defaultParametroHistoricoOmegaCambioParametroUint16,
  tipoDato: EnTipoDatoDFAccion.cambioParametroTiempo,
  // valorVariable como crudo 4B: HH,MM,SS,0
  valorVariable: packHora4(12, 30, 0),
};

// ---------- DEFAULT: FECHA (DD/MM/YY → 01/01/23) ----------
export const defaultParametroHistoricoOmegaCambioParametroFecha: ParametroHistoricoOmegaCambioParametroDfDto = {
  ...defaultParametroHistoricoOmegaCambioParametroUint16,
  tipoDato: EnTipoDatoDFAccion.cambioParametroFecha,
  // valorVariable como crudo 4B: DD,MM,YY,0  (YY=23 → 2023)
  valorVariable: packFecha4(1, 1, 23),
};





// ---------- DEFAULT A: variable2 = tipo UINT16 con valor 25 (0x000019) ----------
export const defaultParametroHistoricoOmegaEbusFinalesA: ParametroHistoricoOmegaEbusFinalesDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),
  tipoDato: EnTipoDatoDFAccion.datosEbusFinales, // (=39)
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: 1,
  textVariable: EnTextos.textAlarmaActualizarDispositivosEbusCompatibilidad as unknown as number,
  valorVariable: 25, // p.ej. nuevo setpoint = 25
  identificadorCrianzaUnico: 0,
  diaCrianza: 12,
  textTituloVariable: EnTextos.textEventos as unknown as number,
  // variable2Raw: [ tipo (UINT16), valor 24-bit BE ]
  variable2Raw: Buffer.from([
    EnTipoDatoDFAccion.cambioParametroUint16 & 0xff, // primer byte = tipo
    0x00, 0x00, 0x19,                                // 25 en 24-bit BE
  ]),
  // campos de conveniencia (opcionales, no los necesita el serializador si variable2Raw ya está)
  variable2TipoDato: EnTipoDatoDFAccion.cambioParametroUint16,
  variable2Valor: 25,
  variable3TextTituloPersonalizado: 0,
};

// ---------- DEFAULT B: variable2 = tipo UINT8 con valor 100 (0x000064) ----------
export const defaultParametroHistoricoOmegaEbusFinalesB: ParametroHistoricoOmegaEbusFinalesDto = {
  ...defaultParametroHistoricoOmegaEbusFinalesA,
  textVariable: EnTextos.textAlarmaActualizarDispositivosEbusCompatibilidad as unknown as number,
  valorVariable: 100, // por variar el dato principal
  variable2Raw: Buffer.from([
    EnTipoDatoDFAccion.cambioParametroUint8 & 0xff,
    0x00, 0x00, 0x64, // 100 en 24-bit BE
  ]),
  variable2TipoDato: EnTipoDatoDFAccion.cambioParametroUint8,
  variable2Valor: 100,
  variable3TextTituloPersonalizado: 0,
};





// ---------- DEFAULT A: valor numérico (numeroByteValor=0 ⇒ usar valorVariable), sin EBUS ----------
const tituloA = Buffer.from('Cambio parámetro: Setpoint alimentación', 'utf16le');
const opcionA = Buffer.from('Opción: Línea 1', 'utf16le');
// valor en texto no incluido porque numeroByteValor=0 (valor numérico)
let cadenaA = Buffer.concat([tituloA, opcionA]);
if (cadenaA.length > 160) cadenaA = cadenaA.subarray(0, 160);

export const defaultParametroHistoricoOmegaCambioParametroConcatenadoNumerico: ParametroHistoricoOmegaCambioParametroConcatenadoDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),
  identificadorUnicoDentroDelSegundo: 0,
  versionCambioParametroConcatenado: 1,
  identificadorCliente: 1,
  tipoEquipo: 1,                   // p.ej. 1 = controlador Omega principal
  ebusNodo: 0,                     // 0 ⇒ no es un cambio en EBUS
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  diaCrianza: 12,
  identificadorCrianzaUnico: 0,
  numeroByteTitulo: tituloA.length,
  numeroByteOpcion: opcionA.length,
  numeroByteValor: 0,              // 0 ⇒ valor numérico
  tipoDatoCambioParametro: EnTipoDatoDFAccion.cambioParametroUint16,
  valorVariable: 25,               // setpoint=25 (ejemplo)
  cadenaConcatenada: cadenaA,
};

// ---------- DEFAULT B: valor en texto (numeroByteValor>0 ⇒ se ignora valorVariable), con EBUS ----------
const tituloB = Buffer.from('Cambio parámetro: Ventilación', 'utf16le');
const opcionB = Buffer.from('Opción: Velocidad', 'utf16le');
const valorTxtB = Buffer.from('30 %', 'utf16le');
let cadenaB = Buffer.concat([tituloB, opcionB, valorTxtB]);
if (cadenaB.length > 160) cadenaB = cadenaB.subarray(0, 160);

export const defaultParametroHistoricoOmegaCambioParametroConcatenadoTexto: ParametroHistoricoOmegaCambioParametroConcatenadoDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),
  identificadorUnicoDentroDelSegundo: 0,
  versionCambioParametroConcatenado: 1,
  identificadorCliente: 1,
  tipoEquipo: 2,                   // p.ej. 2 = módulo de ventilación
  ebusNodo: 3,                     // ejemplo: nodo 3 en EBUS
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  diaCrianza: 12,
  identificadorCrianzaUnico: 0,
  numeroByteTitulo: tituloB.length,
  numeroByteOpcion: opcionB.length,
  numeroByteValor: valorTxtB.length, // >0 ⇒ valor textual en cadena
  // cuando es valor textual, tipoDatoCambioParametro no aplica realmente (lo dejamos informativo)
  tipoDatoCambioParametro: EnTipoDatoDFAccion.cambioParametroString,
  valorVariable: 0,               // ignorado por protocolo si numeroByteValor>0
  cadenaConcatenada: cadenaB,
};





// ---------- DEFAULT: Inicio de crianza básico (valorVariable numérico) ----------
export const defaultParametroHistoricoOmegaInicioCrianza: ParametroHistoricoOmegaInicioCrianzaDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]), // 8B MAC
  tipoDato: EnTipoDatoDFAccion.inicioCrianza,                           // (=30)
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: 1,
  nombreVariable: EnTextos.textInicioCrianza as unknown as number,            // catálogo interno
  valorVariable: 25,                                                    // p.ej. nº naves/galpones iniciales = 25
  identificadorCrianzaUnico: 12345,                                         // 0 si aún no asignado
  diaCrianza: 1,                                                        // inicio → día 0
  variable1_2: 0,                                                       // reservado
  variable2: 0,                                                         // reservado
  variable3: 0,                                                         // reservado
};

// ---------- DEFAULT: Variante con campos crudos (Buffers de 4B) ----------
export const defaultParametroHistoricoOmegaInicioCrianzaCrudo: ParametroHistoricoOmegaInicioCrianzaDto = {
  ...defaultParametroHistoricoOmegaInicioCrianza,
  // valorVariable/variable2/variable3 como 4B crudos (ejemplo)
  valorVariable: Buffer.from([0x00, 0x00, 0x00, 0x19]), // 25 en big-endian
  variable2: Buffer.from([0x00, 0x00, 0x00, 0x00]),
  variable3: Buffer.from([0x00, 0x00, 0x00, 0x00]),
};





// ---------- DEFAULT A: Crianza “mixtos” ----------
export const defaultParametroHistoricoOmegaFinCrianzaMixtos: ParametroHistoricoOmegaFinCrianzaDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),
  tipoDato: EnTipoDatoDFAccion.finCrianza,                  // (=31)
  fecha: { dia: 1, mes: 1, anyo: 2023 },
  hora: { hora: 0, min: 0, seg: 0 },
  identificadorUnicoDentroDelSegundo: 0,
  identificadorCliente: 1,
  nombreVariableTipoAnimal: EnCrianzaTipoAnimal.mixtos,     // 0
  valorVariableNAnimalesMachosMixtos: 600,                  // machos/mixtos
  identificadorCrianzaUnico: 123456,                        // ejemplo
  diaCrianza: 120,                                          // día de cierre
  variable1_2: 0,                                           // reservado
  variable2NAnimalesHembras: 400,                           // hembras
  variable3: 0,                                             // reservado
};

// ---------- DEFAULT B: Crianza “machoHembraSeparado” ----------
export const defaultParametroHistoricoOmegaFinCrianzaSeparado: ParametroHistoricoOmegaFinCrianzaDto = {
  mac: Buffer.from([0x00, 0x13, 0xA2, 0x00, 0x40, 0xB5, 0xC2, 0xD7]),
  tipoDato: EnTipoDatoDFAccion.finCrianza,
  fecha: { dia: 15, mes: 3, anyo: 2024 },
  hora: { hora: 14, min: 30, seg: 0 },
  identificadorUnicoDentroDelSegundo: 1,
  identificadorCliente: 2,
  nombreVariableTipoAnimal: EnCrianzaTipoAnimal.machoHembraSeparado, // 3
  valorVariableNAnimalesMachosMixtos: 550,            // machos
  identificadorCrianzaUnico: 987654,
  diaCrianza: 105,
  variable1_2: 0,
  variable2NAnimalesHembras: 530,                      // hembras
  variable3: 0,
};

















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

// Tabla predefinida:
export const defaultTablaPrefabricada: TablaCentralItemOld[] = [
  { mac: Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]), nodo: 1, estado: 1, tipoDispositivo: 115, version: 0x0101, password: '0000000000000001', crcParametros: 0, infoEstado: 0, hayAlarma: 0 },
  { mac: Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x78]), nodo: 2, estado: 0, tipoDispositivo: 140, version: 0x0102, password: '0000000000000002', crcParametros: 0, infoEstado: 1, hayAlarma: 1 },
  { mac: Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x79]), nodo: 3, estado: 1, tipoDispositivo: 115, version: 0x0103, password: '0000000000000003', crcParametros: 0, infoEstado: 2, hayAlarma: 0 },
  { mac: Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x7A]), nodo: 4, estado: 1, tipoDispositivo: 140, version: 0x0104, password: '0000000000000004', crcParametros: 0, infoEstado: 3, hayAlarma: 1 },
  { mac: Buffer.from([0x00, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xF0, 0x01]), nodo: 5, estado: 1, tipoDispositivo: 115, version: 0x0201, password: '0000000000000005', crcParametros: 0, infoEstado: 4, hayAlarma: 0 },
  { mac: Buffer.from([0x00, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xF0, 0x02]), nodo: 6, estado: 1, tipoDispositivo: 140, version: 0x0202, password: '0000000000000006', crcParametros: 0, infoEstado: 5, hayAlarma: 1 },
  { mac: Buffer.from([0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80]), nodo: 7, estado: 0, tipoDispositivo: 115, version: 0x0203, password: '0000000000000007', crcParametros: 0, infoEstado: 6, hayAlarma: 0 },
  { mac: Buffer.from([0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x81]), nodo: 8, estado: 1, tipoDispositivo: 140, version: 0x0204, password: '0000000000000008', crcParametros: 0, infoEstado: 7, hayAlarma: 1 },
  { mac: Buffer.from([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x00, 0x00, 0x09]), nodo: 9, estado: 1, tipoDispositivo: 115, version: 0x0301, password: '0000000000000009', crcParametros: 0, infoEstado: 8, hayAlarma: 0 },
  { mac: Buffer.from([0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0x00, 0x00, 0x0A]), nodo: 10, estado: 1, tipoDispositivo: 140, version: 0x0302, password: '0000000000000010', crcParametros: 0, infoEstado: 9, hayAlarma: 1 },
];
