import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { i18nValidationErrorFactory } from 'nestjs-i18n';

export function configureApp(app: NestExpressApplication): void {
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: i18nValidationErrorFactory,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

export function configureAppCors(app: NestExpressApplication): void {
  app.enableCors({
    origin: [process.env.CLIENT_URL],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });
}
