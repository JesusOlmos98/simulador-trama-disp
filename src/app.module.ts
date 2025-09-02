import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TramaModule } from './trama/trama.module';
import { TcpClientModule } from './tcp-client/tcp-client.module';
import { TestModule } from './test/test.module';
import { EnvConfiguration } from 'config/app.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TramaModule, TcpClientModule, TestModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EnvConfiguration],              
      envFilePath: ['.env.local', '.env'],   // primero .env.local si existe
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
