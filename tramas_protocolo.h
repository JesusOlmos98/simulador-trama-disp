#ifndef __TRAMAS_PROTOCOLO___
#define __TRAMAS_PROTOCOLO___

/*
 * Archivo:                     gestor_tramas.h
 *
 * Autor:                       JFG
 * Fecha creacion:              9 julio 2013
 * Fecha ultima actualizacion:  7 octubre 2014
 * Version                      1.3
 * Comentario:


 */

#include "mstdtypes.h"
#include "gen_defines.h"

/********************************************************
//DEFINE
*********************************************************/

































//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX CONSTANTES XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

#define DEFVERSION_PROTOCOLO 1 // version del protocolo de comunicaciones

#ifndef DEF_TRAMAS_GESTOR_BOOT_10K
#define DEFMAX_BUFFER_RX 1024 // 10500//1024					//numero maximo de bytes de una trama completa
#else
#define DEFMAX_BUFFER_RX 10500 // 1024					//numero maximo de bytes de una trama completa
#endif

#define DEFMAX_DATOS_TRAMA DEFMAX_BUFFER_RX - 20 // numero maximo del campo datos

#define DEFMAX_DATOS_TRAMA_consola DEFMAX_DATOS_TRAMA // numero maximo de bytes del buffer de la consola para enviar al servidor

#define DEFMAX_BUFFER_RX_SIMPLE 10 //


#define MAX_BYTE_PD_DF_DATOS_COMPUESTOS_INICIO 26 // este parametro indica cuanta informacion entra en un trozo de trama compuesta
#define MAX_BYTE_PD_DF_DATOS_COMPUESTOS 30        // este parametro indica cuanta informacion entra en un trozo de trama compuesta

#define MAX_CARACTERES_CAMBIO_PARAMETROS_CONCATENADOS 80 // cuantos caracteres se pueden enviar en el mensaje de cambio de parametro incluyendo el titulo la linea y la opcion

#define MAX_BYTE_DATOS_DINAMICOS_ESTADISTICOS 120                                            // ojo el valor tiene que ser multiplo de 4
#define MAX_VARIABLES_DATOS_DINAMICOS_ESTADISTICOS MAX_BYTE_DATOS_DINAMICOS_ESTADISTICOS / 5 // Ojo el valor siempre tiene que ser par















































//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ESTRUCTURAS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

// TIPO DE TRAMAS

typedef struct
{

    uint8_c Inicio_trama[4];
    uint8_c Version_protocolo;
    uint16_c Direc_nodo_origen;
    uint16_c Direc_nodo_destino;
    uint8_c Tipo_trama; // ENUM_tipo_trama
    uint8_c Tipo_mensaje;
    uint16_c size_datos;

    uint8_c datos_trama[DEFMAX_DATOS_TRAMA];

    uint8_c CRC;
    uint8_c final_trama[4];

} ST_trama;

typedef struct
{

    uint16_c Direc_nodo;
    uint8_c Tipo_trama;
    uint8_c datos_trama[2];
    uint8_c CRC;
    uint8_c final_trama[2];

} ST_trama_asin;

typedef struct
{

    uint8_c Inicio_trama[4];
    uint8_c Version_protocolo;
    uint8_c Tipo_trama;
    uint16_c size_datos;

    uint8_c datos_trama[DEFMAX_BUFFER_RX_SIMPLE];

    uint8_c final_trama[4];

} ST_trama_simple;


// la estructura tiene este orden porque se organicen bien los datos
typedef struct
{
    uint8_c tipo_dato;                              // 1 byte	ENUM_tipo_dato_DF_accion esta variable la contiene cualquier tipo de dato estadistico parametro ect
    uint8_c identificador_unico_dentro_del_segundo; // 1 bytes	este parametro lo utiliza la pila interna para asegurarse de los envios no se tiene que rellenar
    uint16_c identificador_cliente;                 // 2 byte identificador_cliente
    Tiempo fecha;                                   // 3 bytes
    Tiempo hora;                                    // 3 bytes
    uint16_c nombre_variable;                       // 2 bytes
    uint32_c identificador_unico_crianza;           // 4 bytes
    svariante_c valor_variable;                     // 4 bytes

    uint16_c valor_variable1;    // 2 bytes //dia de la crianza el dia de la crianza puede ser negativo
    uint16_c valor_variable1_2;  // 2 bytes
    svariante_c valor_variable2; // 4 bytes
    svariante_c valor_variable3; // 4 bytes

} ST_PD_DF_tipo_dato;

// tipos de dato que se guardan en la pila de comunicaciones.

//
//
// typedef struct
//{
//	uint8_c tipo_dato;										// 1 byte	ENUM_tipo_dato_DF_accion esta variable la contiene cualquier tipo de dato estadistico parametro ect
//	uint8_c identificador_unico_dentro_del_segundo;			// 1 bytes	este parametro lo utiliza la pila interna para asegurarse de los envios no se tiene que rellenar
//	Tiempo fecha;											// 3 bytes
//	Tiempo hora;											// 3 bytes
//	svariante_c valor_variable1;							// 4 bytes
//	svariante_c valor_variable2;							// 4 bytes
//	svariante_c valor_variable3;							// 4 bytes
//	svariante_c valor_variable4;							// 4 bytes
//	svariante_c valor_variable5;							// 4 bytes
//	svariante_c valor_variable6;							// 4 bytes
//
//} ST_PD_DF_tipo_dato_genericos;

