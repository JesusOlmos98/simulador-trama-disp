import { Module } from '@nestjs/common';
import { TcpClientService } from './tcp-client.service';
import { TcpClientController } from './tcp-client.controller';

@Module({
  // imports: [TramaModule],
  controllers: [TcpClientController],
  providers: [TcpClientService],
  exports: [TcpClientService],
})
export class TcpClientModule {}
