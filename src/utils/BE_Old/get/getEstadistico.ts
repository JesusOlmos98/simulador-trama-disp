// ========================= Estadístico OLD (TM_envia_parametro_historico) =========================

import { ParametroHistoricoOldDto } from "src/utils/dtoBE/tt_estadisticosOld.dto";
import { EnTipoTramaOld, EnTipoMensajeDispositivoCentral, EnEstadisticosNombres, EnTipoDatoOld, EnTipoAccionAltasBajasRetiradasCrianzaOld, EnTipoAccionInicioFinCrianzaOld, EnTipoDatoDFAccion, EnEventosEstadisFamilia, EnEventosEstadisPropiedades, EnEventosEstadisSubfamilia, EnEventosEstadisTipo, EnCrianzaTipoAnimal, EnCrianzaAltaBajaAccion } from "../globals/enumOld";
import { getTipoTramaOld, getTipoMensajeOld, getDataSectionOld, getParsedHeaderOld, getStartOld, getCRCFromFrameOld, getEndOld } from "./getTrama";
import { josLogger } from "src/utils/josLogger";
import { ParametroHistoricoValorOmegaDfDto } from "src/utils/dtoBE/tt_estadisticosOldDF.dto";
import { EnTextos } from "src/utils/enumTextos";

// =================== payload selector ===================

/** Devuelve el payload de un frame si es TT_envio_dispositivo_final + TM_envia_parametro_historico (o undefined). */
export function getParametroHistoricoPayloadOld(frame: Buffer): Buffer | undefined {
  // TT y TM que corresponden al estadístico OLD
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.envioDispositivoFinal) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;

  const data = getDataSectionOld(frame);
  return ensurePayload(data);
}

// =================== getters campo a campo ===================

/** Lee el tipo de dato “old” del payload histórico. */
export function getPhTipoDatoOld(frame: Buffer): EnTipoDatoOld | undefined {
  const p = getParametroHistoricoPayloadOld(frame);
  if (!p) return undefined;
  return p.readUInt8(PH_OFF.tipoDato) as EnTipoDatoOld;
}

export function getPhFechaOld(frame: Buffer) {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return readFecha3(p, PH_OFF.fecha);
}

export function getPhMacOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.mac, PH_OFF.mac + 8);
}

export function getPhHoraOld(frame: Buffer) {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return readHora3(p, PH_OFF.hora);
}

export function getPhIdUnicoOld(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.readUInt8(PH_OFF.idUnico);
}

export function getPhIdentificadorClienteOld(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_OFF.idCliente);
}

export function getPhNumeroServicioOld(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_OFF.numServicio);
}

/** Devuelve los 4 bytes crudos del campo 'datos'. */
export function getPhDatosRawOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.datos, PH_OFF.datos + 4);
}

/** Interpreta 'datos' (4B BE) según EnTipoDatoOld. Si no reconoce el tipo, devuelve el Buffer crudo. */
export function getPhDatosValorOld(frame: Buffer): number | Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame);
  if (!p) return undefined;

  const tipo = p.readUInt8(PH_OFF.tipoDato) as EnTipoDatoOld;
  const raw = p.subarray(PH_OFF.datos, PH_OFF.datos + 4);

  const asU32 = () => raw.readUInt32BE(0);
  const asI32 = () => raw.readInt32BE(0);
  const asF32 = () => raw.readFloatBE(0);

  switch (tipo) {
    // Valores “sensores/estadísticos”: normalmente float32
    case EnTipoDatoOld.datoEstadisticas:
    case EnTipoDatoOld.cambioParametro:
    case EnTipoDatoOld.cambioParametroValoresCalculados:
      return asF32();

    // Cambios de parámetro “calculados”: típicamente float32
    // return asF32();

    // Cambio de parámetro “normal”: suele ser entero (enum/escala)
    // return asI32();

    // Eventos/identificadores/contadores: mejor como entero sin signo
    case EnTipoDatoOld.alarmas:
    case EnTipoDatoOld.tablaLog:
    case EnTipoDatoOld.altasBajasRetiradas:
    case EnTipoDatoOld.inicioFinCrianza:
      return asU32();

    default:
      // Desconocido: devolvemos el crudo para no inventar interpretación
      return raw;
  }
}

export function getPhIdentificadorCrianzaUnicoOld(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_OFF.idCrianza);
}

export function getPhDiaCrianzaOld(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_OFF.diaCrianza);
}

// =================== parser completo a DTO ===================

export function parseParametroHistoricoOld(frame: Buffer): ParametroHistoricoOldDto | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;

  const tipoDato = p.readUInt8(PH_OFF.tipoDato);
  const fecha = readFecha3(p, PH_OFF.fecha);
  const mac = p.subarray(PH_OFF.mac, PH_OFF.mac + 8); // Buffer crudo (más fiel); si quieres number, conviértelo aparte
  const hora = readHora3(p, PH_OFF.hora);
  const identificadorUnicoDentroDelSegundo = p.readUInt8(PH_OFF.idUnico);
  const identificadorCliente = p.readUInt16BE(PH_OFF.idCliente);
  const numeroServicio = p.readUInt16BE(PH_OFF.numServicio) as unknown as EnEstadisticosNombres;
  const datos = getPhDatosValorOld(frame) ?? p.subarray(PH_OFF.datos, PH_OFF.datos + 4);
  const identificadorCrianzaUnico = p.readUInt32BE(PH_OFF.idCrianza);
  const diaCrianza = p.readUInt16BE(PH_OFF.diaCrianza);

  return {
    tipoDato,
    fecha,
    mac,
    hora,
    identificadorUnicoDentroDelSegundo,
    identificadorCliente,
    numeroServicio,
    datos,
    identificadorCrianzaUnico,
    diaCrianza,
  };
}

// =================== logger opcional (útil en TRACE) ===================

export function logCabeceraComunOld(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);

  josLogger.trace(`---------- DECODIFICAMOS TRAMA EN BYTES: ----------`);
  josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
  josLogger.trace(`Versión protocolo: ${hdr.versionProtocolo} `);
  josLogger.trace(`Nodo origen: ${hdr.nodoOrigen} `);
  josLogger.trace(`Nodo destino: ${hdr.nodoDestino} `);
  josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[hdr.tipoTrama]} `);
  josLogger.trace(`Tipo Mensaje TM: ${EnTipoMensajeDispositivoCentral[hdr.tipoMensaje]} `);
  josLogger.trace(`Longitud: ${hdr.longitud} `);
}

export function logTramaParametroHistoricoOld(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);
  const p = getParametroHistoricoPayloadOld(frame);
  logCabeceraComunOld(frame);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const dto = parseParametroHistoricoOld(frame)!;
    josLogger.trace(`---------- DATA: ----------`);
    josLogger.trace(`tipoDato:     ${EnTipoDatoOld[dto.tipoDato]} (${dto.tipoDato})`);
    josLogger.trace(`fecha:        ${dto.fecha.dia}-${dto.fecha.mes}-${dto.fecha.anyo}  `);
    josLogger.trace(`hora:         ${dto.hora.hora}:${dto.hora.min}:${dto.hora.seg}`);
    josLogger.trace(`mac:          ${Buffer.isBuffer(dto.mac) ? dto.mac.toString('hex') : dto.mac}`);
    josLogger.trace(`idUnico:      ${dto.identificadorUnicoDentroDelSegundo}    `);
    switch (dto.tipoDato) {
      case EnTipoDatoOld.datoEstadisticas:
      case EnTipoDatoOld.cambioParametro:
      case EnTipoDatoOld.cambioParametroValoresCalculados:
        josLogger.trace(`idCliente:    ${dto.identificadorCliente}`); //${EnEstadisticosNombres[dto.numeroServicio]}`);
        break;
      case EnTipoDatoOld.altasBajasRetiradas:
        josLogger.trace(`idCliente:    ${EnTipoAccionAltasBajasRetiradasCrianzaOld[dto.identificadorCliente]}`);
        break;
      case EnTipoDatoOld.inicioFinCrianza:
        josLogger.trace(`idCliente:    ${EnTipoAccionInicioFinCrianzaOld[dto.identificadorCliente]}`);
        break;
      default:
        josLogger.trace(`idCliente:    ${dto.identificadorCliente}`); //${EnEstadisticosNombres[dto.numeroServicio]}`);
        break;
    }
    josLogger.trace(`numServicio:  ${dto.tipoDato === EnTipoDatoOld.alarmas ? `${dto.identificadorCliente} (se interpreta según ENUM_textos)` : EnEstadisticosNombres[dto.numeroServicio]}`);
    josLogger.trace(`datos:        ${Buffer.isBuffer(dto.datos) ? dto.datos.toString('hex') : dto.datos}`);
    josLogger.trace(`idCrianza:    ${dto.identificadorCrianzaUnico}`);
    josLogger.trace(`diaCrianza:   ${dto.diaCrianza}`);
    josLogger.trace(`---------- DATA: ----------`);
  }
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}

//! Helpers

/** Layout fijo en bytes dentro del payload (BE en los multibyte salvo fecha/hora de 3B) */
const PH_OFF = {
  tipoDato: 0,                      // 1
  fecha: 1,                      // +3  -> 4
  mac: 4,                      // +8  -> 12
  hora: 12,                     // +3  -> 15
  idUnico: 15,                     // +1  -> 16
  idCliente: 16,                   // +2  -> 18 (BE)
  numServicio: 18,                 // +2  -> 20 (BE)
  datos: 20,                       // +4  -> 24 (interpreta por tipo)
  idCrianza: 24,                   // +4  -> 28 (BE)
  diaCrianza: 28,                  // +2  -> 30 (BE)
} as const;

const PH_TOTAL_MIN_LEN = 30; // suma: 1+3+8+3+1+2+2+4+4+2

// ---- Helpers locales ----
const ensurePayload = (buf?: Buffer): Buffer | undefined =>
  buf && buf.length >= PH_TOTAL_MIN_LEN ? buf : undefined;

const readFecha3 = (b: Buffer, off: number) => ({
  dia: b.readUInt8(off),
  mes: b.readUInt8(off + 1),
  anyo: 2000 + (b.readUInt8(off + 2) % 100), // doc: 0–99; lo elevamos a año 20xx
});

const readHora3 = (b: Buffer, off: number) => ({
  hora: b.readUInt8(off),
  min: b.readUInt8(off + 1),
  seg: b.readUInt8(off + 2),
});

// ? -------------------------------------------------------------------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? --------------------------------------------------- OmegaDF -------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? -------------------------------------------------------------------------------------------------------------------
// ? Estadísticos con EnTipoDatoDFAccion OMEGA.

/** Devuelve el payload DF (40B) de un frame si es TT_omegaPantallaPlaca + TM_envia_parametro_historico (o undefined). */
export function getParametroHistoricoPayloadOmegaDf(frame: Buffer): Buffer | undefined {
  // TT y TM que corresponden al estadístico Omega DF
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;

  const data = getDataSectionOld(frame);
  return ensurePayloadDf(data);
}

// =================== getters campo a campo (Omega DF) ===================

/** Lee el tipo de dato DF del payload histórico. */
export function getPhTipoDatoOmegaDf(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame);
  if (!p) return undefined;
  return p.readUInt8(PH_DF_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhFechaOmegaDf(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return readFecha3Df(p, PH_DF_OFF.fecha);
}

export function getPhMacOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.mac, PH_DF_OFF.mac + 8);
}

export function getPhHoraOmegaDf(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return readHora3Df(p, PH_DF_OFF.hora);
}

export function getPhIdUnicoOmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt8(PH_DF_OFF.idUnico);
}

export function getPhIdentificadorClienteOmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_DF_OFF.idCliente);
}

export function getPhNombreVariableOmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_DF_OFF.nombreVariable);
}

/** Devuelve los 4 bytes crudos del campo 'valorVariable'. */
export function getPhValorRawOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);
}

/** Interpreta 'valorVariable' (4B BE) según EnTipoDatoDFAccion. Si no reconoce el tipo, devuelve el Buffer crudo. */
export function getPhValorSegunTipoOmegaDf(frame: Buffer): number | Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame);
  if (!p) return undefined;

  const tipo = p.readUInt8(PH_DF_OFF.tipoDato) as EnTipoDatoDFAccion;
  const raw = p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);

  const asU32 = () => raw.readUInt32BE(0);
  const asI32 = () => raw.readInt32BE(0);
  const asF32 = () => raw.readFloatBE(0);

  const b0 = raw.readUInt8(0);
  const b1 = raw.readUInt8(1);
  const b2 = raw.readUInt8(2);

  switch (tipo) {
    // Estadísticos (numéricos)
    case EnTipoDatoDFAccion.estadisticoUint8: return raw.readUInt8(3);
    case EnTipoDatoDFAccion.estadisticoInt8: return raw.readInt8(3);
    case EnTipoDatoDFAccion.estadisticoUint16: return raw.readUInt16BE(2);
    case EnTipoDatoDFAccion.estadisticoInt16: return raw.readInt16BE(2);
    case EnTipoDatoDFAccion.estadisticoUint32: return asU32();
    case EnTipoDatoDFAccion.estadisticoInt32: return asI32();
    case EnTipoDatoDFAccion.estadisticoFloat0:
    case EnTipoDatoDFAccion.estadisticoFloat1:
    case EnTipoDatoDFAccion.estadisticoFloat2:
    case EnTipoDatoDFAccion.estadisticoFloat3: return asF32();

    // Cambios de parámetro (numéricos)
    case EnTipoDatoDFAccion.cambioParametroUint8: return raw.readUInt8(3);
    case EnTipoDatoDFAccion.cambioParametroInt8: return raw.readInt8(3);
    case EnTipoDatoDFAccion.cambioParametroUint16: return raw.readUInt16BE(2);
    case EnTipoDatoDFAccion.cambioParametroInt16: return raw.readInt16BE(2);
    case EnTipoDatoDFAccion.cambioParametroUint32: return asU32();
    case EnTipoDatoDFAccion.cambioParametroInt32: return asI32();
    case EnTipoDatoDFAccion.cambioParametroFloat0:
    case EnTipoDatoDFAccion.cambioParametroFloat1:
    case EnTipoDatoDFAccion.cambioParametroFloat2:
    case EnTipoDatoDFAccion.cambioParametroFloat3: return asF32();

    // Alarmas / eventos simples
    case EnTipoDatoDFAccion.alarmas:
    case EnTipoDatoDFAccion.warning:
    case EnTipoDatoDFAccion.altasBajas:
    case EnTipoDatoDFAccion.entradaAnimales:
    case EnTipoDatoDFAccion.inicioCrianza:
    case EnTipoDatoDFAccion.finCrianza:
    case EnTipoDatoDFAccion.cambioParametroSincronizacion:
      return asU32();

    // Tiempos / Fechas
    case EnTipoDatoDFAccion.cambioParametroTiempo:
    case EnTipoDatoDFAccion.estadisticoTiempo: {
      const hh = b0, mm = b1, ss = b2;
      return hh * 3600 + mm * 60 + ss;
    }
    case EnTipoDatoDFAccion.cambioParametroTiempoHM:
    case EnTipoDatoDFAccion.estadisticoTiempoHM: {
      const hh = b0, mm = b1;
      return hh * 60 + mm;
    }
    case EnTipoDatoDFAccion.cambioParametroTiempoMS:
    case EnTipoDatoDFAccion.estadisticoTiempoMS: {
      const hh = b0, mm = b1, ss = b2; // si HH=0, queda en MM:SS
      return hh * 3600 + mm * 60 + ss;
    }
    case EnTipoDatoDFAccion.cambioParametroFecha:
    case EnTipoDatoDFAccion.estadisticoFecha: {
      const dd = b0, mm = b1, yy = b2 % 100;
      const yyyy = 2000 + yy;
      return yyyy * 10000 + mm * 100 + dd; // YYYYMMDD
    }

    // Cadenas / compuestos / debug → devolver crudo
    case EnTipoDatoDFAccion.estadisticoString:
    case EnTipoDatoDFAccion.cambioParametroString:
    case EnTipoDatoDFAccion.cambioParametroTexto:
    case EnTipoDatoDFAccion.datosEbusFinales:
    case EnTipoDatoDFAccion.debugString:
    case EnTipoDatoDFAccion.pdDatoCompuestoInicio:
    case EnTipoDatoDFAccion.pdDatoCompuesto:
    case EnTipoDatoDFAccion.eventoConcatenado:
    case EnTipoDatoDFAccion.cambioParametroConcatenado:
    case EnTipoDatoDFAccion.evento:
    case EnTipoDatoDFAccion.reservadoSt:
      return raw;

    // Genérico: asumir float
    case EnTipoDatoDFAccion.estadisticoGenerico:
      return asF32();

    default:
      return raw; // desconocido: devolvemos crudo para no inventar interpretación
  }
}

export function getPhIdentificadorCrianzaUnicoOmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_DF_OFF.idCrianza);
}

export function getPhDiaCrianzaOmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readInt16BE(PH_DF_OFF.diaCrianza);
}

export function getPhVariable1_2OmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_DF_OFF.variable1_2);
}

export function getPhVariable2OmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_DF_OFF.variable2);
}

export function getPhVariable3OmegaDf(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_DF_OFF.variable3);
}

// =================== parser completo a DTO (Omega DF) ===================

export function parseParametroHistoricoValorOmegaDf(frame: Buffer): ParametroHistoricoValorOmegaDfDto | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;

  const tipoDato = p.readUInt8(PH_DF_OFF.tipoDato) as EnTipoDatoDFAccion;
  const fecha = readFecha3Df(p, PH_DF_OFF.fecha);
  const mac = p.subarray(PH_DF_OFF.mac, PH_DF_OFF.mac + 8); // Buffer crudo (más fiel); si lo quieres number/bigint, conviértelo aparte
  const hora = readHora3Df(p, PH_DF_OFF.hora);
  const identificadorUnicoDentroDelSegundo = p.readUInt8(PH_DF_OFF.idUnico);
  const identificadorCliente = p.readUInt16BE(PH_DF_OFF.idCliente);
  const nombreVariable = p.readUInt16BE(PH_DF_OFF.nombreVariable);
  const valorVariable = getPhValorSegunTipoOmegaDf(frame) ?? p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);
  const identificadorCrianzaUnico = p.readUInt32BE(PH_DF_OFF.idCrianza);
  const variable1DiaCrianza = p.readInt16BE(PH_DF_OFF.diaCrianza);
  const variable1_2 = p.readUInt16BE(PH_DF_OFF.variable1_2);
  const variable2 = p.readUInt32BE(PH_DF_OFF.variable2);
  const variable3 = p.readUInt32BE(PH_DF_OFF.variable3);

  return {
    tipoDato,
    fecha,
    mac,
    hora,
    identificadorUnicoDentroDelSegundo,
    identificadorCliente,
    nombreVariable,
    valorVariable,
    identificadorCrianzaUnico,
    variable1DiaCrianza,
    variable1_2,
    variable2,
    variable3,
  };
}

// =================== logger opcional (útil en TRACE) ===================

export function logTramaParametroHistoricoOmegaDf(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);
  const p = getParametroHistoricoPayloadOmegaDf(frame);
  logCabeceraComunOld(frame);

  josLogger.trace(`---------- ↓ DATA ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const dto = parseParametroHistoricoValorOmegaDf(frame)!;
    josLogger.trace(`len(payload): ${p.length}`);
    josLogger.trace(`mac:          ${Buffer.isBuffer(dto.mac) ? (dto.mac as Buffer).toString('hex') : dto.mac}`);
    josLogger.trace(`tipoDato:     ${EnTipoDatoDFAccion[dto.tipoDato]} (${dto.tipoDato})`);
    josLogger.trace(`fecha:        ${dto.fecha.dia}-${dto.fecha.mes}-${dto.fecha.anyo}`);
    josLogger.trace(`hora:         ${dto.hora.hora}:${dto.hora.min}:${dto.hora.seg}`);
    josLogger.trace(`idUnico:      ${dto.identificadorUnicoDentroDelSegundo}`);
    josLogger.trace(`idCliente:    ${dto.identificadorCliente}`);
    josLogger.trace(`nombreVar:    ${EnEstadisticosNombres[dto.nombreVariable]}`);
    josLogger.trace(`valorVar:     ${Buffer.isBuffer(dto.valorVariable) ? (dto.valorVariable as Buffer).toString('hex') : dto.valorVariable}`);
    josLogger.trace(`idCrianza:    ${dto.identificadorCrianzaUnico}`);
    josLogger.trace(`diaCrianza:   ${dto.variable1DiaCrianza}`);
    josLogger.trace(`variable1_2:  ${dto.variable1_2}`);
    josLogger.trace(`variable2:    ${dto.variable2}`);
    josLogger.trace(`variable3:    ${dto.variable3}`);
  }
  josLogger.trace(`---------- ↑ DATA ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}

//! Helpers (Omega DF)

/** Layout fijo en bytes dentro del payload DF (BE en multibyte salvo fecha/hora de 3B). */
const PH_DF_OFF = {
  mac: 0,                         // +8  -> 8
  tipoDato: 8,                    // +1  -> 9
  fecha: 9,                       // +3  -> 12
  hora: 12,                       // +3  -> 15
  idUnico: 15,                    // +1  -> 16
  idCliente: 16,                  // +2  -> 18 (BE)
  nombreVariable: 18,             // +2  -> 20 (BE)
  valorVariable: 20,              // +4  -> 24 (interpreta por tipoDato)
  idCrianza: 24,                  // +4  -> 28 (BE)
  diaCrianza: 28,                 // +2  -> 30 (int16 BE)
  variable1_2: 30,                // +2  -> 32 (BE)
  variable2: 32,                  // +4  -> 36 (BE)
  variable3: 36,                  // +4  -> 40 (BE)
} as const;

const PH_DF_TOTAL_MIN_LEN = 40; // suma: 8+1+3+3+1+2+2+4+4+2+2+4+4

// ---- Helpers locales ----
const ensurePayloadDf = (buf?: Buffer): Buffer | undefined =>
  buf && buf.length >= PH_DF_TOTAL_MIN_LEN ? buf : undefined;

const readFecha3Df = (b: Buffer, off: number) => ({
  dia: b.readUInt8(off),
  mes: b.readUInt8(off + 1),
  anyo: 2000 + (b.readUInt8(off + 2) % 100), // doc: 0–99; lo elevamos a año 20xx
});

const readHora3Df = (b: Buffer, off: number) => ({
  hora: b.readUInt8(off),
  min: b.readUInt8(off + 1),
  seg: b.readUInt8(off + 2),
});



// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



// =================== Payload EVENTO (Omega) ===================