typedef struct
{
    uint8_c tipo_dato;                                      // 1 byte	TIPO_DATO_ACCION_PD_DATO_COMPUESTO_INICIO   contendra este valor para saber la pila que es un dato compuesto
    uint8_c identificador_unico_dentro_del_segundo;         // 1 byte	este parametro lo utiliza la pila interna para asegurarse de los envios no se tiene que rellenar
    uint8_c numero_tramas_compuestas_32byte;                // 1 byte
    uint8_c reserva1;                                       // 1 byte
    uint16_c numero_byte_informacion;                       // 2 byte
    uint8_c buffer[MAX_BYTE_PD_DF_DATOS_COMPUESTOS_INICIO]; // 26 buffer informacion
} ST_PD_DF_tipo_dato_compuesto_inicio;

typedef struct
{
    uint8_c tipo_dato;                              // 1 byte	TIPO_DATO_ACCION_PD_DATO_COMPUESTO contendra este valor para saber que es parte de una trama compuesta
    uint8_c dato_compuesto_indice;                  // 1 byte
    uint8_c datos[MAX_BYTE_PD_DF_DATOS_COMPUESTOS]; // 30 bytes 15 caracteres de 2 byte

} ST_PD_DF_tipo_dato_compuesto;

typedef struct
{
    uint8_c tipo_dato;                              // 1 byte	TIPO_DATO_ACCION_EVENTO
    uint8_c identificador_unico_dentro_del_segundo; // 1 bytes	este parametro lo utiliza la pila interna para asegurarse de los envios no se tiene que rellenar
    uint8_c version_estructura;                     // 1 bytes contiene la version de la estructura
    uint8_c tipo;                                   // ENUM_EVENTOS_ESTADIS_TIPO				// 1 bytes
    uint16_c familia;                               // ENUM_EVENTOS_ESTADIS_FAMILIA			// 2 bytes
    uint8_c subfamilia;                             // ENUM_EVENTOS_ESTADIS_SUBFAMILIA	// 1 bytes
    uint8_c reserva1;                               // 1 bytes
    uint16_c propiedades;                           // ENUM_EVENTOS_ESTADIS_PROPIEDADES // 2 bytes
    Tiempo fecha;                                   // 3 bytes
    Tiempo hora;                                    // 3 bytes
    uint16_c nombre_variable;                       // 2 bytes
    int16_c dia_crianza;                            // 2 bytes //dia de la crianza el dia de la crianza puede ser negativo
    uint32_c identificador_unico_crianza;           // 4 bytes
    uint8_c reserva[8];                             // rellenamos hasta 32 byte para asi inicializar a 0 y si en el futuro se quiere utilizar todos los datos enviados serian 0

} ST_PD_DF_tipo_dato_evento_ver2;

typedef struct
{
    uint8_c tipo_dato;                              // 1 byte	ENUM_tipo_dato_DF_accion esta variable la contiene cualquier tipo de dato estadistico parametro ect
    uint8_c identificador_unico_dentro_del_segundo; // 1 bytes	este parametro lo utiliza la pila interna para asegurarse de los envios no se tiene que rellenar
    uint16_c identificador_cliente;                 // 2 byte identificador_cliente
    Tiempo fecha;                                   // 3 bytes
    Tiempo hora;                                    // 3 bytes
    uint16_c TEXT_variable;                         // 2 bytes
    uint32_c reserva1;                              // 4 bytes
    svariante_c valor_variable;                     // 4 bytes

    uint16_c reserva2;                  // 2 bytes
    uint16_c TEXT_Titulo_variable;      // 2 bytes
    svariante_c reserva3;               // 4 bytes
    uint32_c TEXT_titulo_personalizado; // 4 bytes

} ST_PD_DF_tipo_dato_cambio_parametro;

// los tipos de datos tienen que tener maximo 32 bytes son para la entrada de la pila que es de 32 bytes
typedef union
{
    ST_PD_DF_tipo_dato dato_original;
    ST_PD_DF_tipo_dato_compuesto_inicio dato_compuesto_inicio;
    ST_PD_DF_tipo_dato_compuesto dato_compuesto_datos;
    ST_PD_DF_tipo_dato_evento_ver2 eventos;
    ST_PD_DF_tipo_dato_cambio_parametro cambio_parametro;
} UN_PD_DF_tipo_dato_pila;

// tipo dato compuestos como los recibe el servidor y la pantalla
typedef struct
{ // ojo no podemos cambiar el orden de las variables
    uint8_c tipo_dato;
    uint8_c identificador_unico_dentro_del_segundo;
    uint16_c version_alarma_concatenada; // la dejamos de reserva por si cambiaran los datos

    uint8_c tipo;         // ENUM_EVENTOS_ESTADIS_TIPO
    uint8_c subfamilia;   // ENUM_EVENTOS_ESTADIS_SUBFAMILIA
    uint16_c familia;     // ENUM_EVENTOS_ESTADIS_FAMILIA
    uint16_c propiedades; // ENUM_EVENTOS_ESTADIS_PROPIEDADES

    uint16_c nombre_de_alarma; // indicamos el texto que identifica la alarma

    Tiempo fecha;
    Tiempo hora;
    int16_c dia_crianza;
    uint32_c identificador_unico_crianza;
    uint8_c reserva;
    // uint8_c estado_alarma;// 1 alarma on 0 alarma off
    uint8_c numero_bytes_cadena; // 1-max 128
    uint16_c cadena_concatenada[MAX_TEXTO_CONCATENADO];
} ST_PD_DF_tipo_dato_compuesto_evento_concatenado;

