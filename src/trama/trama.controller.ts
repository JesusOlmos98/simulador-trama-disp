import { Controller, Post, Query, BadRequestException } from '@nestjs/common';
import { crearTablaCambioEstadoDispositivoOld, defaultEstadisticoAlarmasOld, defaultEstadisticoAltasBajasRetiradasCrianzaOld, defaultEstadisticoInicioFinCrianzaOld, defaultEstadisticoValorOld, defaultParametroHistoricoValorOmegaDf } from 'src/dtoBE/defaultTramaOld';
import { FrameOldDto } from 'src/dtoBE/frameOld.dto';
import { serializarParametroHistoricoOld } from 'src/dtoBE/tt_estadisticosOld.dto';
import { serializarParametroHistoricoValorOmegaDf } from 'src/dtoBE/tt_estadisticosOldDF.dto';
import {
  defaultDataTempSonda1,
  defaultDataContadorAgua,
  defaultDataActividadCalefaccion1,
  defaultDataEventoInicioCrianza,
  defaultDataAlarmaTempAlta,
  defaultDataCambioParametro,
  defaultDatosValorTempSonda1,
} from 'src/dtoLE/defaultTrama';
import { FrameDto } from 'src/dtoLE/frame.dto';
import { PeticionConsolaDto } from 'src/dtoLE/tt_depuracion.dto';
import { serializarDatosEstadisticoValor } from 'src/dtoLE/tt_estadisticos.dto';
import {
  EstadoDispositivoTxDto,
  ConfigFinalTxDto,
  UrlDescargaOtaTxDto,
  ProgresoActualizacionTxDto,
} from 'src/dtoLE/tt_sistema.dto';
import { TcpClientService } from 'src/tcp-client/tcp-client.service';
import { logTramaParametroHistoricoOld, logTramaParametroHistoricoOmegaDf } from 'src/utils/BE_Old/get/getEstadistico';
import { logTramaCompletaTablaDispositivosOld } from 'src/utils/BE_Old/get/getTablaDispositivos';
import { PROTO_VERSION_OLD } from 'src/utils/BE_Old/globals/constGlobales';
import { EnTipoAccionAltasBajasRetiradasCrianzaOld, EnTipoAccionInicioFinCrianzaOld, EnTipoDatoDFAccion, EnTipoDatoOld, EnTipoMensajeCentralDispositivo, EnTipoMensajeCentralServidor, EnTipoMensajeDispositivoCentral, EnTipoTramaOld } from 'src/utils/BE_Old/globals/enumOld';
import { START, END } from 'src/utils/LE/globals/constGlobales';
import {
  EnTipoTrama,
  EnTmSistema,
  EnTipoEquipo,
  EnGcspaEventoActualizacionServer,
  EnTmEstadisticos,
  EnTmDepuracion,
  EnEstadisPeriodicidad,
  EnEstadisticosControladores,
  EnGtUnidades,
} from 'src/utils/LE/globals/enums';
import { mac8FromParam, parseDmYToFecha } from 'src/utils/helpers';
import { josLogger } from 'src/utils/josLogger';
import { Fecha, Tiempo } from 'src/utils/tiposGlobales';

@Controller('trama')
export class TramaController {
  constructor(private readonly tcp: TcpClientService) { }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------- EQUIPOS NUEVOS (ST) --------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT SISTEMAS -------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // ------------------------------------------- PRESENTACION -------------------------------------------
  /** POST /api/trama/presentacion
   * body (opcional): { nodoOrigen?, nodoDestino?, datos?: PresentacionDto }
   */
  @Post('presentacion')
  async presentacion(@Query('ver') ver?: string) {
    const usePort = ver === '0' ? 8002 : 8003;
    await this.tcp.cambiarPuerto({ port: usePort });

    if (ver === '0') {                     // 8002 Antiguos
      this.tcp.handlerPresentacionOld();
    } else {                               // 8003 Nuevos
      this.tcp.handlerPresentacion();
    }
  }

