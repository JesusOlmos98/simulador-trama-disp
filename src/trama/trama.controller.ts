import { Body, Controller, Post } from '@nestjs/common';
import { FrameDto, PresentacionDto } from 'src/dto/frame.dto';
import { josLogger } from 'src/utils/logger';
import { TcpClientService } from 'src/tcp-client/tcp-client.service';
import { readPresentacion, readNodoOrigen, readNodoDestino, readTempC } from 'src/utils/helpersTipado';
import { defaultPresentacion } from 'src/dto/defaultTrama';

@Controller('trama')
export class TramaController {
  constructor(private readonly tcp: TcpClientService) { }

  // ------------------------------------------- PRESENTACION -------------------------------------------
  /** POST /api/trama/presentacion
   * body (opcional): { nodoOrigen?, nodoDestino?, datos?: PresentacionDto }
   */
  @Post('presentacion')
  async presentacion(@Body() body: unknown) {
    josLogger.info('Enviamos PRESENTACION');

    const defaultPres: PresentacionDto = defaultPresentacion;

    const pres: PresentacionDto = readPresentacion(body, defaultPres);
    const data = this.tcp.crearDataPresentacion(pres); //done Aquí insertamos la data en la presentación.

    const frame: FrameDto = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(body, 1),
      nodoDestino: readNodoDestino(body, 0),
      tipoTrama: 25, // TT_SISTEMA
      tipoMensaje: 1,  // TM_SISTEMA_TX_PRESENTACION
      data,
    });

    const enviarFrame = this.tcp.enviarFrame(frame);
    if (!enviarFrame) return false;
    else return enviarFrame;
    // return this.tcp.enviarFrame(frame);
  }

  // ------------------------------------------- PRESENCIA -------------------------------------------
  /** POST /api/trama/presencia
   * body (opcional): { nodoOrigen?, nodoDestino? }
   */
  @Post('presencia')
  async presencia(@Body() body?: unknown) {
    josLogger.info('Enviamos PRESENCIA');

    const data = this.tcp.crearDataPresencia(); // vacío
    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(body, 1),
      nodoDestino: readNodoDestino(body, 0),
      tipoTrama: 25, // TT_SISTEMA
      tipoMensaje: 4,  // TM_SISTEMA_TX_PRESENCIA
      data,
    });

    const enviarFrame = this.tcp.enviarFrame(frame);
    if (!enviarFrame) return false;
    else return enviarFrame;
    // return this.tcp.enviarFrame(frame);
  }

  // ------------------------------------------- TEMPS1 -------------------------------------------
  /** POST /api/trama/tempS1
   * body (opcional): { nodoOrigen?, nodoDestino?, tempC? } o { datos: { tempC? } }
   * NOTA: demo sencilla. Si quieres formalizarlo, lo llevamos a TT_ESTADISTICOS.
   */
  @Post('tempS1')
  async tempS1(@Body() body: unknown) {
    josLogger.info('Enviamos tempS1');

    const tempC = readTempC(body, 25.31416);
    const data = this.tcp.crearDataTempS1(tempC);

    const frame = this.tcp.crearFrame({
      nodoOrigen: readNodoOrigen(body, 1),
      nodoDestino: readNodoDestino(body, 0),
      tipoTrama: 25, // TT_SISTEMA
      tipoMensaje: 0,  // Demo / reservado
      data,
    });

    const enviarFrame = this.tcp.enviarFrame(frame);
    if (!enviarFrame) return false;
    else return enviarFrame;
    // return this.tcp.enviarFrame(frame);
  }

 // trama.controller.ts
@Post('metricas')
async metricas(@Body() body: any) {
  josLogger.info('Enviamos METRICAS');

  const seq      = Number(body?.seq ?? 0);       // opcional en body
  const nodoOrg  = readNodoOrigen(body, 1);
  const nodoDest = readNodoDestino(body, 0);

  const data  = this.tcp.crearDataMetricas(seq);
  const frame = this.tcp.crearFrame({
    nodoOrigen:  nodoOrg,
    nodoDestino: nodoDest,
    tipoTrama:   25,        // TT_SISTEMA
    tipoMensaje: 0x40,      // TM_SISTEMA_TX_METRICAS (elige un código libre)
    data,
  });

  const enviarFrame = this.tcp.enviarFrame(frame);
  return enviarFrame || false;
}


}



