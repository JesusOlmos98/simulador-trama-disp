import { Controller, Post, Body, Query } from '@nestjs/common';
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
} from 'src/dtoLE/defaultTrama';
import { FrameDto } from 'src/dtoLE/frame.dto';
import { PeticionConsolaDto } from 'src/dtoLE/tt_depuracion.dto';
import {
  PresentacionDto,
  EstadoDispositivoTxDto,
  ConfigFinalTxDto,
  UrlDescargaOtaTxDto,
  ProgresoActualizacionTxDto,
} from 'src/dtoLE/tt_sistema.dto';
import { TcpClientService } from 'src/tcp-client/tcp-client.serviceDEPRECATED';
import {
  EnTipoTrama,
  EnTmSistema,
  EnTipoEquipo,
  EnGcspaEventoActualizacionServer,
  EnTmEstadisticos,
  EnTmDepuracion,
} from 'src/utils/BE/globals/enums';
import {
  readNodoOrigen,
  readNodoDestino,
} from 'src/utils/helpers';
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
    let enviarFrame: boolean | { bytes: number; hex: string; } = false;

    if (ver === '0') { // 8002 Antiguos

      josLogger.debug('@Post("presentacion") 8002 Antiguos');
      const defaultPres: PresentacionCentralOldDto = defaultPresentacionOmegaOld;
      const data = this.tcp.crearDataPresentacion({
        tipoEquipo: defaultPres.tipoEquipo,
        mac: defaultPres.mac,
        versionEquipo: defaultPres.versionEquipo,
        password: defaultPres.password,
        crcTabla: 0,
      }); //done Aquí insertamos la data en la presentación.

      const frame: FrameOldDto = this.tcp.crearFrame({
        nodoOrigen: readNodoOrigen(1),
        nodoDestino: readNodoDestino(0),
        tipoTrama: EnTipoTrama.sistema,          // TT_SISTEMA
        tipoMensaje: EnTmSistema.txPresentacion, // TM_SISTEMA_TX_PRESENTACION
        data,
        // reserva: 0, //done NO enviamos reserva en los antiguos, nos sirve como flag en crearFrame()
      }) as FrameOldDto;

      enviarFrame = this.tcp.enviarFrame(frame as FrameOldDto);
      josLogger.info(`Enviamos PRESENTACION equipo VIEJO ${EnTipoEquipo[defaultPres.tipoEquipo].toUpperCase()} al puerto ${usePort}`,);

    } else { // 8003 Nuevos

      josLogger.debug('@Post("presentacion") 8003 Nuevos');

      const defaultPres: PresentacionDto = defaultPresentacionCTI40;
      // const pres: PresentacionDto = readPresentacion(defaultPres);
      const data = this.tcp.crearDataPresentacion(defaultPres); //done Aquí insertamos la data en la presentación.
      const frame: FrameDto = this.tcp.crearFrame({
        nodoOrigen: readNodoOrigen(1),
        nodoDestino: readNodoDestino(0),
        tipoTrama: EnTipoTrama.sistema,          // TT_SISTEMA
        tipoMensaje: EnTmSistema.txPresentacion, // TM_SISTEMA_TX_PRESENTACION
        data,
        reserva: 0,
      }) as FrameDto;
      enviarFrame = this.tcp.enviarFrame(frame);
      josLogger.info(`Enviamos PRESENTACION equipo NUEVO ${EnTipoEquipo[defaultPres.tipoEquipo].toUpperCase()} al puerto ${usePort}`,);
    }

    if (!enviarFrame) return false;
    else return enviarFrame;
  }

  // ------------------------------------------- PRESENCIA -------------------------------------------
  /** POST /api/trama/presencia
   * body (opcional): { nodoOrigen?, nodoDestino? }
   */
  @Post('presencia')
  async presencia(@Query('ver') ver?: string) {
    const usePort = ver === '0' ? 8002 : 8003;
    await this.tcp.switchTargetAndEnsureConnected({ port: usePort });
    let enviarFrame: boolean | { bytes: number; hex: string; } = false;
    if (ver === '0') { // 8002 Antiguos
      const defaultPres: PresentacionCentralOldDto = defaultPresentacionOmegaOld;
      // const frame:FrameOldDto = 
//! WIP

    } else { // 8003 Nuevos
      const data = this.tcp.crearDataPresencia(); // vacío
      const frame = this.tcp.crearFrame({
        nodoOrigen: readNodoOrigen(1),
        nodoDestino: readNodoDestino(0),
        tipoTrama: EnTipoTrama.sistema, // TT_SISTEMA
        tipoMensaje: EnTmSistema.txPresencia, // TM_SISTEMA_TX_PRESENCIA
        data,
      }) as FrameDto;
      enviarFrame = this.tcp.enviarFrame(frame);
    }

    josLogger.info(`Enviamos PRESENCIA`);
    if (!enviarFrame) return false;
    else return enviarFrame;
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
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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

  // ------------------------------------------- VALOR (ej. tempSonda1) -------------------------------------------
  /** POST /api/trama/tempSonda1 */
  @Post('tempSonda1')
  async tempSonda1(@Body() body?: unknown) {
    josLogger.info('Enviamos tempSonda1');

    const id = this.tcp.nextStatId();
    defaultDataTempSonda1.identificadorUnicoDentroDelSegundo = id;
    josLogger.info(
      `📈 Estadístico id=${defaultDataTempSonda1.identificadorUnicoDentroDelSegundo} enviado`,
    );

    const data = this.tcp.crearDataTempS1();

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
    josLogger.info(`📈 Estadístico contador id=${id} enviado`);

    const data = this.tcp.crearDataContador();

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
    josLogger.info(`📈 Estadístico actividad id=${id} enviado`);

    const data = this.tcp.crearDataActividad();

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
    josLogger.info(`📈 Estadístico evento id=${id} enviado`);

    // Wrapper público en tu TcpClientService (igual que crearDataContador/Actividad/TempS1)
    const data = this.tcp.crearDataEventoInicioCrianza();

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
    josLogger.info(`📈 Estadístico alarma id=${id} enviado`);

    const data = this.tcp.crearDataAlarmaTempAlta();

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
    josLogger.info(`📈 Estadístico cambioParametro id=${id} enviado`);

    const data = this.tcp.crearDataCambioParametro();

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
      nodoOrigen: readNodoOrigen(1),
      nodoDestino: readNodoDestino(0),
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
  //     nodoOrigen: readNodoOrigen(1),
  //     nodoDestino: readNodoDestino(0),
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
  //     nodoOrigen: readNodoOrigen(1),
  //     nodoDestino: readNodoDestino(0),
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
  //     nodoOrigen: readNodoOrigen(1),
  //     nodoDestino: readNodoDestino(0),
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
  //     nodoOrigen: readNodoOrigen(1),
  //     nodoDestino: readNodoDestino(0),
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
  //     nodoOrigen: readNodoOrigen(1),
  //     nodoDestino: readNodoDestino(0),
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
  //   const nodoOrg = readNodoOrigen(1);
  //   const nodoDest = readNodoDestino(0);

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
