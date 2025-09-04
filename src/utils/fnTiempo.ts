import { Fecha, Tiempo } from './tiposGlobales';

// -------------------------------------------------- tiempoDiferenciaFechas --------------------------------------------------
export function tiempoDiferenciaFechas(fecha1: Fecha, fecha2: Fecha): number {
  const date1 = new Date(fecha1.anyo, fecha1.mes - 1, fecha1.dia); // Convierte las fechas `Fecha` a objetos `Date`
  const date2 = new Date(fecha2.anyo, fecha2.mes - 1, fecha2.dia); // Mes en JavaScript es 0-indexado

  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    // Valida que las fechas sean válidas
    console.error('Una de las fechas no es válida.');
    return 0; // Devuelve 0 como valor por defecto en caso de error
  }

  const diffMs = date1.getTime() - date2.getTime(); // Diferencia en milisegundos
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // Convierte ms a días

  return diffDays;
}

// -------------------------------------------------- tiempoDiferenciaFechasHoras --------------------------------------------------
export function tiempoDiferenciaFechasHoras(
  fecha1: Fecha,
  hora1: Tiempo,
  fecha2: Fecha,
  hora2: Tiempo,
): number {
  const diasDiferencia = tiempoDiferenciaFechas(fecha1, fecha2); // Calcula la diferencia en días entre las fechas
  const horasDiferencia = hora1.hora - hora2.hora; // Calcula la diferencia en horas entre los tiempos
  const horasDiferenciaTotal = diasDiferencia * 24 + horasDiferencia; // Calcula el total de horas considerando días y horas

  return horasDiferenciaTotal;
}

// -------------------------------------------------- tiempoDiferenciaHorasSegundos --------------------------------------------------
export function tiempoDiferenciaHorasSegundos(
  hora1: Tiempo,
  hora2: Tiempo,
): number {
  const seg1 = tiempoToSeg(hora1); // Convierte las horas a segundos
  const seg2 = tiempoToSeg(hora2);

  const segundosDiff = seg1 - seg2; // Calcula la diferencia en segundos

  return segundosDiff;
}

// -------------------------------------------------- tiempoDiferenciaIntervalos24HorasEnSegundos --------------------------------------------------
export function tiempoDiferenciaIntervalos24HorasEnSegundos(
  inicioIntervalo: Tiempo,
  finalIntervalo: Tiempo,
): number {
  const horaInicioSegundos = tiempoToSeg(inicioIntervalo); // Convierte las horas a segundos
  const horaFinSegundos = tiempoToSeg(finalIntervalo);

  const diferenciaSegundos = tiempoDiferenciaHorasSegundos(
    finalIntervalo,
    inicioIntervalo,
  ); // Calcula la diferencia entre inicio y fin en segundos

  if (diferenciaSegundos >= 0) {
    return horaFinSegundos - horaInicioSegundos; // Si el intervalo final es mayor o igual al inicio
  } else {
    const hora24Segundos = tiempoToSeg({ hora: 23, min: 59, seg: 59 }); // Si el intervalo final es menor al inicio (cruza medianoche)
    const intervaloHastaMedianoche = hora24Segundos - horaInicioSegundos;
    return intervaloHastaMedianoche + horaFinSegundos;
  }
}

// -------------------------------------------------- fechaHoraToSegPOSIX --------------------------------------------------
export function fechaHoraToSegPOSIX(fecha: Fecha, hora: Tiempo): number {
  const fechaObj = new Date(
    fecha.anyo + 2000,
    fecha.mes - 1,
    fecha.dia,
    hora.hora,
    hora.min,
    hora.seg,
  ); // Crea un objeto Date en base a los parámetros proporcionados

  if (isNaN(fechaObj.getTime())) {
    // Valida que la fecha sea válida
    console.error('La combinación de fecha y hora no es válida.');
    return 0; // Devuelve 0 como valor por defecto en caso de error
  }

  const segundosPOSIX = Math.floor(fechaObj.getTime() / 1000); // Convierte la fecha a segundos POSIX

  return segundosPOSIX;
}

// -------------------------------------------------- posixToFechaHora --------------------------------------------------
export function posixToFechaHora(posix: number): {
  fecha: Fecha;
  hora: Tiempo;
} {
  const date = new Date(posix * 1000); // Convierte POSIX a milisegundos y crea un objeto Date

  if (isNaN(date.getTime())) {
    console.error('El valor POSIX proporcionado no es válido.');
    return {
      fecha: { dia: 1, mes: 1, anyo: 1970 },
      hora: { hora: 0, min: 0, seg: 0 },
    };
  }

  const fecha: Fecha = {
    anyo: date.getFullYear() - 2000, // Ajusta el año al formato esperado (2 dígitos)
    mes: date.getMonth() + 1, // Ajusta el mes (0-indexado en JS)
    dia: date.getDate(),
  };

  const hora: Tiempo = {
    hora: date.getHours(),
    min: date.getMinutes(),
    seg: date.getSeconds(),
  };

  return { fecha, hora };
}

