import { Module } from '@nestjs/common';
import { TramaController } from './trama.controller';
import { TcpClientModule } from 'src/tcp-client/tcp-client.module';

@Module({
  imports: [TcpClientModule],
  controllers: [TramaController],
  providers: [TramaController],
  exports: [TramaController],
})
export class TramaModule {}
