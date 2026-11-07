import { NestExpressApplication } from '@nestjs/platform-express';
import { TestingModule } from '@nestjs/testing';
import { configureApp } from 'src/config/configure-app';

export function createConfiguredE2eApp(moduleFixture: TestingModule): NestExpressApplication {
  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  configureApp(app);
  return app;
}