/** Offsets (40B) del payload EVENTO (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_EVT_OFF = {
  mac: 0,                              // +8  -> 8
  tipoDato: 8,                         // +1  -> 9
  idUnico: 9,                          // +1  -> 10
  versionEstructura: 10,               // +1  -> 11
  tipo: 11,                            // +1  -> 12
  familia: 12,                         // +2  -> 14 (BE)
  subfamilia: 14,                      // +1  -> 15
  reserva1: 15,                        // +1  -> 16
  propiedades: 16,                     // +2  -> 18 (BE)
  fecha: 18,                           // +3  -> 21
  hora: 21,                            // +3  -> 24
  nombreVariable: 24,                  // +2  -> 26 (BE)
  diaCrianza: 26,                      // +2  -> 28 (int16 BE)
  idCrianza: 28,                       // +4  -> 32 (BE)
  reserva: 32,                         // +8  -> 40
} as const;

const PH_EVT_TOTAL_LEN = 40;

const ensurePayloadEvento = (buf?: Buffer): Buffer | undefined =>
  buf && buf.length >= PH_EVT_TOTAL_LEN ? buf : undefined;

const readFecha3Evt = (b: Buffer, off: number) => ({
  dia: b.readUInt8(off),
  mes: b.readUInt8(off + 1),
  anyo: 2000 + (b.readUInt8(off + 2) % 100),
});

const readHora3Evt = (b: Buffer, off: number) => ({
  hora: b.readUInt8(off),
  min: b.readUInt8(off + 1),
  seg: b.readUInt8(off + 2),
});

/** Devuelve el payload EVENTO (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEvento(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadEvento(data);
}

// =================== getters campo a campo (EVENTO) ===================

export function getPhEventoTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhEventoMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.mac, PH_EVT_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhEventoMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_EVT_OFF.mac);
  }
  // Fallback manual (compatible sin usar `any`)
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EVT_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhEventoMacNumber(frame: Buffer): number | undefined {
  const v = getPhEventoMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhEventoIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_OFF.idUnico);
}

export function getPhEventoVersionEstructura(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_OFF.versionEstructura);
}

export function getPhEventoTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_OFF.tipo) as EnEventosEstadisTipo;
}

export function getPhEventoFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_OFF.familia) as EnEventosEstadisFamilia;
}

export function getPhEventoSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_OFF.subfamilia) as EnEventosEstadisSubfamilia;
}

export function getPhEventoReserva1(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_OFF.reserva1);
}

export function getPhEventoPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_OFF.propiedades) as EnEventosEstadisPropiedades;
}

export function getPhEventoFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return readFecha3Evt(p, PH_EVT_OFF.fecha);
}

export function getPhEventoHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return readHora3Evt(p, PH_EVT_OFF.hora);
}

export function getPhEventoNombreVariable(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_OFF.nombreVariable);
}

export function getPhEventoDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readInt16BE(PH_EVT_OFF.diaCrianza);
}

export function getPhEventoIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_EVT_OFF.idCrianza);
}

export function getPhEventoReservaRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.reserva, PH_EVT_OFF.reserva + 8);
}

export function logTramaParametroHistoricoEventoOmegaDf(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);
  const p = getParametroHistoricoPayloadOmegaEvento(frame);

  logCabeceraComunOld(frame);

  josLogger.trace(`---------- ↓ DATA (EVENTO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    // Construimos dto vía getters de EVENTO
    const macBuf = getPhEventoMacRaw(frame)!;
    const tipoDato = getPhEventoTipoDato(frame)!;
    const idUnico = getPhEventoIdUnico(frame)!;
    const verStruct = getPhEventoVersionEstructura(frame)!;
    const tipo = getPhEventoTipo(frame)!;
    const familia = getPhEventoFamilia(frame)!;
    const subfamilia = getPhEventoSubfamilia(frame)!;
    const reserva1 = getPhEventoReserva1(frame)!;
    const propiedades = getPhEventoPropiedades(frame)!;
    const fecha = getPhEventoFecha(frame)!;
    const hora = getPhEventoHora(frame)!;
    const nombreVariable = getPhEventoNombreVariable(frame)!;
    const diaCrianza = getPhEventoDiaCrianza(frame)!;
    const idCrianza = getPhEventoIdentificadorCrianzaUnico(frame)!;
    const reserva = getPhEventoReservaRaw(frame)!;

    const propHex = propiedades.toString(16).padStart(4, '0');

    josLogger.trace(`len(payload): ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`verEstructura:  ${verStruct}`);
    josLogger.trace(`tipoEvento:     ${EnEventosEstadisTipo[tipo]} (${tipo})`);
    josLogger.trace(`familia:        ${EnEventosEstadisFamilia[familia]} (${familia})`);
    josLogger.trace(`subfamilia:     ${EnEventosEstadisSubfamilia[subfamilia]} (${subfamilia})`);
    josLogger.trace(`reserva1:       ${reserva1}`);
    josLogger.trace(`propiedades:    0x${propHex} (${propiedades})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`nombreVar:      ${EnTextos[nombreVariable]} (${nombreVariable})`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`reserva[8]:     ${reserva.toString('hex')}`);
  }
  josLogger.trace(`---------- ↑ DATA (EVENTO) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// Payload TIPO EVENTO CONCATENADO
// =================== Payload EVENTO_CONCATENADO (Omega) ===================
/** Offsets (114B) del payload EVENTO_CONCATENADO (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_EVT_CONCAT_OFF = {
  mac: 0,                    // +8  -> 8
  tipoDato: 8,               // +1  -> 9
  idUnico: 9,                // +1  -> 10
  versionConcatenada: 10,    // +2  -> 12 (BE)
  tipo: 12,                  // +1  -> 13
  subfamilia: 13,            // +1  -> 14
  familia: 14,               // +2  -> 16 (BE)
  propiedades: 16,           // +2  -> 18 (BE)
  nombreAlarma: 18,          // +2  -> 20 (BE)
  fecha: 20,                 // +3  -> 23
  hora: 23,                  // +3  -> 26
  diaCrianza: 26,            // +2  -> 28 (int16 BE)
  idCrianza: 28,             // +4  -> 32 (BE)
  reserva: 32,               // +1  -> 33
  nBytes: 33,                // +1  -> 34
  cadena: 34,                // +80 -> 114
} as const;

const PH_EVT_CONCAT_TOTAL_LEN = 114;
const PH_EVT_CONCAT_CADENA_MAX = 80;

const ensurePayloadEventoConcatenado = (buf?: Buffer): Buffer | undefined =>
  buf && buf.length >= PH_EVT_CONCAT_TOTAL_LEN ? buf : undefined;

const readFecha3EvtConcat = (b: Buffer, off: number) => ({
  dia: b.readUInt8(off),
  mes: b.readUInt8(off + 1),
  anyo: 2000 + (b.readUInt8(off + 2) % 100),
});

const readHora3EvtConcat = (b: Buffer, off: number) => ({
  hora: b.readUInt8(off),
  min: b.readUInt8(off + 1),
  seg: b.readUInt8(off + 2),
});

/** Devuelve el payload EVENTO_CONCATENADO (114B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEventoConcatenado(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadEventoConcatenado(data);
}

// =================== getters campo a campo (EVENTO_CONCATENADO) ===================

export function getPhEvtConcatTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_CONCAT_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhEvtConcatMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.mac, PH_EVT_CONCAT_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhEvtConcatMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_EVT_CONCAT_OFF.mac);
  }
  // Fallback manual
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EVT_CONCAT_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhEvtConcatMacNumber(frame: Buffer): number | undefined {
  const v = getPhEvtConcatMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhEvtConcatIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_CONCAT_OFF.idUnico);
}

export function getPhEvtConcatVersionConcatenada(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_CONCAT_OFF.versionConcatenada);
}

export function getPhEvtConcatTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_CONCAT_OFF.tipo) as EnEventosEstadisTipo;
}

export function getPhEvtConcatSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_CONCAT_OFF.subfamilia) as EnEventosEstadisSubfamilia;
}

export function getPhEvtConcatFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_CONCAT_OFF.familia) as EnEventosEstadisFamilia;
}

export function getPhEvtConcatPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_CONCAT_OFF.propiedades) as EnEventosEstadisPropiedades;
}

export function getPhEvtConcatNombreAlarma(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EVT_CONCAT_OFF.nombreAlarma);
}

export function getPhEvtConcatFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return readFecha3EvtConcat(p, PH_EVT_CONCAT_OFF.fecha);
}

export function getPhEvtConcatHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return readHora3EvtConcat(p, PH_EVT_CONCAT_OFF.hora);
}

export function getPhEvtConcatDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readInt16BE(PH_EVT_CONCAT_OFF.diaCrianza);
}

export function getPhEvtConcatIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_EVT_CONCAT_OFF.idCrianza);
}

export function getPhEvtConcatReserva(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_CONCAT_OFF.reserva);
}

export function getPhEvtConcatNumeroBytesCadena(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_EVT_CONCAT_OFF.nBytes);
}

/** Devuelve los 80 bytes reservados para la cadena (sin recortar por nBytes). */
export function getPhEvtConcatCadenaRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.cadena, PH_EVT_CONCAT_OFF.cadena + PH_EVT_CONCAT_CADENA_MAX);
}

/** Devuelve solo los `nBytes` válidos de la cadena (recortados a 0..80). */
export function getPhEvtConcatCadenaValidaRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  const n = Math.min(p.readUInt8(PH_EVT_CONCAT_OFF.nBytes), PH_EVT_CONCAT_CADENA_MAX);
  return p.subarray(PH_EVT_CONCAT_OFF.cadena, PH_EVT_CONCAT_OFF.cadena + n);
}

