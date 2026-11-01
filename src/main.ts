import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp, configureAppCors } from './config/configure-app';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);

  configureAppCors(app);
  configureApp(app);
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
