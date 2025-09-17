import { ParametroHistoricoOldDto } from "src/utils/dtoBE/tt_estadisticosOld.dto";
import { EnTipoTramaOld, EnTipoMensajeDispositivoCentral, EnEstadisticosNombres, EnTipoDatoOld, EnTipoAccionAltasBajasRetiradasCrianzaOld, EnTipoAccionInicioFinCrianzaOld, EnTipoDatoDFAccion, EnEventosEstadisFamilia, EnEventosEstadisPropiedades, EnEventosEstadisSubfamilia, EnEventosEstadisTipo, EnCrianzaTipoAnimal, EnCrianzaAltaBajaAccion } from "../globals/enumOld";
import { getTipoTramaOld, getTipoMensajeOld, getDataSectionOld, getCRCFromFrameOld, getEndOld, logCabeceraComunOld } from "./getTrama";
import { josLogger } from "src/utils/josLogger";
import { ParametroHistoricoValorOmegaDfDto } from "src/utils/dtoBE/tt_estadisticosOldDF.dto";
import { EnTextos } from "src/utils/enumTextos";

// ========================= Estadístico OLD (TM_envia_parametro_historico) =========================

// =================== payload selector ===================

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
const ensurePayload = (buf?: Buffer): Buffer | undefined => buf && buf.length >= PH_TOTAL_MIN_LEN ? buf : undefined;

// =================== PAYLOAD HISTÓRICO OLD: capa RAW ===================

export function getParametroHistoricoPayloadOld(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.envioDispositivoFinal) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayload(data);
}

export function getBytesPhTipoDatoOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.tipoDato, PH_OFF.tipoDato + 1);
}
export function getBytesPhFechaOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.fecha, PH_OFF.fecha + 3);
}
export function getBytesPhMacOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.mac, PH_OFF.mac + 8);
}
export function getBytesPhHoraOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.hora, PH_OFF.hora + 3);
}
export function getBytesPhIdUnicoOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.idUnico, PH_OFF.idUnico + 1);
}
export function getBytesPhIdentificadorClienteOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.idCliente, PH_OFF.idCliente + 2);
}
export function getBytesPhNumeroServicioOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.numServicio, PH_OFF.numServicio + 2);
}
export function getBytesPhDatosOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.datos, PH_OFF.datos + 4);
}
export function getBytesPhIdentificadorCrianzaUnicoOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.idCrianza, PH_OFF.idCrianza + 4);
}
export function getBytesPhDiaCrianzaOld(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  return p.subarray(PH_OFF.diaCrianza, PH_OFF.diaCrianza + 2);
}

// =================== PAYLOAD HISTÓRICO OLD: capa VALOR ===================

export function getPhTipoDatoOld(frame: Buffer): EnTipoDatoOld | undefined {
  const b = getBytesPhTipoDatoOld(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoOld;
}
export function getPhFechaOld(frame: Buffer) {
  const b = getBytesPhFechaOld(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhMacOld(frame: Buffer): Buffer | undefined {
  return getBytesPhMacOld(frame);
}
export function getPhHoraOld(frame: Buffer) {
  const b = getBytesPhHoraOld(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhIdUnicoOld(frame: Buffer): number | undefined {
  const b = getBytesPhIdUnicoOld(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhIdentificadorClienteOld(frame: Buffer): number | undefined {
  const b = getBytesPhIdentificadorClienteOld(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhNumeroServicioOld(frame: Buffer): number | undefined {
  const b = getBytesPhNumeroServicioOld(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhDatosRawOld(frame: Buffer): Buffer | undefined {
  return getBytesPhDatosOld(frame);
}
export function getPhDatosValorOld(frame: Buffer): number | Buffer | undefined {
  const tipo = getPhTipoDatoOld(frame); if (tipo === undefined) return undefined;
  const raw = getBytesPhDatosOld(frame); if (!raw) return undefined;
  const asU32 = () => raw.readUInt32BE(0);
  const asI32 = () => raw.readInt32BE(0);
  const asF32 = () => raw.readFloatBE(0);
  switch (tipo) {
    case EnTipoDatoOld.datoEstadisticas:
    case EnTipoDatoOld.cambioParametro:
    case EnTipoDatoOld.cambioParametroValoresCalculados:
      return asF32();
    case EnTipoDatoOld.alarmas:
    case EnTipoDatoOld.tablaLog:
    case EnTipoDatoOld.altasBajasRetiradas:
    case EnTipoDatoOld.inicioFinCrianza:
      return asU32();
    default:
      return raw;
  }
}
export function getPhIdentificadorCrianzaUnicoOld(frame: Buffer): number | undefined {
  const b = getBytesPhIdentificadorCrianzaUnicoOld(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhDiaCrianzaOld(frame: Buffer): number | undefined {
  const b = getBytesPhDiaCrianzaOld(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

// =================== parser y logs ===================

export function parseParametroHistoricoOld(frame: Buffer): ParametroHistoricoOldDto | undefined {
  const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
  const tipoDato = getPhTipoDatoOld(frame)!;
  const fecha = getPhFechaOld(frame)!;
  const mac = getPhMacOld(frame)!;
  const hora = getPhHoraOld(frame)!;
  const identificadorUnicoDentroDelSegundo = getPhIdUnicoOld(frame)!;
  const identificadorCliente = getPhIdentificadorClienteOld(frame)!;
  const numeroServicio = getPhNumeroServicioOld(frame)! as unknown as EnEstadisticosNombres;
  const datos = getPhDatosValorOld(frame) ?? getPhDatosRawOld(frame)!;
  const identificadorCrianzaUnico = getPhIdentificadorCrianzaUnicoOld(frame)!;
  const diaCrianza = getPhDiaCrianzaOld(frame)!;
  return { tipoDato, fecha, mac, hora, identificadorUnicoDentroDelSegundo, identificadorCliente, numeroServicio, datos, identificadorCrianzaUnico, diaCrianza };
}

export function logTramaParametroHistoricoOld(frame: Buffer): void {
  logCabeceraComunOld(frame);
  const p = getParametroHistoricoPayloadOld(frame);
  josLogger.trace(`---------- DATA (OLD) ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o corto>`);
  } else {
    const dto = parseParametroHistoricoOld(frame)!;
    josLogger.trace(`tipoDato:   ${EnTipoDatoOld[dto.tipoDato]} (${dto.tipoDato})`);
    josLogger.trace(`fecha:      ${dto.fecha.dia}-${dto.fecha.mes}-${dto.fecha.anyo}`);
    josLogger.trace(`hora:       ${dto.hora.hora}:${dto.hora.min}:${dto.hora.seg}`);
    josLogger.trace(`mac:        ${typeof dto.mac === "number" ? dto.mac : dto.mac.toString('hex')}`);
    josLogger.trace(`idUnico:    ${dto.identificadorUnicoDentroDelSegundo}`);
    switch (dto.tipoDato) {
      case EnTipoDatoOld.altasBajasRetiradas:
        josLogger.trace(`idCliente:  ${EnTipoAccionAltasBajasRetiradasCrianzaOld[dto.identificadorCliente]}`);
        break;
      case EnTipoDatoOld.inicioFinCrianza:
        josLogger.trace(`idCliente:  ${EnTipoAccionInicioFinCrianzaOld[dto.identificadorCliente]}`);
        break;
      default:
        josLogger.trace(`idCliente:  ${dto.identificadorCliente}`);
        break;
    }
    josLogger.trace(`numServ:    ${dto.tipoDato === EnTipoDatoOld.alarmas ? `${dto.identificadorCliente} (ENUM_textos)` : EnEstadisticosNombres[dto.numeroServicio]}`);
    josLogger.trace(`datos:      ${Buffer.isBuffer(dto.datos) ? dto.datos.toString('hex') : dto.datos}`);
    josLogger.trace(`idCrianza:  ${dto.identificadorCrianzaUnico}`);
    josLogger.trace(`diaCrianza: ${dto.diaCrianza}`);
  }
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}









/** Devuelve el payload de un frame si es TT_envio_dispositivo_final + TM_envia_parametro_historico (o undefined). */
// export function getParametroHistoricoPayloadOld(frame: Buffer): Buffer | undefined {
//   // TT y TM que corresponden al estadístico OLD
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.envioDispositivoFinal) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;

//   const data = getDataSectionOld(frame);
//   return ensurePayload(data);
// }

// // =================== getters campo a campo ===================

// /** Lee el tipo de dato “old” del payload histórico. */
// export function getPhTipoDatoOld(frame: Buffer): EnTipoDatoOld | undefined {
//   const p = getParametroHistoricoPayloadOld(frame);
//   if (!p) return undefined;
//   return p.readUInt8(PH_OFF.tipoDato) as EnTipoDatoOld;
// }

// export function getPhFechaOld(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return readFecha3(p, PH_OFF.fecha);
// }

// export function getPhMacOld(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.subarray(PH_OFF.mac, PH_OFF.mac + 8);
// }

// export function getPhHoraOld(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return readHora3(p, PH_OFF.hora);
// }

// export function getPhIdUnicoOld(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.readUInt8(PH_OFF.idUnico);
// }

// export function getPhIdentificadorClienteOld(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_OFF.idCliente);
// }

// export function getPhNumeroServicioOld(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_OFF.numServicio);
// }

// /** Devuelve los 4 bytes crudos del campo 'datos'. */
// export function getPhDatosRawOld(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.subarray(PH_OFF.datos, PH_OFF.datos + 4);
// }

// /** Interpreta 'datos' (4B BE) según EnTipoDatoOld. Si no reconoce el tipo, devuelve el Buffer crudo. */
// export function getPhDatosValorOld(frame: Buffer): number | Buffer | undefined {
//   const p = getParametroHistoricoPayloadOld(frame);
//   if (!p) return undefined;

//   const tipo = p.readUInt8(PH_OFF.tipoDato) as EnTipoDatoOld;
//   const raw = p.subarray(PH_OFF.datos, PH_OFF.datos + 4);

//   const asU32 = () => raw.readUInt32BE(0);
//   const asI32 = () => raw.readInt32BE(0);
//   const asF32 = () => raw.readFloatBE(0);

//   switch (tipo) {
//     // Valores “sensores/estadísticos”: normalmente float32
//     case EnTipoDatoOld.datoEstadisticas:
//     case EnTipoDatoOld.cambioParametro:
//     case EnTipoDatoOld.cambioParametroValoresCalculados:
//       return asF32();

//     // Cambios de parámetro “calculados”: típicamente float32
//     // return asF32();

//     // Cambio de parámetro “normal”: suele ser entero (enum/escala)
//     // return asI32();

//     // Eventos/identificadores/contadores: mejor como entero sin signo
//     case EnTipoDatoOld.alarmas:
//     case EnTipoDatoOld.tablaLog:
//     case EnTipoDatoOld.altasBajasRetiradas:
//     case EnTipoDatoOld.inicioFinCrianza:
//       return asU32();

//     default:
//       // Desconocido: devolvemos el crudo para no inventar interpretación
//       return raw;
//   }
// }

// export function getPhIdentificadorCrianzaUnicoOld(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_OFF.idCrianza);
// }

// export function getPhDiaCrianzaOld(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_OFF.diaCrianza);
// }

// // =================== parser completo a DTO ===================

// export function parseParametroHistoricoOld(frame: Buffer): ParametroHistoricoOldDto | undefined {
//   const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;

//   const tipoDato = p.readUInt8(PH_OFF.tipoDato);
//   const fecha = readFecha3(p, PH_OFF.fecha);
//   const mac = p.subarray(PH_OFF.mac, PH_OFF.mac + 8); // Buffer crudo (más fiel); si quieres number, conviértelo aparte
//   const hora = readHora3(p, PH_OFF.hora);
//   const identificadorUnicoDentroDelSegundo = p.readUInt8(PH_OFF.idUnico);
//   const identificadorCliente = p.readUInt16BE(PH_OFF.idCliente);
//   const numeroServicio = p.readUInt16BE(PH_OFF.numServicio) as unknown as EnEstadisticosNombres;
//   const datos = getPhDatosValorOld(frame) ?? p.subarray(PH_OFF.datos, PH_OFF.datos + 4);
//   const identificadorCrianzaUnico = p.readUInt32BE(PH_OFF.idCrianza);
//   const diaCrianza = p.readUInt16BE(PH_OFF.diaCrianza);

//   return {
//     tipoDato,
//     fecha,
//     mac,
//     hora,
//     identificadorUnicoDentroDelSegundo,
//     identificadorCliente,
//     numeroServicio,
//     datos,
//     identificadorCrianzaUnico,
//     diaCrianza,
//   };
// }

// // =================== logger opcional (útil en TRACE) ===================

// export function logTramaParametroHistoricoOld(frame: Buffer): void {
//   const hdr = getParsedHeaderOld(frame);
//   const p = getParametroHistoricoPayloadOld(frame);
//   logCabeceraComunOld(frame);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const dto = parseParametroHistoricoOld(frame)!;
//     josLogger.trace(`---------- DATA: ----------`);
//     josLogger.trace(`tipoDato:     ${EnTipoDatoOld[dto.tipoDato]} (${dto.tipoDato})`);
//     josLogger.trace(`fecha:        ${dto.fecha.dia}-${dto.fecha.mes}-${dto.fecha.anyo}  `);
//     josLogger.trace(`hora:         ${dto.hora.hora}:${dto.hora.min}:${dto.hora.seg}`);
//     josLogger.trace(`mac:          ${Buffer.isBuffer(dto.mac) ? dto.mac.toString('hex') : dto.mac}`);
//     josLogger.trace(`idUnico:      ${dto.identificadorUnicoDentroDelSegundo}    `);
//     switch (dto.tipoDato) {
//       case EnTipoDatoOld.datoEstadisticas:
//       case EnTipoDatoOld.cambioParametro:
//       case EnTipoDatoOld.cambioParametroValoresCalculados:
//         josLogger.trace(`idCliente:    ${dto.identificadorCliente}`); //${EnEstadisticosNombres[dto.numeroServicio]}`);
//         break;
//       case EnTipoDatoOld.altasBajasRetiradas:
//         josLogger.trace(`idCliente:    ${EnTipoAccionAltasBajasRetiradasCrianzaOld[dto.identificadorCliente]}`);
//         break;
//       case EnTipoDatoOld.inicioFinCrianza:
//         josLogger.trace(`idCliente:    ${EnTipoAccionInicioFinCrianzaOld[dto.identificadorCliente]}`);
//         break;
//       default:
//         josLogger.trace(`idCliente:    ${dto.identificadorCliente}`); //${EnEstadisticosNombres[dto.numeroServicio]}`);
//         break;
//     }
//     josLogger.trace(`numServicio:  ${dto.tipoDato === EnTipoDatoOld.alarmas ? `${dto.identificadorCliente} (se interpreta según ENUM_textos)` : EnEstadisticosNombres[dto.numeroServicio]}`);
//     josLogger.trace(`datos:        ${Buffer.isBuffer(dto.datos) ? dto.datos.toString('hex') : dto.datos}`);
//     josLogger.trace(`idCrianza:    ${dto.identificadorCrianzaUnico}`);
//     josLogger.trace(`diaCrianza:   ${dto.diaCrianza}`);
//     josLogger.trace(`---------- DATA: ----------`);
//   }
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }

//! Helpers

// const readFecha3 = (b: Buffer, off: number) => ({
//   dia: b.readUInt8(off),
//   mes: b.readUInt8(off + 1),
//   anyo: 2000 + (b.readUInt8(off + 2) % 100), // doc: 0–99; lo elevamos a año 20xx
// });

// const readHora3 = (b: Buffer, off: number) => ({
//   hora: b.readUInt8(off),
//   min: b.readUInt8(off + 1),
//   seg: b.readUInt8(off + 2),
// });

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
const ensurePayloadDf = (buf?: Buffer): Buffer | undefined => buf && buf.length >= PH_DF_TOTAL_MIN_LEN ? buf : undefined;

// =================== PAYLOAD OMEGA DF: capa RAW ===================

export function getParametroHistoricoPayloadOmegaDf(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadDf(data);
}

export function getBytesPhTipoDatoOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.tipoDato, PH_DF_OFF.tipoDato + 1);
}
export function getBytesPhFechaOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.fecha, PH_DF_OFF.fecha + 3);
}
export function getBytesPhMacOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.mac, PH_DF_OFF.mac + 8);
}
export function getBytesPhHoraOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.hora, PH_DF_OFF.hora + 3);
}
export function getBytesPhIdUnicoOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.idUnico, PH_DF_OFF.idUnico + 1);
}
export function getBytesPhIdentificadorClienteOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.idCliente, PH_DF_OFF.idCliente + 2);
}
export function getBytesPhNombreVariableOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.nombreVariable, PH_DF_OFF.nombreVariable + 2);
}
export function getBytesPhValorVariableOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);
}
export function getBytesPhIdentificadorCrianzaUnicoOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.idCrianza, PH_DF_OFF.idCrianza + 4);
}
export function getBytesPhDiaCrianzaOmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.diaCrianza, PH_DF_OFF.diaCrianza + 2);
}
export function getBytesPhVariable1_2OmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.variable1_2, PH_DF_OFF.variable1_2 + 2);
}
export function getBytesPhVariable2OmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.variable2, PH_DF_OFF.variable2 + 4);
}
export function getBytesPhVariable3OmegaDf(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  return p.subarray(PH_DF_OFF.variable3, PH_DF_OFF.variable3 + 4);
}

// =================== PAYLOAD OMEGA DF: capa VALOR ===================