// import { Body, Controller, Post } from '@nestjs/common';
// import { FrameDto, PresentacionDto } from 'src/dto/frame.dto';
// import { josLogger } from 'src/logger';
// import { TcpClientService } from 'src/tcp-client/tcp-client.service';

// //! CAPA 1

// @Controller('trama')
// export class TramaController {
//   constructor(private readonly tcp: TcpClientService) { }

//   // ------------------------------------------- PRESENTACION -------------------------------------------
//   /** POST /api/trama/presentacion
//    * body: { originNode, destNode, versionPresentacion, mac, versionEquipo, tipoEquipo, claveEquipo, versionHw }
//    */
//   @Post('presentacion')
//   async presentacion(@Body() b: FrameDto, ) {

//     josLogger.info('Enviamos PRESENTACION');

//     const data = this.tcp.buildDataPresentacion({
//       versionPresentacion: b?.versionPresentacion ?? 1,
//       mac: b?.mac ?? 0x12345678,
//       versionEquipo: b?.versionEquipo ?? 100,
//       tipoEquipo: b?.tipoEquipo ?? 140, // p.ej. TIPO_EQUIPO_OMEGA=140 en el doc
//       claveEquipo: b?.claveEquipo ?? 0,
//       versionHw: b?.versionHw ?? 1,
//     });

//     const frame: FrameDto= this.tcp.buildFrame({
//       originNode: b?.originNode ?? 1,
//       destNode: b?.destNode ?? 0,
//       tipoTrama: 25, // TT_SISTEMA
//       tipoMensaje: 1, // TM_SISTEMA_TX_PRESENTACION
//       data
//     });

//     return this.tcp.sendFrame(frame);
//   }

//   // ------------------------------------------- PRESENCIA -------------------------------------------
//   /** POST /api/trama/presencia
//    * body: { originNode, destNode }
//    */
//   @Post('presencia')
//   async presencia(@Body() b: any) {

//     josLogger.info('Enviamos PRESENCIA');

//     const data = this.tcp.buildDataPresencia(); // vacío (según doc no define campos)
//     const frame = this.tcp.buildFrame({
//       originNode: b?.originNode ?? 1,
//       destNode: b?.destNode ?? 0,
//       tipoTrama: 25, // TT_SISTEMA
//       tipoMensaje: 4, // TM_SISTEMA_TX_PRESENCIA
//       data
//     });
//     return this.tcp.sendFrame(frame);
//   }

//   // ------------------------------------------- TEMPS1 -------------------------------------------
//   /** POST /api/trama/tempS1
//    * body: { originNode, destNode, tempC }
//    * NOTA: demo sencilla. Si quieres formalizarlo, lo llevamos a TT_ESTADISTICOS.
//    */
//   @Post('tempS1')
//   async tempS1(@Body() b: any) {

//     josLogger.info('Enviamos tempS1');

//     const tempC = typeof b?.tempC === 'number' ? b.tempC : 25.0;
//     const data = this.tcp.buildDataTempS1(tempC);

//     const frame = this.tcp.buildFrame({
//       originNode: b?.originNode ?? 1,
//       destNode: b?.destNode ?? 0,
//       tipoTrama: 25, // TT_SISTEMA
//       tipoMensaje: 0, // Demo / reservado
//       data
//     });
//     return this.tcp.sendFrame(frame);
//   }
// }



// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { TramaService } from './trama.service';
// import { CreateTramaDto } from './dto/create-trama.dto';
// import { UpdateTramaDto } from './dto/update-trama.dto';

// @Controller('trama')
// export class TramaController {
//   constructor(private readonly tramaService: TramaService) {}

//   @Post()
//   create(@Body() createTramaDto: CreateTramaDto) {
//     return this.tramaService.create(createTramaDto);
//   }

//   @Get()
//   findAll() {
//     return this.tramaService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.tramaService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateTramaDto: UpdateTramaDto) {
//     return this.tramaService.update(+id, updateTramaDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.tramaService.remove(+id);
//   }
// }
