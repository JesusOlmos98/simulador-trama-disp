import { Controller, Post, Query } from '@nestjs/common';
import { josLogger } from 'src/utils/logger';
import { TramaController } from 'src/trama/trama.controller';
import { defaultPresentacionCTI40 } from 'src/dto/defaultTrama';
import { EnTipoEquipo } from 'src/utils/enums';
import { PresentacionDto } from 'src/dto/tt_sistema.dto';

@Controller('test')
export class TestController {

  constructor(
    private readonly trama: TramaController,
    // private readonly tcp: TcpClientService,
    // private timer: NodeJS.Timeout,
  ) { }

  @Post('todastramascti40')
  async todasTramasCti40(@Query('ms') ms?: string){

    const milisegundos = parseInt(ms ?? '1000');

    josLogger.info('Enviando todas las tramas CTI40 cada ' + milisegundos + ' ms');
    let timer: NodeJS.Timeout;
    let contadorEnvios = 0;

    josLogger.info('Enviamos todasTramasCti40:');
    josLogger.info('------------------------------');

    const presentacion: PresentacionDto = defaultPresentacionCTI40;
    presentacion.tipoEquipo = EnTipoEquipo.cti40;




    //Done Aquí enviamos la presentación.
    this.trama.presentacion(presentacion); // Ya lleva el equipo CTI40 por defecto
    josLogger.info(`Enviada trama presentación: 
      \nnVariables: ${presentacion.nVariables}
      \nversionPresentacion: ${presentacion.versionPresentacion}
      \nmac: ${presentacion.mac.toString(16)}
      \nversionEquipo: ${presentacion.versionEquipo}
      \ntipoEquipo: ${EnTipoEquipo[presentacion.tipoEquipo]}
      \nclaveEquipo: ${presentacion.claveEquipo}
      \nversionHw: ${presentacion.versionHw}`);



    //Done Aquí enviamos la presencia y estadístico (simulando la temperatura) cada X milisegundos.
    timer = setInterval(() => {
      const resPrese = this.trama.presencia();
      josLogger.info(`✅ Enviada trama presencia.`);

      const resTempS1 = this.trama.tempS1(25.31416);
      josLogger.info(`✅ Enviada trama temperatura tempS1: 25.31416ºC`);

      const resMetricas = this.trama.metricas();
      josLogger.info(`✅ Enviada trama métricas.`);

      josLogger.info(`Envíos realizados (3 tramas por envío más la presentación inicial): ${++contadorEnvios}`);
      josLogger.info('------------------------------');

      if (!resPrese || !resTempS1 || !resMetricas) clearInterval(timer); // Usamos el propio ID que da esta función para detenerla desde dentro.
    }, milisegundos);
  }





























  // @Post()
  // create(@Body() createTestDto: CreateTestDto) {
  //   return this.testService.create(createTestDto);
  // }

  // @Get()
  // findAll() {
  //   return this.testService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.testService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
  //   return this.testService.update(+id, updateTestDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.testService.remove(+id);
  // }
}
