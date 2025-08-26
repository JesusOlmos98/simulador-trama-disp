
// Helpers de tipado

import { PresentacionDto } from "src/dto/frame.dto";

export function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

export function isNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
}

export function isPresentacionDto(v: unknown): v is PresentacionDto {
    if (!isObject(v)) return false;
    const o = v as Record<string, unknown>;
    return (
        isNumber(o.versionPresentacion) &&
        isNumber(o.mac) &&
        isNumber(o.versionEquipo) &&
        isNumber(o.tipoEquipo) &&
        isNumber(o.claveEquipo) &&
        isNumber(o.versionHw)
    );
}

export function readNodoOrigen(body: unknown, def = 1): number {
    if (!isObject(body)) return def;
    const raw = body['nodoOrigen'];
    return isNumber(raw) ? raw : def;
}

export function readNodoDestino(body: unknown, def = 0): number {
    if (!isObject(body)) return def;
    const raw = body['nodoDestino'];
    return isNumber(raw) ? raw : def;
}

export function readTempC(body: unknown, def = 25.0): number {
    if (!isObject(body)) return def;

    const top = body['tempC'];
    if (isNumber(top)) return top;

    const datos = body['datos'];
    if (isObject(datos)) {
        const nested = (datos as Record<string, unknown>)['tempC'];
        if (isNumber(nested)) return nested;
    }
    return def;
}

/** Si no hay presentación en el body, devuelve la default. */
export function readPresentacion(body: unknown, def: PresentacionDto): PresentacionDto {
    if (!isObject(body)) return def;
    const datos = body['datos'];
    return isPresentacionDto(datos) ? (datos as PresentacionDto) : def;
}