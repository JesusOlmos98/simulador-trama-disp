import {  EnTipoDatoOld } from "src/utils/BE_Old/globals/enumOld";
import { u8Old, u16BE, u32BE, packDatos4BE, packMac8BE, u8 } from "src/utils/helpers";
import { Fecha, Tiempo } from "src/utils/tiposGlobales";

/**
 * Payload de TM_envia_parametro_historico (OLD / BE).
 * Orden y tamaños exactos según doc:
 *  - 1B  tipoDato
 *  - 3B  fecha (día, mes, año)
 *  - 8B  mac
 *  - 3B  hora (hh, mm, ss)
 *  - 1B  identificadorUnicoDentroDelSegundo
 *  - 2B  identificadorCliente          (BE)
 *  - 2B  numeroServicio                (BE)
 *  - 4B  datos                         (interpretación depende de tipo)
 *  - 4B  identificadorCrianzaUnico     (BE)
 *  - 2B  diaCrianza                    (BE)
 */
export class ParametroHistoricoOldDto {
    /** uint8: catálogo de tipo de dato (OLD). */
    tipoDato: EnTipoDatoOld; // o tu EnTipoDato existente

    /** 3 bytes: día, mes, año(00–99). */
    fecha: Fecha;

    /** 8 bytes MAC (buffer crudo). */
    mac: number | Buffer;

    /** 3 bytes: hora, minuto, segundo. */
    hora: Tiempo;

    /** uint8: “identificador único dentro del segundo”. */
    identificadorUnicoDentroDelSegundo: number;

    /** uint16 BE: identificador cliente. */
    identificadorCliente: number;

    /** uint16 BE: número de servicio. */
    numeroServicio: number; // EnEstadisticosNombres | vacio | nombreAlarma (ENUM_textos) si tipoDato = alarmas

    /**
     * 4 bytes de datos. La interpretación depende de `tipoDato` (p.ej. UINT32, FLOAT, etc.).
     * Lo dejamos como Buffer para no acoplar aquí la semántica.
     * Esto será, por ejemplo, 25.3°C en FLOAT32 BE para temperatura o 89% en UINT32 BE para humedad.
     */
    datos: number | Buffer; // length = 4

    /** uint32 BE: identificador de crianza único. */
    identificadorCrianzaUnico: number;

    /** uint16 BE: día de la crianza. */
    diaCrianza: number;

}

/**
 * Serializa el payload de TM_envia_parametro_historico (OLD / BE) a Buffer.
 * Layout (BE):
 *  - 1B  tipoDato
 *  - 3B  fecha (día, mes, año)
 *  - 8B  mac
 *  - 3B  hora (hh, mm, ss)
 *  - 1B  identificadorUnicoDentroDelSegundo
 *  - 2B  identificadorCliente          (BE)
 *  - 2B  numeroServicio                (BE)
 *  - 4B  datos                         (tal cual, 4 bytes)
 *  - 4B  identificadorCrianzaUnico     (BE)
 *  - 2B  diaCrianza                    (BE)
 */
export function serializarParametroHistoricoOld(d: ParametroHistoricoOldDto): Buffer {
    // 1B tipoDato
    const tipoDato = u8Old(d.tipoDato);

    // 3B fecha (día, mes, año 0–99)
    const anyo1B = (d.fecha.anyo ?? 0) % 100;
    const fecha = Buffer.from([
        d.fecha.dia & 0xff,
        d.fecha.mes & 0xff,
        anyo1B & 0xff,
    ]);

    // 8B MAC
    const mac = packMac8BE(d.mac);

    // 3B hora (hh, mm, ss)
    const hora = Buffer.from([
        d.hora.hora & 0xff,
        d.hora.min & 0xff,
        d.hora.seg & 0xff,
    ]);

    // 1B identificador único
    const idUnico = u8(d.identificadorUnicoDentroDelSegundo);

    // 2B identificadorCliente (BE)
    const idCliente = u16BE(d.identificadorCliente);

    // 2B numeroServicio (BE)
    const numServicio = u16BE((d.numeroServicio as unknown as number) >>> 0);

    // 4B datos
    const datos4 = packDatos4BE(d.tipoDato, d.datos);

    // 4B identificadorCrianzaUnico (BE)
    const idCrianza = u32BE(d.identificadorCrianzaUnico >>> 0);

    // 2B diaCrianza (BE)
    const diaCrianza = u16BE(d.diaCrianza >>> 0);

    return Buffer.concat([
        tipoDato,
        fecha,
        mac,
        hora,
        idUnico,
        idCliente,
        numServicio,
        datos4,
        idCrianza,
        diaCrianza,
    ]);
}