/** Decodifica la cadena válida como UTF-16LE (si nBytes es impar, recorta el último byte). */
export function getPhEvtConcatCadenaUtf16(frame: Buffer): string | undefined {
  const raw = getPhEvtConcatCadenaValidaRaw(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1; // asegurar múltiplo de 2
  return raw.subarray(0, nEven).toString('utf16le');
}

// =================== Logger (EVENTO_CONCATENADO) ===================

export function logTramaParametroHistoricoEventoConcatenadoOmegaDf(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame);

  logCabeceraComunOld(frame);

  josLogger.trace(`---------- ↓ DATA (EVENTO_CONCATENADO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhEvtConcatMacRaw(frame)!;
    const tipoDato = getPhEvtConcatTipoDato(frame)!;
    const idUnico = getPhEvtConcatIdUnico(frame)!;
    const verConcat = getPhEvtConcatVersionConcatenada(frame)!;
    const tipo = getPhEvtConcatTipo(frame)!;
    const familia = getPhEvtConcatFamilia(frame)!;
    const subfamilia = getPhEvtConcatSubfamilia(frame)!;
    const propiedades = getPhEvtConcatPropiedades(frame)!;
    const nombreAlarma = getPhEvtConcatNombreAlarma(frame)!;
    const fecha = getPhEvtConcatFecha(frame)!;
    const hora = getPhEvtConcatHora(frame)!;
    const diaCrianza = getPhEvtConcatDiaCrianza(frame)!;
    const idCrianza = getPhEvtConcatIdentificadorCrianzaUnico(frame)!;
    const reserva = getPhEvtConcatReserva(frame)!;
    const nBytes = getPhEvtConcatNumeroBytesCadena(frame)!;
    const cadenaRaw = getPhEvtConcatCadenaValidaRaw(frame)!;
    const cadenaUtf16 = getPhEvtConcatCadenaUtf16(frame)!;

    const propHex = propiedades.toString(16).padStart(4, '0');

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`verConcatenada: ${verConcat}`);
    josLogger.trace(`tipo:           ${EnEventosEstadisTipo[tipo]} (${tipo})`);
    josLogger.trace(`familia:        ${EnEventosEstadisFamilia[familia]} (${familia})`);
    josLogger.trace(`subfamilia:     ${EnEventosEstadisSubfamilia[subfamilia]} (${subfamilia})`);
    josLogger.trace(`propiedades:    0x${propHex} (${propiedades})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`nombreAlarma:   ${EnTextos[nombreAlarma]} (${nombreAlarma})`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`reserva:        ${reserva}`);
    josLogger.trace(`nBytesCadena:   ${nBytes} (máx ${PH_EVT_CONCAT_CADENA_MAX})`);
    josLogger.trace(`cadena[hex]:    ${cadenaRaw.toString('hex')}`);
    josLogger.trace(`cadena[utf16]:   ${cadenaUtf16}`);
  }
  josLogger.trace(`---------- ↑ DATA (EVENTO_CONCATENADO) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload ESTADISTICO_GENERICO (Omega) ===================

/** Offsets (114B) del payload ESTADISTICO_GENERICO (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_EST_GEN_OFF = {
  mac: 0,                    // +8  -> 8
  tipoDato: 8,               // +1  -> 9
  idUnico: 9,                // +1  -> 10
  versionConcatenada: 10,    // +2  -> 12 (BE)
  tipo: 12,                  // +1  -> 13
  subfamilia: 13,            // +1  -> 14
  familia: 14,               // +2  -> 16 (BE)
  propiedades: 16,           // +2  -> 18 (BE)
  nombreAlarma: 18,          // +2  -> 20 (BE)  // nombre_estadistico
  fecha: 20,                 // +3  -> 23
  hora: 23,                  // +3  -> 26
  diaCrianza: 26,            // +2  -> 28 (int16 BE)
  idCrianza: 28,             // +4  -> 32 (BE)
  reserva: 32,               // +1  -> 33
  nBytes: 33,                // +1  -> 34
  cadena: 34,                // +80 -> 114
} as const;

const PH_EST_GEN_TOTAL_LEN = 114;
const PH_EST_GEN_CADENA_MAX = 80;

const ensurePayloadEstadisticoGenerico = (buf?: Buffer): Buffer | undefined =>
  buf && buf.length >= PH_EST_GEN_TOTAL_LEN ? buf : undefined;

const readFecha3EstGen = (b: Buffer, off: number) => ({
  dia: b.readUInt8(off),
  mes: b.readUInt8(off + 1),
  anyo: 2000 + (b.readUInt8(off + 2) % 100),
});

const readHora3EstGen = (b: Buffer, off: number) => ({
  hora: b.readUInt8(off),
  min: b.readUInt8(off + 1),
  seg: b.readUInt8(off + 2),
});

/** Devuelve el payload ESTADISTICO_GENERICO (114B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadEstadisticoGenerico(data);
}

// =================== getters campo a campo (ESTADISTICO_GENERICO) ===================

export function getPhEstGenTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt8(PH_EST_GEN_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhEstGenMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.mac, PH_EST_GEN_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhEstGenMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_EST_GEN_OFF.mac);
  }
  // Fallback manual
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EST_GEN_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhEstGenMacNumber(frame: Buffer): number | undefined {
  const v = getPhEstGenMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhEstGenIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt8(PH_EST_GEN_OFF.idUnico);
}

export function getPhEstGenVersionConcatenada(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EST_GEN_OFF.versionConcatenada);
}

export function getPhEstGenTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt8(PH_EST_GEN_OFF.tipo) as EnEventosEstadisTipo;
}

export function getPhEstGenSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt8(PH_EST_GEN_OFF.subfamilia) as EnEventosEstadisSubfamilia;
}

export function getPhEstGenFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EST_GEN_OFF.familia) as EnEventosEstadisFamilia;
}

export function getPhEstGenPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EST_GEN_OFF.propiedades) as EnEventosEstadisPropiedades;
}

export function getPhEstGenNombreAlarma(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EST_GEN_OFF.nombreAlarma);
}

export function getPhEstGenFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return readFecha3EstGen(p, PH_EST_GEN_OFF.fecha);
}

export function getPhEstGenHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return readHora3EstGen(p, PH_EST_GEN_OFF.hora);
}

export function getPhEstGenDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readInt16BE(PH_EST_GEN_OFF.diaCrianza);
}

export function getPhEstGenIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_EST_GEN_OFF.idCrianza);
}

export function getPhEstGenReserva(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt8(PH_EST_GEN_OFF.reserva);
}

export function getPhEstGenNumeroBytesCadena(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.readUInt8(PH_EST_GEN_OFF.nBytes);
}

/** Devuelve los 80 bytes reservados para la cadena (sin recortar por nBytes). */
export function getPhEstGenCadenaRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.cadena, PH_EST_GEN_OFF.cadena + PH_EST_GEN_CADENA_MAX);
}

/** Devuelve solo los `nBytes` válidos de la cadena (recortados a 0..80). */
export function getPhEstGenCadenaValidaRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  const n = Math.min(p.readUInt8(PH_EST_GEN_OFF.nBytes), PH_EST_GEN_CADENA_MAX);
  return p.subarray(PH_EST_GEN_OFF.cadena, PH_EST_GEN_OFF.cadena + n);
}

/** Decodifica la cadena válida como UTF-16LE (si nBytes es impar, recorta el último byte). */
export function getPhEstGenCadenaUtf16(frame: Buffer): string | undefined {
  const raw = getPhEstGenCadenaValidaRaw(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1; // asegurar múltiplo de 2
  return raw.subarray(0, nEven).toString('utf16le');
}

// =================== Logger (ESTADISTICO_GENERICO) ===================

export function logTramaParametroHistoricoEstadisticoGenericoOmegaDf(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame);

  logCabeceraComunOld(frame);

  josLogger.trace(`---------- ↓ DATA (ESTADISTICO_GENERICO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhEstGenMacRaw(frame)!;
    const tipoDato = getPhEstGenTipoDato(frame)!;
    const idUnico = getPhEstGenIdUnico(frame)!;
    const verConcat = getPhEstGenVersionConcatenada(frame)!;
    const tipo = getPhEstGenTipo(frame)!;
    const familia = getPhEstGenFamilia(frame)!;
    const subfamilia = getPhEstGenSubfamilia(frame)!;
    const propiedades = getPhEstGenPropiedades(frame)!;
    const nombreAlarma = getPhEstGenNombreAlarma(frame)!; // nombre_estadistico
    const fecha = getPhEstGenFecha(frame)!;
    const hora = getPhEstGenHora(frame)!;
    const diaCrianza = getPhEstGenDiaCrianza(frame)!;
    const idCrianza = getPhEstGenIdentificadorCrianzaUnico(frame)!;
    const reserva = getPhEstGenReserva(frame)!;
    const nBytes = getPhEstGenNumeroBytesCadena(frame)!;
    const cadenaRaw = getPhEstGenCadenaValidaRaw(frame)!;
    const cadenaUtf16 = getPhEstGenCadenaUtf16(frame)!;

    const propHex = propiedades.toString(16).padStart(4, '0');

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`verConcatenada: ${verConcat}`);
    josLogger.trace(`tipo:           ${EnEventosEstadisTipo[tipo]} (${tipo})`);
    josLogger.trace(`familia:        ${EnEventosEstadisFamilia[familia]} (${familia})`);
    josLogger.trace(`subfamilia:     ${EnEventosEstadisSubfamilia[subfamilia]} (${subfamilia})`);
    josLogger.trace(`propiedades:    0x${propHex} (${propiedades})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`nombreEstad:    ${EnTextos[nombreAlarma]} (${nombreAlarma})`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`reserva:        ${reserva}`);
    josLogger.trace(`nBytesCadena:   ${nBytes} (máx ${PH_EST_GEN_CADENA_MAX})`);
    josLogger.trace(`cadena[hex]:    ${cadenaRaw.toString('hex')}`);
    josLogger.trace(`cadena[utf16]:   ${cadenaUtf16}`);
  }
  josLogger.trace(`---------- ↑ DATA (ESTADISTICO_GENERICO) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload DF_CAMBIO_PARAMETRO (Omega) ===================

/** Offsets (40B) del payload DF_CAMBIO_PARAMETRO (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_CAMBIO_PARAM_OFF = {
  mac: 0,                      // +8  -> 8
  tipoDato: 8,                 // +1  -> 9
  fecha: 9,                    // +3  -> 12
  hora: 12,                    // +3  -> 15
  idUnico: 15,                 // +1  -> 16
  idCliente: 16,               // +2  -> 18 (BE)
  textVariable: 18,            // +2  -> 20 (BE)
  valorVariable: 20,           // +4  -> 24 (BE / crudo)
  idCrianza: 24,               // +4  -> 28 (BE)
  diaCrianza: 28,              // +2  -> 30 (int16 BE)
  textTituloVariable: 30,      // +2  -> 32 (BE)
  variable2: 32,               // +4  -> 36 (BE / crudo)
  variable3TituloPers: 36,     // +4  -> 40 (BE / crudo)
} as const;

const PH_CAMBIO_PARAM_TOTAL_LEN = 40;

/** Devuelve el payload DF_CAMBIO_PARAMETRO (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaCambioParametro(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_CAMBIO_PARAM_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (DF_CAMBIO_PARAMETRO) ===================

export function getPhCambioTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_PARAM_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhCambioMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.mac, PH_CAMBIO_PARAM_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhCambioMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_CAMBIO_PARAM_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_CAMBIO_PARAM_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhCambioMacNumber(frame: Buffer): number | undefined {
  const v = getPhCambioMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhCambioFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  const off = PH_CAMBIO_PARAM_OFF.fecha;
  return {
    dia: p.readUInt8(off),
    mes: p.readUInt8(off + 1),
    anyo: 2000 + (p.readUInt8(off + 2) % 100),
  };
}

export function getPhCambioHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  const off = PH_CAMBIO_PARAM_OFF.hora;
  return {
    hora: p.readUInt8(off),
    min: p.readUInt8(off + 1),
    seg: p.readUInt8(off + 2),
  };
}

export function getPhCambioIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_PARAM_OFF.idUnico);
}

export function getPhCambioIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_CAMBIO_PARAM_OFF.idCliente);
}

export function getPhCambioTextVariable(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_CAMBIO_PARAM_OFF.textVariable);
}

/** Valor variable crudo (4B). */
export function getPhCambioValorVariableRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.valorVariable, PH_CAMBIO_PARAM_OFF.valorVariable + 4);
}

/** Valor variable como UInt32BE. */
export function getPhCambioValorVariableU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.valorVariable);
}

/** Valor variable como Int32BE. */
export function getPhCambioValorVariableI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readInt32BE(PH_CAMBIO_PARAM_OFF.valorVariable);
}

/** Valor variable como FloatBE (IEEE754 32-bit). */
export function getPhCambioValorVariableFloat(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readFloatBE(PH_CAMBIO_PARAM_OFF.valorVariable);
}

export function getPhCambioIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.idCrianza);
}

export function getPhCambioDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readInt16BE(PH_CAMBIO_PARAM_OFF.diaCrianza);
}

export function getPhCambioTextTituloVariable(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_CAMBIO_PARAM_OFF.textTituloVariable);
}

/** variable2 crudo (4B). */
export function getPhCambioVariable2Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.variable2, PH_CAMBIO_PARAM_OFF.variable2 + 4);
}

/** variable2 como UInt32BE. */
export function getPhCambioVariable2U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.variable2);
}

/** variable3 TEXT_titulo_personalizado crudo (4B). */
export function getPhCambioVariable3Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.variable3TituloPers, PH_CAMBIO_PARAM_OFF.variable3TituloPers + 4);
}

/** variable3 TEXT_titulo_personalizado como UInt32BE. */
export function getPhCambioVariable3U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.variable3TituloPers);
}

// =================== Logger (DF_CAMBIO_PARAMETRO) ===================

