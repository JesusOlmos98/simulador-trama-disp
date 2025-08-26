import { EnTipoDato, EnEstadisTipoRegistro } from "src/utils/enums";

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

export class PresentacionDto {

    nVariables: number;
    versionPresentacion: number;
    mac: number;
    versionEquipo: number;
    tipoEquipo: number;
    claveEquipo: number;
    versionHw: number;

}

export class PresenciaDto {

    presencia: number; // Puede ser cualquier cosa

}

//jos EstadisticoDto:
export class FechaDto {
    dia: number;      // uint8
    mes: number;      // uint8
    anio: number;     // uint16 (o uint8 según tu protocolo)
}

export class TiempoDto {
    hora: number;     // uint8
    min: number;      // uint8
    seg: number;      // uint8
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
    
    fecha: FechaDto;                          // Fecha
    hora: TiempoDto;                          // Tiempo
    
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