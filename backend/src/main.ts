import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks(); // this is oue new shutydown 

  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  // 0.0.0.0 so a phone on the same network (or USB reverse) can reach the API.
  await app.listen(port, '0.0.0.0');
}
bootstrap();
