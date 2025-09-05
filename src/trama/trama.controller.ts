import { Controller, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { defaultPresentacionOmegaOld } from 'src/dtoBE/defaultTramaOld';
import { FrameOldDto } from 'src/dtoBE/frameOld.dto';
import { PresentacionCentralOldDto } from 'src/dtoBE/tt_sistemaOld.dto';
import {
  defaultPresentacionCTI40,
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
import { EstadisticoDato, serializarDatosEstadisticoValor } from 'src/dtoLE/tt_estadisticos.dto';
import {
  PresentacionDto,
  EstadoDispositivoTxDto,
  ConfigFinalTxDto,
  UrlDescargaOtaTxDto,
  ProgresoActualizacionTxDto,
} from 'src/dtoLE/tt_sistema.dto';
import { TcpClientService } from 'src/tcp-client/tcp-client.service';
import {
  EnTipoTrama,
  EnTmSistema,
  EnTipoEquipo,
  EnGcspaEventoActualizacionServer,
  EnTmEstadisticos,
  EnTmDepuracion,
  EnEstadisPeriodicidad,
  EnEstadisticosControladores,
} from 'src/utils/LE/globals/enums';
import { parseDmYToFecha } from 'src/utils/helpers';
import { josLogger } from 'src/utils/josLogger';

@Controller('trama')
export class TramaController {
  constructor(private readonly tcp: TcpClientService) { }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT SISTEMAS -------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // ------------------------------------------- PRESENTACION -------------------------------------------
  /** POST /api/trama/presentacion
   * body (opcional): { nodoOrigen?, nodoDestino?, datos?: PresentacionDto }
   */
  @Post('presentacion')
  async presentacion(@Query('ver') ver?: string) {
    const usePort = ver === '0' ? 8002 : 8003;
    await this.tcp.switchTargetAndEnsureConnected({ port: usePort });

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
    await this.tcp.switchTargetAndEnsureConnected({ port: usePort });
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
    await this.tcp.switchTargetAndEnsureConnected({ port: usePort });
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
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ESTADISTICOS ---------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  //! hacer con Querys tempSonda1, humedad, co2, nh3

  // ------------------------------------------- VALOR (ej. tempSonda1) -------------------------------------------
  // @Post('tempSonda1')
  // async tempSonda1(
  //   @Query('ver') ver?: string,
  //   @Query('fi') fi?: string,
  //   @Query('periodicidad') periodicidadRaw?: string,
  //   @Query('tipo') tipoRaw?: string,
  //   @Query('ff') ff?: string,
  // ) {
  //   josLogger.info('Enviamos tempSonda1');

  //   // “Todos o ninguno”
  //   const providedCount = [fi, periodicidadRaw, tipoRaw, ff].filter(v => v !== undefined).length;
  //   if (providedCount !== 0 && providedCount !== 4) {
  //     throw new BadRequestException('Debes enviar los cuatro parámetros (fi, periodicidad, tipo, ff) o ninguno.');
  //   }

  //   // Si vienen los 4, validamos/convertimos y aplicamos
  //   if (providedCount === 4) {
  //     try {
  //       const fechaInicio = parseDmY(fi!);
  //       const fechaFin = parseDmY(ff!);
  //       if (fechaFin < fechaInicio) throw new Error('La fecha final debe ser posterior a la inicial.');

  //       const periodicidad = coerceEnum(periodicidadRaw!, EnEstadisPeriodicidad);
  //       const tipo = coerceEnum(tipoRaw!, EnEstadisticosControladores);

  //       // Ajusta estos campos a tu DTO real de estadístico:
  //       // ! Si tus nombres no coinciden, cambia aquí los nombres de propiedad.
  //       defaultDataTempSonda1.fechaInicioEpoch = Math.floor(fechaInicio.getTime() / 1000); // ! Epoch UTC
  //       defaultDataTempSonda1.fechaFinEpoch = Math.floor(fechaFin.getTime() / 1000);       // ! Epoch UTC
  //       defaultDataTempSonda1.periodicidad = periodicidad as number;
  //       defaultDataTempSonda1.tipoEstadistico = tipo as number;
  //     } catch (e: any) {
  //       throw new BadRequestException(`Parámetros inválidos: ${e.message}`);
  //     }
  //   }

  //   // Flujo habitual (nuevo o viejo según ?ver)
  //   const id = this.tcp.nextStatId();
  //   defaultDataTempSonda1.identificadorUnicoDentroDelSegundo = id;
  //   josLogger.info(`📈 Estadístico id=${defaultDataTempSonda1.identificadorUnicoDentroDelSegundo} enviado`);

  //   const data = this.tcp.crearDataTempS1();

  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: 1,
  //     nodoDestino: 0,
  //     tipoTrama: EnTipoTrama.estadisticos,
  //     tipoMensaje: EnTmEstadisticos.enviaEstadistico,
  //     data,
  //     // Para nuevos agrega reserva: 0; si quieres soportar ver=0 (viejos) en este endpoint,
  //     // podrías decidir aquí en función de 'ver' como hiciste en presentación/presencia.
  //     reserva: ver === '0' ? undefined as any : 0, // ! si NO quieres viejos aquí, quita esta línea
  //   }) as FrameDto;

  //   const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
  //   return ok;
  // }

  // ────────── ENDPOINT ──────────
  @Post('tempSonda1')
  async tempSonda1(
    @Query('fi') fi?: string,                                 // fecha inicio (DD-MM-YYYY)
    @Query('periodicidad') periodicidadRaw?: string | number, // EnEstadisPeriodicidad
    @Query('tipo') tipoRaw?: string | number,                 // EnEstadisticosControladores
    @Query('ff') ff?: string,                                 // fecha fin (DD-MM-YYYY) — se valida pero este frame no la porta
  ) {
    josLogger.info('Enviamos tempSonda1');

    // “Todos o ninguno”
    const provided = [fi, periodicidadRaw, tipoRaw, ff].filter(v => v !== undefined);
    if (provided.length !== 0 && provided.length !== 4) {throw new BadRequestException('Debes enviar los cuatro parámetros (fi, periodicidad, tipo, ff) o ninguno.');}

    // Token ACK
    const id = this.tcp.nextStatId();
    defaultDataTempSonda1.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico id=${defaultDataTempSonda1.identificadorUnicoDentroDelSegundo} enviado`);

    // Si llegan los 4, aplicamos overrides al “valor” y a la fecha del frame
    if (provided.length === 4) {
      try {

        const periodicidad = typeof periodicidadRaw === "string" ? parseInt(periodicidadRaw) : periodicidadRaw; //coerceEnum(periodicidadRaw!, EnEstadisPeriodicidad);
        const tipo = typeof tipoRaw === "string" ? parseInt(tipoRaw) : tipoRaw; //coerceEnum(tipoRaw!, EnEstadisticosControladores);

        const parsedPreiodicidad = periodicidadRaw === 0
          ? EnEstadisPeriodicidad.noConfig : periodicidadRaw === 1
            ? EnEstadisPeriodicidad.variable : periodicidadRaw === 2
              ? EnEstadisPeriodicidad.envioHoras : periodicidadRaw === 3
                ? EnEstadisPeriodicidad.envioDia : EnEstadisPeriodicidad.variableInstantaneo;

        // Fechas
        const fechaInicio = parseDmYToFecha(fi!);
        const _fechaFin = parseDmYToFecha(ff!); // Validamos que es fecha válida
        // Nota: este tipo de frame no porta "fecha fin"; si en el futuro
        // quieres enviar un rango, debería ser otro mensaje o varios frames.

        // Enum periodicidad / tipo

        // Ajustamos el “valor” base (se serializa a EstadisticoDato[])
        defaultDatosValorTempSonda1.periodicidad = parsedPreiodicidad as EnEstadisPeriodicidad;
        defaultDatosValorTempSonda1.nombreEstadistico = tipo as EnEstadisticosControladores;

        // Ponemos la fecha de “inicio” en el frame de envío
        defaultDataTempSonda1.fecha = fechaInicio;
        // Puedes fijar hora a 00:00:00 si prefieres:
        // defaultDataTempSonda1.hora = { hora: 0, min: 0, seg: 0 } as Tiempo;
      } catch (e) {
        throw new BadRequestException(`Parámetros inválidos: ${e.message}`);
      }


      //! aqui hay que manejar que envie TODOS los estadísticos segun los parámetros
      // Re-serializamos el bloque de “valor” → EstadisticoDato[]
      const datos: EstadisticoDato[] = serializarDatosEstadisticoValor(defaultDatosValorTempSonda1);
      defaultDataTempSonda1.datos = datos;
      defaultDataTempSonda1.numeroDatos = datos.length;

      // Construimos payload con tu builder existente
      const data = this.tcp.crearDataTempS1();

      // Frame (equipos nuevos; este endpoint usa el flujo nuevo)
      const frame = this.tcp.crearFrame({
        nodoOrigen: 1,
        nodoDestino: 0,
        tipoTrama: EnTipoTrama.estadisticos,
        tipoMensaje: EnTmEstadisticos.enviaEstadistico,
        data,
        reserva: 0, // nuevos
      }) as FrameDto;

      const ok = await this.tcp.enviarEstadisticoYEsperarAck(id, frame);
      return ok;
    }


    josLogger.info('Enviamos tempSonda1');

    // const id = this.tcp.nextStatId();
    defaultDataTempSonda1.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(`📈 Estadístico id=${defaultDataTempSonda1.identificadorUnicoDentroDelSegundo} enviado`);

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
  // * ----------------------------------------------- TT DEPURACION -----------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // ------------------------------------------- DEPURACIÓN: PETICIÓN CONSOLA -------------------------------------------
  @Post('depuracion/peticionConsola')
  async depuracionPeticionConsola() {
    // Ejemplo de datos
    const dto: PeticionConsolaDto = {
      identificadorCliente: 1,
    };

    const data = this.tcp.serializarDepuracionPeticionConsola(dto);
    const frame = this.tcp.crearFrame({
      nodoOrigen: 1,
      nodoDestino: 0,
      tipoTrama: EnTipoTrama.depuracion, // TT_DEPURACION
      tipoMensaje: EnTmDepuracion.peticionConsola, // 1
      data,
    }) as FrameDto;

    const ok = this.tcp.enviarFrame(frame);
    josLogger.info('Enviamos DEPURACION PETICION CONSOLA');
    return !!ok && ok;
  }

  //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
  //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
  //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
  //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP
  //! WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP WIP

  // ------------------------------------------- DEPURACIÓN: RT PETICIÓN CONSOLA -------------------------------------------
  // @Post("depuracion/rtPeticionConsola")
  // async depuracionRtPeticionConsola() {
  //   // Ejemplo de datos
  //   const dto: RtPeticionConsolaDto = {
  //     identificadorCliente: 1,
  //     datos: "Comando ejecutado correctamente", // resto del payload en UTF-8
  //   };

  //   const data = this.tcp.serializarDepuracionRtPeticionConsola(dto);
  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: 1,
  //     nodoDestino: 0,
  //     tipoTrama: EnTipoTrama.depuracion,               // TT_DEPURACION
  //     tipoMensaje: EnTmDepuracion.rtPeticionConsola,   // 2
  //     data,
  //   });

  //   const ok = this.tcp.enviarFrame(frame);
  //   josLogger.info("Enviamos DEPURACION RT PETICION CONSOLA");
  //   return !!ok && ok;
  // }

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT ACTUALIZACION_SERVER -------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * ----------------------------------------------- TT SERVICIOS_CLAVE_VALOR ------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------

  //! WIP: Servicios Clave Valor
  // ------------------------------------------- SCV: PETICION SERVIDOR → FINAL -------------------------------------------
  // @Post("scv/peticionServidorFinal")
  // async scvPeticionServidorFinal() {
  //   const dto = {
  //     uidEnvioTrama: 42,         // u16
  //     servicio: 50010,           // u16 (ejemplo; 50000+ suelen ser comunes)
  //     // tipo lo fija el serializador a 'peticion'
  //     claves: [
  //       { clave: 50001, tipo: EnTipoDato.uint16, valor: 123 },         // p.ej. idLote
  //       { clave: 50002, tipo: EnTipoDato.float,  valor: 25.3 },        // p.ej. tempObjetivo
  //     ],
  //   } as const;

  //   const data = this.tcp.serializarScvPeticionServidorFinal(dto);
  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: 1,
  //     nodoDestino: 0,
  //     tipoTrama: EnTipoTrama.serviciosClaveValor,                  // TT_SCV
  //     tipoMensaje: EnTmServiciosClaveValor.peticionServidorFinal,  // 0
  //     data,
  //   });

  //   const ok = this.tcp.enviarFrame(frame);
  //   josLogger.info("Enviamos SCV PETICION SERVIDOR → FINAL");
  //   return !!ok && ok;
  // }

  // // ------------------------------------------- SCV: RT PETICION SERVIDOR → FINAL -------------------------------------------
  // @Post("scv/rtPeticionServidorFinal")
  // async scvRtPeticionServidorFinal() {
  //   const dto = {
  //     uidEnvioTrama: 42,
  //     servicio: 50010,
  //     claves: [
  //       { clave: 50001, tipo: EnTipoDato.uint16, valor: 123 },         // eco/resultado
  //       { clave: 50002, tipo: EnTipoDato.float,  valor: 25.3 },
  //     ],
  //   } as const;

  //   const data = this.tcp.serializarScvRtPeticionServidorFinal(dto);
  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: 1,
  //     nodoDestino: 0,
  //     tipoTrama: EnTipoTrama.serviciosClaveValor,
  //     tipoMensaje: EnTmServiciosClaveValor.rtPeticionServidorFinal,     // 1
  //     data,
  //   });

  //   const ok = this.tcp.enviarFrame(frame);
  //   josLogger.info("Enviamos SCV RT PETICION SERVIDOR → FINAL");
  //   return !!ok && ok;
  // }

  // // ------------------------------------------- SCV: PETICION FINAL → SERVIDOR -------------------------------------------
  // @Post("scv/peticionFinalServidor")
  // async scvPeticionFinalServidor() {
  //   const dto = {
  //     uidEnvioTrama: 7,
  //     servicio: 50020,
  //     claves: [
  //       { clave: 50005, tipo: EnTipoDato.uint32, valor: 987654 },      // p.ej. idCrianza
  //       { clave: 50006, tipo: EnTipoDato.string32, valor: "OK TEST" }, // string en UTF-8
  //     ],
  //   } as const;

  //   const data = this.tcp.serializarScvPeticionFinalServidor(dto);
  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: 1,
  //     nodoDestino: 0,
  //     tipoTrama: EnTipoTrama.serviciosClaveValor,
  //     tipoMensaje: EnTmServiciosClaveValor.peticionFinalServidor,       // 2
  //     data,
  //   });

  //   const ok = this.tcp.enviarFrame(frame);
  //   josLogger.info("Enviamos SCV PETICION FINAL → SERVIDOR");
  //   return !!ok && ok;
  // }

  // ------------------------------------------- SCV: RT PETICION FINAL → SERVIDOR -------------------------------------------
  // @Post("scv/rtPeticionFinalServidor")
  // async scvRtPeticionFinalServidor() {

  //     // uidEnvioTrama: number;          // uint16
  //     // servicio: number;               // uint16
  //     // tipo: EnScvTipo;                // uint8 (peticion|respuesta)
  //     // claves: ScvPar[];               // N_claves = claves.length

  //   const dto: ScvDto = {
  //     uidEnvioTrama: 7,
  //     servicio: 50020,
  //     claves: [
  //       { clave: 50005, tipo: EnTipoDato.uint32, valor: 987654 },       // eco/resultado
  //       { clave: 50006, tipo: EnTipoDato.string32, valor: "ACK" },
  //     ],
  //   } as const;

  //   const data = this.tcp.serializarScvRtPeticionFinalServidor(dto);
  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: 1,
  //     nodoDestino: 0,
  //     tipoTrama: EnTipoTrama.serviciosClaveValor,
  //     tipoMensaje: EnTmServiciosClaveValor.rtPeticionFinalServidor,     // 3
  //     data,
  //   });

  //   const ok = this.tcp.enviarFrame(frame);
  //   josLogger.info("Enviamos SCV RT PETICION FINAL → SERVIDOR");
  //   return !!ok && ok;
  // }

  //! Métricas para pruebas.
  // trama.controller.ts
  // @Post('metricas')
  // async metricas(@Body() body?: any) {
  //   josLogger.info('Enviamos METRICAS');

  //   const seq = Number(body?.seq ?? 0);       // opcional en body
  //   const nodoOrg = 1;
  //   const nodoDest = 0;

  //   const data = this.tcp.crearDataMetricas(seq);
  //   const frame = this.tcp.crearFrame({
  //     nodoOrigen: nodoOrg,
  //     nodoDestino: nodoDest,
  //     tipoTrama: EnTipoTrama.estadisticos,             // TT_SISTEMA
  //     tipoMensaje: EnTmEstadisticos.enviaEstadistico,      // TM_SISTEMA_TX_METRICAS (elige un código libre)
  //     data,
  //   });

  //   const enviarFrame = this.tcp.enviarFrame(frame);
  //   return enviarFrame || false;
  // }
}