// -------------------------------------------------- tiempoOperacionFecha --------------------------------------------------
export function tiempoOperacionFecha(
  fechaEntrada: Fecha,
  dias: number,
  meses: number,
): Fecha {
  const fechaTemp = new Date(
    fechaEntrada.anyo + 2000,
    fechaEntrada.mes - 1,
    fechaEntrada.dia,
  ); // Convierte la fecha `Fecha` a un objeto `Date`

  fechaTemp.setDate(fechaTemp.getDate() + dias); // Suma o resta días

  const mesesTotales = fechaTemp.getMonth() + 1 + meses; // Suma o resta meses
  const anioAdicional = Math.floor(mesesTotales / 12);
  const mesFinal = mesesTotales % 12;

  fechaTemp.setFullYear(fechaTemp.getFullYear() + anioAdicional, mesFinal - 1);

  return {
    // Devuelve la fecha actualizada como un objeto `Fecha`
    anyo: fechaTemp.getFullYear() - 2000,
    mes: fechaTemp.getMonth() + 1,
    dia: fechaTemp.getDate(),
  };
}

// -------------------------------------------------- tiempoSumaSegundosAHora --------------------------------------------------
export function tiempoSumaSegundosAHora(
  hora: Tiempo,
  segundos: number,
): Tiempo {
  const segTotalInicial = tiempoToSeg(hora); // Convierte la hora inicial a segundos

  const segTotalResultado = segTotalInicial + segundos; // Suma los segundos adicionales

  return {
    // Convierte los segundos totales de vuelta a un objeto `Tiempo`
    hora: Math.floor(segTotalResultado / 3600) % 24, // Calcula las horas dentro de un rango de 24
    min: Math.floor((segTotalResultado % 3600) / 60), // Calcula los minutos restantes
    seg: segTotalResultado % 60, // Calcula los segundos restantes
  };
}

// -------------------------------------------------- tiempoRestaSegundosAHora --------------------------------------------------
export function tiempoRestaSegundosAHora(
  hora: Tiempo,
  segundos: number,
): Tiempo {
  const segTotalInicial = tiempoToSeg(hora); // Convierte la hora inicial a segundos

  let segTotalResultado = segTotalInicial - segundos; // Resta los segundos

  if (segTotalResultado < 0) {
    // Ajusta para mantener el rango dentro de las 24 horas
    segTotalResultado += 86400; // 24 horas en segundos
  }

  return {
    // Convierte los segundos totales de vuelta a un objeto `Tiempo`
    hora: Math.floor(segTotalResultado / 3600) % 24, // Calcula las horas dentro de un rango de 24
    min: Math.floor((segTotalResultado % 3600) / 60), // Calcula los minutos restantes
    seg: segTotalResultado % 60, // Calcula los segundos restantes
  };
}

// -------------------------------------------------- tiempoSumaHoras --------------------------------------------------
export function tiempoSumaHoras(hora1: Tiempo, hora2: Tiempo): Tiempo {
  const segTotal1 = tiempoToSeg(hora1); // Convierte ambas horas a segundos
  const segTotal2 = tiempoToSeg(hora2);

  const segResultado = segTotal1 + segTotal2; // Suma los segundos de ambas horas

  return {
    // Convierte los segundos totales de vuelta a un objeto `Tiempo`
    hora: Math.floor(segResultado / 3600) % 24, // Calcula las horas dentro de un rango de 24
    min: Math.floor((segResultado % 3600) / 60), // Calcula los minutos restantes
    seg: segResultado % 60, // Calcula los segundos restantes
  };
}

// -------------------------------------------------- segToTiempo --------------------------------------------------
export function segToTiempo(seg: number): Tiempo {
  return {
    seg: seg % 60, // Segundos restantes
    min: Math.floor((seg / 60) % 60), // Minutos restantes después de los segundos
    hora: Math.floor((seg / 3600) % 24),
  };
}

// -------------------------------------------------- tiempoToSeg --------------------------------------------------
export function tiempoToSeg(tiempo: Tiempo): number {
  return tiempo.hora * 3600 + tiempo.min * 60 + tiempo.seg;
}

// -------------------------------------------------- tiempoToDecimas --------------------------------------------------
export function tiempoToDecimas(tiempo: Tiempo): number {
  return (tiempo.hora * 3600 + tiempo.min * 60 + tiempo.seg) * 10;
}
