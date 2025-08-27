import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TramaModule } from './trama/trama.module';
import { TcpClientModule } from './tcp-client/tcp-client.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [TramaModule, TcpClientModule, TestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