export function logTramaParametroHistoricoCambioParametroOmegaDf(frame: Buffer): void {
  const hdr = getParsedHeaderOld(frame);
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame);

  logCabeceraComunOld(frame);

  josLogger.trace(`---------- ↓ DATA (DF_CAMBIO_PARAMETRO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhCambioMacRaw(frame)!;
    const tipoDato = getPhCambioTipoDato(frame)!;
    const fecha = getPhCambioFecha(frame)!;
    const hora = getPhCambioHora(frame)!;
    const idUnico = getPhCambioIdUnico(frame)!;
    const idCliente = getPhCambioIdentificadorCliente(frame)!;
    const textVar = getPhCambioTextVariable(frame)!;
    const valorRaw = getPhCambioValorVariableRaw(frame)!;
    const valorU32 = getPhCambioValorVariableU32(frame)!;
    const valorI32 = getPhCambioValorVariableI32(frame)!;
    const valorF32 = getPhCambioValorVariableFloat(frame)!;
    const idCrianza = getPhCambioIdentificadorCrianzaUnico(frame)!;
    const diaCrianza = getPhCambioDiaCrianza(frame)!;
    const textTituloVar = getPhCambioTextTituloVariable(frame)!;
    const var2Raw = getPhCambioVariable2Raw(frame)!;
    const var2U32 = getPhCambioVariable2U32(frame)!;
    const var3Raw = getPhCambioVariable3Raw(frame)!;
    const var3U32 = getPhCambioVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`idCliente:      ${idCliente}`);
    josLogger.trace(`textVariable:   ${EnTextos[textVar]} (${textVar})`);
    josLogger.trace(`valorRaw[4]:    ${valorRaw.toString('hex')}`);
    josLogger.trace(`valorU32:       ${valorU32}`);
    josLogger.trace(`valorI32:       ${valorI32}`);
    josLogger.trace(`valorF32:       ${Number.isNaN(valorF32) ? 'NaN' : valorF32}`);
    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`textTituloVar:  ${EnTextos[textTituloVar]} (${textTituloVar})`);
    josLogger.trace(`variable2Raw:   ${var2Raw.toString('hex')} (u32=${var2U32})`);
    josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
  }
  josLogger.trace(`---------- ↑ DATA (DF_CAMBIO_PARAMETRO) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload DATOS_EBUS_FINALES (Omega) ===================

/** Offsets (40B) del payload DATOS_EBUS_FINALES (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_EBUS_OFF = {
  mac: 0,                      // +8  -> 8
  tipoDato: 8,                 // +1  -> 9
  fecha: 9,                    // +3  -> 12
  hora: 12,                    // +3  -> 15
  idUnico: 15,                 // +1  -> 16
  idCliente: 16,               // +2  -> 18 (BE)
  textVariable: 18,            // +2  -> 20 (BE)
  valorVariable: 20,           // +4  -> 24 (BE / crudo)
  idCrianza: 24,               // +4  -> 28 (BE)
  diaCrianza: 28,              // +2  -> 30 (int16 BE)
  textTituloVariable: 30,      // +2  -> 32 (BE)
  variable2: 32,               // +4  -> 36 (byte0=tipoDato; byte1..3=valor/meta)
  variable3TituloPers: 36,     // +4  -> 40 (BE / crudo)
} as const;

const PH_EBUS_TOTAL_LEN = 40;

/** Devuelve el payload DATOS_EBUS_FINALES (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEbusFinales(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_EBUS_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (DATOS_EBUS_FINALES) ===================

export function getPhEbusTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt8(PH_EBUS_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhEbusMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.mac, PH_EBUS_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhEbusMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_EBUS_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EBUS_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhEbusMacNumber(frame: Buffer): number | undefined {
  const v = getPhEbusMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhEbusFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  const off = PH_EBUS_OFF.fecha;
  return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
}

export function getPhEbusHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  const off = PH_EBUS_OFF.hora;
  return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
}

export function getPhEbusIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt8(PH_EBUS_OFF.idUnico);
}

export function getPhEbusIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EBUS_OFF.idCliente);
}

export function getPhEbusTextVariable(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EBUS_OFF.textVariable);
}

/** valorVariable crudo (4B). */
export function getPhEbusValorVariableRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.valorVariable, PH_EBUS_OFF.valorVariable + 4);
}

/** valorVariable como UInt32BE. */
export function getPhEbusValorVariableU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_EBUS_OFF.valorVariable);
}

/** valorVariable como Int32BE. */
export function getPhEbusValorVariableI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readInt32BE(PH_EBUS_OFF.valorVariable);
}

/** valorVariable como FloatBE (IEEE754 32-bit). */
export function getPhEbusValorVariableFloat(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readFloatBE(PH_EBUS_OFF.valorVariable);
}

export function getPhEbusIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_EBUS_OFF.idCrianza);
}

export function getPhEbusDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readInt16BE(PH_EBUS_OFF.diaCrianza);
}

export function getPhEbusTextTituloVariable(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_EBUS_OFF.textTituloVariable);
}

/** variable2 crudo (4B) — byte0=tipoDato, byte1..3=valor/meta. */
export function getPhEbusVariable2Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.variable2, PH_EBUS_OFF.variable2 + 4);
}

/** variable2 → primer byte como EnTipoDatoDFAccion. */
export function getPhEbusVariable2TipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt8(PH_EBUS_OFF.variable2) as EnTipoDatoDFAccion;
}

/** variable2 → 3 bytes de valor/meta tal cual (bytes 1..3). */
export function getPhEbusVariable2Valor24Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.variable2 + 1, PH_EBUS_OFF.variable2 + 4);
}

/** variable2 → valor/meta como UInt24 (0..0xFFFFFF). */
export function getPhEbusVariable2Valor24U(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUIntBE(PH_EBUS_OFF.variable2 + 1, 3);
}

/** variable2 → valor/meta como Int24 (-8388608..8388607). */
export function getPhEbusVariable2Valor24I(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readIntBE(PH_EBUS_OFF.variable2 + 1, 3);
}

/** variable3 TEXT_titulo_personalizado crudo (4B). */
export function getPhEbusVariable3Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.variable3TituloPers, PH_EBUS_OFF.variable3TituloPers + 4);
}

/** variable3 TEXT_titulo_personalizado como UInt32BE. */
export function getPhEbusVariable3U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_EBUS_OFF.variable3TituloPers);
}

export function logTramaParametroHistoricoEbusFinalesOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame);

  josLogger.trace(`---------- ↓ DATA (DATOS_EBUS_FINALES) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    // Campos principales
    const macBuf = getPhEbusMacRaw(frame)!;
    const tipoDato = getPhEbusTipoDato(frame)!;

    const fecha = getPhEbusFecha(frame)!;
    const hora = getPhEbusHora(frame)!;

    const idUnico = getPhEbusIdUnico(frame)!;
    const idCliente = getPhEbusIdentificadorCliente(frame)!;

    const textVar = getPhEbusTextVariable(frame)!;

    const valorRaw = getPhEbusValorVariableRaw(frame)!;
    const valorU32 = getPhEbusValorVariableU32(frame)!;
    const valorI32 = getPhEbusValorVariableI32(frame)!;
    const valorF32 = getPhEbusValorVariableFloat(frame)!;

    const idCrianza = getPhEbusIdentificadorCrianzaUnico(frame)!;
    const diaCrianza = getPhEbusDiaCrianza(frame)!;

    const textTituloVar = getPhEbusTextTituloVariable(frame)!;

    // variable2: [ byte0 = tipoDato , bytes1..3 = valor/meta (24-bit BE) ]
    const v2raw = getPhEbusVariable2Raw(frame)!;
    const v2Tipo = getPhEbusVariable2TipoDato(frame)!;
    const v2TipoName = EnTipoDatoDFAccion[v2Tipo] ?? `${v2Tipo}`;
    const v224raw = getPhEbusVariable2Valor24Raw(frame)!;
    const v224u = getPhEbusVariable2Valor24U(frame)!;
    const v224i = getPhEbusVariable2Valor24I(frame)!;

    // variable3
    const v3raw = getPhEbusVariable3Raw(frame)!;
    const v3u32 = getPhEbusVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`idCliente:      ${idCliente}`);
    josLogger.trace(`textVariable:   ${EnTextos[textVar]} (${textVar})`);
    josLogger.trace(`valorRaw[4]:    ${valorRaw.toString('hex')}`);
    josLogger.trace(`valorU32:       ${valorU32}`);
    josLogger.trace(`valorI32:       ${valorI32}`);
    josLogger.trace(`valorF32:       ${Number.isNaN(valorF32) ? 'NaN' : valorF32}`);
    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`textTituloVar:  ${EnTextos[textTituloVar]} (${textTituloVar})`);

    josLogger.trace(`variable2Raw:   ${v2raw.toString('hex')}`);
    josLogger.trace(`variable2.tipo: ${v2TipoName} (${v2Tipo})`);
    josLogger.trace(`variable2.val:  0x${v224raw.toString('hex')}  (u24=${v224u}, i24=${v224i})`);

    josLogger.trace(`variable3Raw:   ${v3raw.toString('hex')} (u32=${v3u32})`);
  }
  josLogger.trace(`---------- ↑ DATA (DATOS_EBUS_FINALES) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload CAMBIO_PARAMETRO_CONCATENADO (Omega) ===================

/** Offsets (195B) del payload CAMBIO_PARAMETRO_CONCATENADO (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_CAMBIO_CONCAT_OFF = {
  mac: 0,                           // +8  -> 8
  idUnico: 8,                       // +1  -> 9
  versionCambioParam: 9,            // +2  -> 11 (BE)
  idCliente: 11,                    // +2  -> 13 (BE)
  tipoEquipo: 13,                   // +1  -> 14
  ebusNodo: 14,                     // +1  -> 15
  fecha: 15,                        // +3  -> 18
  hora: 18,                         // +3  -> 21
  diaCrianza: 21,                   // +2  -> 23 (int16 BE)
  idCrianza: 23,                    // +4  -> 27 (BE)
  nTitulo: 27,                      // +1  -> 28
  nOpcion: 28,                      // +1  -> 29
  nValor: 29,                       // +1  -> 30
  tipoDatoCambio: 30,               // +1  -> 31
  valorVariable: 31,                // +4  -> 35 (BE / crudo)
  cadena: 35,                       // +160 -> 195
} as const;

const PH_CAMBIO_CONCAT_TOTAL_LEN = 195;
const PH_CAMBIO_CONCAT_CADENA_MAX = 160;

/** Devuelve el payload CAMBIO_PARAMETRO_CONCATENADO (195B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_CAMBIO_CONCAT_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (CAMBIO_PARAMETRO_CONCATENADO) ===================

export function getPhCambioConcatMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.mac, PH_CAMBIO_CONCAT_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhCambioConcatMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_CAMBIO_CONCAT_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_CAMBIO_CONCAT_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhCambioConcatMacNumber(frame: Buffer): number | undefined {
  const v = getPhCambioConcatMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhCambioConcatIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.idUnico);
}

export function getPhCambioConcatVersionCambioParametro(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_CAMBIO_CONCAT_OFF.versionCambioParam);
}

export function getPhCambioConcatIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_CAMBIO_CONCAT_OFF.idCliente);
}

export function getPhCambioConcatTipoEquipo(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.tipoEquipo);
}

export function getPhCambioConcatEbusNodo(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.ebusNodo);
}

export function getPhCambioConcatFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const off = PH_CAMBIO_CONCAT_OFF.fecha;
  return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
}

export function getPhCambioConcatHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const off = PH_CAMBIO_CONCAT_OFF.hora;
  return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
}

export function getPhCambioConcatDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readInt16BE(PH_CAMBIO_CONCAT_OFF.diaCrianza);
}

export function getPhCambioConcatIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_CAMBIO_CONCAT_OFF.idCrianza);
}

export function getPhCambioConcatNumeroByteTitulo(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
}

export function getPhCambioConcatNumeroByteOpcion(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
}

export function getPhCambioConcatNumeroByteValor(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
}

export function getPhCambioConcatTipoDatoCambioParametro(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt8(PH_CAMBIO_CONCAT_OFF.tipoDatoCambio) as EnTipoDatoDFAccion;
}

/** valorVariable crudo (4B). */
export function getPhCambioConcatValorVariableRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.valorVariable, PH_CAMBIO_CONCAT_OFF.valorVariable + 4);
}