export function getPhTipoDatoOmegaDf(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhTipoDatoOmegaDf(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhFechaOmegaDf(frame: Buffer) {
  const b = getBytesPhFechaOmegaDf(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhMacOmegaDf(frame: Buffer): Buffer | undefined {
  return getBytesPhMacOmegaDf(frame);
}
export function getPhHoraOmegaDf(frame: Buffer) {
  const b = getBytesPhHoraOmegaDf(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhIdUnicoOmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhIdUnicoOmegaDf(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhIdentificadorClienteOmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhIdentificadorClienteOmegaDf(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhNombreVariableOmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhNombreVariableOmegaDf(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhValorRawOmegaDf(frame: Buffer): Buffer | undefined {
  return getBytesPhValorVariableOmegaDf(frame);
}
export function getPhValorSegunTipoOmegaDf(frame: Buffer): number | Buffer | undefined {
  const tipo = getPhTipoDatoOmegaDf(frame); if (tipo === undefined) return undefined;
  const raw = getBytesPhValorVariableOmegaDf(frame); if (!raw) return undefined;

  const asU32 = () => raw.readUInt32BE(0);
  const asI32 = () => raw.readInt32BE(0);
  const asF32 = () => raw.readFloatBE(0);
  const b0 = raw.readUInt8(0), b1 = raw.readUInt8(1), b2 = raw.readUInt8(2);

  switch (tipo) {
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

    case EnTipoDatoDFAccion.alarmas:
    case EnTipoDatoDFAccion.warning:
    case EnTipoDatoDFAccion.altasBajas:
    case EnTipoDatoDFAccion.entradaAnimales:
    case EnTipoDatoDFAccion.inicioCrianza:
    case EnTipoDatoDFAccion.finCrianza:
    case EnTipoDatoDFAccion.cambioParametroSincronizacion:
      return asU32();

    case EnTipoDatoDFAccion.cambioParametroTiempo:
    case EnTipoDatoDFAccion.estadisticoTiempo:
      return b0 * 3600 + b1 * 60 + b2;
    case EnTipoDatoDFAccion.cambioParametroTiempoHM:
    case EnTipoDatoDFAccion.estadisticoTiempoHM:
      return b0 * 60 + b1;
    case EnTipoDatoDFAccion.cambioParametroTiempoMS:
    case EnTipoDatoDFAccion.estadisticoTiempoMS:
      return b0 * 3600 + b1 * 60 + b2;
    case EnTipoDatoDFAccion.cambioParametroFecha:
    case EnTipoDatoDFAccion.estadisticoFecha: {
      const yyyy = 2000 + (b2 % 100);
      return yyyy * 10000 + b1 * 100 + b0;
    }

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

    case EnTipoDatoDFAccion.estadisticoGenerico:
      return asF32();

    default:
      return raw;
  }
}
export function getPhIdentificadorCrianzaUnicoOmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhIdentificadorCrianzaUnicoOmegaDf(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhDiaCrianzaOmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhDiaCrianzaOmegaDf(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhVariable1_2OmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhVariable1_2OmegaDf(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhVariable2OmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhVariable2OmegaDf(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhVariable3OmegaDf(frame: Buffer): number | undefined {
  const b = getBytesPhVariable3OmegaDf(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== parser y log (usando capa VALOR) ===================

export function parseParametroHistoricoValorOmegaDf(frame: Buffer): ParametroHistoricoValorOmegaDfDto | undefined {
  const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
  const tipoDato = getPhTipoDatoOmegaDf(frame)!;
  const fecha = getPhFechaOmegaDf(frame)!;
  const mac = getPhMacOmegaDf(frame)!;
  const hora = getPhHoraOmegaDf(frame)!;
  const identificadorUnicoDentroDelSegundo = getPhIdUnicoOmegaDf(frame)!;
  const identificadorCliente = getPhIdentificadorClienteOmegaDf(frame)!;
  const nombreVariable = getPhNombreVariableOmegaDf(frame)!;
  const valorVariable = getPhValorSegunTipoOmegaDf(frame) ?? getPhValorRawOmegaDf(frame)!;
  const identificadorCrianzaUnico = getPhIdentificadorCrianzaUnicoOmegaDf(frame)!;
  const variable1DiaCrianza = getPhDiaCrianzaOmegaDf(frame)!;
  const variable1_2 = getPhVariable1_2OmegaDf(frame)!;
  const variable2 = getPhVariable2OmegaDf(frame)!;
  const variable3 = getPhVariable3OmegaDf(frame)!;
  return { tipoDato, fecha, mac, hora, identificadorUnicoDentroDelSegundo, identificadorCliente, nombreVariable, valorVariable, identificadorCrianzaUnico, variable1DiaCrianza, variable1_2, variable2, variable3 };
}

export function logTramaParametroHistoricoOmegaDf(frame: Buffer): void {
  logCabeceraComunOld(frame);
  const p = getParametroHistoricoPayloadOmegaDf(frame);
  josLogger.trace(`---------- ↓ DATA ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
    const dto = parseParametroHistoricoValorOmegaDf(frame)!;
    josLogger.trace(`len(payload): ${p.length}`);
    // josLogger.trace(`mac:          ${dto.mac.toString('hex')}`);
    josLogger.trace(`mac:          ${typeof dto.mac === "number" ? dto.mac : dto.mac.toString('hex')}`);
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


// /** Devuelve el payload DF (40B) de un frame si es TT_omegaPantallaPlaca + TM_envia_parametro_historico (o undefined). */
// export function getParametroHistoricoPayloadOmegaDf(frame: Buffer): Buffer | undefined {
//   // TT y TM que corresponden al estadístico Omega DF
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;

//   const data = getDataSectionOld(frame);
//   return ensurePayloadDf(data);
// }

// // =================== getters campo a campo (Omega DF) ===================

// /** Lee el tipo de dato DF del payload histórico. */
// export function getPhTipoDatoOmegaDf(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame);
//   if (!p) return undefined;
//   return p.readUInt8(PH_DF_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhFechaOmegaDf(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return readFecha3Df(p, PH_DF_OFF.fecha);
// }

// export function getPhMacOmegaDf(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.subarray(PH_DF_OFF.mac, PH_DF_OFF.mac + 8);
// }

// export function getPhHoraOmegaDf(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return readHora3Df(p, PH_DF_OFF.hora);
// }

// export function getPhIdUnicoOmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt8(PH_DF_OFF.idUnico);
// }

// export function getPhIdentificadorClienteOmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_DF_OFF.idCliente);
// }

// export function getPhNombreVariableOmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_DF_OFF.nombreVariable);
// }

// /** Devuelve los 4 bytes crudos del campo 'valorVariable'. */
// export function getPhValorRawOmegaDf(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);
// }

// /** Interpreta 'valorVariable' (4B BE) según EnTipoDatoDFAccion. Si no reconoce el tipo, devuelve el Buffer crudo. */
// export function getPhValorSegunTipoOmegaDf(frame: Buffer): number | Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame);
//   if (!p) return undefined;

//   const tipo = p.readUInt8(PH_DF_OFF.tipoDato) as EnTipoDatoDFAccion;
//   const raw = p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);

//   const asU32 = () => raw.readUInt32BE(0);
//   const asI32 = () => raw.readInt32BE(0);
//   const asF32 = () => raw.readFloatBE(0);

//   const b0 = raw.readUInt8(0);
//   const b1 = raw.readUInt8(1);
//   const b2 = raw.readUInt8(2);

//   switch (tipo) {
//     // Estadísticos (numéricos)
//     case EnTipoDatoDFAccion.estadisticoUint8: return raw.readUInt8(3);
//     case EnTipoDatoDFAccion.estadisticoInt8: return raw.readInt8(3);
//     case EnTipoDatoDFAccion.estadisticoUint16: return raw.readUInt16BE(2);
//     case EnTipoDatoDFAccion.estadisticoInt16: return raw.readInt16BE(2);
//     case EnTipoDatoDFAccion.estadisticoUint32: return asU32();
//     case EnTipoDatoDFAccion.estadisticoInt32: return asI32();
//     case EnTipoDatoDFAccion.estadisticoFloat0:
//     case EnTipoDatoDFAccion.estadisticoFloat1:
//     case EnTipoDatoDFAccion.estadisticoFloat2:
//     case EnTipoDatoDFAccion.estadisticoFloat3: return asF32();

//     // Cambios de parámetro (numéricos)
//     case EnTipoDatoDFAccion.cambioParametroUint8: return raw.readUInt8(3);
//     case EnTipoDatoDFAccion.cambioParametroInt8: return raw.readInt8(3);
//     case EnTipoDatoDFAccion.cambioParametroUint16: return raw.readUInt16BE(2);
//     case EnTipoDatoDFAccion.cambioParametroInt16: return raw.readInt16BE(2);
//     case EnTipoDatoDFAccion.cambioParametroUint32: return asU32();
//     case EnTipoDatoDFAccion.cambioParametroInt32: return asI32();
//     case EnTipoDatoDFAccion.cambioParametroFloat0:
//     case EnTipoDatoDFAccion.cambioParametroFloat1:
//     case EnTipoDatoDFAccion.cambioParametroFloat2:
//     case EnTipoDatoDFAccion.cambioParametroFloat3: return asF32();

//     // Alarmas / eventos simples
//     case EnTipoDatoDFAccion.alarmas:
//     case EnTipoDatoDFAccion.warning:
//     case EnTipoDatoDFAccion.altasBajas:
//     case EnTipoDatoDFAccion.entradaAnimales:
//     case EnTipoDatoDFAccion.inicioCrianza:
//     case EnTipoDatoDFAccion.finCrianza:
//     case EnTipoDatoDFAccion.cambioParametroSincronizacion:
//       return asU32();

//     // Tiempos / Fechas
//     case EnTipoDatoDFAccion.cambioParametroTiempo:
//     case EnTipoDatoDFAccion.estadisticoTiempo: {
//       const hh = b0, mm = b1, ss = b2;
//       return hh * 3600 + mm * 60 + ss;
//     }
//     case EnTipoDatoDFAccion.cambioParametroTiempoHM:
//     case EnTipoDatoDFAccion.estadisticoTiempoHM: {
//       const hh = b0, mm = b1;
//       return hh * 60 + mm;
//     }
//     case EnTipoDatoDFAccion.cambioParametroTiempoMS:
//     case EnTipoDatoDFAccion.estadisticoTiempoMS: {
//       const hh = b0, mm = b1, ss = b2; // si HH=0, queda en MM:SS
//       return hh * 3600 + mm * 60 + ss;
//     }
//     case EnTipoDatoDFAccion.cambioParametroFecha:
//     case EnTipoDatoDFAccion.estadisticoFecha: {
//       const dd = b0, mm = b1, yy = b2 % 100;
//       const yyyy = 2000 + yy;
//       return yyyy * 10000 + mm * 100 + dd; // YYYYMMDD
//     }

//     // Cadenas / compuestos / debug → devolver crudo
//     case EnTipoDatoDFAccion.estadisticoString:
//     case EnTipoDatoDFAccion.cambioParametroString:
//     case EnTipoDatoDFAccion.cambioParametroTexto:
//     case EnTipoDatoDFAccion.datosEbusFinales:
//     case EnTipoDatoDFAccion.debugString:
//     case EnTipoDatoDFAccion.pdDatoCompuestoInicio:
//     case EnTipoDatoDFAccion.pdDatoCompuesto:
//     case EnTipoDatoDFAccion.eventoConcatenado:
//     case EnTipoDatoDFAccion.cambioParametroConcatenado:
//     case EnTipoDatoDFAccion.evento:
//     case EnTipoDatoDFAccion.reservadoSt:
//       return raw;

//     // Genérico: asumir float
//     case EnTipoDatoDFAccion.estadisticoGenerico:
//       return asF32();

//     default:
//       return raw; // desconocido: devolvemos crudo para no inventar interpretación
//   }
// }

// export function getPhIdentificadorCrianzaUnicoOmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_DF_OFF.idCrianza);
// }

// export function getPhDiaCrianzaOmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_DF_OFF.diaCrianza);
// }

// export function getPhVariable1_2OmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_DF_OFF.variable1_2);
// }

// export function getPhVariable2OmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_DF_OFF.variable2);
// }

// export function getPhVariable3OmegaDf(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_DF_OFF.variable3);
// }

// // =================== parser completo a DTO (Omega DF) ===================

// export function parseParametroHistoricoValorOmegaDf(frame: Buffer): ParametroHistoricoValorOmegaDfDto | undefined {
//   const p = getParametroHistoricoPayloadOmegaDf(frame); if (!p) return undefined;

//   const tipoDato = p.readUInt8(PH_DF_OFF.tipoDato) as EnTipoDatoDFAccion;
//   const fecha = readFecha3Df(p, PH_DF_OFF.fecha);
//   const mac = p.subarray(PH_DF_OFF.mac, PH_DF_OFF.mac + 8); // Buffer crudo (más fiel); si lo quieres number/bigint, conviértelo aparte
//   const hora = readHora3Df(p, PH_DF_OFF.hora);
//   const identificadorUnicoDentroDelSegundo = p.readUInt8(PH_DF_OFF.idUnico);
//   const identificadorCliente = p.readUInt16BE(PH_DF_OFF.idCliente);
//   const nombreVariable = p.readUInt16BE(PH_DF_OFF.nombreVariable);
//   const valorVariable = getPhValorSegunTipoOmegaDf(frame) ?? p.subarray(PH_DF_OFF.valorVariable, PH_DF_OFF.valorVariable + 4);
//   const identificadorCrianzaUnico = p.readUInt32BE(PH_DF_OFF.idCrianza);
//   const variable1DiaCrianza = p.readInt16BE(PH_DF_OFF.diaCrianza);
//   const variable1_2 = p.readUInt16BE(PH_DF_OFF.variable1_2);
//   const variable2 = p.readUInt32BE(PH_DF_OFF.variable2);
//   const variable3 = p.readUInt32BE(PH_DF_OFF.variable3);

//   return {
//     tipoDato,
//     fecha,
//     mac,
//     hora,
//     identificadorUnicoDentroDelSegundo,
//     identificadorCliente,
//     nombreVariable,
//     valorVariable,
//     identificadorCrianzaUnico,
//     variable1DiaCrianza,
//     variable1_2,
//     variable2,
//     variable3,
//   };
// }

// // =================== logger opcional (útil en TRACE) ===================

// export function logTramaParametroHistoricoOmegaDf(frame: Buffer): void {
//   const hdr = getParsedHeaderOld(frame);
//   const p = getParametroHistoricoPayloadOmegaDf(frame);
//   logCabeceraComunOld(frame);

//   josLogger.trace(`---------- ↓ DATA ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const dto = parseParametroHistoricoValorOmegaDf(frame)!;
//     josLogger.trace(`len(payload): ${p.length}`);
//     josLogger.trace(`mac:          ${Buffer.isBuffer(dto.mac) ? (dto.mac as Buffer).toString('hex') : dto.mac}`);
//     josLogger.trace(`tipoDato:     ${EnTipoDatoDFAccion[dto.tipoDato]} (${dto.tipoDato})`);
//     josLogger.trace(`fecha:        ${dto.fecha.dia}-${dto.fecha.mes}-${dto.fecha.anyo}`);
//     josLogger.trace(`hora:         ${dto.hora.hora}:${dto.hora.min}:${dto.hora.seg}`);
//     josLogger.trace(`idUnico:      ${dto.identificadorUnicoDentroDelSegundo}`);
//     josLogger.trace(`idCliente:    ${dto.identificadorCliente}`);
//     josLogger.trace(`nombreVar:    ${EnEstadisticosNombres[dto.nombreVariable]}`);
//     josLogger.trace(`valorVar:     ${Buffer.isBuffer(dto.valorVariable) ? (dto.valorVariable as Buffer).toString('hex') : dto.valorVariable}`);
//     josLogger.trace(`idCrianza:    ${dto.identificadorCrianzaUnico}`);
//     josLogger.trace(`diaCrianza:   ${dto.variable1DiaCrianza}`);
//     josLogger.trace(`variable1_2:  ${dto.variable1_2}`);
//     josLogger.trace(`variable2:    ${dto.variable2}`);
//     josLogger.trace(`variable3:    ${dto.variable3}`);
//   }
//   josLogger.trace(`---------- ↑ DATA ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }

//! Helpers (Omega DF)

// const readFecha3Df = (b: Buffer, off: number) => ({
//   dia: b.readUInt8(off),
//   mes: b.readUInt8(off + 1),
//   anyo: 2000 + (b.readUInt8(off + 2) % 100), // doc: 0–99; lo elevamos a año 20xx
// });

// const readHora3Df = (b: Buffer, off: number) => ({
//   hora: b.readUInt8(off),
//   min: b.readUInt8(off + 1),
//   seg: b.readUInt8(off + 2),
// });

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

const ensurePayloadEvento = (buf?: Buffer): Buffer | undefined => buf && buf.length >= PH_EVT_TOTAL_LEN ? buf : undefined;

// =================== Payload EVENTO (Omega) – Capa RAW ===================

/** Devuelve el payload EVENTO (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEvento(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadEvento(data);
}

// Bytes por campo
export function getBytesPhEventoTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.tipoDato, PH_EVT_OFF.tipoDato + 1);
}
export function getBytesPhEventoMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.mac, PH_EVT_OFF.mac + 8);
}
export function getBytesPhEventoIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.idUnico, PH_EVT_OFF.idUnico + 1);
}
export function getBytesPhEventoVersionEstructura(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.versionEstructura, PH_EVT_OFF.versionEstructura + 1);
}
export function getBytesPhEventoTipo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.tipo, PH_EVT_OFF.tipo + 1);
}
export function getBytesPhEventoFamilia(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.familia, PH_EVT_OFF.familia + 2);
}
export function getBytesPhEventoSubfamilia(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.subfamilia, PH_EVT_OFF.subfamilia + 1);
}
export function getBytesPhEventoReserva1(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.reserva1, PH_EVT_OFF.reserva1 + 1);
}
export function getBytesPhEventoPropiedades(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.propiedades, PH_EVT_OFF.propiedades + 2);
}
export function getBytesPhEventoFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.fecha, PH_EVT_OFF.fecha + 3);
}
export function getBytesPhEventoHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.hora, PH_EVT_OFF.hora + 3);
}
export function getBytesPhEventoNombreVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.nombreVariable, PH_EVT_OFF.nombreVariable + 2);
}
export function getBytesPhEventoDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.diaCrianza, PH_EVT_OFF.diaCrianza + 2);
}
export function getBytesPhEventoIdCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.idCrianza, PH_EVT_OFF.idCrianza + 4);
}
export function getBytesPhEventoReserva(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_OFF.reserva, PH_EVT_OFF.reserva + 8);
}

// =================== Payload EVENTO (Omega) – Capa VALOR ===================

export function getPhEventoTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhEventoTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhEventoMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEventoMac(frame);
}
/** MAC como bigint (0..2^64-1). */
export function getPhEventoMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhEventoMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
/** MAC como number si es seguro (<= 2^53-1). */
export function getPhEventoMacNumber(frame: Buffer): number | undefined {
  const v = getPhEventoMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhEventoIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEventoIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEventoVersionEstructura(frame: Buffer): number | undefined {
  const b = getBytesPhEventoVersionEstructura(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEventoTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
  const b = getBytesPhEventoTipo(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnEventosEstadisTipo;
}
export function getPhEventoFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
  const b = getBytesPhEventoFamilia(frame); if (!b) return undefined;
  return b.readUInt16BE(0) as EnEventosEstadisFamilia;
}
export function getPhEventoSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
  const b = getBytesPhEventoSubfamilia(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnEventosEstadisSubfamilia;
}
export function getPhEventoReserva1(frame: Buffer): number | undefined {
  const b = getBytesPhEventoReserva1(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEventoPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
  const b = getBytesPhEventoPropiedades(frame); if (!b) return undefined;
  return b.readUInt16BE(0) as EnEventosEstadisPropiedades;
}
export function getPhEventoFecha(frame: Buffer) {
  const b = getBytesPhEventoFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhEventoHora(frame: Buffer) {
  const b = getBytesPhEventoHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhEventoNombreVariable(frame: Buffer): number | undefined {
  const b = getBytesPhEventoNombreVariable(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEventoDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhEventoDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhEventoIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEventoIdCrianza(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEventoReservaRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEventoReserva(frame);
}

// =================== Logger ===================

export function logTramaParametroHistoricoEventoOmegaDf(frame: Buffer): void {
  const p = getParametroHistoricoPayloadOmegaEvento(frame);
  logCabeceraComunOld(frame);

  josLogger.trace(`---------- ↓ DATA (EVENTO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
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

/** Devuelve el payload EVENTO (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaEvento(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return ensurePayloadEvento(data);
// }

// // =================== getters campo a campo (EVENTO) ===================

// export function getPhEventoTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhEventoMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.subarray(PH_EVT_OFF.mac, PH_EVT_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhEventoMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_EVT_OFF.mac);
//   }
//   // Fallback manual (compatible sin usar `any`)
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EVT_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhEventoMacNumber(frame: Buffer): number | undefined {
//   const v = getPhEventoMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhEventoIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_OFF.idUnico);
// }

// export function getPhEventoVersionEstructura(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_OFF.versionEstructura);
// }

// export function getPhEventoTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_OFF.tipo) as EnEventosEstadisTipo;
// }

// export function getPhEventoFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_OFF.familia) as EnEventosEstadisFamilia;
// }

// export function getPhEventoSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_OFF.subfamilia) as EnEventosEstadisSubfamilia;
// }

// export function getPhEventoReserva1(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_OFF.reserva1);
// }

// export function getPhEventoPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_OFF.propiedades) as EnEventosEstadisPropiedades;
// }

// export function getPhEventoFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return readFecha3Evt(p, PH_EVT_OFF.fecha);
// }

// export function getPhEventoHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return readHora3Evt(p, PH_EVT_OFF.hora);
// }

// export function getPhEventoNombreVariable(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_OFF.nombreVariable);
// }

// export function getPhEventoDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_EVT_OFF.diaCrianza);
// }

// export function getPhEventoIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_EVT_OFF.idCrianza);
// }

// export function getPhEventoReservaRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEvento(frame); if (!p) return undefined;
//   return p.subarray(PH_EVT_OFF.reserva, PH_EVT_OFF.reserva + 8);
// }

// export function logTramaParametroHistoricoEventoOmegaDf(frame: Buffer): void {
//   const hdr = getParsedHeaderOld(frame);
//   const p = getParametroHistoricoPayloadOmegaEvento(frame);

//   logCabeceraComunOld(frame);

//   josLogger.trace(`---------- ↓ DATA (EVENTO) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     // Construimos dto vía getters de EVENTO
//     const macBuf = getPhEventoMacRaw(frame)!;
//     const tipoDato = getPhEventoTipoDato(frame)!;
//     const idUnico = getPhEventoIdUnico(frame)!;
//     const verStruct = getPhEventoVersionEstructura(frame)!;
//     const tipo = getPhEventoTipo(frame)!;
//     const familia = getPhEventoFamilia(frame)!;
//     const subfamilia = getPhEventoSubfamilia(frame)!;
//     const reserva1 = getPhEventoReserva1(frame)!;
//     const propiedades = getPhEventoPropiedades(frame)!;
//     const fecha = getPhEventoFecha(frame)!;
//     const hora = getPhEventoHora(frame)!;
//     const nombreVariable = getPhEventoNombreVariable(frame)!;
//     const diaCrianza = getPhEventoDiaCrianza(frame)!;
//     const idCrianza = getPhEventoIdentificadorCrianzaUnico(frame)!;
//     const reserva = getPhEventoReservaRaw(frame)!;

//     const propHex = propiedades.toString(16).padStart(4, '0');

//     josLogger.trace(`len(payload): ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`verEstructura:  ${verStruct}`);
//     josLogger.trace(`tipoEvento:     ${EnEventosEstadisTipo[tipo]} (${tipo})`);
//     josLogger.trace(`familia:        ${EnEventosEstadisFamilia[familia]} (${familia})`);
//     josLogger.trace(`subfamilia:     ${EnEventosEstadisSubfamilia[subfamilia]} (${subfamilia})`);
//     josLogger.trace(`reserva1:       ${reserva1}`);
//     josLogger.trace(`propiedades:    0x${propHex} (${propiedades})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`nombreVar:      ${EnTextos[nombreVariable]} (${nombreVariable})`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`reserva[8]:     ${reserva.toString('hex')}`);
//   }
//   josLogger.trace(`---------- ↑ DATA (EVENTO) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }

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

const ensurePayloadEventoConcatenado = (buf?: Buffer): Buffer | undefined =>buf && buf.length >= PH_EVT_CONCAT_TOTAL_LEN ? buf : undefined;

// =================== Payload EVENTO_CONCATENADO (Omega) – Capa RAW ===================

export function getParametroHistoricoPayloadOmegaEventoConcatenado(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadEventoConcatenado(data);
}

// Bytes por campo
export function getBytesPhEvtConcatTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.tipoDato, PH_EVT_CONCAT_OFF.tipoDato + 1);
}
export function getBytesPhEvtConcatMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.mac, PH_EVT_CONCAT_OFF.mac + 8);
}
export function getBytesPhEvtConcatIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.idUnico, PH_EVT_CONCAT_OFF.idUnico + 1);
}
export function getBytesPhEvtConcatVersionConcatenada(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.versionConcatenada, PH_EVT_CONCAT_OFF.versionConcatenada + 2);
}
export function getBytesPhEvtConcatTipo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.tipo, PH_EVT_CONCAT_OFF.tipo + 1);
}
export function getBytesPhEvtConcatSubfamilia(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.subfamilia, PH_EVT_CONCAT_OFF.subfamilia + 1);
}
export function getBytesPhEvtConcatFamilia(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.familia, PH_EVT_CONCAT_OFF.familia + 2);
}
export function getBytesPhEvtConcatPropiedades(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.propiedades, PH_EVT_CONCAT_OFF.propiedades + 2);
}
export function getBytesPhEvtConcatNombreAlarma(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.nombreAlarma, PH_EVT_CONCAT_OFF.nombreAlarma + 2);
}
export function getBytesPhEvtConcatFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.fecha, PH_EVT_CONCAT_OFF.fecha + 3);
}
export function getBytesPhEvtConcatHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.hora, PH_EVT_CONCAT_OFF.hora + 3);
}
export function getBytesPhEvtConcatDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.diaCrianza, PH_EVT_CONCAT_OFF.diaCrianza + 2);
}
export function getBytesPhEvtConcatIdCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.idCrianza, PH_EVT_CONCAT_OFF.idCrianza + 4);
}
export function getBytesPhEvtConcatReserva(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.reserva, PH_EVT_CONCAT_OFF.reserva + 1);
}
export function getBytesPhEvtConcatNumeroBytesCadena(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.nBytes, PH_EVT_CONCAT_OFF.nBytes + 1);
}
export function getBytesPhEvtConcatCadenaArea(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_EVT_CONCAT_OFF.cadena, PH_EVT_CONCAT_OFF.cadena + PH_EVT_CONCAT_CADENA_MAX);
}
export function getBytesPhEvtConcatCadenaValida(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
  const n = Math.min(p.readUInt8(PH_EVT_CONCAT_OFF.nBytes), PH_EVT_CONCAT_CADENA_MAX);
  return p.subarray(PH_EVT_CONCAT_OFF.cadena, PH_EVT_CONCAT_OFF.cadena + n);
}

// =================== Payload EVENTO_CONCATENADO (Omega) – Capa VALOR ===================

export function getPhEvtConcatTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhEvtConcatTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhEvtConcatMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEvtConcatMac(frame);
}
export function getPhEvtConcatMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhEvtConcatMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
export function getPhEvtConcatMacNumber(frame: Buffer): number | undefined {
  const v = getPhEvtConcatMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhEvtConcatIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEvtConcatVersionConcatenada(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatVersionConcatenada(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEvtConcatTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
  const b = getBytesPhEvtConcatTipo(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnEventosEstadisTipo;
}
export function getPhEvtConcatSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
  const b = getBytesPhEvtConcatSubfamilia(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnEventosEstadisSubfamilia;
}
export function getPhEvtConcatFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
  const b = getBytesPhEvtConcatFamilia(frame); if (!b) return undefined;
  return b.readUInt16BE(0) as EnEventosEstadisFamilia;
}
export function getPhEvtConcatPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
  const b = getBytesPhEvtConcatPropiedades(frame); if (!b) return undefined;
  return b.readUInt16BE(0) as EnEventosEstadisPropiedades;
}
export function getPhEvtConcatNombreAlarma(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatNombreAlarma(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEvtConcatFecha(frame: Buffer) {
  const b = getBytesPhEvtConcatFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhEvtConcatHora(frame: Buffer) {
  const b = getBytesPhEvtConcatHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhEvtConcatDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhEvtConcatIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatIdCrianza(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEvtConcatReserva(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatReserva(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEvtConcatNumeroBytesCadena(frame: Buffer): number | undefined {
  const b = getBytesPhEvtConcatNumeroBytesCadena(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEvtConcatCadenaRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEvtConcatCadenaArea(frame);
}
export function getPhEvtConcatCadenaValidaRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEvtConcatCadenaValida(frame);
}
export function getPhEvtConcatCadenaUtf16(frame: Buffer): string | undefined {
  const raw = getBytesPhEvtConcatCadenaValida(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1;
  return raw.subarray(0, nEven).toString('utf16le');
}

// =================== Logger (EVENTO_CONCATENADO) ===================

export function logTramaParametroHistoricoEventoConcatenadoOmegaDf(frame: Buffer): void {
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

/** Devuelve el payload EVENTO_CONCATENADO (114B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaEventoConcatenado(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return ensurePayloadEventoConcatenado(data);
// }

// // =================== getters campo a campo (EVENTO_CONCATENADO) ===================

// export function getPhEvtConcatTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_CONCAT_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhEvtConcatMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.subarray(PH_EVT_CONCAT_OFF.mac, PH_EVT_CONCAT_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhEvtConcatMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_EVT_CONCAT_OFF.mac);
//   }
//   // Fallback manual
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EVT_CONCAT_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhEvtConcatMacNumber(frame: Buffer): number | undefined {
//   const v = getPhEvtConcatMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhEvtConcatIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_CONCAT_OFF.idUnico);
// }

// export function getPhEvtConcatVersionConcatenada(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_CONCAT_OFF.versionConcatenada);
// }

// export function getPhEvtConcatTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_CONCAT_OFF.tipo) as EnEventosEstadisTipo;
// }

// export function getPhEvtConcatSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_CONCAT_OFF.subfamilia) as EnEventosEstadisSubfamilia;
// }

// export function getPhEvtConcatFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_CONCAT_OFF.familia) as EnEventosEstadisFamilia;
// }

// export function getPhEvtConcatPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_CONCAT_OFF.propiedades) as EnEventosEstadisPropiedades;
// }

// export function getPhEvtConcatNombreAlarma(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EVT_CONCAT_OFF.nombreAlarma);
// }

// export function getPhEvtConcatFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return readFecha3EvtConcat(p, PH_EVT_CONCAT_OFF.fecha);
// }

// export function getPhEvtConcatHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return readHora3EvtConcat(p, PH_EVT_CONCAT_OFF.hora);
// }

// export function getPhEvtConcatDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_EVT_CONCAT_OFF.diaCrianza);
// }

// export function getPhEvtConcatIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_EVT_CONCAT_OFF.idCrianza);
// }

// export function getPhEvtConcatReserva(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_CONCAT_OFF.reserva);
// }

// export function getPhEvtConcatNumeroBytesCadena(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EVT_CONCAT_OFF.nBytes);
// }

// /** Devuelve los 80 bytes reservados para la cadena (sin recortar por nBytes). */
// export function getPhEvtConcatCadenaRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   return p.subarray(PH_EVT_CONCAT_OFF.cadena, PH_EVT_CONCAT_OFF.cadena + PH_EVT_CONCAT_CADENA_MAX);
// }

// /** Devuelve solo los `nBytes` válidos de la cadena (recortados a 0..80). */
// export function getPhEvtConcatCadenaValidaRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame); if (!p) return undefined;
//   const n = Math.min(p.readUInt8(PH_EVT_CONCAT_OFF.nBytes), PH_EVT_CONCAT_CADENA_MAX);
//   return p.subarray(PH_EVT_CONCAT_OFF.cadena, PH_EVT_CONCAT_OFF.cadena + n);
// }

// /** Decodifica la cadena válida como UTF-16LE (si nBytes es impar, recorta el último byte). */
// export function getPhEvtConcatCadenaUtf16(frame: Buffer): string | undefined {
//   const raw = getPhEvtConcatCadenaValidaRaw(frame); if (!raw) return undefined;
//   const nEven = raw.length & ~1; // asegurar múltiplo de 2
//   return raw.subarray(0, nEven).toString('utf16le');
// }

// // =================== Logger (EVENTO_CONCATENADO) ===================

// export function logTramaParametroHistoricoEventoConcatenadoOmegaDf(frame: Buffer): void {
//   const hdr = getParsedHeaderOld(frame);
//   const p = getParametroHistoricoPayloadOmegaEventoConcatenado(frame);

//   logCabeceraComunOld(frame);

//   josLogger.trace(`---------- ↓ DATA (EVENTO_CONCATENADO) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhEvtConcatMacRaw(frame)!;
//     const tipoDato = getPhEvtConcatTipoDato(frame)!;
//     const idUnico = getPhEvtConcatIdUnico(frame)!;
//     const verConcat = getPhEvtConcatVersionConcatenada(frame)!;
//     const tipo = getPhEvtConcatTipo(frame)!;
//     const familia = getPhEvtConcatFamilia(frame)!;
//     const subfamilia = getPhEvtConcatSubfamilia(frame)!;
//     const propiedades = getPhEvtConcatPropiedades(frame)!;
//     const nombreAlarma = getPhEvtConcatNombreAlarma(frame)!;
//     const fecha = getPhEvtConcatFecha(frame)!;
//     const hora = getPhEvtConcatHora(frame)!;
//     const diaCrianza = getPhEvtConcatDiaCrianza(frame)!;
//     const idCrianza = getPhEvtConcatIdentificadorCrianzaUnico(frame)!;
//     const reserva = getPhEvtConcatReserva(frame)!;
//     const nBytes = getPhEvtConcatNumeroBytesCadena(frame)!;
//     const cadenaRaw = getPhEvtConcatCadenaValidaRaw(frame)!;
//     const cadenaUtf16 = getPhEvtConcatCadenaUtf16(frame)!;

//     const propHex = propiedades.toString(16).padStart(4, '0');

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`verConcatenada: ${verConcat}`);
//     josLogger.trace(`tipo:           ${EnEventosEstadisTipo[tipo]} (${tipo})`);
//     josLogger.trace(`familia:        ${EnEventosEstadisFamilia[familia]} (${familia})`);
//     josLogger.trace(`subfamilia:     ${EnEventosEstadisSubfamilia[subfamilia]} (${subfamilia})`);
//     josLogger.trace(`propiedades:    0x${propHex} (${propiedades})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`nombreAlarma:   ${EnTextos[nombreAlarma]} (${nombreAlarma})`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`reserva:        ${reserva}`);
//     josLogger.trace(`nBytesCadena:   ${nBytes} (máx ${PH_EVT_CONCAT_CADENA_MAX})`);
//     josLogger.trace(`cadena[hex]:    ${cadenaRaw.toString('hex')}`);
//     josLogger.trace(`cadena[utf16]:   ${cadenaUtf16}`);
//   }
//   josLogger.trace(`---------- ↑ DATA (EVENTO_CONCATENADO) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

const ensurePayloadEstadisticoGenerico = (buf?: Buffer): Buffer | undefined =>buf && buf.length >= PH_EST_GEN_TOTAL_LEN ? buf : undefined;

// =================== Payload ESTADISTICO_GENERICO (Omega) – Capa RAW ===================

/** Devuelve el payload ESTADISTICO_GENERICO (114B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return ensurePayloadEstadisticoGenerico(data);
}

// ---- Bytes por campo
export function getBytesPhEstGenTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.tipoDato, PH_EST_GEN_OFF.tipoDato + 1);
}
export function getBytesPhEstGenMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.mac, PH_EST_GEN_OFF.mac + 8);
}
export function getBytesPhEstGenIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.idUnico, PH_EST_GEN_OFF.idUnico + 1);
}
export function getBytesPhEstGenVersionConcatenada(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.versionConcatenada, PH_EST_GEN_OFF.versionConcatenada + 2);
}
export function getBytesPhEstGenTipo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.tipo, PH_EST_GEN_OFF.tipo + 1);
}
export function getBytesPhEstGenSubfamilia(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.subfamilia, PH_EST_GEN_OFF.subfamilia + 1);
}
export function getBytesPhEstGenFamilia(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.familia, PH_EST_GEN_OFF.familia + 2);
}
export function getBytesPhEstGenPropiedades(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.propiedades, PH_EST_GEN_OFF.propiedades + 2);
}
export function getBytesPhEstGenNombreAlarma(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.nombreAlarma, PH_EST_GEN_OFF.nombreAlarma + 2);
}
export function getBytesPhEstGenFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.fecha, PH_EST_GEN_OFF.fecha + 3);
}
export function getBytesPhEstGenHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.hora, PH_EST_GEN_OFF.hora + 3);
}
export function getBytesPhEstGenDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.diaCrianza, PH_EST_GEN_OFF.diaCrianza + 2);
}
export function getBytesPhEstGenIdCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.idCrianza, PH_EST_GEN_OFF.idCrianza + 4);
}
export function getBytesPhEstGenReserva(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.reserva, PH_EST_GEN_OFF.reserva + 1);
}
export function getBytesPhEstGenNumeroBytesCadena(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.nBytes, PH_EST_GEN_OFF.nBytes + 1);
}
export function getBytesPhEstGenCadenaArea(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  return p.subarray(PH_EST_GEN_OFF.cadena, PH_EST_GEN_OFF.cadena + PH_EST_GEN_CADENA_MAX);
}
export function getBytesPhEstGenCadenaValida(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
  const n = Math.min(p.readUInt8(PH_EST_GEN_OFF.nBytes), PH_EST_GEN_CADENA_MAX);
  return p.subarray(PH_EST_GEN_OFF.cadena, PH_EST_GEN_OFF.cadena + n);
}

// =================== Payload ESTADISTICO_GENERICO (Omega) – Capa VALOR ===================

export function getPhEstGenTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhEstGenTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhEstGenMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEstGenMac(frame);
}
/** MAC como bigint (0..2^64-1). */
export function getPhEstGenMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhEstGenMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
/** MAC como number si es seguro (<= 2^53-1). */
export function getPhEstGenMacNumber(frame: Buffer): number | undefined {
  const v = getPhEstGenMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhEstGenIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEstGenVersionConcatenada(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenVersionConcatenada(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEstGenTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
  const b = getBytesPhEstGenTipo(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnEventosEstadisTipo;
}
export function getPhEstGenSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
  const b = getBytesPhEstGenSubfamilia(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnEventosEstadisSubfamilia;
}
export function getPhEstGenFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
  const b = getBytesPhEstGenFamilia(frame); if (!b) return undefined;
  return b.readUInt16BE(0) as EnEventosEstadisFamilia;
}
export function getPhEstGenPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
  const b = getBytesPhEstGenPropiedades(frame); if (!b) return undefined;
  return b.readUInt16BE(0) as EnEventosEstadisPropiedades;
}
export function getPhEstGenNombreAlarma(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenNombreAlarma(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEstGenFecha(frame: Buffer) {
  const b = getBytesPhEstGenFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhEstGenHora(frame: Buffer) {
  const b = getBytesPhEstGenHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhEstGenDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhEstGenIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenIdCrianza(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEstGenReserva(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenReserva(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEstGenNumeroBytesCadena(frame: Buffer): number | undefined {
  const b = getBytesPhEstGenNumeroBytesCadena(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEstGenCadenaRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEstGenCadenaArea(frame);
}
export function getPhEstGenCadenaValidaRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEstGenCadenaValida(frame);
}
export function getPhEstGenCadenaUtf16(frame: Buffer): string | undefined {
  const raw = getBytesPhEstGenCadenaValida(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1;
  return raw.subarray(0, nEven).toString('utf16le');
}

// =================== Logger (ESTADISTICO_GENERICO) ===================

export function logTramaParametroHistoricoEstadisticoGenericoOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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

// /** Devuelve el payload ESTADISTICO_GENERICO (114B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return ensurePayloadEstadisticoGenerico(data);
// }

// // =================== getters campo a campo (ESTADISTICO_GENERICO) ===================

// export function getPhEstGenTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EST_GEN_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhEstGenMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.subarray(PH_EST_GEN_OFF.mac, PH_EST_GEN_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhEstGenMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_EST_GEN_OFF.mac);
//   }
//   // Fallback manual
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EST_GEN_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhEstGenMacNumber(frame: Buffer): number | undefined {
//   const v = getPhEstGenMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhEstGenIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EST_GEN_OFF.idUnico);
// }

// export function getPhEstGenVersionConcatenada(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EST_GEN_OFF.versionConcatenada);
// }

// export function getPhEstGenTipo(frame: Buffer): EnEventosEstadisTipo | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EST_GEN_OFF.tipo) as EnEventosEstadisTipo;
// }

// export function getPhEstGenSubfamilia(frame: Buffer): EnEventosEstadisSubfamilia | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EST_GEN_OFF.subfamilia) as EnEventosEstadisSubfamilia;
// }

// export function getPhEstGenFamilia(frame: Buffer): EnEventosEstadisFamilia | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EST_GEN_OFF.familia) as EnEventosEstadisFamilia;
// }

// export function getPhEstGenPropiedades(frame: Buffer): EnEventosEstadisPropiedades | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EST_GEN_OFF.propiedades) as EnEventosEstadisPropiedades;
// }

// export function getPhEstGenNombreAlarma(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EST_GEN_OFF.nombreAlarma);
// }

// export function getPhEstGenFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return readFecha3EstGen(p, PH_EST_GEN_OFF.fecha);
// }

// export function getPhEstGenHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return readHora3EstGen(p, PH_EST_GEN_OFF.hora);
// }

// export function getPhEstGenDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_EST_GEN_OFF.diaCrianza);
// }

// export function getPhEstGenIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_EST_GEN_OFF.idCrianza);
// }

// export function getPhEstGenReserva(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EST_GEN_OFF.reserva);
// }

// export function getPhEstGenNumeroBytesCadena(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EST_GEN_OFF.nBytes);
// }

// /** Devuelve los 80 bytes reservados para la cadena (sin recortar por nBytes). */
// export function getPhEstGenCadenaRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   return p.subarray(PH_EST_GEN_OFF.cadena, PH_EST_GEN_OFF.cadena + PH_EST_GEN_CADENA_MAX);
// }

// /** Devuelve solo los `nBytes` válidos de la cadena (recortados a 0..80). */
// export function getPhEstGenCadenaValidaRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame); if (!p) return undefined;
//   const n = Math.min(p.readUInt8(PH_EST_GEN_OFF.nBytes), PH_EST_GEN_CADENA_MAX);
//   return p.subarray(PH_EST_GEN_OFF.cadena, PH_EST_GEN_OFF.cadena + n);
// }

// /** Decodifica la cadena válida como UTF-16LE (si nBytes es impar, recorta el último byte). */
// export function getPhEstGenCadenaUtf16(frame: Buffer): string | undefined {
//   const raw = getPhEstGenCadenaValidaRaw(frame); if (!raw) return undefined;
//   const nEven = raw.length & ~1; // asegurar múltiplo de 2
//   return raw.subarray(0, nEven).toString('utf16le');
// }

// // =================== Logger (ESTADISTICO_GENERICO) ===================

// export function logTramaParametroHistoricoEstadisticoGenericoOmegaDf(frame: Buffer): void {
//   const hdr = getParsedHeaderOld(frame);
//   const p = getParametroHistoricoPayloadOmegaEstadisticoGenerico(frame);

//   logCabeceraComunOld(frame);

//   josLogger.trace(`---------- ↓ DATA (ESTADISTICO_GENERICO) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhEstGenMacRaw(frame)!;
//     const tipoDato = getPhEstGenTipoDato(frame)!;
//     const idUnico = getPhEstGenIdUnico(frame)!;
//     const verConcat = getPhEstGenVersionConcatenada(frame)!;
//     const tipo = getPhEstGenTipo(frame)!;
//     const familia = getPhEstGenFamilia(frame)!;
//     const subfamilia = getPhEstGenSubfamilia(frame)!;
//     const propiedades = getPhEstGenPropiedades(frame)!;
//     const nombreAlarma = getPhEstGenNombreAlarma(frame)!; // nombre_estadistico
//     const fecha = getPhEstGenFecha(frame)!;
//     const hora = getPhEstGenHora(frame)!;
//     const diaCrianza = getPhEstGenDiaCrianza(frame)!;
//     const idCrianza = getPhEstGenIdentificadorCrianzaUnico(frame)!;
//     const reserva = getPhEstGenReserva(frame)!;
//     const nBytes = getPhEstGenNumeroBytesCadena(frame)!;
//     const cadenaRaw = getPhEstGenCadenaValidaRaw(frame)!;
//     const cadenaUtf16 = getPhEstGenCadenaUtf16(frame)!;

//     const propHex = propiedades.toString(16).padStart(4, '0');

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`verConcatenada: ${verConcat}`);
//     josLogger.trace(`tipo:           ${EnEventosEstadisTipo[tipo]} (${tipo})`);
//     josLogger.trace(`familia:        ${EnEventosEstadisFamilia[familia]} (${familia})`);
//     josLogger.trace(`subfamilia:     ${EnEventosEstadisSubfamilia[subfamilia]} (${subfamilia})`);
//     josLogger.trace(`propiedades:    0x${propHex} (${propiedades})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`nombreEstad:    ${EnTextos[nombreAlarma]} (${nombreAlarma})`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`reserva:        ${reserva}`);
//     josLogger.trace(`nBytesCadena:   ${nBytes} (máx ${PH_EST_GEN_CADENA_MAX})`);
//     josLogger.trace(`cadena[hex]:    ${cadenaRaw.toString('hex')}`);
//     josLogger.trace(`cadena[utf16]:   ${cadenaUtf16}`);
//   }
//   josLogger.trace(`---------- ↑ DATA (ESTADISTICO_GENERICO) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== Payload DF_CAMBIO_PARAMETRO (Omega) – Capa RAW ===================

/** Devuelve el payload DF_CAMBIO_PARAMETRO (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaCambioParametro(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_CAMBIO_PARAM_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhCambioTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.tipoDato, PH_CAMBIO_PARAM_OFF.tipoDato + 1);
}
export function getBytesPhCambioMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.mac, PH_CAMBIO_PARAM_OFF.mac + 8);
}
export function getBytesPhCambioFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.fecha, PH_CAMBIO_PARAM_OFF.fecha + 3);
}
export function getBytesPhCambioHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.hora, PH_CAMBIO_PARAM_OFF.hora + 3);
}
export function getBytesPhCambioIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.idUnico, PH_CAMBIO_PARAM_OFF.idUnico + 1);
}
export function getBytesPhCambioIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.idCliente, PH_CAMBIO_PARAM_OFF.idCliente + 2);
}
export function getBytesPhCambioTextVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.textVariable, PH_CAMBIO_PARAM_OFF.textVariable + 2);
}
export function getBytesPhCambioValorVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.valorVariable, PH_CAMBIO_PARAM_OFF.valorVariable + 4);
}
export function getBytesPhCambioIdCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.idCrianza, PH_CAMBIO_PARAM_OFF.idCrianza + 4);
}
export function getBytesPhCambioDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.diaCrianza, PH_CAMBIO_PARAM_OFF.diaCrianza + 2);
}
export function getBytesPhCambioTextTituloVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.textTituloVariable, PH_CAMBIO_PARAM_OFF.textTituloVariable + 2);
}
export function getBytesPhCambioVariable2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.variable2, PH_CAMBIO_PARAM_OFF.variable2 + 4);
}
export function getBytesPhCambioVariable3(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_PARAM_OFF.variable3TituloPers, PH_CAMBIO_PARAM_OFF.variable3TituloPers + 4);
}

// =================== Payload DF_CAMBIO_PARAMETRO (Omega) – Capa VALOR ===================

export function getPhCambioTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhCambioTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}

export function getPhCambioMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioMac(frame);
}

/** MAC como bigint (0..2^64-1). */
export function getPhCambioMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhCambioMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}

/** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
export function getPhCambioMacNumber(frame: Buffer): number | undefined {
  const v = getPhCambioMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhCambioFecha(frame: Buffer) {
  const b = getBytesPhCambioFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}

export function getPhCambioHora(frame: Buffer) {
  const b = getBytesPhCambioHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}

export function getPhCambioIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhCambioIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}

export function getPhCambioIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhCambioIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

export function getPhCambioTextVariable(frame: Buffer): number | undefined {
  const b = getBytesPhCambioTextVariable(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

export function getPhCambioValorVariableRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioValorVariable(frame);
}

export function getPhCambioValorVariableU32(frame: Buffer): number | undefined {
  const b = getBytesPhCambioValorVariable(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

export function getPhCambioValorVariableI32(frame: Buffer): number | undefined {
  const b = getBytesPhCambioValorVariable(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}

export function getPhCambioValorVariableFloat(frame: Buffer): number | undefined {
  const b = getBytesPhCambioValorVariable(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}

export function getPhCambioIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhCambioIdCrianza(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

export function getPhCambioDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhCambioDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}

export function getPhCambioTextTituloVariable(frame: Buffer): number | undefined {
  const b = getBytesPhCambioTextTituloVariable(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

export function getPhCambioVariable2Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioVariable2(frame);
}

export function getPhCambioVariable2U32(frame: Buffer): number | undefined {
  const b = getBytesPhCambioVariable2(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

export function getPhCambioVariable3Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioVariable3(frame);
}

export function getPhCambioVariable3U32(frame: Buffer): number | undefined {
  const b = getBytesPhCambioVariable3(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== Logger (DF_CAMBIO_PARAMETRO) ===================

export function logTramaParametroHistoricoCambioParametroOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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

/** Devuelve el payload DF_CAMBIO_PARAMETRO (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaCambioParametro(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_CAMBIO_PARAM_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (DF_CAMBIO_PARAMETRO) ===================

// export function getPhCambioTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_PARAM_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhCambioMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_PARAM_OFF.mac, PH_CAMBIO_PARAM_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhCambioMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_CAMBIO_PARAM_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_CAMBIO_PARAM_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhCambioMacNumber(frame: Buffer): number | undefined {
//   const v = getPhCambioMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhCambioFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   const off = PH_CAMBIO_PARAM_OFF.fecha;
//   return {
//     dia: p.readUInt8(off),
//     mes: p.readUInt8(off + 1),
//     anyo: 2000 + (p.readUInt8(off + 2) % 100),
//   };
// }

// export function getPhCambioHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   const off = PH_CAMBIO_PARAM_OFF.hora;
//   return {
//     hora: p.readUInt8(off),
//     min: p.readUInt8(off + 1),
//     seg: p.readUInt8(off + 2),
//   };
// }

// export function getPhCambioIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_PARAM_OFF.idUnico);
// }

// export function getPhCambioIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_CAMBIO_PARAM_OFF.idCliente);
// }

// export function getPhCambioTextVariable(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_CAMBIO_PARAM_OFF.textVariable);
// }

// /** Valor variable crudo (4B). */
// export function getPhCambioValorVariableRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_PARAM_OFF.valorVariable, PH_CAMBIO_PARAM_OFF.valorVariable + 4);
// }

// /** Valor variable como UInt32BE. */
// export function getPhCambioValorVariableU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.valorVariable);
// }

// /** Valor variable como Int32BE. */
// export function getPhCambioValorVariableI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_CAMBIO_PARAM_OFF.valorVariable);
// }

// /** Valor variable como FloatBE (IEEE754 32-bit). */
// export function getPhCambioValorVariableFloat(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_CAMBIO_PARAM_OFF.valorVariable);
// }

// export function getPhCambioIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.idCrianza);
// }

// export function getPhCambioDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_CAMBIO_PARAM_OFF.diaCrianza);
// }

// export function getPhCambioTextTituloVariable(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_CAMBIO_PARAM_OFF.textTituloVariable);
// }

// /** variable2 crudo (4B). */
// export function getPhCambioVariable2Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_PARAM_OFF.variable2, PH_CAMBIO_PARAM_OFF.variable2 + 4);
// }

// /** variable2 como UInt32BE. */
// export function getPhCambioVariable2U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.variable2);
// }

// /** variable3 TEXT_titulo_personalizado crudo (4B). */
// export function getPhCambioVariable3Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_PARAM_OFF.variable3TituloPers, PH_CAMBIO_PARAM_OFF.variable3TituloPers + 4);
// }

// /** variable3 TEXT_titulo_personalizado como UInt32BE. */
// export function getPhCambioVariable3U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_CAMBIO_PARAM_OFF.variable3TituloPers);
// }

// // =================== Logger (DF_CAMBIO_PARAMETRO) ===================

// export function logTramaParametroHistoricoCambioParametroOmegaDf(frame: Buffer): void {
//   const hdr = getParsedHeaderOld(frame);
//   const p = getParametroHistoricoPayloadOmegaCambioParametro(frame);

//   logCabeceraComunOld(frame);

//   josLogger.trace(`---------- ↓ DATA (DF_CAMBIO_PARAMETRO) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhCambioMacRaw(frame)!;
//     const tipoDato = getPhCambioTipoDato(frame)!;
//     const fecha = getPhCambioFecha(frame)!;
//     const hora = getPhCambioHora(frame)!;
//     const idUnico = getPhCambioIdUnico(frame)!;
//     const idCliente = getPhCambioIdentificadorCliente(frame)!;
//     const textVar = getPhCambioTextVariable(frame)!;
//     const valorRaw = getPhCambioValorVariableRaw(frame)!;
//     const valorU32 = getPhCambioValorVariableU32(frame)!;
//     const valorI32 = getPhCambioValorVariableI32(frame)!;
//     const valorF32 = getPhCambioValorVariableFloat(frame)!;
//     const idCrianza = getPhCambioIdentificadorCrianzaUnico(frame)!;
//     const diaCrianza = getPhCambioDiaCrianza(frame)!;
//     const textTituloVar = getPhCambioTextTituloVariable(frame)!;
//     const var2Raw = getPhCambioVariable2Raw(frame)!;
//     const var2U32 = getPhCambioVariable2U32(frame)!;
//     const var3Raw = getPhCambioVariable3Raw(frame)!;
//     const var3U32 = getPhCambioVariable3U32(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);
//     josLogger.trace(`textVariable:   ${EnTextos[textVar]} (${textVar})`);
//     josLogger.trace(`valorRaw[4]:    ${valorRaw.toString('hex')}`);
//     josLogger.trace(`valorU32:       ${valorU32}`);
//     josLogger.trace(`valorI32:       ${valorI32}`);
//     josLogger.trace(`valorF32:       ${Number.isNaN(valorF32) ? 'NaN' : valorF32}`);
//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`textTituloVar:  ${EnTextos[textTituloVar]} (${textTituloVar})`);
//     josLogger.trace(`variable2Raw:   ${var2Raw.toString('hex')} (u32=${var2U32})`);
//     josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
//   }
//   josLogger.trace(`---------- ↑ DATA (DF_CAMBIO_PARAMETRO) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }

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

// =================== Payload DATOS_EBUS_FINALES (Omega) – Capa RAW ===================

/** Devuelve el payload DATOS_EBUS_FINALES (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaEbusFinales(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_EBUS_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhEbusTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.tipoDato, PH_EBUS_OFF.tipoDato + 1);
}
export function getBytesPhEbusMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.mac, PH_EBUS_OFF.mac + 8);
}
export function getBytesPhEbusFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.fecha, PH_EBUS_OFF.fecha + 3);
}
export function getBytesPhEbusHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.hora, PH_EBUS_OFF.hora + 3);
}
export function getBytesPhEbusIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.idUnico, PH_EBUS_OFF.idUnico + 1);
}
export function getBytesPhEbusIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.idCliente, PH_EBUS_OFF.idCliente + 2);
}
export function getBytesPhEbusTextVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.textVariable, PH_EBUS_OFF.textVariable + 2);
}
export function getBytesPhEbusValorVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.valorVariable, PH_EBUS_OFF.valorVariable + 4);
}
export function getBytesPhEbusIdCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.idCrianza, PH_EBUS_OFF.idCrianza + 4);
}
export function getBytesPhEbusDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.diaCrianza, PH_EBUS_OFF.diaCrianza + 2);
}
export function getBytesPhEbusTextTituloVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.textTituloVariable, PH_EBUS_OFF.textTituloVariable + 2);
}
export function getBytesPhEbusVariable2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.variable2, PH_EBUS_OFF.variable2 + 4);
}
export function getBytesPhEbusVariable3(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
  return p.subarray(PH_EBUS_OFF.variable3TituloPers, PH_EBUS_OFF.variable3TituloPers + 4);
}

// =================== Payload DATOS_EBUS_FINALES (Omega) – Capa VALOR ===================

export function getPhEbusTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhEbusTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhEbusMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEbusMac(frame);
}
export function getPhEbusMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhEbusMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
export function getPhEbusMacNumber(frame: Buffer): number | undefined {
  const v = getPhEbusMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhEbusFecha(frame: Buffer) {
  const b = getBytesPhEbusFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhEbusHora(frame: Buffer) {
  const b = getBytesPhEbusHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhEbusIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEbusIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEbusIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhEbusIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEbusTextVariable(frame: Buffer): number | undefined {
  const b = getBytesPhEbusTextVariable(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEbusValorVariableRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEbusValorVariable(frame);
}
export function getPhEbusValorVariableU32(frame: Buffer): number | undefined {
  const b = getBytesPhEbusValorVariable(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEbusValorVariableI32(frame: Buffer): number | undefined {
  const b = getBytesPhEbusValorVariable(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}
export function getPhEbusValorVariableFloat(frame: Buffer): number | undefined {
  const b = getBytesPhEbusValorVariable(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}
export function getPhEbusIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEbusIdCrianza(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEbusDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhEbusDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhEbusTextTituloVariable(frame: Buffer): number | undefined {
  const b = getBytesPhEbusTextTituloVariable(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEbusVariable2Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhEbusVariable2(frame);
}
export function getPhEbusVariable2TipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhEbusVariable2(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhEbusVariable2Valor24Raw(frame: Buffer): Buffer | undefined {
  const b = getBytesPhEbusVariable2(frame); if (!b) return undefined;
  return b.subarray(1, 4);
}
export function getPhEbusVariable2Valor24U(frame: Buffer): number | undefined {
  const b = getBytesPhEbusVariable2(frame); if (!b) return undefined;
  return b.readUIntBE(1, 3);
}
export function getPhEbusVariable2Valor24I(frame: Buffer): number | undefined {
  const b = getBytesPhEbusVariable2(frame); if (!b) return undefined;
  return b.readIntBE(1, 3);
}
export function getPhEbusVariable3Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhEbusVariable3(frame);
}
export function getPhEbusVariable3U32(frame: Buffer): number | undefined {
  const b = getBytesPhEbusVariable3(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== Logger (DATOS_EBUS_FINALES) ===================

export function logTramaParametroHistoricoEbusFinalesOmegaDf(frame: Buffer): void {
  logCabeceraComunOld(frame);
  const p = getParametroHistoricoPayloadOmegaEbusFinales(frame);

  josLogger.trace(`---------- ↓ DATA (DATOS_EBUS_FINALES) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
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

    const v2raw = getPhEbusVariable2Raw(frame)!;
    const v2Tipo = getPhEbusVariable2TipoDato(frame)!;
    const v224raw = getPhEbusVariable2Valor24Raw(frame)!;
    const v224u = getPhEbusVariable2Valor24U(frame)!;
    const v224i = getPhEbusVariable2Valor24I(frame)!;

    const v3raw = getPhEbusVariable3Raw(frame)!;
    const v3u32 = getPhEbusVariable3U32(frame)!;

    josLogger.trace(`len(payload):   ${p.length}`);
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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
    josLogger.trace(`variable2.tipo: ${EnTipoDatoDFAccion[v2Tipo] ?? v2Tipo} (${v2Tipo})`);
    josLogger.trace(`variable2.val:  0x${v224raw.toString('hex')}  (u24=${v224u}, i24=${v224i})`);
    josLogger.trace(`variable3Raw:   ${v3raw.toString('hex')} (u32=${v3u32})`);
  }
  josLogger.trace(`---------- ↑ DATA (DATOS_EBUS_FINALES) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}

/** Devuelve el payload DATOS_EBUS_FINALES (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaEbusFinales(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_EBUS_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (DATOS_EBUS_FINALES) ===================

// export function getPhEbusTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EBUS_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhEbusMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.subarray(PH_EBUS_OFF.mac, PH_EBUS_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhEbusMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_EBUS_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_EBUS_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhEbusMacNumber(frame: Buffer): number | undefined {
//   const v = getPhEbusMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhEbusFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   const off = PH_EBUS_OFF.fecha;
//   return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
// }

// export function getPhEbusHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   const off = PH_EBUS_OFF.hora;
//   return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
// }

// export function getPhEbusIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EBUS_OFF.idUnico);
// }

// export function getPhEbusIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EBUS_OFF.idCliente);
// }

// export function getPhEbusTextVariable(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EBUS_OFF.textVariable);
// }

// /** valorVariable crudo (4B). */
// export function getPhEbusValorVariableRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.subarray(PH_EBUS_OFF.valorVariable, PH_EBUS_OFF.valorVariable + 4);
// }

// /** valorVariable como UInt32BE. */
// export function getPhEbusValorVariableU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_EBUS_OFF.valorVariable);
// }

// /** valorVariable como Int32BE. */
// export function getPhEbusValorVariableI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_EBUS_OFF.valorVariable);
// }

// /** valorVariable como FloatBE (IEEE754 32-bit). */
// export function getPhEbusValorVariableFloat(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_EBUS_OFF.valorVariable);
// }

// export function getPhEbusIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_EBUS_OFF.idCrianza);
// }

// export function getPhEbusDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_EBUS_OFF.diaCrianza);
// }

// export function getPhEbusTextTituloVariable(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_EBUS_OFF.textTituloVariable);
// }

// /** variable2 crudo (4B) — byte0=tipoDato, byte1..3=valor/meta. */
// export function getPhEbusVariable2Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.subarray(PH_EBUS_OFF.variable2, PH_EBUS_OFF.variable2 + 4);
// }

// /** variable2 → primer byte como EnTipoDatoDFAccion. */
// export function getPhEbusVariable2TipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt8(PH_EBUS_OFF.variable2) as EnTipoDatoDFAccion;
// }

// /** variable2 → 3 bytes de valor/meta tal cual (bytes 1..3). */
// export function getPhEbusVariable2Valor24Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.subarray(PH_EBUS_OFF.variable2 + 1, PH_EBUS_OFF.variable2 + 4);
// }

// /** variable2 → valor/meta como UInt24 (0..0xFFFFFF). */
// export function getPhEbusVariable2Valor24U(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUIntBE(PH_EBUS_OFF.variable2 + 1, 3);
// }

// /** variable2 → valor/meta como Int24 (-8388608..8388607). */
// export function getPhEbusVariable2Valor24I(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readIntBE(PH_EBUS_OFF.variable2 + 1, 3);
// }

// /** variable3 TEXT_titulo_personalizado crudo (4B). */
// export function getPhEbusVariable3Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.subarray(PH_EBUS_OFF.variable3TituloPers, PH_EBUS_OFF.variable3TituloPers + 4);
// }

// /** variable3 TEXT_titulo_personalizado como UInt32BE. */
// export function getPhEbusVariable3U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_EBUS_OFF.variable3TituloPers);
// }

// export function logTramaParametroHistoricoEbusFinalesOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaEbusFinales(frame);

//   josLogger.trace(`---------- ↓ DATA (DATOS_EBUS_FINALES) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     // Campos principales
//     const macBuf = getPhEbusMacRaw(frame)!;
//     const tipoDato = getPhEbusTipoDato(frame)!;

//     const fecha = getPhEbusFecha(frame)!;
//     const hora = getPhEbusHora(frame)!;

//     const idUnico = getPhEbusIdUnico(frame)!;
//     const idCliente = getPhEbusIdentificadorCliente(frame)!;

//     const textVar = getPhEbusTextVariable(frame)!;

//     const valorRaw = getPhEbusValorVariableRaw(frame)!;
//     const valorU32 = getPhEbusValorVariableU32(frame)!;
//     const valorI32 = getPhEbusValorVariableI32(frame)!;
//     const valorF32 = getPhEbusValorVariableFloat(frame)!;

//     const idCrianza = getPhEbusIdentificadorCrianzaUnico(frame)!;
//     const diaCrianza = getPhEbusDiaCrianza(frame)!;

//     const textTituloVar = getPhEbusTextTituloVariable(frame)!;

//     // variable2: [ byte0 = tipoDato , bytes1..3 = valor/meta (24-bit BE) ]
//     const v2raw = getPhEbusVariable2Raw(frame)!;
//     const v2Tipo = getPhEbusVariable2TipoDato(frame)!;
//     const v2TipoName = EnTipoDatoDFAccion[v2Tipo] ?? `${v2Tipo}`;
//     const v224raw = getPhEbusVariable2Valor24Raw(frame)!;
//     const v224u = getPhEbusVariable2Valor24U(frame)!;
//     const v224i = getPhEbusVariable2Valor24I(frame)!;

//     // variable3
//     const v3raw = getPhEbusVariable3Raw(frame)!;
//     const v3u32 = getPhEbusVariable3U32(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);
//     josLogger.trace(`textVariable:   ${EnTextos[textVar]} (${textVar})`);
//     josLogger.trace(`valorRaw[4]:    ${valorRaw.toString('hex')}`);
//     josLogger.trace(`valorU32:       ${valorU32}`);
//     josLogger.trace(`valorI32:       ${valorI32}`);
//     josLogger.trace(`valorF32:       ${Number.isNaN(valorF32) ? 'NaN' : valorF32}`);
//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`textTituloVar:  ${EnTextos[textTituloVar]} (${textTituloVar})`);

//     josLogger.trace(`variable2Raw:   ${v2raw.toString('hex')}`);
//     josLogger.trace(`variable2.tipo: ${v2TipoName} (${v2Tipo})`);
//     josLogger.trace(`variable2.val:  0x${v224raw.toString('hex')}  (u24=${v224u}, i24=${v224i})`);

//     josLogger.trace(`variable3Raw:   ${v3raw.toString('hex')} (u32=${v3u32})`);
//   }
//   josLogger.trace(`---------- ↑ DATA (DATOS_EBUS_FINALES) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== CAMBIO_PARAMETRO_CONCATENADO (Omega) – Capa RAW ===================

/** Devuelve el payload CAMBIO_PARAMETRO_CONCATENADO (195B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_CAMBIO_CONCAT_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhCambioConcatMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.mac, PH_CAMBIO_CONCAT_OFF.mac + 8);
}
export function getBytesPhCambioConcatIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.idUnico, PH_CAMBIO_CONCAT_OFF.idUnico + 1);
}
export function getBytesPhCambioConcatVersionCambioParametro(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.versionCambioParam, PH_CAMBIO_CONCAT_OFF.versionCambioParam + 2);
}
export function getBytesPhCambioConcatIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.idCliente, PH_CAMBIO_CONCAT_OFF.idCliente + 2);
}
export function getBytesPhCambioConcatTipoEquipo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.tipoEquipo, PH_CAMBIO_CONCAT_OFF.tipoEquipo + 1);
}
export function getBytesPhCambioConcatEbusNodo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.ebusNodo, PH_CAMBIO_CONCAT_OFF.ebusNodo + 1);
}
export function getBytesPhCambioConcatFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.fecha, PH_CAMBIO_CONCAT_OFF.fecha + 3);
}
export function getBytesPhCambioConcatHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.hora, PH_CAMBIO_CONCAT_OFF.hora + 3);
}
export function getBytesPhCambioConcatDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.diaCrianza, PH_CAMBIO_CONCAT_OFF.diaCrianza + 2);
}
export function getBytesPhCambioConcatIdentificadorCrianzaUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.idCrianza, PH_CAMBIO_CONCAT_OFF.idCrianza + 4);
}
export function getBytesPhCambioConcatNumeroByteTitulo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.nTitulo, PH_CAMBIO_CONCAT_OFF.nTitulo + 1);
}
export function getBytesPhCambioConcatNumeroByteOpcion(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.nOpcion, PH_CAMBIO_CONCAT_OFF.nOpcion + 1);
}
export function getBytesPhCambioConcatNumeroByteValor(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.nValor, PH_CAMBIO_CONCAT_OFF.nValor + 1);
}
export function getBytesPhCambioConcatTipoDatoCambioParametro(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.tipoDatoCambio, PH_CAMBIO_CONCAT_OFF.tipoDatoCambio + 1);
}
export function getBytesPhCambioConcatValorVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.valorVariable, PH_CAMBIO_CONCAT_OFF.valorVariable + 4);
}
export function getBytesPhCambioConcatCadena(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  return p.subarray(PH_CAMBIO_CONCAT_OFF.cadena, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
}
export function getBytesPhCambioConcatCadenaTitulo(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
  return p.subarray(PH_CAMBIO_CONCAT_OFF.cadena, PH_CAMBIO_CONCAT_OFF.cadena + Math.min(nT, PH_CAMBIO_CONCAT_CADENA_MAX));
}
export function getBytesPhCambioConcatCadenaOpcion(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
  const nO = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
  const start = PH_CAMBIO_CONCAT_OFF.cadena + nT;
  const end = Math.min(start + nO, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
  return p.subarray(start, end);
}
export function getBytesPhCambioConcatCadenaValorTexto(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
  const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
  const nO = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
  const nV = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
  const start = PH_CAMBIO_CONCAT_OFF.cadena + nT + nO;
  const end = Math.min(start + nV, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
  return p.subarray(start, end);
}

// =================== CAMBIO_PARAMETRO_CONCATENADO (Omega) – Capa VALOR ===================

export function getPhCambioConcatMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioConcatMac(frame);
}
export function getPhCambioConcatMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhCambioConcatMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
export function getPhCambioConcatMacNumber(frame: Buffer): number | undefined {
  const v = getPhCambioConcatMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhCambioConcatIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhCambioConcatVersionCambioParametro(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatVersionCambioParametro(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhCambioConcatIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhCambioConcatTipoEquipo(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatTipoEquipo(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhCambioConcatEbusNodo(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatEbusNodo(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhCambioConcatFecha(frame: Buffer) {
  const b = getBytesPhCambioConcatFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhCambioConcatHora(frame: Buffer) {
  const b = getBytesPhCambioConcatHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhCambioConcatDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhCambioConcatIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatIdentificadorCrianzaUnico(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhCambioConcatNumeroByteTitulo(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatNumeroByteTitulo(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhCambioConcatNumeroByteOpcion(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatNumeroByteOpcion(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhCambioConcatNumeroByteValor(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatNumeroByteValor(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhCambioConcatTipoDatoCambioParametro(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhCambioConcatTipoDatoCambioParametro(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}

export function getPhCambioConcatValorVariableRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioConcatValorVariable(frame);
}
export function getPhCambioConcatValorVariableU32(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatValorVariable(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhCambioConcatValorVariableI32(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatValorVariable(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}
export function getPhCambioConcatValorVariableFloat(frame: Buffer): number | undefined {
  const b = getBytesPhCambioConcatValorVariable(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}

export function getPhCambioConcatCadenaRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioConcatCadena(frame);
}
export function getPhCambioConcatCadenaTituloRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioConcatCadenaTitulo(frame);
}
export function getPhCambioConcatCadenaOpcionRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioConcatCadenaOpcion(frame);
}
export function getPhCambioConcatCadenaValorTextoRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhCambioConcatCadenaValorTexto(frame);
}
export function getPhCambioConcatCadenaTituloUtf16(frame: Buffer): string | undefined {
  const raw = getBytesPhCambioConcatCadenaTitulo(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1; return raw.subarray(0, nEven).toString('utf16le');
}
export function getPhCambioConcatCadenaOpcionUtf16(frame: Buffer): string | undefined {
  const raw = getBytesPhCambioConcatCadenaOpcion(frame); if (!raw) return undefined;
  const nEven = raw.length & ~1; return raw.subarray(0, nEven).toString('utf16le');
}
export function getPhCambioConcatCadenaValorUtf16(frame: Buffer): string | undefined {
  const bNV = getBytesPhCambioConcatNumeroByteValor(frame); if (!bNV) return undefined;
  const nV = bNV.readUInt8(0);
  if (nV === 0) return '';
  const raw = getBytesPhCambioConcatCadenaValorTexto(frame)!;
  const nEven = raw.length & ~1; return raw.subarray(0, nEven).toString('utf16le');
}

// =================== Logger (CAMBIO_PARAMETRO_CONCATENADO) ===================

export function logTramaParametroHistoricoCambioParametroConcatenadoOmegaDf(frame: Buffer): void {
  logCabeceraComunOld(frame);
  const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame);

  josLogger.trace(`---------- ↓ DATA (CAMBIO_PARAMETRO_CONCATENADO) ↓ ----------`);
  if (!p) {
    josLogger.trace(`Payload: <incompatible o demasiado corto>`);
  } else {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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
    josLogger.trace(`tipoDatoCambio: ${EnTipoDatoDFAccion[tipoDato] ?? tipoDato} (${tipoDato})`);
    if (nValor === 0) {
      josLogger.trace(`valorVariable:  raw=${valRaw.toString('hex')}  u32=${valU32}  i32=${valI32}  f32=${Number.isNaN(valF32) ? 'NaN' : valF32}`);
    } else {
      josLogger.trace(`valorVariable:  (ignorado; valor textual en cadena) raw=${valRaw.toString('hex')}`);
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

// /** Devuelve el payload CAMBIO_PARAMETRO_CONCATENADO (195B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_CAMBIO_CONCAT_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (CAMBIO_PARAMETRO_CONCATENADO) ===================

// export function getPhCambioConcatMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_CONCAT_OFF.mac, PH_CAMBIO_CONCAT_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhCambioConcatMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_CAMBIO_CONCAT_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_CAMBIO_CONCAT_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhCambioConcatMacNumber(frame: Buffer): number | undefined {
//   const v = getPhCambioConcatMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhCambioConcatIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.idUnico);
// }

// export function getPhCambioConcatVersionCambioParametro(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_CAMBIO_CONCAT_OFF.versionCambioParam);
// }

// export function getPhCambioConcatIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_CAMBIO_CONCAT_OFF.idCliente);
// }

// export function getPhCambioConcatTipoEquipo(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.tipoEquipo);
// }

// export function getPhCambioConcatEbusNodo(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.ebusNodo);
// }

// export function getPhCambioConcatFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   const off = PH_CAMBIO_CONCAT_OFF.fecha;
//   return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
// }

// export function getPhCambioConcatHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   const off = PH_CAMBIO_CONCAT_OFF.hora;
//   return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
// }

// export function getPhCambioConcatDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_CAMBIO_CONCAT_OFF.diaCrianza);
// }

// export function getPhCambioConcatIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_CAMBIO_CONCAT_OFF.idCrianza);
// }

// export function getPhCambioConcatNumeroByteTitulo(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
// }

// export function getPhCambioConcatNumeroByteOpcion(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
// }

// export function getPhCambioConcatNumeroByteValor(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
// }

// export function getPhCambioConcatTipoDatoCambioParametro(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt8(PH_CAMBIO_CONCAT_OFF.tipoDatoCambio) as EnTipoDatoDFAccion;
// }

// /** valorVariable crudo (4B). */
// export function getPhCambioConcatValorVariableRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_CONCAT_OFF.valorVariable, PH_CAMBIO_CONCAT_OFF.valorVariable + 4);
// }

// /** valorVariable como UInt32BE. */
// export function getPhCambioConcatValorVariableU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_CAMBIO_CONCAT_OFF.valorVariable);
// }

// /** valorVariable como Int32BE. */
// export function getPhCambioConcatValorVariableI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_CAMBIO_CONCAT_OFF.valorVariable);
// }

// /** valorVariable como FloatBE (IEEE754 32-bit). */
// export function getPhCambioConcatValorVariableFloat(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_CAMBIO_CONCAT_OFF.valorVariable);
// }

// /** Cadena completa (160B) sin recortar. */
// export function getPhCambioConcatCadenaRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   return p.subarray(PH_CAMBIO_CONCAT_OFF.cadena, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
// }

// /** Segmento TÍTULO (0..nTitulo). */
// export function getPhCambioConcatCadenaTituloRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
//   return p.subarray(PH_CAMBIO_CONCAT_OFF.cadena, PH_CAMBIO_CONCAT_OFF.cadena + Math.min(nT, PH_CAMBIO_CONCAT_CADENA_MAX));
// }

// /** Segmento OPCIÓN (nTitulo..nTitulo+nOpcion). */
// export function getPhCambioConcatCadenaOpcionRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
//   const nO = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
//   const start = PH_CAMBIO_CONCAT_OFF.cadena + nT;
//   const end = Math.min(start + nO, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
//   return p.subarray(start, end);
// }

// /** Segmento VALOR TEXTO (… + nValor). Si nValor=0 → cadena vacía. */
// export function getPhCambioConcatCadenaValorTextoRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   const nT = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nTitulo);
//   const nO = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nOpcion);
//   const nV = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
//   const start = PH_CAMBIO_CONCAT_OFF.cadena + nT + nO;
//   const end = Math.min(start + nV, PH_CAMBIO_CONCAT_OFF.cadena + PH_CAMBIO_CONCAT_CADENA_MAX);
//   return p.subarray(start, end);
// }

// /** Título como UTF-16LE (recorta a múltiplo de 2). */
// export function getPhCambioConcatCadenaTituloUtf16(frame: Buffer): string | undefined {
//   const raw = getPhCambioConcatCadenaTituloRaw(frame); if (!raw) return undefined;
//   const nEven = raw.length & ~1;
//   return raw.subarray(0, nEven).toString('utf16le');
// }

// /** Opción como UTF-16LE (recorta a múltiplo de 2). */
// export function getPhCambioConcatCadenaOpcionUtf16(frame: Buffer): string | undefined {
//   const raw = getPhCambioConcatCadenaOpcionRaw(frame); if (!raw) return undefined;
//   const nEven = raw.length & ~1;
//   return raw.subarray(0, nEven).toString('utf16le');
// }

// /** Valor (texto) como UTF-16LE si nValor>0; si nValor=0 devuelve '' (valor numérico en valorVariable). */
// export function getPhCambioConcatCadenaValorUtf16(frame: Buffer): string | undefined {
//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame); if (!p) return undefined;
//   const nV = p.readUInt8(PH_CAMBIO_CONCAT_OFF.nValor);
//   if (nV === 0) return '';
//   const raw = getPhCambioConcatCadenaValorTextoRaw(frame)!;
//   const nEven = raw.length & ~1;
//   return raw.subarray(0, nEven).toString('utf16le');
// }

// export function logTramaParametroHistoricoCambioParametroConcatenadoOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaCambioParametroConcatenado(frame);

//   josLogger.trace(`---------- ↓ DATA (CAMBIO_PARAMETRO_CONCATENADO) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     // Campos principales
//     const macBuf = getPhCambioConcatMacRaw(frame)!;
//     const idUnico = getPhCambioConcatIdUnico(frame)!;
//     const verCambio = getPhCambioConcatVersionCambioParametro(frame)!;
//     const idCliente = getPhCambioConcatIdentificadorCliente(frame)!;
//     const tipoEquipo = getPhCambioConcatTipoEquipo(frame)!;
//     const ebusNodo = getPhCambioConcatEbusNodo(frame)!;

//     const fecha = getPhCambioConcatFecha(frame)!;
//     const hora = getPhCambioConcatHora(frame)!;

//     const diaCrianza = getPhCambioConcatDiaCrianza(frame)!;
//     const idCrianza = getPhCambioConcatIdentificadorCrianzaUnico(frame)!;

//     const nTitulo = getPhCambioConcatNumeroByteTitulo(frame)!;
//     const nOpcion = getPhCambioConcatNumeroByteOpcion(frame)!;
//     const nValor = getPhCambioConcatNumeroByteValor(frame)!;

//     const tipoDato = getPhCambioConcatTipoDatoCambioParametro(frame)!;
//     const tipoDatoName = EnTipoDatoDFAccion[tipoDato] ?? `${tipoDato}`;

//     const valRaw = getPhCambioConcatValorVariableRaw(frame)!;
//     const valU32 = getPhCambioConcatValorVariableU32(frame)!;
//     const valI32 = getPhCambioConcatValorVariableI32(frame)!;
//     const valF32 = getPhCambioConcatValorVariableFloat(frame)!;

//     const cadenaRaw = getPhCambioConcatCadenaRaw(frame)!;
//     const tituloRaw = getPhCambioConcatCadenaTituloRaw(frame)!;
//     const opcionRaw = getPhCambioConcatCadenaOpcionRaw(frame)!;
//     const valorTxtRaw = getPhCambioConcatCadenaValorTextoRaw(frame)!;

//     const tituloUtf16 = getPhCambioConcatCadenaTituloUtf16(frame)!;
//     const opcionUtf16 = getPhCambioConcatCadenaOpcionUtf16(frame)!;
//     const valorUtf16 = getPhCambioConcatCadenaValorUtf16(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`versionCambio:  ${verCambio}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);
//     josLogger.trace(`tipoEquipo:     ${tipoEquipo}`);
//     josLogger.trace(`ebusNodo:       ${ebusNodo}`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`idCrianza:      ${idCrianza}`);

//     josLogger.trace(`nTitulo:        ${nTitulo}`);
//     josLogger.trace(`nOpcion:        ${nOpcion}`);
//     josLogger.trace(`nValor:         ${nValor}`);
//     josLogger.trace(`tipoDatoCambio: ${tipoDatoName} (${tipoDato})`);

//     if (nValor === 0) {
//       josLogger.trace(`valorVariable:  raw=${valRaw.toString('hex')}  u32=${valU32}  i32=${valI32}  f32=${Number.isNaN(valF32) ? 'NaN' : valF32}`);
//     } else {
//       josLogger.trace(`valorVariable:  (ignorado; el valor viene como texto en cadena) raw=${valRaw.toString('hex')}`);
//     }

//     josLogger.trace(`cadena[hex]:    ${cadenaRaw.toString('hex')}`);
//     josLogger.trace(`titulo[hex]:    ${tituloRaw.toString('hex')}`);
//     josLogger.trace(`opcion[hex]:    ${opcionRaw.toString('hex')}`);
//     josLogger.trace(`valorTxt[hex]:  ${valorTxtRaw.toString('hex')}`);

//     josLogger.trace(`titulo[utf16]:  ${tituloUtf16}`);
//     josLogger.trace(`opcion[utf16]:  ${opcionUtf16}`);
//     josLogger.trace(`valor[utf16]:   ${valorUtf16}`);
//   }
//   josLogger.trace(`---------- ↑ DATA (CAMBIO_PARAMETRO_CONCATENADO) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== DF_INICIO_CRIANZA (Omega) – Capa RAW ===================

/** Devuelve el payload DF_INICIO_CRIANZA (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
export function getParametroHistoricoPayloadOmegaInicioCrianza(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_INI_CRI_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhInicioTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.tipoDato, PH_INI_CRI_OFF.tipoDato + 1);
}
export function getBytesPhInicioMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.mac, PH_INI_CRI_OFF.mac + 8);
}
export function getBytesPhInicioFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.fecha, PH_INI_CRI_OFF.fecha + 3);
}
export function getBytesPhInicioHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.hora, PH_INI_CRI_OFF.hora + 3);
}
export function getBytesPhInicioIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.idUnico, PH_INI_CRI_OFF.idUnico + 1);
}
export function getBytesPhInicioIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.idCliente, PH_INI_CRI_OFF.idCliente + 2);
}
export function getBytesPhInicioNombreVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.nombreVariable, PH_INI_CRI_OFF.nombreVariable + 2);
}
export function getBytesPhInicioValorVariable(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.valorVariable, PH_INI_CRI_OFF.valorVariable + 4);
}
export function getBytesPhInicioIdentificadorCrianzaUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.idCrianza, PH_INI_CRI_OFF.idCrianza + 4);
}
export function getBytesPhInicioDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.diaCrianza, PH_INI_CRI_OFF.diaCrianza + 2);
}
export function getBytesPhInicioVariable1_2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.variable1_2, PH_INI_CRI_OFF.variable1_2 + 2);
}
export function getBytesPhInicioVariable2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.variable2, PH_INI_CRI_OFF.variable2 + 4);
}
export function getBytesPhInicioVariable3(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_INI_CRI_OFF.variable3, PH_INI_CRI_OFF.variable3 + 4);
}

// =================== DF_INICIO_CRIANZA (Omega) – Capa VALOR ===================

export function getPhInicioTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhInicioTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}

export function getPhInicioMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhInicioMac(frame);
}

/** MAC como bigint (0..2^64-1). */
export function getPhInicioMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhInicioMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}

/** MAC como number si es seguro (<= 2^53-1). */
export function getPhInicioMacNumber(frame: Buffer): number | undefined {
  const v = getPhInicioMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhInicioFecha(frame: Buffer) {
  const b = getBytesPhInicioFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}

export function getPhInicioHora(frame: Buffer) {
  const b = getBytesPhInicioHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}

export function getPhInicioIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhInicioIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}

export function getPhInicioIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhInicioIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

export function getPhInicioNombreVariable(frame: Buffer): number | undefined {
  const b = getBytesPhInicioNombreVariable(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

/** valorVariable crudo (4B). */
export function getPhInicioValorVariableRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhInicioValorVariable(frame);
}

/** valorVariable como UInt32BE. */
export function getPhInicioValorVariableU32(frame: Buffer): number | undefined {
  const b = getBytesPhInicioValorVariable(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

/** valorVariable como Int32BE. */
export function getPhInicioValorVariableI32(frame: Buffer): number | undefined {
  const b = getBytesPhInicioValorVariable(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}

/** valorVariable como FloatBE (IEEE754 32-bit). */
export function getPhInicioValorVariableFloat(frame: Buffer): number | undefined {
  const b = getBytesPhInicioValorVariable(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}

export function getPhInicioIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhInicioIdentificadorCrianzaUnico(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

export function getPhInicioDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhInicioDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}

export function getPhInicioVariable1_2(frame: Buffer): number | undefined {
  const b = getBytesPhInicioVariable1_2(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}

/** variable2 crudo (4B). */
export function getPhInicioVariable2Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhInicioVariable2(frame);
}

/** variable2 como UInt32BE. */
export function getPhInicioVariable2U32(frame: Buffer): number | undefined {
  const b = getBytesPhInicioVariable2(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

/** variable3 crudo (4B). */
export function getPhInicioVariable3Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhInicioVariable3(frame);
}

/** variable3 como UInt32BE. */
export function getPhInicioVariable3U32(frame: Buffer): number | undefined {
  const b = getBytesPhInicioVariable3(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== Logger (DF_INICIO_CRIANZA) ===================

export function logTramaParametroHistoricoInicioCrianzaOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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

// /** Devuelve el payload DF_INICIO_CRIANZA (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaInicioCrianza(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_INI_CRI_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (DF_INICIO_CRIANZA) ===================

// export function getPhInicioTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt8(PH_INI_CRI_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhInicioMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_INI_CRI_OFF.mac, PH_INI_CRI_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhInicioMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_INI_CRI_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_INI_CRI_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhInicioMacNumber(frame: Buffer): number | undefined {
//   const v = getPhInicioMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhInicioFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   const off = PH_INI_CRI_OFF.fecha;
//   return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
// }

// export function getPhInicioHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   const off = PH_INI_CRI_OFF.hora;
//   return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
// }

// export function getPhInicioIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt8(PH_INI_CRI_OFF.idUnico);
// }

// export function getPhInicioIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_INI_CRI_OFF.idCliente);
// }

// export function getPhInicioNombreVariable(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_INI_CRI_OFF.nombreVariable);
// }

// /** valorVariable crudo (4B). */
// export function getPhInicioValorVariableRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_INI_CRI_OFF.valorVariable, PH_INI_CRI_OFF.valorVariable + 4);
// }

// /** valorVariable como UInt32BE. */
// export function getPhInicioValorVariableU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_INI_CRI_OFF.valorVariable);
// }

// /** valorVariable como Int32BE. */
// export function getPhInicioValorVariableI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_INI_CRI_OFF.valorVariable);
// }

// /** valorVariable como FloatBE (IEEE754 32-bit). */
// export function getPhInicioValorVariableFloat(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_INI_CRI_OFF.valorVariable);
// }

// export function getPhInicioIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_INI_CRI_OFF.idCrianza);
// }

// export function getPhInicioDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_INI_CRI_OFF.diaCrianza);
// }

// export function getPhInicioVariable1_2(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_INI_CRI_OFF.variable1_2);
// }

// /** variable2 crudo (4B). */
// export function getPhInicioVariable2Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_INI_CRI_OFF.variable2, PH_INI_CRI_OFF.variable2 + 4);
// }

// /** variable2 como UInt32BE. */
// export function getPhInicioVariable2U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_INI_CRI_OFF.variable2);
// }

// /** variable3 crudo (4B). */
// export function getPhInicioVariable3Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_INI_CRI_OFF.variable3, PH_INI_CRI_OFF.variable3 + 4);
// }

// /** variable3 como UInt32BE. */
// export function getPhInicioVariable3U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_INI_CRI_OFF.variable3);
// }

// // =================== Logger (DF_INICIO_CRIANZA) ===================

// export function logTramaParametroHistoricoInicioCrianzaOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaInicioCrianza(frame);

//   josLogger.trace(`---------- ↓ DATA (DF_INICIO_CRIANZA) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhInicioMacRaw(frame)!;
//     const tipoDato = getPhInicioTipoDato(frame)!;
//     const fecha = getPhInicioFecha(frame)!;
//     const hora = getPhInicioHora(frame)!;
//     const idUnico = getPhInicioIdUnico(frame)!;
//     const idCliente = getPhInicioIdentificadorCliente(frame)!;
//     const nombreVar = getPhInicioNombreVariable(frame)!;

//     const valorRaw = getPhInicioValorVariableRaw(frame)!;
//     const valorU32 = getPhInicioValorVariableU32(frame)!;
//     const valorI32 = getPhInicioValorVariableI32(frame)!;
//     const valorF32 = getPhInicioValorVariableFloat(frame)!;

//     const idCrianza = getPhInicioIdentificadorCrianzaUnico(frame)!;
//     const diaCrianza = getPhInicioDiaCrianza(frame)!;
//     const variable1_2 = getPhInicioVariable1_2(frame)!;

//     const var2Raw = getPhInicioVariable2Raw(frame)!;
//     const var2U32 = getPhInicioVariable2U32(frame)!;
//     const var3Raw = getPhInicioVariable3Raw(frame)!;
//     const var3U32 = getPhInicioVariable3U32(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);
//     josLogger.trace(`nombreVariable: ${EnTextos[nombreVar]} (${nombreVar})`);

//     josLogger.trace(`valorRaw[4]:    ${valorRaw.toString('hex')}`);
//     josLogger.trace(`valorU32:       ${valorU32}`);
//     josLogger.trace(`valorI32:       ${valorI32}`);
//     josLogger.trace(`valorF32:       ${Number.isNaN(valorF32) ? 'NaN' : valorF32}`);

//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`variable1_2:    ${variable1_2}`);

//     josLogger.trace(`variable2Raw:   ${var2Raw.toString('hex')} (u32=${var2U32})`);
//     josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
//   }
//   josLogger.trace(`---------- ↑ DATA (DF_INICIO_CRIANZA) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== DF_FIN_CRIANZA (Omega) – Capa RAW ===================

export function getParametroHistoricoPayloadOmegaFinCrianza(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_FIN_CRI_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhFinTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.tipoDato, PH_FIN_CRI_OFF.tipoDato + 1);
}
export function getBytesPhFinMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.mac, PH_FIN_CRI_OFF.mac + 8);
}
export function getBytesPhFinFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.fecha, PH_FIN_CRI_OFF.fecha + 3);
}
export function getBytesPhFinHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.hora, PH_FIN_CRI_OFF.hora + 3);
}
export function getBytesPhFinIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.idUnico, PH_FIN_CRI_OFF.idUnico + 1);
}
export function getBytesPhFinIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.idCliente, PH_FIN_CRI_OFF.idCliente + 2);
}
export function getBytesPhFinNombreVariableTipoAnimal(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.nombreVarTipoAnimal, PH_FIN_CRI_OFF.nombreVarTipoAnimal + 2);
}
export function getBytesPhFinNAnimalesMachosMixtos(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.nMachosMixtos, PH_FIN_CRI_OFF.nMachosMixtos + 4);
}
export function getBytesPhFinIdentificadorCrianzaUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.idCrianza, PH_FIN_CRI_OFF.idCrianza + 4);
}
export function getBytesPhFinDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.diaCrianza, PH_FIN_CRI_OFF.diaCrianza + 2);
}
export function getBytesPhFinVariable1_2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.variable1_2, PH_FIN_CRI_OFF.variable1_2 + 2);
}
export function getBytesPhFinNAnimalesHembras(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.nHembras, PH_FIN_CRI_OFF.nHembras + 4);
}
export function getBytesPhFinVariable3(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
  return p.subarray(PH_FIN_CRI_OFF.variable3, PH_FIN_CRI_OFF.variable3 + 4);
}

// =================== DF_FIN_CRIANZA (Omega) – Capa VALOR ===================

export function getPhFinTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhFinTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhFinMacRaw(frame: Buffer): Buffer | undefined { return getBytesPhFinMac(frame); }
export function getPhFinMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhFinMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
export function getPhFinMacNumber(frame: Buffer): number | undefined {
  const v = getPhFinMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhFinFecha(frame: Buffer) {
  const b = getBytesPhFinFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhFinHora(frame: Buffer) {
  const b = getBytesPhFinHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhFinIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhFinIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhFinIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhFinIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhFinNombreVariableTipoAnimal(frame: Buffer): number | undefined {
  const b = getBytesPhFinNombreVariableTipoAnimal(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhFinNombreVariableTipoAnimalEnum(frame: Buffer): EnCrianzaTipoAnimal | undefined {
  const v = getPhFinNombreVariableTipoAnimal(frame);
  return v === undefined ? undefined : (v as EnCrianzaTipoAnimal);
}
export function getPhFinNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhFinNAnimalesMachosMixtos(frame);
}
export function getPhFinNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
  const b = getBytesPhFinNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhFinNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
  const b = getBytesPhFinNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}
export function getPhFinNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
  const b = getBytesPhFinNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}
export function getPhFinIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhFinIdentificadorCrianzaUnico(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhFinDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhFinDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhFinVariable1_2(frame: Buffer): number | undefined {
  const b = getBytesPhFinVariable1_2(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhFinNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhFinNAnimalesHembras(frame);
}
export function getPhFinNAnimalesHembrasU32(frame: Buffer): number | undefined {
  const b = getBytesPhFinNAnimalesHembras(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhFinVariable3Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhFinVariable3(frame);
}
export function getPhFinVariable3U32(frame: Buffer): number | undefined {
  const b = getBytesPhFinVariable3(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== Logger (DF_FIN_CRIANZA) ===================

export function logTramaParametroHistoricoFinCrianzaOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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

// /** Devuelve el payload DF_FIN_CRIANZA (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaFinCrianza(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_FIN_CRI_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (DF_FIN_CRIANZA) ===================

// export function getPhFinTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt8(PH_FIN_CRI_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhFinMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_FIN_CRI_OFF.mac, PH_FIN_CRI_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhFinMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_FIN_CRI_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_FIN_CRI_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhFinMacNumber(frame: Buffer): number | undefined {
//   const v = getPhFinMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhFinFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   const off = PH_FIN_CRI_OFF.fecha;
//   return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
// }

// export function getPhFinHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   const off = PH_FIN_CRI_OFF.hora;
//   return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
// }

// export function getPhFinIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt8(PH_FIN_CRI_OFF.idUnico);
// }

// export function getPhFinIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_FIN_CRI_OFF.idCliente);
// }

// export function getPhFinNombreVariableTipoAnimal(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_FIN_CRI_OFF.nombreVarTipoAnimal);
// }

// export function getPhFinNombreVariableTipoAnimalEnum(frame: Buffer): EnCrianzaTipoAnimal | undefined {
//   const n = getPhFinNombreVariableTipoAnimal(frame);
//   return n === undefined ? undefined : (n as EnCrianzaTipoAnimal);
// }

// /** n_animales_machos_mixtos (Raw 4B). */
// export function getPhFinNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_FIN_CRI_OFF.nMachosMixtos, PH_FIN_CRI_OFF.nMachosMixtos + 4);
// }

// /** n_animales_machos_mixtos como UInt32BE. */
// export function getPhFinNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_FIN_CRI_OFF.nMachosMixtos);
// }

// /** n_animales_machos_mixtos como Int32BE. */
// export function getPhFinNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_FIN_CRI_OFF.nMachosMixtos);
// }

// /** n_animales_machos_mixtos como Float32BE. */
// export function getPhFinNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_FIN_CRI_OFF.nMachosMixtos);
// }

// export function getPhFinIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_FIN_CRI_OFF.idCrianza);
// }

// export function getPhFinDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_FIN_CRI_OFF.diaCrianza);
// }

// export function getPhFinVariable1_2(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_FIN_CRI_OFF.variable1_2);
// }

// /** n_animales_hembras (Raw 4B). */
// export function getPhFinNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_FIN_CRI_OFF.nHembras, PH_FIN_CRI_OFF.nHembras + 4);
// }

// /** n_animales_hembras como UInt32BE. */
// export function getPhFinNAnimalesHembrasU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_FIN_CRI_OFF.nHembras);
// }

// /** variable3 crudo (4B). */
// export function getPhFinVariable3Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.subarray(PH_FIN_CRI_OFF.variable3, PH_FIN_CRI_OFF.variable3 + 4);
// }

// /** variable3 como UInt32BE. */
// export function getPhFinVariable3U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_FIN_CRI_OFF.variable3);
// }

// // =================== Logger (DF_FIN_CRIANZA) ===================

// export function logTramaParametroHistoricoFinCrianzaOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaFinCrianza(frame);

//   josLogger.trace(`---------- ↓ DATA (DF_FIN_CRIANZA) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhFinMacRaw(frame)!;
//     const tipoDato = getPhFinTipoDato(frame)!;

//     const fecha = getPhFinFecha(frame)!;
//     const hora = getPhFinHora(frame)!;

//     const idUnico = getPhFinIdUnico(frame)!;
//     const idCliente = getPhFinIdentificadorCliente(frame)!;

//     const tipoAnimalVal = getPhFinNombreVariableTipoAnimal(frame)!;
//     const tipoAnimalEnum = EnCrianzaTipoAnimal[tipoAnimalVal as EnCrianzaTipoAnimal] ?? `${tipoAnimalVal}`;

//     const nMachosMixtosRaw = getPhFinNAnimalesMachosMixtosRaw(frame)!;
//     const nMachosMixtosU32 = getPhFinNAnimalesMachosMixtosU32(frame)!;
//     const nMachosMixtosI32 = getPhFinNAnimalesMachosMixtosI32(frame)!;
//     const nMachosMixtosF32 = getPhFinNAnimalesMachosMixtosF32(frame)!;

//     const idCrianza = getPhFinIdentificadorCrianzaUnico(frame)!;
//     const diaCrianza = getPhFinDiaCrianza(frame)!;
//     const var1_2 = getPhFinVariable1_2(frame)!;

//     const nHembrasRaw = getPhFinNAnimalesHembrasRaw(frame)!;
//     const nHembrasU32 = getPhFinNAnimalesHembrasU32(frame)!;

//     const var3Raw = getPhFinVariable3Raw(frame)!;
//     const var3U32 = getPhFinVariable3U32(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);

//     josLogger.trace(`tipoAnimal:     ${tipoAnimalEnum} (${tipoAnimalVal})`);
//     josLogger.trace(`nMach/Mixtos:   raw=${nMachosMixtosRaw.toString('hex')}  u32=${nMachosMixtosU32}  i32=${nMachosMixtosI32}  f32=${Number.isNaN(nMachosMixtosF32) ? 'NaN' : nMachosMixtosF32}`);

//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`variable1_2:    ${var1_2}`);

//     josLogger.trace(`nHembras:       raw=${nHembrasRaw.toString('hex')}  u32=${nHembrasU32}`);
//     josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
//   }
//   josLogger.trace(`---------- ↑ DATA (DF_FIN_CRIANZA) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== ENTRADA_ANIMALES (Omega) – Capa RAW ===================

export function getParametroHistoricoPayloadOmegaEntradaAnimales(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_ENTRADA_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhEntradaTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.tipoDato, PH_ENTRADA_OFF.tipoDato + 1);
}
export function getBytesPhEntradaMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.mac, PH_ENTRADA_OFF.mac + 8);
}
export function getBytesPhEntradaFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.fecha, PH_ENTRADA_OFF.fecha + 3);
}
export function getBytesPhEntradaHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.hora, PH_ENTRADA_OFF.hora + 3);
}
export function getBytesPhEntradaIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.idUnico, PH_ENTRADA_OFF.idUnico + 1);
}
export function getBytesPhEntradaIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.idCliente, PH_ENTRADA_OFF.idCliente + 2);
}
export function getBytesPhEntradaNombreVariableTipoAnimal(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.nombreVarTipoAnimal, PH_ENTRADA_OFF.nombreVarTipoAnimal + 2);
}
export function getBytesPhEntradaNAnimalesMachosMixtos(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.nMachosMixtos, PH_ENTRADA_OFF.nMachosMixtos + 4);
}
export function getBytesPhEntradaIdentificadorCrianzaUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.idCrianza, PH_ENTRADA_OFF.idCrianza + 4);
}
export function getBytesPhEntradaDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.diaCrianza, PH_ENTRADA_OFF.diaCrianza + 2);
}
export function getBytesPhEntradaVariable1_2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.variable1_2, PH_ENTRADA_OFF.variable1_2 + 2);
}
export function getBytesPhEntradaNAnimalesHembras(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.nHembras, PH_ENTRADA_OFF.nHembras + 4);
}
export function getBytesPhEntradaVariable3(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
  return p.subarray(PH_ENTRADA_OFF.variable3, PH_ENTRADA_OFF.variable3 + 4);
}

