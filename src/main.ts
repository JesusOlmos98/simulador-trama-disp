import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  //The api endporints are available at http://base_url:8010/api
  app.setGlobalPrefix('api');

  //This pipe will validate the data sent to the controllers
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  
  await app.listen(process.env.PORT ?? 8001);
}
bootstrap();