// typedef struct
//{//ojo no podemos cambiar el orden de las variables
//	uint8_c tipo_variable;//ENUM_TIPO_VARIABLE
//	uint8_c reserva;
//	svariante_c valor;
// } ST_PD_DF_tipo_dato_generico;

// ESTADISTICO GENERICO

typedef struct
{ //
    svariante_c valor;
    ENUM_TIPO_VARIABLE tipo_variable; // ENUM_TIPO_VARIABLE
    uint8_c *ptr_string;              // si tenemos un string indica el puntero al string
} ST_estadistico_generico;

typedef union
{ //
    svariante_c valor[MAX_VARIABLES_DATOS_DINAMICOS_ESTADISTICOS];
    uint8_c tipo_variable[MAX_BYTE_DATOS_DINAMICOS_ESTADISTICOS]; // ENUM_TIPO_VARIABLE
    uint8_c cadena_dinamica_variables[MAX_BYTE_DATOS_DINAMICOS_ESTADISTICOS];
} UN_VAR_dinamicas;

typedef struct
{                      //
    uint8_c tipo_dato; // TIPO_DATO_ACCION_ESTADISTICO_GENERICO 46
    uint8_c identificador_unico_dentro_del_segundo;
    uint16_c version_estadistico_compuesto; // la dejamos de reserva por si cambiaran los datos

    uint16_c nombre_estadistico; // indicamos el texto que identifica la alarma
    Tiempo fecha;
    Tiempo hora;

    uint8_c numero_variables;
    uint8_c reserva1;
    uint8_c reserva2;
    uint8_c reserva3;

    // la cadena dinamica contiene todas las variables y su tipo,
    // ejemplo tenemos 5 variables
    // formacion 	4byte VAR1 , 4byte VAR2 , 4byte VAR3 , 4byte VAR4 , 4byte VAR5 ,
    //				1 byte tipo VAR1 , 1 byte tipo VAR2 , 1 byte tipo VAR3 , 1 byte tipo VAR4 , 1 byte tipo VAR5 ,

    // ejemplo tenemos 5 variables y la 2 es un string
    // formacion 	4byte VAR1 , 4byte VAR2 numero_byte estring , 4byte VAR3 , 4byte VAR4 , 4byte VAR5 ,
    //				1 byte tipo VAR1 , 1 byte tipo VAR2 string , 1 byte tipo VAR3 , 1 byte tipo VAR4 , 1 byte tipo VAR5 ,
    //				string

    UN_VAR_dinamicas cadena_dinamica;

} ST_PD_DF_tipo_dato_compuesto_estadistico_generico;

// tipo dato compuestos cambio parametro como los recibe el servidor y la pantalla

typedef struct
{ // ojo no podemos cambiar el orden de las variables

    uint8_c tipo_dato;
    uint8_c identificador_unico_dentro_del_segundo;
    uint16_c version_cambio_parametro_concatenado; // la dejamos de reserva por si cambiaran los datos

    uint16_c identificador_cliente; // identificador_cliente de quien cambia el parametro
    uint8_c tipo_equipo;            // indica el tipo de equipo donde se realizo el cambio de parametro
    uint8_c EBUS_nodo;              // si es un cambio de parametro del ebus indicamos el nodo ebus que lo ha cambiado si no es un cambio de parametro en el ebus este valor sera 0

    Tiempo fecha;
    Tiempo hora;
    int16_c dia_crianza;

    uint32_c identificador_unico_crianza;

    uint8_c numero_byte_titulo;
    uint8_c numero_byte_opcion;
    uint8_c numero_byte_valor;          // 0 cuando el valor sea un 0 indica que el valor no es una cadena es un valor numerico por lo que tenemos que ver el tipo de dato tipo_dato_cambio_parametro y valor_variable
    uint8_c tipo_dato_cambio_parametro; // ENUM_TIPO_VARIABLE cuando es un valor numerico indicamos el tipo de dato

    svariante_c valor_variable; // 4 byte cuando es un valor numerico esta variable contiene el valor

    // en esta cadena iran indicados el titulo y la opcion en formato concatenado
    // como en las variables anteriores tenemos el tamaño del texto de cada opcion podemos saber donde empieza y termina cada una
    // el orden seria titulo opcion valor
    // si uno de ellos es un texto fijo tendriamos que formarlo como quedaria en una trama concatenada con el texto fijo
    // de esta forma este objeto seria generico
    uint16_c cadena_concatenada[MAX_CARACTERES_CAMBIO_PARAMETROS_CONCATENADOS];

} ST_PD_DF_tipo_dato_compuesto_cambio_parametro_concatenado;

