// ========================= Estadístico OLD (TM_envia_parametro_historico) =========================

import { ParametroHistoricoOldDto } from "src/dtoBE/tt_estadisticosOld.dto";
import { EnTipoTramaOld, EnTipoMensajeDispositivoCentral, EnEstadisticosNombres, EnTipoDatoOld, EnTipoAccionAltasBajasRetiradasCrianzaOld, EnTipoAccionInicioFinCrianzaOld, EnTipoDatoDFAccion, EnEventosEstadisFamilia, EnEventosEstadisPropiedades, EnEventosEstadisSubfamilia, EnEventosEstadisTipo } from "../globals/enumOld";
import { getTipoTramaOld, getTipoMensajeOld, getDataSectionOld, getParsedHeaderOld, getStartOld, getCRCFromFrameOld, getEndOld } from "./getTrama";
import { josLogger } from "src/utils/josLogger";
import { ParametroHistoricoValorOmegaDfDto } from "src/dtoBE/tt_estadisticosOldDF.dto";
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

export function logTramaParametroHistoricoOld(frame: Buffer): void {
    const hdr = getParsedHeaderOld(frame);
    const p = getParametroHistoricoPayloadOld(frame);
    josLogger.trace(`---------- DECODIFICAMOS TRAMA EN BYTES: ----------`);
    josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
    josLogger.trace(`Versión protocolo: ${hdr.versionProtocolo} `);
    josLogger.trace(`Nodo origen: ${hdr.nodoOrigen} `);
    josLogger.trace(`Nodo destino: ${hdr.nodoDestino} `);
    josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[hdr.tipoTrama]} `);
    josLogger.trace(`Tipo Mensaje TM: ${EnTipoMensajeDispositivoCentral[hdr.tipoMensaje]} `);
    josLogger.trace(`Longitud: ${hdr.longitud} `);
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

// jos -----------------------------------------------------------
// jos Para estadisticos valores, cambio parametros y alarmas.
// jos -----------------------------------------------------------
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
    josLogger.trace(`---------- DECODIFICAMOS TRAMA EN BYTES: ----------`);
    josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
    josLogger.trace(`Versión protocolo: ${hdr.versionProtocolo} `);
    josLogger.trace(`Nodo origen: ${hdr.nodoOrigen} `);
    josLogger.trace(`Nodo destino: ${hdr.nodoDestino} `);
    josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[hdr.tipoTrama]} `);
    josLogger.trace(`Tipo Mensaje TM: ${EnTipoMensajeDispositivoCentral[hdr.tipoMensaje]} `);
    josLogger.trace(`Longitud: ${hdr.longitud} `);

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

































// jos -----------------------------------------------------------
// jos Para estadisticos evento (eventos, alarmas, warnings).
// jos -----------------------------------------------------------

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

  josLogger.trace(`---------- DECODIFICAMOS TRAMA EN BYTES: ----------`);
  josLogger.trace(`Inicio: ${getStartOld(frame).toString('hex')}`);
  josLogger.trace(`Versión protocolo: ${hdr.versionProtocolo} `);
  josLogger.trace(`Nodo origen: ${hdr.nodoOrigen} `);
  josLogger.trace(`Nodo destino: ${hdr.nodoDestino} `);
  josLogger.trace(`Tipo Trama TT: ${EnTipoTramaOld[hdr.tipoTrama]} `);
  josLogger.trace(`Tipo Mensaje TM: ${EnTipoMensajeDispositivoCentral[hdr.tipoMensaje]} `);
  josLogger.trace(`Longitud: ${hdr.longitud} `);

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
