import { Injectable } from '@nestjs/common';
import { TcpClientService } from 'src/tcp-client/tcp-client.service';
import { TramaController } from 'src/trama/trama.controller';

@Injectable()
export class TestService {

  constructor(
    private readonly tcp: TcpClientService,
    private readonly trama: TramaController,
    // private timer: NodeJS.Timeout,
  ) { }

  async todasTramasCti40(milisegundosFrecuenciaEnvio?: number) {
    // // return `Enviando todas las tramas CTI40 cada ${milisegundosFrecuenciaEnvio ?? 1000} ms`;

    // let timer: NodeJS.Timeout;
    // let contadorTramas = 0;

    // josLogger.info('Enviamos todasTramasCti40:');
    // josLogger.info('------------------------------');

    // const presentacion: PresentacionDto = defaultPresentacion;
    // presentacion.tipoEquipo = EnTipoEquipo.cti40;

    // //Done Aquí enviamos la presentación.
    // this.trama.presentacion(presentacion); // Ya lleva el equipo CTI40 por defecto
    // josLogger.info(`Presentación enviada: 
    //   \nnVariables: ${presentacion.nVariables}
    //   \nversionPresentacion: ${presentacion.versionPresentacion}
    //   \nmac: ${presentacion.mac.toString(16)}
    //   \nversionEquipo: ${presentacion.versionEquipo}
    //   \ntipoEquipo: ${EnTipoEquipo[presentacion.tipoEquipo]}
    //   \nclaveEquipo: ${presentacion.claveEquipo}
    //   \nversionHw: ${presentacion.versionHw}`);



    // //Done Aquí enviamos la presencia y estadístico (simulando la temperatura).
    // timer = setInterval(() => {
    //   const resPrese = this.trama.presencia();
    //   josLogger.info(`Presencia enviada.`);

    //   const resTempS1 = this.trama.tempS1(25.31416);
    //   josLogger.info(`TempS1 enviada: 25.31416ºC`);
    //   josLogger.info(`Tramas enviadas: ${++contadorTramas}`);
    //   josLogger.info('------------------------------');

    //   if (!resPrese || !resTempS1) clearInterval(timer); // Usamos el propio ID que da esta función para detenerla desde dentro.
    // }, milisegundosFrecuenciaEnvio ?? 1000);

  }






  // create(createTestDto: CreateTestDto) {
  //   return 'This action adds a new test';
  // }

  // findAll() {
  //   return `This action returns all test`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} test`;
  // }

  // update(id: number, updateTestDto: UpdateTestDto) {
  //   return `This action updates a #${id} test`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} test`;
  // }
}