//	typedef struct
//	{
//		uint8_c tipo_dato;										// 1 byte	TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_UINT8	TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_INT8	TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_UINT16	TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_INT16	TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_UINT32		TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_INT32		TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT1	TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT2		TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT3
//		uint8_c identificador_unico_dentro_del_segundo;			// 1 bytes
//		uint16_c identificador_cliente;							// 2 byte 	identificador_cliente de quien cambia el parametro
//		Tiempo fecha;											// 3 bytes 	fecha
//		Tiempo hora;											// 3 bytes 	hora
//		uint16_c nombre_variable;								// 2 bytes  text nombre variable
//		uint32_c identificador_unico_crianza;					// 4 bytes	id crianza
//		svariante_c valor_variable;								// 4 bytes	valor variable
//
//		uint16_c valor_variable1;								// 2 bytes  dia crianza  es int16 aunque se envie en uint16
//		uint16_c valor_variable1_2;								// 2 bytes	text titulo variable
//		svariante_c valor_variable2;							// 4 bytes  estos 4 bytes se utilizan para el cambio parametro ebus continen el tipo equipo nodo y parametro
//		svariante_c valor_variable3;							// 4 bytes	text personalizado se utilizan los dos primeros bytes quedarian libres 2 bytes
//
//	} ST_PD_DF_tipo_dato;
// los tipos de datos de salida de pila
typedef union
{
    ST_PD_DF_tipo_dato tipo_dato_original;
    ST_PD_DF_tipo_dato_compuesto_evento_concatenado dato_compuesto_evento_concatenado;
    ST_PD_DF_tipo_dato_compuesto_cambio_parametro_concatenado dato_compuesto_cambio_parametro;
    ST_PD_DF_tipo_dato_compuesto_estadistico_generico dato_generico;
    UN_PD_DF_tipo_dato_pila tipo_dato_pila;
    uint8_c buffer[1];
} UN_PD_DF_tipo_dato_enviar_server_pantalla;

typedef struct
{
    uint8_c tipo_dato;
    uint8_c identificador_unico_dentro_del_segundo;
    UN_PD_DF_tipo_dato_enviar_server_pantalla datos_enviar;

} ST_PD_DF_tipo_dato_compuesto_salida_pila;








































//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ENUMS XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

// ACCIONES DE LED//
// enumeramos los gestores a utilizar
// direcciones de los buffer can fijos
typedef enum
{
    DIRECCION_RED_SERVIDOR = 0,
    DIRECCION_RED_CENTRAL_ASINCRONAS = 1,
    DIRECCION_RED_CENTRAL_SINCRONAS = 2,
    DIRECCION_RED_SERVIDOR_2 = 3,
    DIRECCION_RED_RADIO_SINCRONAS = 5,
    DIRECCION_RED_RADIO_ASINCRONAS = 6,
    DIRECCION_RED_RED_LOCAL_ASIN_CONTROLA = 7,
    DIRECCION_RED_RED_LOCAL_ASIN_FINAL = 8,

} ENUM_direccion_nodos_red;

typedef enum
{
    TT_NO_CONFIGURADA = 0,
    TT_configuracion_RF = 1,
    TT_central_dispositivo = 2,
    TT_dispositivo_central = 3,
    TT_rt_peticiones_central = 4,
    TT_servidor_central = 5,
    TT_central_servidor = 6,
    TT_configuracion = 7, // tipo trama central rf
    TT_rf_central = 8,
    TT_rf_dispositivo = 9,
    TT_dispositivo_rf = 10,
    TT_rf_rf = 11,
    TT_red_local_datos = 12,

    TT_OMEGA_PANTALLA_PLACA = 13, // este tipo de trama la central sera transparente sera una pasarela ya que no tiene que no es para ella es para el final

    TT_DEPURACION = 14, // este tipo de trama la central sera transparente sera una pasarela ya que no tiene que no es para ella es para el final
    TT_actualizacion_desde_pc = 15,
    TT_actualizacion_desde_pc_COM = 16, // este tipo de trama se utiliza para actualizar la placa de comunicaciones con boot

    TT_SINCRONIZACION_EBUS = 17, // este tipo de trama se utiliza para la sincronizacion de los 485 del EBUS

    TT_OMEGA_PANTALLA_PLACA_FINAL = 18, // este tipo de trama la central sera transparente sera una pasarela ya que no tiene que no es para ella es para el final
                                        // el omega ante este tipo de trama tambien sera una pararela para los finales EBUS tendremos que esperar la respuesta

    TT_OMEGA_PANTALLA_PLACA_FINAL_LOCAL = 19, // este tipo de trama la enviara en local el omega ante este tipo de trama sera una pararela para los finales EBUS tendremos que esperar la respuesta

    TT_actualizacion_desde_pc_EBUS_final = 20, // este tipo de trama se utiliza para actualizar la placa finales

    TT_SINCRONIZACION_COM_INTERNOS = 21, // este tipo de trama se utiliza para enviar tramas de sincronizacion entre dosmicros dentro de un mismo equipo ejemplo CTX DLG

    // TT_CONTROL_ACCESOS				=22,//

    TT_SERVICIOS_CLAVE_VALOR = 23, //

    TT_ACTUALIZACION_SERVER = 24, //

} ENUM_tipo_trama;
//---------- TIPO DE TRAMA ASINCRONO ----------
//---------------------------------------------
typedef enum
{
    TTA_alarma = 0,
    TTA_cambio_parametros = 1,
    TTA_dispositivo_descubierto = 2,
    TTA_nodo_presente_crc_param = 3,
    TTA_nodo_presente_crc_alarm = 4,
    TTA_eventos_historicos = 5,
    TTA_eventos_base_datos_historicos = 6,
    TTA_peticion_datos_red_local = 8,
    TTA_peticion_cargas_silos_red_local = 9,
    TTA_peticion_envio_datos_historicos = 10,

    TTA_PUEDO_PEDIR_N_SERVICIOS_RL = 11,
    TTA_ENVIA_N_SERVICIOS_RL = 12,

    TTA_presencia_nodo_final_RL = 13,
    TTA_pide_primera_sincronizacion = 14,
    TTA_fuerza_sincronizacion = 15,
    TTA_fuerza_primera_sincronizacion = 16,
    TTA_permiso_acceso_enviar_trama_servidor = 17,

} ENUM_tipo_trama_asincronas;
//=============================================

