//* ----------------------------- Protocolo antiguo (BE/Old) -----------------------------

export const ITEM_TABLA_LEN_OLD = 34; // bytes por item en TM_rt_tabla_central_{mas,fin}

// Inicio / Fin de trama (idénticos al nuevo)

export const START_OLD = Buffer.from([0xcc, 0xaa, 0xaa, 0xaa]);
export const END_OLD = Buffer.from([0xcc, 0xbb, 0xbb, 0xbb]);

export const HEADER_OFFSET_OLD = START_OLD.length; // 4
export const HEADER_SIZE_OLD = 9; // 1+2+2+1+1+2 (BE)
export const H_VER_OFF_OLD = 0; // u8
export const H_ORIG_OFF_OLD = 1; // u16 BE
export const H_DEST_OFF_OLD = 3; // u16 BE
export const H_TT_OFF_OLD = 5; // u8
export const H_TM_OFF_OLD = 6; // u8
export const H_LEN_OFF_OLD = 7; // u16 BE

// Desplazamiento al inicio del payload de datos
export const DATA_OFFSET_OLD = HEADER_OFFSET_OLD + HEADER_SIZE_OLD; // 13

// ----------------------------- TM_envia_parametro_historico (formato antiguo) -----------------------------
// Layout (payload): MAC(8) + tipo(1) + fecha(3) + hora(3) + idDentroSegundo(1) +
//                   idCliente(2) + numServicio(2) + dato(4) + idCrianza(4) + diaCrianza(2)
// -Todos los multibyte en Big-Endian.
export const HIST_OFF_MAC_OLD = 0; // 8 bytes
export const HIST_MAC_LEN_OLD = 8;
export const HIST_OFF_TIPO_DATO_OLD = 8; // uint8
export const HIST_OFF_FECHA_OLD = 9; // 3 bytes
export const HIST_OFF_HORA_OLD = 12; // 3 bytes
export const HIST_OFF_ID_SEG_OLD = 15; // uint8 (0..255)
export const HIST_OFF_ID_CLIENTE_OLD = 16; // uint16 BE
export const HIST_OFF_NUM_SERVICIO_OLD = 18; // uint16 BE
export const HIST_OFF_DATO32_OLD = 20; // uint32 BE
export const HIST_OFF_ID_CRIANZA_OLD = 24; // uint32 BE
export const HIST_OFF_DIA_CRIANZA_OLD = 28; // uint16 BE
export const HIST_MIN_PAYLOAD_BYTES_OLD = 30; // hasta día de crianza incluido

// En variantes "inicio/fin crianza" y "altas/bajas" cambian los significados de
// idCliente/numServicio/dato, pero los offsets se mantienen según doc. :contentReference[oaicite:1]{index=1}

// Tipo de registro genérico (mismo valor que en nuevos)
export const TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO_OLD = 47; // 0x2F

// Versión de protocolo "clásico"
export const PROTO_VERSION_OLD = 1; // histórico

// Límites del protocolo antiguo
export const MAX_FRAME_BYTES_OLD = 510; // tamaño máximo de trama (buffer)  :contentReference[oaicite:2]{index=2}
export const MAX_DATA_BYTES_OLD = 462; // máximo bytes en el campo datos     :contentReference[oaicite:3]{index=3}

/** Máximo nº de servicios en una petición (cada servicio son 6 bytes: 2 nombre + 4 dato). */
export const MAX_SERVICES_PER_FRAME_OLD = Math.floor(MAX_DATA_BYTES_OLD / 6); // :contentReference[oaicite:4]{index=4}

/** Timeouts ACK (si aplicas ACK al flujo antiguo; puedes reutilizar los del nuevo). */
export const ACK_TIMEOUT_MS_OLD = 6000;
export const ACK_TTL_MS_OLD = 8000;

// Flag orientativo por si lo necesitas en helpers de (de)serialización
export const IS_BIG_ENDIAN = true;

//* ----------------------------- Constantes originales -----------------------------

/** Versión del protocolo de comunicaciones */
export const DEF_VERSION_PROTOCOLO = 1;

/** (Flag) Compilación con DEF_TRAMAS_GESTOR_BOOT_10K */
export const DEF_TRAMAS_GESTOR_BOOT_10K = false;

/** Número máximo de bytes de una trama completa (por defecto) */
export const DEF_MAX_BUFFER_RX_DEFAULT = 1024;

/** Número máximo de bytes de una trama completa (con DEF_TRAMAS_GESTOR_BOOT_10K) */
export const DEF_MAX_BUFFER_RX_BOOT10K = 10500;

/** Número máximo de bytes de una trama completa (según el flag anterior) */
export const DEF_MAX_BUFFER_RX = DEF_TRAMAS_GESTOR_BOOT_10K
  ? DEF_MAX_BUFFER_RX_BOOT10K
  : DEF_MAX_BUFFER_RX_DEFAULT;

/** Número máximo del campo datos */
export const DEF_MAX_DATOS_TRAMA = DEF_MAX_BUFFER_RX - 20;

/** Número máximo de bytes del buffer de la consola para enviar al servidor */
export const DEF_MAX_DATOS_TRAMA_CONSOLA = DEF_MAX_DATOS_TRAMA;

/** Tamaño máximo del buffer “simple” */
export const DEF_MAX_BUFFER_RX_SIMPLE = 10;

/** Bytes en un trozo de trama compuesta (inicio) */
export const MAX_BYTE_PD_DF_DATOS_COMPUESTOS_INICIO = 26;

/** Bytes en un trozo de trama compuesta (continuación) */
export const MAX_BYTE_PD_DF_DATOS_COMPUESTOS = 30;

/** Máx. caracteres en cambio de parámetro concatenado (incluye título, línea y opción) */
export const MAX_CARACTERES_CAMBIO_PARAMETROS_CONCATENADOS = 80;

/** Máx. bytes de datos dinámicos de estadísticos (debe ser múltiplo de 4) */
export const MAX_BYTE_DATOS_DINAMICOS_ESTADISTICOS = 120;

/** Máx. variables de datos dinámicos de estadísticos (= bytes/5; debe ser par) */
export const MAX_VARIABLES_DATOS_DINAMICOS_ESTADISTICOS =
  MAX_BYTE_DATOS_DINAMICOS_ESTADISTICOS / 5;

/** Dispositivos por trama (FIN o MAS+FIN). */
export const MAX_ITEMS_PER_FRAME = 13;