// =================== ENTRADA_ANIMALES (Omega) – Capa VALOR ===================

export function getPhEntradaTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhEntradaTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhEntradaMacRaw(frame: Buffer): Buffer | undefined { return getBytesPhEntradaMac(frame); }
export function getPhEntradaMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhEntradaMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
export function getPhEntradaMacNumber(frame: Buffer): number | undefined {
  const v = getPhEntradaMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhEntradaFecha(frame: Buffer) {
  const b = getBytesPhEntradaFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhEntradaHora(frame: Buffer) {
  const b = getBytesPhEntradaHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhEntradaIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhEntradaIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEntradaNombreVariableTipoAnimal(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaNombreVariableTipoAnimal(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEntradaNombreVariableTipoAnimalEnum(frame: Buffer): EnCrianzaTipoAnimal | undefined {
  const v = getPhEntradaNombreVariableTipoAnimal(frame);
  return v === undefined ? undefined : (v as EnCrianzaTipoAnimal);
}
export function getPhEntradaNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEntradaNAnimalesMachosMixtos(frame);
}
export function getPhEntradaNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEntradaNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}
export function getPhEntradaNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}
export function getPhEntradaIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaIdentificadorCrianzaUnico(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEntradaDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhEntradaVariable1_2(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaVariable1_2(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhEntradaNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhEntradaNAnimalesHembras(frame);
}
export function getPhEntradaNAnimalesHembrasU32(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaNAnimalesHembras(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhEntradaVariable3Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhEntradaVariable3(frame);
}
export function getPhEntradaVariable3U32(frame: Buffer): number | undefined {
  const b = getBytesPhEntradaVariable3(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== Logger (ENTRADA_ANIMALES) ===================

export function logTramaParametroHistoricoEntradaAnimalesOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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

// /** Devuelve el payload ENTRADA_ANIMALES (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaEntradaAnimales(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_ENTRADA_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (ENTRADA_ANIMALES) ===================

// export function getPhEntradaTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt8(PH_ENTRADA_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhEntradaMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.subarray(PH_ENTRADA_OFF.mac, PH_ENTRADA_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhEntradaMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_ENTRADA_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_ENTRADA_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhEntradaMacNumber(frame: Buffer): number | undefined {
//   const v = getPhEntradaMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhEntradaFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   const off = PH_ENTRADA_OFF.fecha;
//   return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
// }

// export function getPhEntradaHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   const off = PH_ENTRADA_OFF.hora;
//   return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
// }

// export function getPhEntradaIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt8(PH_ENTRADA_OFF.idUnico);
// }

// export function getPhEntradaIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_ENTRADA_OFF.idCliente);
// }

// export function getPhEntradaNombreVariableTipoAnimal(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_ENTRADA_OFF.nombreVarTipoAnimal);
// }

// export function getPhEntradaNombreVariableTipoAnimalEnum(frame: Buffer): EnCrianzaTipoAnimal | undefined {
//   const n = getPhEntradaNombreVariableTipoAnimal(frame);
//   return n === undefined ? undefined : (n as EnCrianzaTipoAnimal);
// }

// /** n_animales_machos_mixtos (Raw 4B). */
// export function getPhEntradaNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.subarray(PH_ENTRADA_OFF.nMachosMixtos, PH_ENTRADA_OFF.nMachosMixtos + 4);
// }

// /** n_animales_machos_mixtos como UInt32BE. */
// export function getPhEntradaNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_ENTRADA_OFF.nMachosMixtos);
// }

// /** n_animales_machos_mixtos como Int32BE. */
// export function getPhEntradaNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_ENTRADA_OFF.nMachosMixtos);
// }

// /** n_animales_machos_mixtos como Float32BE. */
// export function getPhEntradaNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_ENTRADA_OFF.nMachosMixtos);
// }

// export function getPhEntradaIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_ENTRADA_OFF.idCrianza);
// }

// export function getPhEntradaDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_ENTRADA_OFF.diaCrianza);
// }

// export function getPhEntradaVariable1_2(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_ENTRADA_OFF.variable1_2);
// }

// /** n_animales_hembras (Raw 4B). */
// export function getPhEntradaNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.subarray(PH_ENTRADA_OFF.nHembras, PH_ENTRADA_OFF.nHembras + 4);
// }

// /** n_animales_hembras como UInt32BE. */
// export function getPhEntradaNAnimalesHembrasU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_ENTRADA_OFF.nHembras);
// }

// /** variable3 crudo (4B). */
// export function getPhEntradaVariable3Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.subarray(PH_ENTRADA_OFF.variable3, PH_ENTRADA_OFF.variable3 + 4);
// }

// /** variable3 como UInt32BE. */
// export function getPhEntradaVariable3U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_ENTRADA_OFF.variable3);
// }

// // =================== Logger (ENTRADA_ANIMALES) ===================

// export function logTramaParametroHistoricoEntradaAnimalesOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaEntradaAnimales(frame);

//   josLogger.trace(`---------- ↓ DATA (ENTRADA_ANIMALES) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhEntradaMacRaw(frame)!;
//     const tipoDato = getPhEntradaTipoDato(frame)!;

//     const fecha = getPhEntradaFecha(frame)!;
//     const hora = getPhEntradaHora(frame)!;

//     const idUnico = getPhEntradaIdUnico(frame)!;
//     const idCliente = getPhEntradaIdentificadorCliente(frame)!;

//     const tipoAnimalVal = getPhEntradaNombreVariableTipoAnimal(frame)!;
//     const tipoAnimalEnum = EnCrianzaTipoAnimal[tipoAnimalVal as EnCrianzaTipoAnimal] ?? `${tipoAnimalVal}`;

//     const nMachosMixtosRaw = getPhEntradaNAnimalesMachosMixtosRaw(frame)!;
//     const nMachosMixtosU32 = getPhEntradaNAnimalesMachosMixtosU32(frame)!;
//     const nMachosMixtosI32 = getPhEntradaNAnimalesMachosMixtosI32(frame)!;
//     const nMachosMixtosF32 = getPhEntradaNAnimalesMachosMixtosF32(frame)!;

//     const idCrianza = getPhEntradaIdentificadorCrianzaUnico(frame)!;
//     const diaCrianza = getPhEntradaDiaCrianza(frame)!;
//     const var1_2 = getPhEntradaVariable1_2(frame)!;

//     const nHembrasRaw = getPhEntradaNAnimalesHembrasRaw(frame)!;
//     const nHembrasU32 = getPhEntradaNAnimalesHembrasU32(frame)!;

//     const var3Raw = getPhEntradaVariable3Raw(frame)!;
//     const var3U32 = getPhEntradaVariable3U32(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);

//     josLogger.trace(`tipoAnimal:     ${tipoAnimalEnum} (${tipoAnimalVal})`);
//     josLogger.trace(`nMach/Mixtos:   raw=${nMachosMixtosRaw.toString('hex')}  u32=${nMachosMixtosU32}  i32=${nMachosMixtosI32}  f32=${Number.isNaN(nMachosMixtosF32) ? 'NaN' : nMachosMixtosF32}`);

//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`variable1_2:    ${var1_2}`);

//     josLogger.trace(`nHembras:       raw=${nHembrasRaw.toString('hex')}  u32=${nHembrasU32}`);
//     josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
//   }
//   josLogger.trace(`---------- ↑ DATA (ENTRADA_ANIMALES) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== ALTAS_BAJAS (Omega) – Capa RAW ===================

export function getParametroHistoricoPayloadOmegaAltasBajas(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca && getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined; // safeguard if typo; keep original:
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_AB_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhAltasBajasTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.tipoDato, PH_AB_OFF.tipoDato + 1);
}
export function getBytesPhAltasBajasMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.mac, PH_AB_OFF.mac + 8);
}
export function getBytesPhAltasBajasFecha(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.fecha, PH_AB_OFF.fecha + 3);
}
export function getBytesPhAltasBajasHora(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.hora, PH_AB_OFF.hora + 3);
}
export function getBytesPhAltasBajasIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.idUnico, PH_AB_OFF.idUnico + 1);
}
export function getBytesPhAltasBajasIdentificadorCliente(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.idCliente, PH_AB_OFF.idCliente + 2);
}
export function getBytesPhAltasBajasNombreVariableAccion(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.nombreVarAccion, PH_AB_OFF.nombreVarAccion + 2);
}
export function getBytesPhAltasBajasNAnimalesMachosMixtos(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.nMachosMixtos, PH_AB_OFF.nMachosMixtos + 4);
}
export function getBytesPhAltasBajasIdentificadorCrianzaUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.idCrianza, PH_AB_OFF.idCrianza + 4);
}
export function getBytesPhAltasBajasDiaCrianza(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.diaCrianza, PH_AB_OFF.diaCrianza + 2);
}
export function getBytesPhAltasBajasVariable1_2(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.variable1_2, PH_AB_OFF.variable1_2 + 2);
}
export function getBytesPhAltasBajasNAnimalesHembras(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.nHembras, PH_AB_OFF.nHembras + 4);
}
export function getBytesPhAltasBajasVariable3(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
  return p.subarray(PH_AB_OFF.variable3, PH_AB_OFF.variable3 + 4);
}

