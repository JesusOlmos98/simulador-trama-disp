import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TcpClientModule } from 'src/tcp-client/tcp-client.module';
import { TramaModule } from 'src/trama/trama.module';

@Module({
  imports: [TcpClientModule, TramaModule],
  controllers: [TestController],
  providers: [],
  exports: [],
})
export class TestModule {}
