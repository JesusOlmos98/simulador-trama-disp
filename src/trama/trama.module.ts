import { Module } from '@nestjs/common';
import { TramaService } from './trama.service';
import { TramaController } from './trama.controller';
import { TcpClientModule } from 'src/tcp-client/tcp-client.module';

@Module({
  imports: [TcpClientModule],
  controllers: [TramaController],
  providers: [TramaService],
  exports: [TramaService],
})
export class TramaModule { }
