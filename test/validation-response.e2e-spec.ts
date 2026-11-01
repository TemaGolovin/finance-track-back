import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { MailService } from 'src/mail/mail.service';
import { createConfiguredE2eApp } from './e2e-app';

describe('Validation error response (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
        sendEmailChangeConfirmation: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = createConfiguredE2eApp(moduleFixture);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/registration — 400 without password or email in body', async () => {
    const secretPassword = 'abc12';
    const email = 'validation-leak@example.com';

    const { body } = await request(app.getHttpServer())
      .post('/auth/registration')
      .send({
        deviceId: '87654321-1234-4234-a234-123456789abc',
        email,
        name: 'Validation Test',
        password: secretPassword,
      })
      .expect(400);

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(secretPassword);
    expect(serialized).not.toContain(email);
    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'password',
          constraints: expect.any(Object),
        }),
      ]),
    );
    expect(body.message[0]).not.toHaveProperty('value');
    expect(body.message[0]).not.toHaveProperty('target');
  });
});