// =================== ALTAS_BAJAS (Omega) – Capa VALOR ===================

export function getPhAltasBajasTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhAltasBajasTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}
export function getPhAltasBajasMacRaw(frame: Buffer): Buffer | undefined { return getBytesPhAltasBajasMac(frame); }
export function getPhAltasBajasMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhAltasBajasMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}
export function getPhAltasBajasMacNumber(frame: Buffer): number | undefined {
  const v = getPhAltasBajasMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}
export function getPhAltasBajasFecha(frame: Buffer) {
  const b = getBytesPhAltasBajasFecha(frame); if (!b) return undefined;
  return { dia: b.readUInt8(0), mes: b.readUInt8(1), anyo: 2000 + (b.readUInt8(2) % 100) };
}
export function getPhAltasBajasHora(frame: Buffer) {
  const b = getBytesPhAltasBajasHora(frame); if (!b) return undefined;
  return { hora: b.readUInt8(0), min: b.readUInt8(1), seg: b.readUInt8(2) };
}
export function getPhAltasBajasIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}
export function getPhAltasBajasIdentificadorCliente(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasIdentificadorCliente(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhAltasBajasNombreVariableAccion(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasNombreVariableAccion(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhAltasBajasNombreVariableAccionEnum(frame: Buffer): EnCrianzaAltaBajaAccion | undefined {
  const v = getPhAltasBajasNombreVariableAccion(frame);
  return v === undefined ? undefined : (v as EnCrianzaAltaBajaAccion);
}
export function getPhAltasBajasNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhAltasBajasNAnimalesMachosMixtos(frame);
}
export function getPhAltasBajasNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhAltasBajasNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readInt32BE(0);
}
export function getPhAltasBajasNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasNAnimalesMachosMixtos(frame); if (!b) return undefined;
  return b.readFloatBE(0);
}
export function getPhAltasBajasIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasIdentificadorCrianzaUnico(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhAltasBajasDiaCrianza(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasDiaCrianza(frame); if (!b) return undefined;
  return b.readInt16BE(0);
}
export function getPhAltasBajasVariable1_2(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasVariable1_2(frame); if (!b) return undefined;
  return b.readUInt16BE(0);
}
export function getPhAltasBajasNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhAltasBajasNAnimalesHembras(frame);
}
export function getPhAltasBajasNAnimalesHembrasU32(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasNAnimalesHembras(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}
export function getPhAltasBajasVariable3Raw(frame: Buffer): Buffer | undefined {
  return getBytesPhAltasBajasVariable3(frame);
}
export function getPhAltasBajasVariable3U32(frame: Buffer): number | undefined {
  const b = getBytesPhAltasBajasVariable3(frame); if (!b) return undefined;
  return b.readUInt32BE(0);
}

// =================== Logger (ALTAS_BAJAS) ===================

export function logTramaParametroHistoricoAltasBajasOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
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


// /** Devuelve el payload ALTAS_BAJAS (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaAltasBajas(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_AB_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (ALTAS_BAJAS) ===================

// export function getPhAltasBajasTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt8(PH_AB_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhAltasBajasMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.subarray(PH_AB_OFF.mac, PH_AB_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhAltasBajasMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_AB_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_AB_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhAltasBajasMacNumber(frame: Buffer): number | undefined {
//   const v = getPhAltasBajasMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhAltasBajasFecha(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   const off = PH_AB_OFF.fecha;
//   return { dia: p.readUInt8(off), mes: p.readUInt8(off + 1), anyo: 2000 + (p.readUInt8(off + 2) % 100) };
// }

// export function getPhAltasBajasHora(frame: Buffer) {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   const off = PH_AB_OFF.hora;
//   return { hora: p.readUInt8(off), min: p.readUInt8(off + 1), seg: p.readUInt8(off + 2) };
// }

// export function getPhAltasBajasIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt8(PH_AB_OFF.idUnico);
// }

// export function getPhAltasBajasIdentificadorCliente(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_AB_OFF.idCliente);
// }

// export function getPhAltasBajasNombreVariableAccion(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_AB_OFF.nombreVarAccion);
// }

// export function getPhAltasBajasNombreVariableAccionEnum(frame: Buffer): EnCrianzaAltaBajaAccion | undefined {
//   const n = getPhAltasBajasNombreVariableAccion(frame);
//   return n === undefined ? undefined : (n as EnCrianzaAltaBajaAccion);
// }

// /** n_animales_machos_mixtos (Raw 4B). */
// export function getPhAltasBajasNAnimalesMachosMixtosRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.subarray(PH_AB_OFF.nMachosMixtos, PH_AB_OFF.nMachosMixtos + 4);
// }

// /** n_animales_machos_mixtos como UInt32BE. */
// export function getPhAltasBajasNAnimalesMachosMixtosU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_AB_OFF.nMachosMixtos);
// }

// /** n_animales_machos_mixtos como Int32BE. */
// export function getPhAltasBajasNAnimalesMachosMixtosI32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readInt32BE(PH_AB_OFF.nMachosMixtos);
// }

// /** n_animales_machos_mixtos como Float32BE. */
// export function getPhAltasBajasNAnimalesMachosMixtosF32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readFloatBE(PH_AB_OFF.nMachosMixtos);
// }

// export function getPhAltasBajasIdentificadorCrianzaUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_AB_OFF.idCrianza);
// }

// export function getPhAltasBajasDiaCrianza(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readInt16BE(PH_AB_OFF.diaCrianza);
// }

// export function getPhAltasBajasVariable1_2(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt16BE(PH_AB_OFF.variable1_2);
// }

// /** n_animales_hembras (Raw 4B). */
// export function getPhAltasBajasNAnimalesHembrasRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.subarray(PH_AB_OFF.nHembras, PH_AB_OFF.nHembras + 4);
// }

// /** n_animales_hembras como UInt32BE. */
// export function getPhAltasBajasNAnimalesHembrasU32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_AB_OFF.nHembras);
// }

// /** variable3 crudo (4B). */
// export function getPhAltasBajasVariable3Raw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.subarray(PH_AB_OFF.variable3, PH_AB_OFF.variable3 + 4);
// }

// /** variable3 como UInt32BE. */
// export function getPhAltasBajasVariable3U32(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame); if (!p) return undefined;
//   return p.readUInt32BE(PH_AB_OFF.variable3);
// }

// // =================== Logger (ALTAS_BAJAS) ===================

// export function logTramaParametroHistoricoAltasBajasOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaAltasBajas(frame);

//   josLogger.trace(`---------- ↓ DATA (ALTAS_BAJAS) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhAltasBajasMacRaw(frame)!;
//     const tipoDato = getPhAltasBajasTipoDato(frame)!;

//     const fecha = getPhAltasBajasFecha(frame)!;
//     const hora = getPhAltasBajasHora(frame)!;

//     const idUnico = getPhAltasBajasIdUnico(frame)!;
//     const idCliente = getPhAltasBajasIdentificadorCliente(frame)!;

//     const accionVal = getPhAltasBajasNombreVariableAccion(frame)!;
//     const accionEnum = EnCrianzaAltaBajaAccion[accionVal as EnCrianzaAltaBajaAccion] ?? `${accionVal}`;

//     const nMachosRaw = getPhAltasBajasNAnimalesMachosMixtosRaw(frame)!;
//     const nMachosU32 = getPhAltasBajasNAnimalesMachosMixtosU32(frame)!;
//     const nMachosI32 = getPhAltasBajasNAnimalesMachosMixtosI32(frame)!;
//     const nMachosF32 = getPhAltasBajasNAnimalesMachosMixtosF32(frame)!;

//     const idCrianza = getPhAltasBajasIdentificadorCrianzaUnico(frame)!;
//     const diaCrianza = getPhAltasBajasDiaCrianza(frame)!;
//     const var1_2 = getPhAltasBajasVariable1_2(frame)!;

//     const nHembrasRaw = getPhAltasBajasNAnimalesHembrasRaw(frame)!;
//     const nHembrasU32 = getPhAltasBajasNAnimalesHembrasU32(frame)!;

//     const var3Raw = getPhAltasBajasVariable3Raw(frame)!;
//     const var3U32 = getPhAltasBajasVariable3U32(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`fecha:          ${fecha.dia}-${fecha.mes}-${fecha.anyo}`);
//     josLogger.trace(`hora:           ${hora.hora}:${hora.min}:${hora.seg}`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`idCliente:      ${idCliente}`);

//     josLogger.trace(`acción:         ${accionEnum} (${accionVal})`);
//     josLogger.trace(`nMach/Mixtos:   raw=${nMachosRaw.toString('hex')}  u32=${nMachosU32}  i32=${nMachosI32}  f32=${Number.isNaN(nMachosF32) ? 'NaN' : nMachosF32}`);

//     josLogger.trace(`idCrianza:      ${idCrianza}`);
//     josLogger.trace(`diaCrianza:     ${diaCrianza}`);
//     josLogger.trace(`variable1_2:    ${var1_2}`);

//     josLogger.trace(`nHembras:       raw=${nHembrasRaw.toString('hex')}  u32=${nHembrasU32}`);
//     josLogger.trace(`variable3Raw:   ${var3Raw.toString('hex')} (u32=${var3U32})`);
//   }
//   josLogger.trace(`---------- ↑ DATA (ALTAS_BAJAS) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }


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

// =================== DEBUG_STRING (Omega) – Capa RAW ===================

export function getParametroHistoricoPayloadOmegaDebugString(frame: Buffer): Buffer | undefined {
  if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
  if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
  const data = getDataSectionOld(frame);
  return data && data.length >= PH_DBG_STR_TOTAL_LEN ? data : undefined;
}

// ---- Bytes por campo
export function getBytesPhDebugStringTipoDato(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.subarray(PH_DBG_STR_OFF.tipoDato, PH_DBG_STR_OFF.tipoDato + 1);
}
export function getBytesPhDebugStringMac(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.subarray(PH_DBG_STR_OFF.mac, PH_DBG_STR_OFF.mac + 8);
}
export function getBytesPhDebugStringIdUnico(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.subarray(PH_DBG_STR_OFF.idUnico, PH_DBG_STR_OFF.idUnico + 1);
}
export function getBytesPhDebugStringTexto30(frame: Buffer): Buffer | undefined {
  const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
  return p.subarray(PH_DBG_STR_OFF.str, PH_DBG_STR_OFF.str + 30);
}

// =================== DEBUG_STRING (Omega) – Capa VALOR ===================

export function getPhDebugStringTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
  const b = getBytesPhDebugStringTipoDato(frame); if (!b) return undefined;
  return b.readUInt8(0) as EnTipoDatoDFAccion;
}

export function getPhDebugStringMacRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhDebugStringMac(frame);
}

