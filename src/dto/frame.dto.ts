import { EnTipoDato, EnEstadisTipoRegistro } from "src/utils/enums";
import { PresentacionDto } from "./tt_sistema.dto";

export class FrameDto {

    inicioTrama: Buffer;
    versionProtocolo: number;
    reserva: number;
    nodoOrigen: number;
    nodoDestino: number;
    tipoTrama: number;
    tipoMensaje: number;
    longitud: number; // Tamaño trama datos
    datos: Buffer | PresentacionDto | PresenciaDto | EstadisticoDto; // Datos a enviar
    crc: number;
    finTrama: Buffer;

}

export class PresenciaDto {

    presencia: number; // Puede ser cualquier cosa

}

//jos EstadisticoDto:
export enum DiasSemana {
     SABADO = 0,
     DOMINGO = 1,
     LUNES = 2,
     MARTES = 3,
     MIERCOLES = 4,
     JUEVES = 5,
     VIERNES = 6
 }
 
 export interface Fecha {
     dia: number;
     mes: number;
     anyo: number;
     diaSemana?: DiasSemana;                                                                 //Día de la semana opcional
 }
 
 export interface Tiempo {
     hora: number;
     min: number;
     seg: number;
 }

export class EstadisticoDto {
    mac: number;                              // uint32_t
    
    tipoDatoAccion: number;                   // uint8  // ! valor esperado: TIPO_DATO_ACCION_REGISTRO_DATOS_GENERICO
    
    identificadorUnicoDentroDelSegundo: number; // uint8
    version: number;                          // uint8  // ! VERSION del paquete de estadístico
    tipoRegistro: EnEstadisTipoRegistro;      // uint8  // ! ENUM_ESTADIS_TIPO_REGISTRO
    
    res1: number;
    res2: number;
    res3: number;
    res4: number;
    
    fecha: Fecha;                          // Fecha
    hora: Tiempo;                          // Tiempo
    
    res5: number;                             // uint8  // ! reservado
    numeroDatos: number;                      // uint8  // ! número de bloques que siguen
    
    tipoDato: EnTipoDato;                     // uint8  // ! TIPO_DATO
    sizeDatoByte: number;                     // uint8  // ! tamaño de cada bloque de datos
    
    dato:  Buffer | number[]; // uint8_t dato[]; 
    
}
//   datos: EstadisticoDatoDto[];

// export class EstadisticoDatoDto {
//     tipoDato: EnTipoDato;     // uint8
//     sizeDatoByte: number;     // uint8
//     dato: Buffer | number[];
// }