// -------TIPO DE TRAMA: SERVIDOR CENTRAL -----
// ============= TIPOS DE MENSAJE =============

typedef enum
{

    TM_peticion_N_servicios = 0,
    TM_peticion_instantaneos = 1,
    TM_peticion_rango_servicios = 2,
    TM_peticion_parametros = 3,
    TM_peticion_alarmas = 4,
    TM_presencia_central = 5,
    TM_aceptacion_central = 6,
    TM_cambio_parametros = 7,
    TM_peticion_otros = 8,
    TM_peticion_base_datos = 9,
    TM_eventos_servidor_central = 10,
    TM_peticion_tabla_central = 11,
    TM_rt_ID_respuesta = 12,

    TM_peticion_servicios_central = 50,

    // apartir del 100 todas las tramas recibidas por el servidor la central realizara una pasarela la enviara al can

    TM_peticion_alarmas_activas = 102,

} ENUM_tipo_mensaje_servidor_central;
//!daaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
//=============================================
// -------TIPO DE TRAMA: CENTRAL SERVIDOR------
// ============= TIPOS DE MENSAJE =============

typedef enum
{

    TM_rt_peticion_N_servicios = 0,
    TM_rt_peticion_instantaneos = 1, ///*no se utiliza
    TM_rt_peticion_rango_servicios = 2,
    TM_rt_peticion_parametros_fin = 3, // no
    TM_rt_peticion_parametros_mas = 4, // no
    TM_rt_peticion_alarmas_fin = 5,
    TM_rt_peticion_alarmas_mas = 6,
    TM_rt_presencia_central = 7,
    TM_trama_presentacion_central = 8,
    TM_alarmas_asincronas = 9,
    TM_parametros_asincronos = 10, // no
    TM_rt_cambio_parametros = 11,
    TM_dispositivo_descubierto = 12,
    TM_rt_peticion_otros_fin = 13, // no
    TM_rt_peticion_otros_mas = 14, // no
    TM_rt_peticion_base_datos_fin = 15,
    TM_rt_peticion_base_datos_mas = 16,
    TM_evento_dispositivo = 17,
    TM_rt_tabla_central_mas = 18,
    TM_rt_tabla_central_fin = 19,
    TM_evento_cambio_estado_nodo = 20,
    TM_alarmas_asincronas_2 = 21, // no

    TM_trama_ACK_a_peticion_sin_respuesta = 22,

    TM_rt_peticion_servicios_central = 50, // no

    TM_rt_presencia_central_WIFI = 104,
    TM_cambio_estado_central_WIFI = 105,

} ENUM_tipo_mensaje_central_servidor;

//================================================
// -------TIPO DE TRAMA: CENTRAL DISPOSITIVO------
// ============= TIPOS DE MENSAJE ================

typedef enum
{

    TM_peticion_parametros_cd = 1,     //*no se usa
    TM_peticion_parametros_mas_cd = 2, // no
    TM_peticion_N_servicios_cd = 3,
    TM_peticion_alarmas_cd = 4,
    TM_peticion_alarmas_mas_cd = 5,
    TM_peticion_eventos_cd = 6, // no
    TM_peticion_descubrimiento_cd = 7,
    TM_config_servicios_cd = 8, // no
    TM_config_nodo_cd = 9,
    TM_peticion_instantaneos_cd = 10,
    TM_peticion_rango_servicios_cd = 11, // no
    TM_cambio_parametros_cd = 12,
    TM_peticion_base_datos_cd = 13,
    TM_peticion_eventos_historicos_cd = 16, // no
    TM_rt_ID_respuesta_cd = 17,

    TM_rt_envia_parametro_historico = 100,
    TM_acceso_enviar_parametro_historico = 101,
    TM_confirma_nodo_configurado = 104,

    TM_acceso_enviar_trama_servidor = 105,

} ENUM_tipo_mensaje_central_dispositivo;

//================================================
// -------TIPO DE TRAMA: DISPOSITIVO CENTRAL------
// ============= TIPOS DE MENSAJE ================

typedef enum
{

    TM_rt_peticion_parametros_mas_dc = 1, // no
    TM_rt_peticion_parametros_fin_dc = 2, // no
    TM_rt_peticion_N_servicios_dc = 0,
    TM_rt_peticion_alarmas_mas_dc = 4,
    TM_rt_peticion_alarmas_fin_dc = 5,
    TM_rt_peticion_eventos_dc = 6, // no
    TM_rt_peticion_descubrimiento_dc = 7,
    TM_rt_config_servicios_dc = 8, // no
    TM_rt_config_nodo_dc = 9,
    TM_rt_peticion_instantaneos_dc = 10,    // no
    TM_rt_peticion_rango_servicios_dc = 11, // no
    TM_rt_cambio_parametros_dc = 12,
    TM_rt_peticion_base_datos_dc = 13,
    TM_rt_peticion_alarmas_mas2_dc = 14,
    TM_rt_peticion_alarmas_fin2_dc = 15,
    TM_rt_eventos_historicos_dc = 16,

    TM_envia_parametro_historico = 100,
    TM_rt_peticion_alarmas_activas = 103,
    TM_fuerza_presentacion_dispositivo = 104,

} ENUM_tipo_mensaje_dispositivo_central;

