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


}