export function getPhDebugStringMacBigInt(frame: Buffer): bigint | undefined {
  const b = getBytesPhDebugStringMac(frame); if (!b) return undefined;
  if (typeof (b as any).readBigUInt64BE === 'function') return (b as any).readBigUInt64BE(0);
  let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[i]); return v;
}

export function getPhDebugStringMacNumber(frame: Buffer): number | undefined {
  const v = getPhDebugStringMacBigInt(frame); if (v === undefined) return undefined;
  return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
}

export function getPhDebugStringIdUnico(frame: Buffer): number | undefined {
  const b = getBytesPhDebugStringIdUnico(frame); if (!b) return undefined;
  return b.readUInt8(0);
}

export function getPhDebugStringRaw(frame: Buffer): Buffer | undefined {
  return getBytesPhDebugStringTexto30(frame);
}

export function getPhDebugStringTexto(frame: Buffer): string | undefined {
  const raw = getBytesPhDebugStringTexto30(frame); if (!raw) return undefined;
  let end = raw.length; while (end > 0 && raw[end - 1] === 0x00) end--;
  return raw.subarray(0, end).toString('utf8');
}

// =================== Logger (DEBUG_STRING) ===================

export function logTramaParametroHistoricoDebugStringOmegaDf(frame: Buffer): void {
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
    josLogger.trace(`mac:            ${typeof macBuf === "number" ? macBuf : macBuf.toString('hex')}`);
    josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
    josLogger.trace(`idUnico:        ${idUnico}`);
    josLogger.trace(`debug[hex]:     ${strRaw.toString('hex')}`);
    josLogger.trace(`debug[text]:    "${strTxt}"`);
  }
  josLogger.trace(`---------- ↑ DATA (DEBUG_STRING) ↑ ----------`);
  josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
  josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
}