//===========================================
//------- TIPO DE TRAMA: CENTRAL - RF -------
//===========================================
typedef enum
{

    TM_inicio_asociacion = 1,
    TM_fin_asociacion = 2,
    TM_rt_incorporacion = 3,
    TM_peticion_eventos_asin = 4,

} ENUM_tipo_mensaje_central_RF;

//===========================================
//------- TIPO DE TRAMA: RF - CENTRAL -------
//===========================================

typedef enum
{

    TM_incorporacion = 1,
    TM_fin_peticion_eventos_asin = 2,
    TM_eventos_asincronos_nodos = 3,

} ENUM_tipo_mensaje_RF_central;

//===========================================
//------- TIPO DE TRAMA: RF - CENTRAL -------
//===========================================

typedef enum
{

    TM_peticion_servicios_RL = 4,
    TM_rt_peticion_servicios_RL = 5,
    TM_sincronizacion_nodo_RL = 6,

} ENUM_tipo_mensaje_red_local;

//======================================
//------- TIPO DE TRAMA: RF - RF -------
//======================================

typedef enum
{

    TM_comprueba_RSSI = 1,
    TM_rt_comprueba_RSSI = 2,
    TM_peticion_eventos_RF = 3,

} ENUM_tipo_mensaje_RF_RF;

typedef enum
{
    TM_OMEGA_PANTALLA_PLACA_NO_mensaje = 0,
    TM_OMEGA_PANTALLA_PLACA_pide_pantalla = 1,
    TM_OMEGA_PANTALLA_PLACA_rt_pantalla = 2,
    TM_OMEGA_PANTALLA_PLACA_envia_estadistico = 3, // este tipo de trama lo enviar el final
    TM_OMEGA_PANTALLA_PLACA_rt_estadistico = 4,    // respuesta estadistico asi confirma que que se inserto el estadistico
    TM_OMEGA_PANTALLA_PLACA_pide_pantalla_principal = 5,
    TM_OMEGA_PANTALLA_PLACA_cambio_parametro = 6,
    TM_OMEGA_PANTALLA_PLACA_pide_estadistico_pantalla_local = 7, // este tipo de trama se utiliza solo para la pantalla local tiene que pedir los estadisticos

    TM_OMEGA_PANTALLA_PLACA_Pide_fichero_configuracion_exportacion = 8,    // este trama se utiliza para pedir fichero configuracion
    TM_OMEGA_PANTALLA_PLACA_Pide_fichero_configuracion_exportacion_rt = 9, // este trama se utiliza para enviar los datos de exportacion a la pantalla o o servidor

    TM_OMEGA_PANTALLA_PLACA_Pide_fichero_configuracion_importacion = 10,              // este trama la utiliza la placa para pedir los datos a la pantalla o al servidor
    TM_OMEGA_PANTALLA_PLACA_Pide_fichero_configuracion_importacion_rt_pantallas = 11, // esta trama la utiliza la pantalla o el servidor para enviar los datos de las variables a importar

    TM_OMEGA_PANTALLA_PLACA_Pide_estados_Vpad = 12,    ////esta trama solo la utilizara el V4 V2 para pedir el estado de los led de la placa Vpad y hacer la accion de los pulsadores
    TM_OMEGA_PANTALLA_PLACA_RT_Pide_estados_Vpad = 13, //

    TM_OMEGA_PANTALLA_PLACA_CONSOLA_PANTALLA = 14, //

    TM_OMEGA_PANTALLA_PIDE_PANTALLA_SINCRONIZACION = 15, //
    TM_OMEGA_PANTALLA_RT_PANTALLA_SINCRONIZACION = 16,   //

} ENUM_tipo_mensaje_omega_pantalla_placa;

typedef enum
{
    TM_DEPURACION_NO_mensaje = 0,
    TM_DEPURACION_peticion_consola = 1,
    TM_DEPURACION_rt_peticion_consola = 2,

} ENUM_tipo_mensaje_depuracion;

typedef enum
{
    TM_actualiPC_descubrimiento_placa = 1,
    TM_actualiPC_rt_descubrimiento_placa = 2,
    TM_actualiPC_inicio_actualizacion = 3,
    TM_actualiPC_pide_fichero_trama = 4,

    TM_actualiPC_rt_datos_fichero = 6,
    TM_actualiPC_rt_datos_fichero_fin = 7,
    TM_envio_actualizacion_error_reinicia = 8,

    TM_CPU_no_responde_placa_COM = 9,
    // esta trama la enviara las com al arrancar para indicar la version
    // tambien la enviara los finales Ebus para indicar las versiones
    TM_rt_informacion_placa = 10,

    // esta trama la enviara el controlador a las com para indicarle que ya tenemos la indormacion de la placa y que no siga enviando mas informacion
    // esta trama tambien la podra enviar la UVI a los EBUS Para pedirle informacion de la version
    TM_peticion_informacion = 11,

} ENUM_TM_actualiPC;

typedef enum
{
    TM_AS_sin_peticion = 0,
    TM_AS_peticion_ultima_version = 1,
    TM_AS_rt_peticion_ultima_version = 2,
    TM_AS_peticion_fichero = 3,
    TM_AS_rt_peticion_fichero = 4,

    TM_AS_peticion_CRC_fichero = 5,
    TM_AS_rt_peticion_CRC_fichero = 6,

    TM_AS_TX_pantalla_inicio_actualizacion = 7,
    TM_AS_RX_pantalla_inicio_actualizacion = 8,

    TM_AS_TX_pantalla_fichero = 9,
    TM_AS_RX_pantalla_fichero = 10,

    TM_AS_TX_pantalla_fin_fichero = 11,
    TM_AS_RX_pantalla_fin_fichero = 12,

    TM_AS_TX_pantalla_info = 13,
    TM_AS_RX_pantalla_info = 14,

    TM_AS_TX_inicia_acualizacion_remota = 15,

} ENUM_TM_Actualiza_server;

// DISPOSITIVOS EBUS
typedef enum
{

    TM_ACCION_ENVIO_CT,
    TM_RESPUESTA_FIN,
    TM_RESPUESTA_ERROR_ESTRUCTURA,  // indica que la estructura que ha recibido la placa tenia menos bytes de los que esperaba la placa
    TM_RESPUESTA_CT_SINCRONIZACION, // esta trama le indica al final que el controlador ha recibido la trama

    TM_PIDE_ESTADISTICOS,               //
    TM_RT_PIDE_ESTADISTICOS,            //
    TM_RT_PIDE_ESTADISTICOS_PILA_VACIA, //

    TM_RESPUESTA_FINAL_EN_BOOT, // indica que el final se encuentra en boot

} EN_BC_TIPO_MENSAJE;

// SINCRO_COM_INTERNOS_
typedef enum
{

    TM_envia_sincronizacion,
    TM_rt_envia_sincronizacion,

} EN_SINCRO_COM_INTERNOS_TIPO_MENSAJE;

//
// typedef enum
//{
//	TM_CA_EVENTOS_FINAL											=	0,
//	TM_CA_RT_EVENTOS_FINAL										=	1,
//	TM_CA_TABLA_SINCRONIZACION_USUARIOS							=	2,//
//	TM_CA_TABLA_RT_SINCRONIZACION_USUARIOS						=	3,
//
//}ENUM_C_ACCESOS_TM;

typedef enum
{
    TM_SCV_PETICION_SERVIDOR_FINAL = 0,
    TM_SCV_RT_PETICION_SERVIDOR_FINAL = 1,

    TM_SCV_PETICION_FINAL_SERVIDOR = 2,
    TM_SCV_RT_PETICION_FINAL_SERVIDOR = 3,

} ENUM_tipo_mensaje_servicios_clave_valor;


typedef enum
{
    GTDETEC_ST_trama = 0,
    GTDETEC_ST_trama_asin = 1,
    GTDETEC_ST_trama_simple = 2
} GTDETEC_trama;

/**********************************************************

//ESTRUCTURAS

***********************************************************/

typedef enum
{

    TIPO_DATO_ACCION_DF_ESTADISTICO_UINT8 = 1,
    TIPO_DATO_ACCION_DF_ESTADISTICO_INT8 = 2,
    TIPO_DATO_ACCION_DF_ESTADISTICO_UINT16 = 3,
    TIPO_DATO_ACCION_DF_ESTADISTICO_INT16 = 4,
    TIPO_DATO_ACCION_DF_ESTADISTICO_UINT32 = 5,
    TIPO_DATO_ACCION_DF_ESTADISTICO_INT32 = 6,
    TIPO_DATO_ACCION_DF_ESTADISTICO_FLOAT1 = 7,
    TIPO_DATO_ACCION_DF_ESTADISTICO_FLOAT2 = 8,
    TIPO_DATO_ACCION_DF_ESTADISTICO_FLOAT3 = 9,

    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_UINT8 = 10,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_INT8 = 11,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_UINT16 = 12,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_INT16 = 13,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_UINT32 = 14,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_INT32 = 15,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT1 = 16,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT2 = 17,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT3 = 18,

    TIPO_DATO_ACCION_DF_ALARMAS = 19,

    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_TIEMPO = 20,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_TIEMPO_HM = 21,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_TIEMPO_MS = 22,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FECHA = 23,

    TIPO_DATO_ACCION_DF_ESTADISTICO_TIEMPO = 24,
    TIPO_DATO_ACCION_DF_ESTADISTICO_TIEMPO_HM = 25,
    TIPO_DATO_ACCION_DF_ESTADISTICO_TIEMPO_MS = 26,
    TIPO_DATO_ACCION_DF_ESTADISTICO_FECHA = 27,

    TIPO_DATO_ACCION_DF_ESTADISTICO_STRING = 28,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_STRING = 29,

    TIPO_DATO_ACCION_DF_INICIO_CRIANZA = 30,
    TIPO_DATO_ACCION_DF_FIN_CRIANZA = 31,

    TIPO_DATO_ACCION_ALTAS_BAJAS = 32, // contine las acciones de altas bajas retiradas eliminar ect

    TIPO_DATO_ACCION_WARNING = 33, // contiene warnings

    TIPO_DATO_ACCION_ENTRADA_ANIMALES = 34,

    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_TEXTO = 35,

    TIPO_DATO_ACCION_CAMBIO_PARAMETRO_SINCRONIZACION = 36,

    TIPO_DATO_ACCION_DF_ESTADISTICO_FLOAT0 = 37,
    TIPO_DATO_ACCION_DF_CAMBIO_PARAMETRO_FLOAT0 = 38,

    TIPO_DATO_ACCION_DATOS_EBUS_FINALES = 39,

    TIPO_DATO_ACCION_DEBUG_STRING = 40,

    TIPO_DATO_ACCION_PD_DATO_COMPUESTO_INICIO = 41, // este tipo de dato lo utiliza la pila de datos dataflash para saber que es un dato compuesto no se envia a pantallas ni servidor
    TIPO_DATO_ACCION_PD_DATO_COMPUESTO = 42,        // este tipo de dato lo utiliza la pila de datos dataflash para saber que es un dato compuesto no se envia a pantallas ni servidor

    TIPO_DATO_ACCION_EVENTO_CONCATENADO = 43,           // indica que es un evento concatenado y en la informacion de este tipo de dato indicaremos si es una alarma un warning evento dosificacion ect
    TIPO_DATO_ACCION_CAMBIO_PARAMETRO_CONCATENADO = 44, // indica que es un cambio de parametro que contiene alguna cadena concatenada.

    TIPO_DATO_ACCION_EVENTO = 45, // este tipo se utiliza para enviar eventos alarmas o eventos warning o eventos normales es el metodo que subtituye TIPO_DATO_ACCION_WARNING TIPO_DATO_ACCION_DF_ALARMAS

    TIPO_DATO_ACCION_ESTADISTICO_GENERICO = 46, // envia un estadistico generico que se rellena desde la parte aplicacion

} ENUM_tipo_dato_DF_accion;

// typedef enum{
//	PDF_TIPO_DATO_COMPUESTO_INICIO						=1,//inicio de dato compuesto
//	PDF_TIPO_DATO_COMPUESTO_1							=2,
//	PDF_TIPO_DATO_COMPUESTO_2							=3,
//	PDF_TIPO_DATO_COMPUESTO_3							=4,
//	PDF_TIPO_DATO_COMPUESTO_4							=5,
//	PDF_TIPO_DATO_COMPUESTO_5							=6,
//	PDF_TIPO_DATO_COMPUESTO_6							=7,
//	PDF_TIPO_DATO_COMPUESTO_7							=8,
// }ENUM_tipo_dato_DF_dato_comupesto;

typedef enum
{
    ENUM_TIPO_EVENTO_INTRODUCCION_ALARMAS_GENERAL = 0x00000001,
    ENUM_TIPO_EVENTO_INTRODUCCION_WARNING = 0x00000002,
    ENUM_TIPO_EVENTO_INTRODUCCION_DOSIFICACION = 0x00000004,
} ENUM_TIPO_EVENTO_INTRODUCCION;

// indicamos el tipo de evento a la hora de enviar alarmas
typedef enum
{
    ENUM_EVENTOS_ESTADIS_TIPO_ALARMAS = 0,
    ENUM_EVENTOS_ESTADIS_TIPO_WARNING = 1,
    ENUM_EVENTOS_ESTADIS_TIPO_EVENTO = 2,

} ENUM_EVENTOS_ESTADIS_TIPO;

//
typedef enum
{
    ENUM_EVENTOS_ESTADIS_FAMILIA_NO_DEFINIDO = 0,
    ENUM_EVENTOS_ESTADIS_FAMILIA_ALIMENTACION = 1, // Esta familia es para los eventos de la alimentacion avanzada.
    ENUM_EVENTOS_ESTADIS_FAMILIA_ALIMENTACION_SIMPLE = 2,

} ENUM_EVENTOS_ESTADIS_FAMILIA;

typedef enum
{
    ENUM_EVENTOS_ESTADIS_SUBFAMILIA_NO_DEFINIDO = 0,

} ENUM_EVENTOS_ESTADIS_SUBFAMILIA;

typedef enum
{
    ENUM_EVENTOS_ESTADIS_PROPIEDADES_NO_DEFINIDO = 0x0000,      //
    ENUM_EVENTOS_ESTADIS_PROPIEDADES_ACCION_EVENTO_ON = 0x0001, // si el primer bit es un 1 indicamos que que el evento esta conectado, si esta a 0 indica que el evento esta desconectado
    ENUM_EVENTOS_ESTADIS_PROPIEDADES_EVENTO_SONORO = 0x0002,    // si es una alarma o un warning si este bit es 1 indica que es sonoro o no es no sonoro

} ENUM_EVENTOS_ESTADIS_PROPIEDADES;

// funcion que se utiliza para obtener los datos de un estadistico generico
// ST_PD_DF_tipo_dato_compuesto_estadistico_generico *estadistico estadistico generico que tenemos
// uint16_c numero_dato que queremos obtener ejem 123456....
// ST_estadistico_generico *resultado lugar donde coloca la informacion.

EN_ESTADO_OK_ERROR get_dato_estadistico_generico(ST_PD_DF_tipo_dato_compuesto_estadistico_generico *estadistico, uint16_c numero_dato, ST_estadistico_generico *resultado);

/********************************************************
//VARIABLES
*********************************************************/

#endif

/********************************************************
//NOTAS DE FUNCIONAMIENTO
*********************************************************
*
*  -  	Cuando tengamos un mensaje colocara *flag_mensaje_rx a TRUE
*  		cuando se procese mensaje hay que borrar el flag para seguir recibiendo mensajes
*
*
*********************************************************/

/********************************************************
//VERSIONES
*********************************************************
*  -  	1.1 se a introducido una nueva gestion las tramas asincronas.
*  -	1.2 se a a�adido trama simple detecta trama simple
*  -    1.3 se a a�adido calculo del CRC sin buffer
*********************************************************/
