import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { TcpClientModule } from 'src/tcp-client/tcp-client.module';
import { TramaModule } from 'src/trama/trama.module';

@Module({
  imports: [TcpClientModule, TramaModule],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule { }
