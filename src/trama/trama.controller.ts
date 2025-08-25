import { Body, Controller, Post } from '@nestjs/common';
import { josLogger } from 'src/logger';
import { TcpClientService } from 'src/tcp-client/tcp-client.service';

@Controller('trama')
export class TramaController {
  constructor(private readonly tcp: TcpClientService) { }

  /** POST /api/trama/presentacion
   * body: { originNode, destNode, versionPresentacion, mac, versionEquipo, tipoEquipo, claveEquipo, versionHw }
   */
  @Post('presentacion')
  async presentacion(@Body() b: any) {

    josLogger.info('Enviamos PRESENTACION');

    const data = this.tcp.buildDataPresentacion({
      versionPresentacion: b?.versionPresentacion ?? 1,
      mac: b?.mac ?? 0x12345678,
      versionEquipo: b?.versionEquipo ?? 100,
      tipoEquipo: b?.tipoEquipo ?? 140, // p.ej. TIPO_EQUIPO_OMEGA=140 en el doc
      claveEquipo: b?.claveEquipo ?? 0,
      versionHw: b?.versionHw ?? 1,
    });

    const frame = this.tcp.buildFrame({
      originNode: b?.originNode ?? 1,
      destNode: b?.destNode ?? 0,
      tipoTrama: 25, // TT_SISTEMA
      tipoMensaje: 1, // TM_SISTEMA_TX_PRESENTACION
      data
    });

    return this.tcp.sendFrame(frame);
  }

  /** POST /api/trama/presencia
   * body: { originNode, destNode }
   */
  @Post('presencia')
  async presencia(@Body() b: any) {

    josLogger.info('Enviamos PRESENCIA');

    const data = this.tcp.buildDataPresencia(); // vacío (según doc no define campos)
    const frame = this.tcp.buildFrame({
      originNode: b?.originNode ?? 1,
      destNode: b?.destNode ?? 0,
      tipoTrama: 25, // TT_SISTEMA
      tipoMensaje: 4, // TM_SISTEMA_TX_PRESENCIA
      data
    });
    return this.tcp.sendFrame(frame);
  }

  /** POST /api/trama/tempS1
   * body: { originNode, destNode, tempC }
   * NOTA: demo sencilla. Si quieres formalizarlo, lo llevamos a TT_ESTADISTICOS.
   */
  @Post('tempS1')
  async tempS1(@Body() b: any) {

    josLogger.info('Enviamos tempS1');

    const tempC = typeof b?.tempC === 'number' ? b.tempC : 25.0;
    const data = this.tcp.buildDataTempS1(tempC);

    const frame = this.tcp.buildFrame({
      originNode: b?.originNode ?? 1,
      destNode: b?.destNode ?? 0,
      tipoTrama: 25, // TT_SISTEMA
      tipoMensaje: 0, // Demo / reservado
      data
    });
    return this.tcp.sendFrame(frame);
  }
}



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
