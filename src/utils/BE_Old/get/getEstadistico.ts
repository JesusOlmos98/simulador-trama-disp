// ========================= Estadístico OLD (TM_envia_parametro_historico) =========================

import { ParametroHistoricoOldDto } from "src/dtoBE/tt_estadisticosOld.dto";
import { EnTipoTramaOld, EnTipoMensajeDispositivoCentral, EnTipoDatoDFAccion, EnEstadisticosNombres, EnTipoDatoOld, EnTipoAccionAltasBajasRetiradasCrianzaOld, EnTipoAccionInicioFinCrianzaOld } from "../globals/enumOld";
import { getTipoTramaOld, getTipoMensajeOld, getDataSectionOld, getParsedHeaderOld, getStartOld, getCRCFromFrameOld, getEndOld } from "./getTrama";
import { josLogger } from "src/utils/josLogger";

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

// export function getPhTipoDatoOld(frame: Buffer): EnTipoDatoDFAccion | undefined {
//     const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//     return p.readUInt8(PH_OFF.tipoDato) as EnTipoDatoDFAccion;
// }
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

/** Interpreta 'datos' según el tipo DF. Si no reconoce el tipo, devuelve el Buffer crudo (4B). */
// export function getPhDatosValorOld(frame: Buffer): number | Buffer | undefined {
//     const p = getParametroHistoricoPayloadOld(frame); if (!p) return undefined;
//     const tipo = p.readUInt8(PH_OFF.tipoDato) as EnTipoDatoDFAccion;
//     const raw = p.subarray(PH_OFF.datos, PH_OFF.datos + 4);

//     // Mapeo básico por familias (todas caben en 4B en esta trama)
//     const asU32 = () => raw.readUInt32BE(0);
//     const asI32 = () => raw.readInt32BE(0);
//     const asF32 = () => raw.readFloatBE(0); // Node >=12 soporta readFloatBE

//     switch (tipo) {
//         // UINT8 / INT8 -> vienen en 4B; devolvemos el LSB con signo si aplica
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoUint8:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroUint8:
//             return raw.readUInt8(3);
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoInt8:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroInt8:
//             return raw.readInt8(3);

//         // UINT16 / INT16 -> usamos los 2 LSB
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoUint16:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroUint16:
//             return raw.readUInt16BE(2);
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoInt16:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroInt16:
//             return raw.readInt16BE(2);

//         // UINT32 / INT32
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoUint32:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroUint32:
//             return asU32();
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoInt32:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroInt32:
//             return asI32();

//         // Floats (usamos float32 BE). Incluye las variantes float0/1/2/3 por si firmware las usa igual.
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat0:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat1:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat2:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfEstadisticoFloat3:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat0:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat1:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat2:
//         case EnTipoDatoDFAccion.tipoDatoAccionDfCambioParametroFloat3:
//             return asF32();

//         // Tiempos/fechas/string/eventos/etc -> no interpretamos aquí: devolvemos los 4B crudos
//         default:
//             return raw;
//     }
// }
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
