  // ------------------------------------------- PRESENCIA -------------------------------------------
  /** POST /api/trama/presencia
   * body (opcional): { nodoOrigen?, nodoDestino? }
   */
  @Post('presencia')
  async presencia(@Query('ver') ver?: string) {
    const usePort = ver === '0' ? 8002 : 8003;
    await this.tcp.cambiarPuerto({ port: usePort });
    // let enviarFrame: boolean | { bytes: number; hex: string; } = false;

    if (ver === '0') { // 8002 Antiguos
      return this.tcp.handlerPresenciaOld();
    } else { // 8003 Nuevos
      return this.tcp.handlerPresencia();
    }
  }

  // ------------------------------------------- ESTADO DISPOSITIVO -------------------------------------------
  @Post('estadoDispositivo')
  async estadoDispositivo(@Query('ver') ver?: string) {
    const usePort = ver === '0' ? 8002 : 8003;
    await this.tcp.cambiarPuerto({ port: usePort });
    let enviarFrame: boolean | { bytes: number; hex: string; } = false;

    // Datos de ejemplo
    const estadoDispositivo: EstadoDispositivoTxDto = {
      nVariables: 6,
      version: 1,
      idEnvio: 1234,
      alarmaEquipo: 0, // Si es distinto de 0, hay alarama
    };

    const data = this.tcp.serializarDataEstadoDispositivo(estadoDispositivo);
    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.sistema, // TT_SISTEMA
      tipoMensaje: EnTmSistema.txEstadoDispositivo, // TM_SISTEMA_TX_PRESENCIA
      data,
    }) as FrameDto;

    enviarFrame = this.tcp.enviarFrame(frame);
    josLogger.info(`Enviamos ESTADO DISPOSITIVO`);
    if (!enviarFrame) return false;
    else return enviarFrame;
  }

  // ------------------------------------------- CONFIG FINAL -------------------------------------------
  @Post('configFinal')
  async configFinal() {
    // Datos de ejemplo (doc 2.4.7)
    const cfg: ConfigFinalTxDto = {
      version: 0, // inicialmente 0
      enviaEstadisticos: 1, // 0: no envía; 1: intenta enviar hasta infinito
    };

    const data = this.tcp.serializarDataConfigFinal(cfg);
    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.sistema, // TT_SISTEMA
      tipoMensaje: EnTmSistema.txConfigFinal, // 12
      data,
    }) as FrameDto;

    const ok = this.tcp.enviarFrame(frame);
    josLogger.info(`Enviamos CONFIG FINAL`);
    return !!ok && ok;
  }

  // ------------------------------------------- URL DESCARGA OTA -------------------------------------------
  @Post('urlDescargaOta')
  async urlDescargaOta() {
    // Datos de ejemplo (doc 1.1.1: solo dosimac por http; para pruebas puedes variar el tipo_equipo)
    const ota: UrlDescargaOtaTxDto = {
      versionTramaOta: 1,
      tipoEquipo: EnTipoEquipo.cti40, // o el que corresponda en tu simulación
    };

    const data = this.tcp.serializarDataUrlDescargaOta(ota);
    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.sistema, // TT_SISTEMA
      tipoMensaje: EnTmSistema.txUrlDescargaOta, // 6
      data,
    }) as FrameDto;

    const ok = this.tcp.enviarFrame(frame);
    josLogger.info(`Enviamos URL DESCARGA OTA`);
    return !!ok && ok;
  }

  // ------------------------------------------- PROGRESO ACTUALIZACION -------------------------------------------
  @Post('progresoActualizacion')
  async progresoActualizacion() {
    // Datos de ejemplo (doc 1.1.3)
    const prog: ProgresoActualizacionTxDto = {
      nVariables: 3,
      version: 1,
      estadoProgreso: EnGcspaEventoActualizacionServer.iniciandoDescarga,
    };

    const data = this.tcp.serializarDataProgresoActualizacion(prog);
    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.sistema, // TT_SISTEMA
      tipoMensaje: EnTmSistema.txProgresoActualizacion, // 10
      data,
    }) as FrameDto;

    const ok = this.tcp.enviarFrame(frame);
    josLogger.info(`Enviamos PROGRESO ACTUALIZACION`);
    return !!ok && ok;
  }

  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ESTADISTICOS ---------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  @Post('estadisticos')
  async estadisticos(
    @Query('fi') fi?: string,                                 // fecha inicio (DD-MM-YYYY)
    @Query('periodicidad') periodicidadRaw?: string | number, // EnEstadisPeriodicidad
    @Query('tipo') tipoRaw?: string | number,                 // EnEstadisticosControladores
    @Query('ff') ff?: string,                                 // fecha fin (DD-MM-YYYY)
  ) {
    // Validación: deben llegar los 4 parámetros, sin “ver”

    if (fi === undefined || periodicidadRaw === undefined || tipoRaw === undefined || ff === undefined) { throw new BadRequestException('Debes enviar los cuatro parámetros: fi, periodicidad, tipo y ff.'); }

    // Conectamos a equipos NUEVOS (8003) para este endpoint genérico
    await this.tcp.cambiarPuerto({ port: 8003 });

    const periodicidad = typeof periodicidadRaw === "string" ? parseInt(periodicidadRaw) : periodicidadRaw; //coerceEnum(periodicidadRaw!, EnEstadisPeriodicidad);
    const tipo = typeof tipoRaw === "string" ? parseInt(tipoRaw) : tipoRaw; //coerceEnum(tipoRaw!, EnEstadisticosControladores);

    const parsedPreiodicidad = periodicidad === 0
      ? EnEstadisPeriodicidad.noConfig : periodicidad === 1
        ? EnEstadisPeriodicidad.variable : periodicidad === 2
          ? EnEstadisPeriodicidad.envioHoras : periodicidad === 3
            ? EnEstadisPeriodicidad.envioDia : EnEstadisPeriodicidad.variableInstantaneo;

    // Parseo de fechas
    const fIni = parseDmYToFecha(fi); // -> Fecha {dia,mes,anyo}
    const fFin = parseDmYToFecha(ff);
    const dtIni = new Date(fIni.anyo, (fIni.mes ?? 1) - 1, fIni.dia ?? 1, 0, 0, 0, 0);
    const dtFin = new Date(fFin.anyo, (fFin.mes ?? 1) - 1, fFin.dia ?? 1, 23, 59, 59, 999);
    if (isNaN(dtIni.getTime()) || isNaN(dtFin.getTime()) || dtIni > dtFin) {
      throw new BadRequestException('Rango de fechas inválido.');
    }

    // Paso temporal según periodicidad
    const stepMs = (() => {
      switch (parsedPreiodicidad as EnEstadisPeriodicidad) {
        case EnEstadisPeriodicidad.envioHoras: return 60 * 60 * 1000;      // 1 hora
        case EnEstadisPeriodicidad.envioDia: return 24 * 60 * 60 * 1000; // 1 día
        // variable / variableInstantaneo / noConfig → elegimos 1h como fallback sensato para pruebas
        default: return 60 * 60 * 1000;
      }
    })();

    // Enviamos un punto por “step”

    // 1) Ajustamos el DTO “valor” (el bloque de items)
    defaultDatosValorTempSonda1.nombreEstadistico = tipo as EnEstadisticosControladores;
    defaultDatosValorTempSonda1.periodicidad = parsedPreiodicidad as EnEstadisPeriodicidad;
    defaultDatosValorTempSonda1.unidad = [EnEstadisticosControladores.tempSonda1, EnEstadisticosControladores.tempSonda2, EnEstadisticosControladores.tempSonda3, EnEstadisticosControladores.tempSonda4].includes(tipo as number)
      ? EnGtUnidades.gradoCentigrado : [EnEstadisticosControladores.humedadInterior, EnEstadisticosControladores.humedadExterior].includes(tipo as number)
        ? EnGtUnidades.porcentaje : [EnEstadisticosControladores.co2Interior, EnEstadisticosControladores.nh3Interior].includes(tipo as number)
          ? EnGtUnidades.ppm : EnGtUnidades.gradoCentigrado;

    let enviados = 0;
    let valor = [EnEstadisticosControladores.tempSonda1, EnEstadisticosControladores.tempSonda2, EnEstadisticosControladores.tempSonda3, EnEstadisticosControladores.tempSonda4].includes(tipo as number)
      ? 28 : [EnEstadisticosControladores.humedadInterior, EnEstadisticosControladores.humedadExterior].includes(tipo as number)
        ? 65 : tipo === EnEstadisticosControladores.co2Interior
          ? 2850 : tipo === EnEstadisticosControladores.nh3Interior
            ? 10 : 25;

    for (let t = dtIni.getTime(); t <= dtFin.getTime(); t += stepMs) {

      const d = new Date(t);

      switch (tipo) {
        case EnEstadisticosControladores.humedadInterior:
        case EnEstadisticosControladores.humedadExterior: {
          // Humedad: rango 55–75 (%)
          const delta = (Math.random() * 1.4 + 0.1) * (Math.random() < 0.5 ? -1 : 1); // ±(0.1..1.5)
          valor = Math.max(55, Math.min(75, Number((valor + delta).toFixed(2))));
          defaultDatosValorTempSonda1.valorMedio = valor;
          defaultDatosValorTempSonda1.valorMax = Math.min(75, Number((valor + 3.0).toFixed(2)));
          defaultDatosValorTempSonda1.valorMin = Math.max(55, Number((valor - 2.0).toFixed(2)));
          break;
        }

        case EnEstadisticosControladores.co2Interior: {
          // CO₂: rango 2700–3000 (ppm)
          const delta = (Math.random() * 30 + 10) * (Math.random() < 0.5 ? -1 : 1); // ±(10..40)
          valor = Math.max(2700, Math.min(3000, Number((valor + delta).toFixed(2))));
          defaultDatosValorTempSonda1.valorMedio = valor;
          defaultDatosValorTempSonda1.valorMax = Math.min(3000, Number((valor + 80).toFixed(2)));
          defaultDatosValorTempSonda1.valorMin = Math.max(2700, Number((valor - 60).toFixed(2)));
          break;
        }

        case EnEstadisticosControladores.nh3Interior: {
          // NH₃: rango 5–15 (ppm)
          const delta = (Math.random() * 0.7 + 0.1) * (Math.random() < 0.5 ? -1 : 1); // ±(0.1..0.8)
          valor = Math.max(5, Math.min(15, Number((valor + delta).toFixed(2))));
          defaultDatosValorTempSonda1.valorMedio = valor;
          defaultDatosValorTempSonda1.valorMax = Math.min(15, Number((valor + 1.2).toFixed(2)));
          defaultDatosValorTempSonda1.valorMin = Math.max(5, Number((valor - 1.0).toFixed(2)));
          break;
        }

        case EnEstadisticosControladores.tempSonda1:
        case EnEstadisticosControladores.tempSonda2:
        case EnEstadisticosControladores.tempSonda3:
        case EnEstadisticosControladores.tempSonda4:
        default: {
          // Temperatura: rango 22–32 (°C)
          const delta = (Math.random() * 0.3 + 0.1) * (Math.random() < 0.5 ? -1 : 1); // ±(0.1..0.4)
          valor = Math.max(22, Math.min(32, Number((valor + delta).toFixed(2))));
          defaultDatosValorTempSonda1.valorMedio = valor;
          defaultDatosValorTempSonda1.valorMax = Math.min(32, Number((valor + 1.2).toFixed(2)));
          defaultDatosValorTempSonda1.valorMin = Math.max(22, Number((valor - 1.0).toFixed(2)));
          break;
        }
      }

      // 2) Re-serializamos los items
      const items = serializarDatosEstadisticoValor(defaultDatosValorTempSonda1);

      // 3) Ajustamos el DTO “header” del estadístico
      const fechaFrame: Fecha = { dia: d.getDate(), mes: d.getMonth() + 1, anyo: d.getFullYear() };
      const horaFrame: Tiempo = { hora: d.getHours(), min: d.getMinutes(), seg: d.getSeconds() };

      const ackId = this.tcp.nextStatId();
      defaultDataTempSonda1.identificadorUnicoDentroDelSegundo = ackId;
      defaultDataTempSonda1.fecha = fechaFrame;
      defaultDataTempSonda1.hora = horaFrame;
      defaultDataTempSonda1.datos = items;
      defaultDataTempSonda1.numeroDatos = items.length;

      // 4) Construimos el payload y el frame y lo enviamos esperando ACK
      const data = this.tcp.crearDataTempS1();
      const frame = this.tcp.crearFrame({
        nodoOrigen: 1,
        nodoDestino: 0,
        tipoTrama: EnTipoTrama.estadisticos,
        tipoMensaje: EnTmEstadisticos.enviaEstadistico,
        data,
        reserva: 0, // nuevos
      });

      const ok = await this.tcp.enviarEstadisticoYEsperarAck(ackId, frame as any);
      if (ok) enviados++;
    }

    return { ok: true, enviados, desde: fi, hasta: ff, parsedPreiodicidad, tipo };
  }

  // ------------------------------------------- VALOR (ej. tempSonda1) -------------------------------------------
  /** POST /api/trama/tempSonda1 */
  @Post('tempSonda1')
  async tempSonda1() {
    josLogger.info('Enviamos tempSonda1');

    const id = this.tcp.nextStatId();
    defaultDataTempSonda1.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico id=${defaultDataTempSonda1.identificadorUnicoDentroDelSegundo} enviado`,);

    const data = this.tcp.crearDataTempS1();

    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.estadisticos,
      tipoMensaje: EnTmEstadisticos.enviaEstadistico,
      data,
    }) as FrameDto;

    const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
    return ok;
  }

  // ------------------------------------------- CONTADOR (ej. contadorAgua) -------------------------------------------
  /** POST /api/trama/contadorAgua */
  @Post('contadorAgua')
  async contadorAgua() {
    josLogger.info('Enviamos contadorAgua');

    const id = this.tcp.nextStatId();
    defaultDataContadorAgua.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico contador id = ${id} enviado`);

    const data = this.tcp.crearDataContador();

    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.estadisticos,
      tipoMensaje: EnTmEstadisticos.enviaEstadistico,
      data,
    }) as FrameDto;

    const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
    return ok;
  }

  // ------------------------------------------- ACTIVIDAD (ej. actividadCalefaccion1) -------------------------------------------
  /** POST /api/trama/actividadCalefaccion1 */
  @Post('actividadCalefaccion1')
  async actividadCalefaccion1() {
    josLogger.info('Enviamos actividadCalefaccion1');

    const id = this.tcp.nextStatId();
    defaultDataActividadCalefaccion1.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico actividad id = ${id} enviado`);

    const data = this.tcp.crearDataActividad();

    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.estadisticos,
      tipoMensaje: EnTmEstadisticos.enviaEstadistico,
      data,
    }) as FrameDto;

    const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
    return ok;
  }

  // ------------------------------------------- EVENTO (ej. inicioCrianza) -------------------------------------------
  /** POST /api/trama/eventoInicioCrianza */
  @Post('eventoInicioCrianza')
  async eventoInicioCrianza() {
    josLogger.info('Enviamos eventoInicioCrianza');

    const id = this.tcp.nextStatId();
    defaultDataEventoInicioCrianza.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico evento id = ${id} enviado`);

    // Wrapper público en tu TcpClientService (igual que crearDataContador/Actividad/TempS1)
    const data = this.tcp.crearDataEventoInicioCrianza();

    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.estadisticos,
      tipoMensaje: EnTmEstadisticos.enviaEstadistico,
      data,
    }) as FrameDto;

    const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
    return ok;
  }

  // ------------------------------------------- ALARMA (ej. alarmaTempAlta) -------------------------------------------
  /** POST /api/trama/alarmaTempAlta */
  @Post('alarmaTempAlta')
  async alarmaTempAlta() {
    josLogger.info('Enviamos alarmaTempAlta');

    const id = this.tcp.nextStatId();
    defaultDataAlarmaTempAlta.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico alarma id = ${id} enviado`);

    const data = this.tcp.crearDataAlarmaTempAlta();

    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.estadisticos,
      tipoMensaje: EnTmEstadisticos.enviaEstadistico,
      data,
    }) as FrameDto;

    const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
    return ok;
  }

  @Post('cambioParametro')
  async cambioParametro() {
    josLogger.info('Enviamos cambioParametro');

    const id = this.tcp.nextStatId();
    defaultDataCambioParametro.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico cambioParametro id = ${id} enviado`);

    const data = this.tcp.crearDataCambioParametro();

    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.estadisticos,
      tipoMensaje: EnTmEstadisticos.enviaEstadistico,
      data,
    }) as FrameDto;

    const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
    return ok;
  }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------- EQUIPOS VIEJOS (Old/BE TipoDato TipoAccion) -----------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT SISTEMAS -------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // ------------------------------------------- TABLA DISPOSITIVOS (OLD) -------------------------------------------
  @Post('tablaDispositivos')
  async tablaDispositivos(@Query('nDispositivos') nDispositivos?: string) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    let n = parseInt(nDispositivos ?? '10');
    if (isNaN(n) || n === null || n === undefined || n < 1 || n > 20) {
      josLogger.error(`Número de dispositivos inválido (${nDispositivos}). Usando 10 por defecto.`);
      n = 10;
    }

    josLogger.trace(`Enviando tabla de dispositivos con ${n} dispositivos`);

    // Si no se introducen dispositivos serán 10 por defecto.
    const { fin, mas } = this.tcp.crearBuffersTablaDispositivos(n);

    if (mas) {
      const frameMas = this.tcp.crearFrameOld({
        nodoOrigen: 1,
        nodoDestino: 0,
        tipoTrama: EnTipoTramaOld.centralServidor, // TT_central_servidor (=6)
        tipoMensaje: EnTipoMensajeCentralServidor.tmRtTablaCentralMas, // (=7)
        data: mas,
        versionProtocolo: PROTO_VERSION_OLD,
      });
      josLogger.trace('Enviamos trama MAS de tabla de dispositivos (más de 13 dispositivos en total).');
      const okMas = this.tcp.enviarFrameOld(frameMas);
      const bufferMas = Buffer.from((okMas as { bytes: number, hex: string }).hex, 'hex');
      logTramaCompletaTablaDispositivosOld(bufferMas);
    }

    const frameFin = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.centralServidor, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeCentralServidor.tmRtTablaCentralFin, // (=8)
      data: fin,
      versionProtocolo: PROTO_VERSION_OLD,
    });
    josLogger.trace('Enviamos trama FIN de tabla de dispositivos.');
    const okFin = this.tcp.enviarFrameOld(frameFin);
    josLogger.trace(`${EnTipoTramaOld[frameFin.tipoTrama]} ${EnTipoMensajeCentralServidor[frameFin.tipoMensaje]}`);
    const bufferFin = Buffer.from((okFin as { bytes: number, hex: string }).hex, 'hex');
    logTramaCompletaTablaDispositivosOld(bufferFin);

    return okFin;
  }

  // ------------------------------------------- TABLA DISPOSITIVOS (OLD) -------------------------------------------
  @Post('cambioEstadoDispositivo')
  /** Se puede introducir por parámetro, opcionalmente: mac, nodo, estado, td (tipoDispositivo), version, hayAlarma */
  async cambioEstadoDispositivo(
    @Query('mac') mac?: string,                                // fecha inicio (DD-MM-YYYY)
    @Query('nodo') nodo?: string | number,                     // EnEstadisPeriodicidad
    @Query('estado') estado?: string | number,                 // EnEstadisticosControladores
    @Query('td') td?: string,
    @Query('version') version?: string,
    @Query('hayAlarma') hayAlarma?: string,
  ) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    // const m = parseInt(mac ?? '12345678');
    const m = mac?.trim().startsWith("0x") ? BigInt(mac.trim()) : BigInt("0x" + mac8FromParam(mac).toString("hex"));
    const n = typeof nodo === "string" ? parseInt(nodo) : (nodo ?? 1);
    const e = typeof estado === "string" ? parseInt(estado) : (estado ?? 1);
    const t = parseInt(td ?? '1');
    const v = parseInt(version ?? '1');
    const a = parseInt(hayAlarma ?? '1');
    const disp = crearTablaCambioEstadoDispositivoOld(m, n, e, t, v, a);
    const data = this.tcp.crearDataTablaDispositivosCambioEstadoOld(disp);
    // const dispositivo = crearTablaCambioEstadoDispositivo(mac, nodo, estado, td, v, hayAlarma);

    const frameTablaConDispositivoCambiado = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.centralServidor, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeCentralServidor.tmEventoCambioEstadoNodo, // (=8)
      data: data,
      versionProtocolo: PROTO_VERSION_OLD,
    });

    const ok = this.tcp.enviarFrameOld(frameTablaConDispositivoCambiado);
    return ok;
  }

  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ESTADISTICOS ---------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * Estadísticos con TipoDato y TipoAccion, no DF Omega.

  @Post('estadisticoValor')
  /** Se puede introducir por parámetro, opcionalmente: mac, nodo, estado, td (tipoDispositivo), version, hayAlarma */
  async estadisticoValor(
    @Query('nombreEstadistico') nombreEstadistico?: string,
    @Query('cambioParametro') cambioParametro?: string
  ) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    let estadistico = defaultEstadisticoValorOld;

    //done Según el numSer (EnEstadisticosNombres) envía un valor u otro (porcentaje, temperatura, nh3...)
    if (nombreEstadistico !== undefined) {
      const n = parseInt(nombreEstadistico);
      estadistico = this.tcp.crearDataEstadisticoValorOld(n);
    }

    // Si se introduce cualquier valor para cambioParametro, se interpreta como cambioParametro en vez de estadístico valor normal.
    if (cambioParametro !== undefined) estadistico.tipoDato = EnTipoDatoOld.cambioParametro;

    const data = serializarParametroHistoricoOld(estadistico);

    const frame = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.envioDispositivoFinal, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico, // (=8)
      data: data,
      versionProtocolo: PROTO_VERSION_OLD,
    });

    const ok = this.tcp.enviarFrameOld(frame);
    const bufferFrame = Buffer.from((ok as { bytes: number, hex: string }).hex, 'hex');
    logTramaParametroHistoricoOld(bufferFrame);
    return ok;
  }

  @Post('estadisticoAltasBajasRetiradas')
  async estadisticoAltasBajasRetiradasOld(@Query('altaBajaRetirada') altaBajaRetirada?: string) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    let estadistico = defaultEstadisticoAltasBajasRetiradasCrianzaOld;

    if (altaBajaRetirada !== undefined) {
      const n = parseInt(altaBajaRetirada);
      estadistico.identificadorCliente = n === 1
        ? EnTipoAccionAltasBajasRetiradasCrianzaOld.altaAnadir as number
        : n === 2
          ? EnTipoAccionAltasBajasRetiradasCrianzaOld.bajaAnadir as number
          : n === 3
            ? EnTipoAccionAltasBajasRetiradasCrianzaOld.retiradaAnadir as number
            : EnTipoAccionAltasBajasRetiradasCrianzaOld.altaAnadir as number
        ; // EnTipoAccionAltasBajasRetiradasCrianzaOld
    }

    // estadistico = this.tcp.crearDataEstadisticoValorOld(n);

    const data = serializarParametroHistoricoOld(estadistico);

    const frame = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.envioDispositivoFinal, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico, // (=8)
      data: data,
      versionProtocolo: PROTO_VERSION_OLD,
    });

    const ok = this.tcp.enviarFrameOld(frame);
    const bufferFrame = Buffer.from((ok as { bytes: number, hex: string }).hex, 'hex');
    logTramaParametroHistoricoOld(bufferFrame);
    return ok;

  }

  @Post('estadisticoInicioFinOld')
  async estadisticoInicioFinOld(@Query('inicioFin') inicioFin?: string) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    let estadistico = defaultEstadisticoInicioFinCrianzaOld;

    if (inicioFin !== undefined) {
      const n = parseInt(inicioFin);
      estadistico.identificadorCliente = n === 0 ? EnTipoAccionInicioFinCrianzaOld.inicio as number : EnTipoAccionInicioFinCrianzaOld.fin as number;
    }

    const data = serializarParametroHistoricoOld(estadistico);

    const frame = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.envioDispositivoFinal, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico, // (=8)
      data: data,
      versionProtocolo: PROTO_VERSION_OLD,
    });

    const ok = this.tcp.enviarFrameOld(frame);
    const bufferFrame = Buffer.from((ok as { bytes: number, hex: string }).hex, 'hex');
    logTramaParametroHistoricoOld(bufferFrame);
    return ok;
  }

  @Post('estadisticoAlarmasOld')
  async estadisticoAlarmasOld(@Query('alarma') alarma?: string) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    let estadistico = defaultEstadisticoAlarmasOld;

    if (alarma !== undefined) {
      const n = parseInt(alarma);
      estadistico.datos = n;
    }

    const data = serializarParametroHistoricoOld(estadistico);

    const frame = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.envioDispositivoFinal, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico, // (=8)
      data: data,
      versionProtocolo: PROTO_VERSION_OLD,
    });

    const ok = this.tcp.enviarFrameOld(frame);
    const bufferFrame = Buffer.from((ok as { bytes: number, hex: string }).hex, 'hex');
    logTramaParametroHistoricoOld(bufferFrame);
    return ok;
  }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------- EQUIPOS VIEJOS (Old/BE EnTipoDatoDFAccion) ------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ESTADISTICOS ---------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * Estadísticos con EnTipoDatoDFAccion OMEGA.

  @Post('estadisticoValorOmegaDf')
  async estadisticoValorOmegaDf(
    @Query('nombreEstadistico') nombreEstadistico?: string,
    @Query('cambioParametro') cambioParametro?: string
  ) {

    await this.tcp.cambiarPuerto({ port: 8002 });

    let estadistico = defaultParametroHistoricoValorOmegaDf;

    if (nombreEstadistico !== undefined) estadistico.nombreVariable = parseInt(nombreEstadistico);
    if (cambioParametro !== undefined) estadistico.tipoDato = EnTipoDatoDFAccion.cambioParametroFloat1; // Por defecto es estadisticoFloat1

    const data = serializarParametroHistoricoValorOmegaDf(estadistico);

    const frame = this.tcp.crearFrameOld({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTramaOld.omegaPantallaPlaca, // TT_central_servidor (=6)
      tipoMensaje: EnTipoMensajeDispositivoCentral.tmEnviaParametroHistorico, // (=8)
      data: data,
      versionProtocolo: PROTO_VERSION_OLD,
    });

    const ok = this.tcp.enviarFrameOld(frame);
    const bufferFrame = Buffer.from((ok as { bytes: number, hex: string }).hex, 'hex');
    // logTramaParametroHistoricoOld(bufferFrame);
    logTramaParametroHistoricoOmegaDf(bufferFrame);
    return ok;
  }

}