/** valorVariable como UInt32BE. */
export function getPhCambioConcatValorVariableU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_CAMBIO_CONCAT_OFF.valorVariable);
}

/** valorVariable como Int32BE. */
export function getPhCambioConcatValorVariableI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readInt32BE(PH_CAMBIO_CONCAT_OFF.valorVariable);
}

/** valorVariable como FloatBE (IEEE754 32-bit). */
export function getPhCambioConcatValorVariableFloat(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.readFloatBE(PH_CAMBIO_CONCAT_OFF.valorVariable);
}

/** Cadena completa (160B) sin recortar. */
export function getPhCambioConcatCadenaRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.cadena, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
}

/** Segmento TÍTULO (0..nTitulo). */
export function getPhCambioConcatCadenaTituloRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
  return p.subarray(PH_CAMBIO_CONCAT_OFF.cadena, PH_CAMBIO_CONCAT_OFF.cadena + Math.min(nT, PH_CAMBIO_CONCAT_CADENA_MAX));
}

/** Segmento OPCIÓN (nTitulo..nTitulo+nOpcion). */
export function getPhCambioConcatCadenaOpcionRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
  const nO = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
  const start = PH_CAMBIO_CONCAT_OFF.cadena + nT;
  const end = Math.min(start + nO, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
  return p.subarray(start, end);
}

/** Segmento VALOR TEXTO (… + nValor). Si nValor=0 → cadena vacía. */
export function getPhCambioConcatCadenaValorTextoRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
  const nO = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
  const nV = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
  const start = PH_CAMBIO_CONCAT_OFF.cadena + nT + nO;
  const end = Math.min(start + nV, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
  return p.subarray(start, end);
}

/** Título como UTF-16LE (recorta a múltiplo de 2). */
export function getPhCambioConcatCadenaTituloUtf16(frame: Buffer): string | undefined {
  const raw = getPhCambioConcatCadenaTituloRaw(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1;
  return raw.subarray(0, nEven).toString('utf16le');
}

/** Opción como UTF-16LE (recorta a múltiplo de 2). */
export function getPhCambioConcatCadenaOpcionUtf16(frame: Buffer): string | undefined {
  const raw = getPhCambioConcatCadenaOpcionRaw(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1;
  return raw.subarray(0, nEven).toString('utf16le');
}

/** Valor (texto) como UTF-16LE si nValor>0; si nValor=0 devuelve '' (valor numérico en valorVariable). */
export function getPhCambioConcatCadenaValorUtf16(frame: Buffer): string | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nV = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
  if (nV === 0) return '';
  const raw = getPhCambioConcatCadenaValorTextoRaw(frame)!;
  const nEven = raw.length & ~1;
  return raw.subarray(0, nEven).toString('utf16le');
}

export function logTramaParametroHistoricoCambioParametroConcatenadoOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame);

  josLogger.trace(`---------- ↓ DATA (CAMBIO_PARAMETRO_CONCATENADO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    // Campos principales
    const macBuf = getPhCambioConcatMacRaw(frame)!;
    const idUnico = getPhCambioConcatIdUnico(frame)!;
    const verCambio = getPhCambioConcatVersionCambioParametro(frame)!;
    const idCliente = getPhCambioConcatIdentificadorCliente(frame)!;
    const tipoEquipo = getPhCambioConcatTipoEquipo(frame)!;
    const ebusNodo = getPhCambioConcatEbusNodo(frame)!;

    const fecha = getPhCambioConcatFecha(frame)!;
    const hora = getPhCambioConcatHora(frame)!;

    const diaCrianza = getPhCambioConcatDiaCrianza(frame)!;
    const idCrianza = getPhCambioConcatIdentificadorCrianzaUnico(frame)!;

    const nTitulo = getPhCambioConcatNumeroByteTitulo(frame)!;
    const nOpcion = getPhCambioConcatNumeroByteOpcion(frame)!;
    const nValor = getPhCambioConcatNumeroByteValor(frame)!;

    const tipoDato = getPhCambioConcatTipoDatoCambioParametro(frame)!;
    const tipoDatoName = EnTipoDatoDFAccion[tipoDato] ?? `${tipoDato}`;

    const valRaw = getPhCambioConcatValorVariableRaw(frame)!;
    const valU32 = getPhCambioConcatValorVariableU32(frame)!;
    const valI32 = getPhCambioConcatValorVariableI32(frame)!;
    const valF32 = getPhCambioConcatValorVariableFloat(frame)!;

    const cadenaRaw = getPhCambioConcatCadenaRaw(frame)!;
    const tituloRaw = getPhCambioConcatCadenaTituloRaw(frame)!;
    const opcionRaw = getPhCambioConcatCadenaOpcionRaw(frame)!;
    const valorTxtRaw = getPhCambioConcatCadenaValorTextoRaw(frame)!;

    const tituloUtf16 = getPhCambioConcatCadenaTituloUtf16(frame)!;
    const opcionUtf16 = getPhCambioConcatCadenaOpcionUtf16(frame)!;
    const valorUtf16 = getPhCambioConcatCadenaValorUtf16(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`versionCambio:  ${verCambio}`);
    josLogger.trace(`idCliente:      ${idCliente}`);
    josLogger.trace(`tipoEquipo:     ${tipoEquipo}`);
    josLogger.trace(`ebusNodo:       ${ebusNodo}`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`idCrianza:      ${idCrianza}`);

    josLogger.trace(`nTitulo:        ${nTitulo}`);
    josLogger.trace(`nOpcion:        ${nOpcion}`);
    josLogger.trace(`nValor:         ${nValor}`);
    josLogger.trace(`tipoDatoCambio: ${tipoDatoName} (${tipoDato})`);

    if (nValor === 0) {
      josLogger.trace(`valorVariable:  raw=${valRaw.toString('hex')}  u32=${valU32}  i32=${valI32}  f32=${Number.isNaN(valF32) ? 'NaN' : valF32}`);
    } else {
      josLogger.trace(`valorVariable:  (ignorado; el valor viene como texto en cadena) raw=${valRaw.toString('hex')}`);
    }

    josLogger.trace(`cadena[hex]:    ${cadenaRaw.toString('hex')}`);
    josLogger.trace(`titulo[hex]:    ${tituloRaw.toString('hex')}`);
    josLogger.trace(`opcion[hex]:    ${opcionRaw.toString('hex')}`);
    josLogger.trace(`valorTxt[hex]:  ${valorTxtRaw.toString('hex')}`);

    josLogger.trace(`titulo[utf16]:  ${tituloUtf16}`);
    josLogger.trace(`opcion[utf16]:  ${opcionUtf16}`);
    josLogger.trace(`valor[utf16]:   ${valorUtf16}`);
  }
  josLogger.trace(`---------- ↑ DATA (CAMBIO_PARAMETRO_CONCATENADO) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload DF_INICIO_CRIANZA (Omega) ===================

/** Offsets (40B) del payload DF_INICIO_CRIANZA (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_INI_CRI_OFF = {
  mac: 0,                   // +8  -> 8
  tipoDato: 8,              // +1  -> 9
  fecha: 9,                 // +3  -> 12
  hora: 12,                 // +3  -> 15
  idUnico: 15,              // +1  -> 16
  idCliente: 16,            // +2  -> 18 (BE)
  nombreVariable: 18,       // +2  -> 20 (BE)
  valorVariable: 20,        // +4  -> 24 (BE / crudo)
  idCrianza: 24,            // +4  -> 28 (BE)
  diaCrianza: 28,           // +2  -> 30 (int16 BE)
  variable1_2: 30,          // +2  -> 32 (BE)
  variable2: 32,            // +4  -> 36 (BE / crudo)
  variable3: 36,            // +4  -> 40 (BE / crudo)
} as const;

const PH_INI_CRI_TOTAL_LEN = 40;

/** Devuelve el payload DF_INICIO_CRIANZA (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaInicioCrianza(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_INI_CRI_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (DF_INICIO_CRIANZA) ===================

export function getPhInicioTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt8(PH_INI_CRI_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhInicioMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.mac, PH_INI_CRI_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhInicioMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_INI_CRI_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_INI_CRI_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhInicioMacNumber(frame: Buffer): number | undefined {
  const v = getPhInicioMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhInicioFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  const off = PH_INI_CRI_OFF.fecha;
  return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
}

export function getPhInicioHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  const off = PH_INI_CRI_OFF.hora;
  return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
}

export function getPhInicioIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt8(PH_INI_CRI_OFF.idUnico);
}

export function getPhInicioIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_INI_CRI_OFF.idCliente);
}

export function getPhInicioNombreVariable(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_INI_CRI_OFF.nombreVariable);
}

/** valorVariable crudo (4B). */
export function getPhInicioValorVariableRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.valorVariable, PH_INI_CRI_OFF.valorVariable + 4);
}

/** valorVariable como UInt32BE. */
export function getPhInicioValorVariableU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_INI_CRI_OFF.valorVariable);
}

/** valorVariable como Int32BE. */
export function getPhInicioValorVariableI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readInt32BE(PH_INI_CRI_OFF.valorVariable);
}

/** valorVariable como FloatBE (IEEE754 32-bit). */
export function getPhInicioValorVariableFloat(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readFloatBE(PH_INI_CRI_OFF.valorVariable);
}

export function getPhInicioIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_INI_CRI_OFF.idCrianza);
}

export function getPhInicioDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readInt16BE(PH_INI_CRI_OFF.diaCrianza);
}

export function getPhInicioVariable1_2(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_INI_CRI_OFF.variable1_2);
}

/** variable2 crudo (4B). */
export function getPhInicioVariable2Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.variable2, PH_INI_CRI_OFF.variable2 + 4);
}

/** variable2 como UInt32BE. */
export function getPhInicioVariable2U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_INI_CRI_OFF.variable2);
}

/** variable3 crudo (4B). */
export function getPhInicioVariable3Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.variable3, PH_INI_CRI_OFF.variable3 + 4);
}

/** variable3 como UInt32BE. */
export function getPhInicioVariable3U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_INI_CRI_OFF.variable3);
}

// =================== Logger (DF_INICIO_CRIANZA) ===================

