
export enum DiasSemana {
    SABADO = 0,
    DOMINGO = 1,
    LUNES = 2,
    MARTES = 3,
    MIERCOLES = 4,
    JUEVES = 5,
    VIERNES = 6,
}

export interface Fecha {
    dia: number;
    mes: number;
    anyo: number;
    diaSemana?: DiasSemana; //Día de la semana opcional
}

export interface Tiempo {
    hora: number;
    min: number;
    seg: number;
}
