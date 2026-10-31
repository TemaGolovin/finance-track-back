import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';

const SWAGGER_PATH = 'api';

function isSwaggerEnabled(): boolean {
  if (process.env.SWAGGER_ENABLED === 'false') {
    return false;
  }

  if (process.env.NODE_ENV === 'production') {
    return process.env.SWAGGER_ENABLED === 'true';
  }

  return true;
}

function swaggerBasicAuthMiddleware(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
      res.status(401).send('Authentication required');
      return;
    }

    const encoded = header.slice('Basic '.length);
    let decoded: string;
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      res.status(401).send('Invalid authorization header');
      return;
    }

    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      res.status(401).send('Invalid authorization header');
      return;
    }

    const providedUser = decoded.slice(0, separatorIndex);
    const providedPassword = decoded.slice(separatorIndex + 1);

    if (providedUser !== user || providedPassword !== password) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
      res.status(401).send('Invalid credentials');
      return;
    }

    next();
  };
}

export function setupSwagger(app: INestApplication): void {
  if (!isSwaggerEnabled()) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('finance tracker API docs')
    .setDescription(
      'A joint finance tracker that allows you to combine the expenses and income of the entire family',
    )
    .setVersion('1.0')
    .addTag('finance-tracker')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (swaggerUser && swaggerPassword) {
    app.use(`/${SWAGGER_PATH}`, swaggerBasicAuthMiddleware(swaggerUser, swaggerPassword));
    app.use(`/${SWAGGER_PATH}-json`, swaggerBasicAuthMiddleware(swaggerUser, swaggerPassword));
  }

  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