export function logTramaParametroHistoricoInicioCrianzaOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame);

  josLogger.trace(`---------- ↓ DATA (DF_INICIO_CRIANZA) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhInicioMacRaw(frame)!;
    const tipoDato = getPhInicioTipoDato(frame)!;
    const fecha = getPhInicioFecha(frame)!;
    const hora = getPhInicioHora(frame)!;
    const idUnico = getPhInicioIdUnico(frame)!;
    const idCliente = getPhInicioIdentificadorCliente(frame)!;
    const nombreVar = getPhInicioNombreVariable(frame)!;

    const valorRaw = getPhInicioValorVariableRaw(frame)!;
    const valorU32 = getPhInicioValorVariableU32(frame)!;
    const valorI32 = getPhInicioValorVariableI32(frame)!;
    const valorF32 = getPhInicioValorVariableFloat(frame)!;

    const idCrianza = getPhInicioIdentificadorCrianzaUnico(frame)!;
    const diaCrianza = getPhInicioDiaCrianza(frame)!;
    const variable1_2 = getPhInicioVariable1_2(frame)!;

    const var2Raw = getPhInicioVariable2Raw(frame)!;
    const var2U32 = getPhInicioVariable2U32(frame)!;
    const var3Raw = getPhInicioVariable3Raw(frame)!;
    const var3U32 = getPhInicioVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`idCliente:      ${idCliente}`);
    josLogger.trace(`nombreVariable: ${EnTextos[nombreVar]} (${nombreVar})`);

    josLogger.trace(`valorRaw[4]:    ${valorRaw.toString('hex')}`);
    josLogger.trace(`valorU32:       ${valorU32}`);
    josLogger.trace(`valorI32:       ${valorI32}`);
    josLogger.trace(`valorF32:       ${Number.isNaN(valorF32) ? 'NaN' : valorF32}`);

    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`variable1_2:    ${variable1_2}`);

    josLogger.trace(`variable2Raw:   ${var2Raw.toString('hex')} (u32=${var2U32})`);
    josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
  }
  josLogger.trace(`---------- ↑ DATA (DF_INICIO_CRIANZA) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload DF_FIN_CRIANZA (Omega) ===================

/** Offsets (40B) del payload DF_FIN_CRIANZA (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_FIN_CRI_OFF = {
  mac: 0,                         // +8  -> 8
  tipoDato: 8,                    // +1  -> 9
  fecha: 9,                       // +3  -> 12
  hora: 12,                       // +3  -> 15
  idUnico: 15,                    // +1  -> 16
  idCliente: 16,                  // +2  -> 18 (BE)
  nombreVarTipoAnimal: 18,        // +2  -> 20 (BE)
  nMachosMixtos: 20,              // +4  -> 24 (BE)
  idCrianza: 24,                  // +4  -> 28 (BE)
  diaCrianza: 28,                 // +2  -> 30 (int16 BE)
  variable1_2: 30,                // +2  -> 32 (BE)
  nHembras: 32,                   // +4  -> 36 (BE)
  variable3: 36,                  // +4  -> 40 (BE / crudo)
} as const;

const PH_FIN_CRI_TOTAL_LEN = 40;

/** Devuelve el payload DF_FIN_CRIANZA (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaFinCrianza(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_FIN_CRI_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (DF_FIN_CRIANZA) ===================

export function getPhFinTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt8(PH_FIN_CRI_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhFinMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.mac, PH_FIN_CRI_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhFinMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_FIN_CRI_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_FIN_CRI_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhFinMacNumber(frame: Buffer): number | undefined {
  const v = getPhFinMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhFinFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  const off = PH_FIN_CRI_OFF.fecha;
  return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
}

export function getPhFinHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  const off = PH_FIN_CRI_OFF.hora;
  return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
}

export function getPhFinIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt8(PH_FIN_CRI_OFF.idUnico);
}

export function getPhFinIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_FIN_CRI_OFF.idCliente);
}

export function getPhFinNombreVariableTipoAnimal(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_FIN_CRI_OFF.nombreVarTipoAnimal);
}

export function getPhFinNombreVariableTipoAnimalEnum(frame: Buffer): EnCrianzaTipoAnimal | undefined {
  const n = getPhFinNombreVariableTipoAnimal(frame);
  return n === undefined ? undefined : (n as EnCrianzaTipoAnimal);
}

/** n_animales_machos_mixtos (Raw 4B). */
export function getPhFinNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.nMachosMixtos, PH_FIN_CRI_OFF.nMachosMixtos + 4);
}

/** n_animales_machos_mixtos como UInt32BE. */
export function getPhFinNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_FIN_CRI_OFF.nMachosMixtos);
}

/** n_animales_machos_mixtos como Int32BE. */
export function getPhFinNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readInt32BE(PH_FIN_CRI_OFF.nMachosMixtos);
}

/** n_animales_machos_mixtos como Float32BE. */
export function getPhFinNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readFloatBE(PH_FIN_CRI_OFF.nMachosMixtos);
}

export function getPhFinIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_FIN_CRI_OFF.idCrianza);
}

export function getPhFinDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readInt16BE(PH_FIN_CRI_OFF.diaCrianza);
}

export function getPhFinVariable1_2(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_FIN_CRI_OFF.variable1_2);
}

/** n_animales_hembras (Raw 4B). */
export function getPhFinNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.nHembras, PH_FIN_CRI_OFF.nHembras + 4);
}

/** n_animales_hembras como UInt32BE. */
export function getPhFinNAnimalesHembrasU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_FIN_CRI_OFF.nHembras);
}

/** variable3 crudo (4B). */
export function getPhFinVariable3Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.variable3, PH_FIN_CRI_OFF.variable3 + 4);
}

/** variable3 como UInt32BE. */
export function getPhFinVariable3U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_FIN_CRI_OFF.variable3);
}

// =================== Logger (DF_FIN_CRIANZA) ===================

export function logTramaParametroHistoricoFinCrianzaOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame);

  josLogger.trace(`---------- ↓ DATA (DF_FIN_CRIANZA) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhFinMacRaw(frame)!;
    const tipoDato = getPhFinTipoDato(frame)!;

    const fecha = getPhFinFecha(frame)!;
    const hora = getPhFinHora(frame)!;

    const idUnico = getPhFinIdUnico(frame)!;
    const idCliente = getPhFinIdentificadorCliente(frame)!;

    const tipoAnimalVal = getPhFinNombreVariableTipoAnimal(frame)!;
    const tipoAnimalEnum = EnCrianzaTipoAnimal[tipoAnimalVal as EnCrianzaTipoAnimal] ?? `${tipoAnimalVal}`;

    const nMachosMixtosRaw = getPhFinNAnimalesMachosMixtosRaw(frame)!;
    const nMachosMixtosU32 = getPhFinNAnimalesMachosMixtosU32(frame)!;
    const nMachosMixtosI32 = getPhFinNAnimalesMachosMixtosI32(frame)!;
    const nMachosMixtosF32 = getPhFinNAnimalesMachosMixtosF32(frame)!;

    const idCrianza = getPhFinIdentificadorCrianzaUnico(frame)!;
    const diaCrianza = getPhFinDiaCrianza(frame)!;
    const var1_2 = getPhFinVariable1_2(frame)!;

    const nHembrasRaw = getPhFinNAnimalesHembrasRaw(frame)!;
    const nHembrasU32 = getPhFinNAnimalesHembrasU32(frame)!;

    const var3Raw = getPhFinVariable3Raw(frame)!;
    const var3U32 = getPhFinVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`idCliente:      ${idCliente}`);

    josLogger.trace(`tipoAnimal:     ${tipoAnimalEnum} (${tipoAnimalVal})`);
    josLogger.trace(`nMach/Mixtos:   raw=${nMachosMixtosRaw.toString('hex')}  u32=${nMachosMixtosU32}  i32=${nMachosMixtosI32}  f32=${Number.isNaN(nMachosMixtosF32) ? 'NaN' : nMachosMixtosF32}`);

    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`variable1_2:    ${var1_2}`);

    josLogger.trace(`nHembras:       raw=${nHembrasRaw.toString('hex')}  u32=${nHembrasU32}`);
    josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
  }
  josLogger.trace(`---------- ↑ DATA (DF_FIN_CRIANZA) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload ENTRADA_ANIMALES (Omega) ===================

/** Offsets (40B) del payload ENTRADA_ANIMALES (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_ENTRADA_OFF = {
  mac: 0,                       // +8  -> 8
  tipoDato: 8,                  // +1  -> 9
  fecha: 9,                     // +3  -> 12
  hora: 12,                     // +3  -> 15
  idUnico: 15,                  // +1  -> 16
  idCliente: 16,                // +2  -> 18 (BE)
  nombreVarTipoAnimal: 18,      // +2  -> 20 (BE)
  nMachosMixtos: 20,            // +4  -> 24 (BE)
  idCrianza: 24,                // +4  -> 28 (BE)
  diaCrianza: 28,               // +2  -> 30 (int16 BE)
  variable1_2: 30,              // +2  -> 32 (BE)
  nHembras: 32,                 // +4  -> 36 (BE)
  variable3: 36,                // +4  -> 40 (BE / crudo)
} as const;

const PH_ENTRADA_TOTAL_LEN = 40;

/** Devuelve el payload ENTRADA_ANIMALES (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEntradaAnimales(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_ENTRADA_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (ENTRADA_ANIMALES) ===================

export function getPhEntradaTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt8(PH_ENTRADA_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhEntradaMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.mac, PH_ENTRADA_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhEntradaMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_ENTRADA_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_ENTRADA_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhEntradaMacNumber(frame: Buffer): number | undefined {
  const v = getPhEntradaMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhEntradaFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  const off = PH_ENTRADA_OFF.fecha;
  return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
}

export function getPhEntradaHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  const off = PH_ENTRADA_OFF.hora;
  return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
}

export function getPhEntradaIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt8(PH_ENTRADA_OFF.idUnico);
}

export function getPhEntradaIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_ENTRADA_OFF.idCliente);
}

export function getPhEntradaNombreVariableTipoAnimal(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_ENTRADA_OFF.nombreVarTipoAnimal);
}

export function getPhEntradaNombreVariableTipoAnimalEnum(frame: Buffer): EnCrianzaTipoAnimal | undefined {
  const n = getPhEntradaNombreVariableTipoAnimal(frame);
  return n === undefined ? undefined : (n as EnCrianzaTipoAnimal);
}

/** n_animales_machos_mixtos (Raw 4B). */
export function getPhEntradaNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.nMachosMixtos, PH_ENTRADA_OFF.nMachosMixtos + 4);
}

/** n_animales_machos_mixtos como UInt32BE. */
export function getPhEntradaNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_ENTRADA_OFF.nMachosMixtos);
}

/** n_animales_machos_mixtos como Int32BE. */
export function getPhEntradaNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readInt32BE(PH_ENTRADA_OFF.nMachosMixtos);
}

/** n_animales_machos_mixtos como Float32BE. */
export function getPhEntradaNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readFloatBE(PH_ENTRADA_OFF.nMachosMixtos);
}

export function getPhEntradaIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_ENTRADA_OFF.idCrianza);
}

export function getPhEntradaDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readInt16BE(PH_ENTRADA_OFF.diaCrianza);
}

export function getPhEntradaVariable1_2(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_ENTRADA_OFF.variable1_2);
}

/** n_animales_hembras (Raw 4B). */
export function getPhEntradaNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.nHembras, PH_ENTRADA_OFF.nHembras + 4);
}

/** n_animales_hembras como UInt32BE. */
export function getPhEntradaNAnimalesHembrasU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_ENTRADA_OFF.nHembras);
}

/** variable3 crudo (4B). */
export function getPhEntradaVariable3Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.variable3, PH_ENTRADA_OFF.variable3 + 4);
}

/** variable3 como UInt32BE. */
export function getPhEntradaVariable3U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_ENTRADA_OFF.variable3);
}

// =================== Logger (ENTRADA_ANIMALES) ===================

