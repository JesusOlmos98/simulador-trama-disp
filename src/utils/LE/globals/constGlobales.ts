import { EnvConfiguration } from 'config/app.config';

export const env = EnvConfiguration();

export const PORT = env.port ?? 8001;
export const DESTINY_HOST = env.destinyHost ?? '127.0.0.1';
export const DESTINY_PORT = env.destinyPort ?? 8010; // 8020 o 8010;

export const START_ARR = [0xcc, 0xaa, 0xaa, 0xaa] as const;
export const END_ARR = [0xcc, 0xbb, 0xbb, 0xbb] as const;

export const START = Buffer.from(START_ARR);
export const END = Buffer.from(END_ARR);

export const HEADER_OFFSET = START.length; // empieza justo después de START
export const HEADER_SIZE = 10; // 1+1+2+2+1+1+2
export const TIPO_REGISTRO_ESTADISTICO_OFFSET_EN_PAYLOAD = 4 + 1 + 1 + 1; // 4(mac) + 1(tipoDatoHdr) + 1(idDentroSegundo) + 1(version) = 7
export const ESTADIS_HEADER_LEN = 22; // MAC(4)+cabecera(4)+res(4)+fecha(4)+hora(4)+res5(1)+nDatos(1)

export const TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO = 47; // 0x2F
export const PROTO_VERSION = 2; // según doc

export const MAX_FRAME_BYTES = 2500; // frame completo (aprox)
export const MAX_DATA_BYTES = 2480; // ver protocolo

export const ACK_TIMEOUT_MS = 6000;

export const ACK_TTL_MS = 8000; // vencimiento de pendientes (evitar colisiones entre segundos) //! REVISAR