/** Devuelve el payload DEBUG_STRING (40B) si TT=omegaPantallaPlaca y TM=tmEnviaParametroHistorico. */
// export function getParametroHistoricoPayloadOmegaDebugString(frame: Buffer): Buffer | undefined {
//   if (getTipoTramaOld(frame) !== EnTipoTramaOld.omegaPantallaPlaca) return undefined;
//   if (getTipoMensajeOld(frame) !== EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico) return undefined;
//   const data = getDataSectionOld(frame);
//   return data && data.length >= PH_DBG_STR_TOTAL_LEN ? data : undefined;
// }

// // =================== getters campo a campo (DEBUG_STRING) ===================

// export function getPhDebugStringTipoDato(frame: Buffer): EnTipoDatoDFAccion | undefined {
//   const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
//   return p.readUInt8(PH_DBG_STR_OFF.tipoDato) as EnTipoDatoDFAccion;
// }

// export function getPhDebugStringMacRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
//   return p.subarray(PH_DBG_STR_OFF.mac, PH_DBG_STR_OFF.mac + 8);
// }

// /** MAC como bigint (0..2^64-1). */
// export function getPhDebugStringMacBigInt(frame: Buffer): bigint | undefined {
//   const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
//   if (typeof (p as Buffer).readBigUInt64BE === 'function') {
//     return p.readBigUInt64BE(PH_DBG_STR_OFF.mac);
//   }
//   let v = 0n;
//   for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(p[PH_DBG_STR_OFF.mac + i]);
//   return v;
// }