export function logTramaParametroHistoricoEntradaAnimalesOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame);

  josLogger.trace(`---------- ↓ DATA (ENTRADA_ANIMALES) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhEntradaMacRaw(frame)!;
    const tipoDato = getPhEntradaTipoDato(frame)!;

    const fecha = getPhEntradaFecha(frame)!;
    const hora = getPhEntradaHora(frame)!;

    const idUnico = getPhEntradaIdUnico(frame)!;
    const idCliente = getPhEntradaIdentificadorCliente(frame)!;

    const tipoAnimalVal = getPhEntradaNombreVariableTipoAnimal(frame)!;
    const tipoAnimalEnum = EnCrianzaTipoAnimal[tipoAnimalVal as EnCrianzaTipoAnimal] ?? `${tipoAnimalVal}`;

    const nMachosMixtosRaw = getPhEntradaNAnimalesMachosMixtosRaw(frame)!;
    const nMachosMixtosU32 = getPhEntradaNAnimalesMachosMixtosU32(frame)!;
    const nMachosMixtosI32 = getPhEntradaNAnimalesMachosMixtosI32(frame)!;
    const nMachosMixtosF32 = getPhEntradaNAnimalesMachosMixtosF32(frame)!;

    const idCrianza = getPhEntradaIdentificadorCrianzaUnico(frame)!;
    const diaCrianza = getPhEntradaDiaCrianza(frame)!;
    const var1_2 = getPhEntradaVariable1_2(frame)!;

    const nHembrasRaw = getPhEntradaNAnimalesHembrasRaw(frame)!;
    const nHembrasU32 = getPhEntradaNAnimalesHembrasU32(frame)!;

    const var3Raw = getPhEntradaVariable3Raw(frame)!;
    const var3U32 = getPhEntradaVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`idCliente:      ${idCliente}`);

    josLogger.trace(`tipoAnimal:     ${tipoAnimalEnum} (${tipoAnimalVal})`);
    josLogger.trace(`nMach/Mixtos:   raw=${nMachosMixtosRaw.toString('hex')}  u32=${nMachosMixtosU32}  i32=${nMachosMixtosI32}  f32=${Number.isNaN(nMachosMixtosF32) ? 'NaN' : nMachosMixtosF32}`);

    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`variable1_2:    ${var1_2}`);

    josLogger.trace(`nHembras:       raw=${nHembrasRaw.toString('hex')}  u32=${nHembrasU32}`);
    josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
  }
  josLogger.trace(`---------- ↑ DATA (ENTRADA_ANIMALES) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload ALTAS_BAJAS (Omega) ===================

/** Offsets (40B) del payload ALTAS_BAJAS (BE en multibyte; fecha/hora en 3B dd/mm/yy y hh/mm/ss) */
const PH_AB_OFF = {
  mac: 0,                     // +8  -> 8
  tipoDato: 8,                // +1  -> 9
  fecha: 9,                   // +3  -> 12
  hora: 12,                   // +3  -> 15
  idUnico: 15,                // +1  -> 16
  idCliente: 16,              // +2  -> 18 (BE)
  nombreVarAccion: 18,        // +2  -> 20 (BE)
  nMachosMixtos: 20,          // +4  -> 24 (BE)
  idCrianza: 24,              // +4  -> 28 (BE)
  diaCrianza: 28,             // +2  -> 30 (int16 BE)
  variable1_2: 30,            // +2  -> 32 (BE)
  nHembras: 32,               // +4  -> 36 (BE)
  variable3: 36,              // +4  -> 40 (BE / crudo)
} as const;

const PH_AB_TOTAL_LEN = 40;

/** Devuelve el payload ALTAS_BAJAS (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaAltasBajas(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_AB_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (ALTAS_BAJAS) ===================

export function getPhAltasBajasTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt8(PH_AB_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhAltasBajasMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.mac, PH_AB_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhAltasBajasMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_AB_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_AB_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhAltasBajasMacNumber(frame: Buffer): number | undefined {
  const v = getPhAltasBajasMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhAltasBajasFecha(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  const off = PH_AB_OFF.fecha;
  return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
}

export function getPhAltasBajasHora(frame: Buffer) {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  const off = PH_AB_OFF.hora;
  return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
}

export function getPhAltasBajasIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt8(PH_AB_OFF.idUnico);
}

export function getPhAltasBajasIdentificadorCliente(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_AB_OFF.idCliente);
}

export function getPhAltasBajasNombreVariableAccion(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_AB_OFF.nombreVarAccion);
}

export function getPhAltasBajasNombreVariableAccionEnum(frame: Buffer): EnCrianzaAltaBajaAccion | undefined {
  const n = getPhAltasBajasNombreVariableAccion(frame);
  return n === undefined ? undefined : (n as EnCrianzaAltaBajaAccion);
}

/** n_animales_machos_mixtos (Raw 4B). */
export function getPhAltasBajasNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.nMachosMixtos, PH_AB_OFF.nMachosMixtos + 4);
}

/** n_animales_machos_mixtos como UInt32BE. */
export function getPhAltasBajasNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_AB_OFF.nMachosMixtos);
}

/** n_animales_machos_mixtos como Int32BE. */
export function getPhAltasBajasNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readInt32BE(PH_AB_OFF.nMachosMixtos);
}

/** n_animales_machos_mixtos como Float32BE. */
export function getPhAltasBajasNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readFloatBE(PH_AB_OFF.nMachosMixtos);
}

export function getPhAltasBajasIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_AB_OFF.idCrianza);
}

export function getPhAltasBajasDiaCrianza(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readInt16BE(PH_AB_OFF.diaCrianza);
}

export function getPhAltasBajasVariable1_2(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt16BE(PH_AB_OFF.variable1_2);
}

/** n_animales_hembras (Raw 4B). */
export function getPhAltasBajasNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.nHembras, PH_AB_OFF.nHembras + 4);
}

/** n_animales_hembras como UInt32BE. */
export function getPhAltasBajasNAnimalesHembrasU32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_AB_OFF.nHembras);
}

/** variable3 crudo (4B). */
export function getPhAltasBajasVariable3Raw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.variable3, PH_AB_OFF.variable3 + 4);
}

/** variable3 como UInt32BE. */
export function getPhAltasBajasVariable3U32(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.readUInt32BE(PH_AB_OFF.variable3);
}

// =================== Logger (ALTAS_BAJAS) ===================

export function logTramaParametroHistoricoAltasBajasOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame);

  josLogger.trace(`---------- ↓ DATA (ALTAS_BAJAS) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhAltasBajasMacRaw(frame)!;
    const tipoDato = getPhAltasBajasTipoDato(frame)!;

    const fecha = getPhAltasBajasFecha(frame)!;
    const hora = getPhAltasBajasHora(frame)!;

    const idUnico = getPhAltasBajasIdUnico(frame)!;
    const idCliente = getPhAltasBajasIdentificadorCliente(frame)!;

    const accionVal = getPhAltasBajasNombreVariableAccion(frame)!;
    const accionEnum = EnCrianzaAltaBajaAccion[accionVal as EnCrianzaAltaBajaAccion] ?? `${accionVal}`;

    const nMachosRaw = getPhAltasBajasNAnimalesMachosMixtosRaw(frame)!;
    const nMachosU32 = getPhAltasBajasNAnimalesMachosMixtosU32(frame)!;
    const nMachosI32 = getPhAltasBajasNAnimalesMachosMixtosI32(frame)!;
    const nMachosF32 = getPhAltasBajasNAnimalesMachosMixtosF32(frame)!;

    const idCrianza = getPhAltasBajasIdentificadorCrianzaUnico(frame)!;
    const diaCrianza = getPhAltasBajasDiaCrianza(frame)!;
    const var1_2 = getPhAltasBajasVariable1_2(frame)!;

    const nHembrasRaw = getPhAltasBajasNAnimalesHembrasRaw(frame)!;
    const nHembrasU32 = getPhAltasBajasNAnimalesHembrasU32(frame)!;

    const var3Raw = getPhAltasBajasVariable3Raw(frame)!;
    const var3U32 = getPhAltasBajasVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
    josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`idCliente:      ${idCliente}`);

    josLogger.trace(`acción:         ${accionEnum} (${accionVal})`);
    josLogger.trace(`nMach/Mixtos:   raw=${nMachosRaw.toString('hex')}  u32=${nMachosU32}  i32=${nMachosI32}  f32=${Number.isNaN(nMachosF32) ? 'NaN' : nMachosF32}`);

    josLogger.trace(`idCrianza:      ${idCrianza}`);
    josLogger.trace(`diaCrianza:     ${diaCrianza}`);
    josLogger.trace(`variable1_2:    ${var1_2}`);

    josLogger.trace(`nHembras:       raw=${nHembrasRaw.toString('hex')}  u32=${nHembrasU32}`);
    josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
  }
  josLogger.trace(`---------- ↑ DATA (ALTAS_BAJAS) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}


// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


// =================== Payload DEBUG_STRING (Omega) ===================

/** Offsets (40B) del payload DEBUG_STRING */
const PH_DBG_STR_OFF = {
  mac: 0,                 // +8  -> 8
  tipoDato: 8,            // +1  -> 9
  idUnico: 9,             // +1  -> 10
  str: 10,                // +30 -> 40
} as const;

const PH_DBG_STR_TOTAL_LEN = 40;

/** Devuelve el payload DEBUG_STRING (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaDebugString(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_DBG_STR_TOTAL_LEN ? data : undefined;
}

// =================== getters campo a campo (DEBUG_STRING) ===================

export function getPhDebugStringTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.readUInt8(PH_DBG_STR_OFF.tipoDato) as EnTipoDatoDFAccion;
}

export function getPhDebugStringMacRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.subarray(PH_DBG_STR_OFF.mac, PH_DBG_STR_OFF.mac + 8);
}

/** MAC como bigint (0..2^64-1). */
export function getPhDebugStringMacBigInt(frame: Buffer): bigint | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  if (typeof (p as Buffer).readBigUInt64BE === 'function') {
    return p.readBigUInt64BE(PH_DBG_STR_OFF.mac);
  }
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_DBG_STR_OFF.mac + i]);
  return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhDebugStringMacNumber(frame: Buffer): number | undefined {
  const v = getPhDebugStringMacBigInt(frame);
  if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhDebugStringIdUnico(frame: Buffer): number | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.readUInt8(PH_DBG_STR_OFF.idUnico);
}

/** Devuelve los 30 bytes de la cadena (crudo, con posibles ceros de padding). */
export function getPhDebugStringRaw(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.subarray(PH_DBG_STR_OFF.str, PH_DBG_STR_OFF.str + 30);
}

/** Devuelve la cadena interpretada como UTF-8/ASCII, sin ceros finales. */
export function getPhDebugStringTexto(frame: Buffer): string | undefined {
  const raw = getPhDebugStringRaw(frame); if (!raw) return undefined;
  // eliminar padding de ceros al final
  let end = raw.length;
  while (end > 0 && raw[end - 1] === 0x00) end--;
  return raw.subarray(0, end).toString('utf8');
}

// =================== Logger (DEBUG_STRING) ===================

export function logTramaParametroHistoricoDebugStringOmegaDf(frame: Buffer): void {
  // Cabecera común
  logCabeceraComunOld(frame);

  const p = getParametroHistoricoPayloadOmegaDebugString(frame);

  josLogger.trace(`---------- ↓ DATA (DEBUG_STRING) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const macBuf = getPhDebugStringMacRaw(frame)!;
    const tipoDato = getPhDebugStringTipoDato(frame)!;
    const idUnico = getPhDebugStringIdUnico(frame)!;
    const strRaw = getPhDebugStringRaw(frame)!;
    const strTxt = getPhDebugStringTexto(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`debug[hex]:     ${strRaw.toString('hex')}`);
    josLogger.trace(`debug[text]:    "${strTxt}"`);
  }
  josLogger.trace(`---------- ↑ DATA (DEBUG_STRING) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}

