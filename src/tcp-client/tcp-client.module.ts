import { Module } from '@nestjs/common';
import { TcpClientService } from './tcp-client.serviceDEPRECATED';

@Module({
  // imports: [TramaModule],
  controllers: [],
  providers: [TcpClientService],
  exports: [TcpClientService],
})
export class TcpClientModule {}