// /** MAC como number si es seguro (<= 2^53-1); si no, undefined. */
// export function getPhDebugStringMacNumber(frame: Buffer): number | undefined {
//   const v = getPhDebugStringMacBigInt(frame);
//   if (v === undefined) return undefined;
//   return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : undefined;
// }

// export function getPhDebugStringIdUnico(frame: Buffer): number | undefined {
//   const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
//   return p.readUInt8(PH_DBG_STR_OFF.idUnico);
// }

// /** Devuelve los 30 bytes de la cadena (crudo, con posibles ceros de padding). */
// export function getPhDebugStringRaw(frame: Buffer): Buffer | undefined {
//   const p = getParametroHistoricoPayloadOmegaDebugString(frame); if (!p) return undefined;
//   return p.subarray(PH_DBG_STR_OFF.str, PH_DBG_STR_OFF.str + 30);
// }

// /** Devuelve la cadena interpretada como UTF-8/ASCII, sin ceros finales. */
// export function getPhDebugStringTexto(frame: Buffer): string | undefined {
//   const raw = getPhDebugStringRaw(frame); if (!raw) return undefined;
//   // eliminar padding de ceros al final
//   let end = raw.length;
//   while (end > 0 && raw[end - 1] === 0x00) end--;
//   return raw.subarray(0, end).toString('utf8');
// }

