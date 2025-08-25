import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TramaModule } from './trama/trama.module';
import { TcpClientModule } from './tcp-client/tcp-client.module';

@Module({
  imports: [TramaModule, TcpClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