// // =================== Logger (DEBUG_STRING) ===================

// export function logTramaParametroHistoricoDebugStringOmegaDf(frame: Buffer): void {
//   // Cabecera común
//   logCabeceraComunOld(frame);

//   const p = getParametroHistoricoPayloadOmegaDebugString(frame);

//   josLogger.trace(`---------- ↓ DATA (DEBUG_STRING) ↓ ----------`);
//   if (!p) {
//     josLogger.trace(`Payload: <incompatible o demasiado corto>`);
//   } else {
//     const macBuf = getPhDebugStringMacRaw(frame)!;
//     const tipoDato = getPhDebugStringTipoDato(frame)!;
//     const idUnico = getPhDebugStringIdUnico(frame)!;
//     const strRaw = getPhDebugStringRaw(frame)!;
//     const strTxt = getPhDebugStringTexto(frame)!;

//     josLogger.trace(`len(payload):   ${p.length}`);
//     josLogger.trace(`mac:            ${macBuf.toString('hex')}`);
//     josLogger.trace(`tipoDato:       ${EnTipoDatoDFAccion[tipoDato]} (${tipoDato})`);
//     josLogger.trace(`idUnico:        ${idUnico}`);
//     josLogger.trace(`debug[hex]:     ${strRaw.toString('hex')}`);
//     josLogger.trace(`debug[text]:    "${strTxt}"`);
//   }
//   josLogger.trace(`---------- ↑ DATA (DEBUG_STRING) ↑ ----------`);
//   josLogger.trace(`CRC: ${getCRCFromFrameOld(frame)}`);
//   josLogger.trace(`Fin: ${getEndOld(frame).toString('hex')}`);
// }

