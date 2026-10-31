import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegistrationDto } from 'src/auth/dto/auth.dto';
import { refreshTokenMatchesStorageSync } from 'src/auth/lib/refresh-token-hash';
import { EmailTokenType } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

const registrationDto: Partial<RegistrationDto> = {
  deviceId: '12341234-1234-1234-1234-87654321',
  email: 'auth-test@example.com',
  name: 'Auth Test User',
  password: 'password123',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userInfo: {
    email: string | null;
    userId: string | null;
    password: string | null;
    token: string | null;
    refreshToken: string | null;
  } = {
    email: null,
    userId: null,
    password: null,
    token: null,
    refreshToken: null,
  };

  let verifyEmailToken: string | null = null;
  let resetPasswordToken: string | null = null;
  let refreshTokenBeforeRotation: string | null = null;

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

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.refreshToken.deleteMany({
        where: { userId: userInfo.userId },
      });
      userInfo?.userId && (await prismaService.user.delete({ where: { id: userInfo.userId } }));

      await prismaService.$disconnect();
    }

    await app.close();
  });

  it('/auth/registration - registration user (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/registration')
      .send(registrationDto)
      .set('user-agent', 'test-agent')
      .expect(200)
      .then(async ({ body, header }) => {
        const setCookieHeader = header['set-cookie'];
        const refreshToken = setCookieHeader[0].split(';')[0].split('=')[1];

        expect(refreshToken).toBeDefined();
        expect(body.email).toBe(registrationDto.email);
        expect(body.id).toBeDefined();
        expect(body?.token).toBeDefined();
        expect(body?.password).toBeUndefined();

        userInfo = {
          password: registrationDto.password,
          email: body.email,
          userId: body.id,
          token: body?.token,
          refreshToken,
        };

        const existRefreshInDB = await prismaService.refreshToken.findUnique({
          where: {
            userId_deviceId: {
              userId: userInfo.userId,
              deviceId: registrationDto.deviceId,
            },
          },
        });

        expect(existRefreshInDB).toBeDefined();
        expect(
          refreshTokenMatchesStorageSync(refreshToken, existRefreshInDB.token),
        ).toBeTruthy();
      });
  });

  it('/auth/login - login user (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userInfo.email,
        password: userInfo.password,
        deviceId: registrationDto.deviceId,
      })
      .set('user-agent', 'test-agent')
      .expect(200)
      .then(({ body, header }) => {
        const setCookieHeader = header['set-cookie'];
        const refreshToken = setCookieHeader[0].split(';')[0].split('=')[1];

        expect(refreshToken).toBeDefined();
        expect(body.email).toBe(userInfo.email);
        expect(body.id).toBe(userInfo.userId);
        expect(body?.password).toBeUndefined();
        userInfo.refreshToken = refreshToken;
      });
  });

  it('/auth/refresh - refresh token (POST)', async () => {
    const previousRefreshToken = userInfo.refreshToken;
    refreshTokenBeforeRotation = previousRefreshToken;

    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${previousRefreshToken}`])
      .expect(200)
      .then(async ({ header }) => {
        const setCookieHeader = header['set-cookie'];
        const newRefreshToken = setCookieHeader[0].split(';')[0].split('=')[1];
        expect(newRefreshToken).toBeDefined();
        expect(newRefreshToken).not.toBe(previousRefreshToken);

        const existRefreshInDB = await prismaService.refreshToken.findUnique({
          where: {
            userId_deviceId: {
              userId: userInfo.userId,
              deviceId: registrationDto.deviceId,
            },
          },
        });

        expect(existRefreshInDB).toBeDefined();
        expect(
          refreshTokenMatchesStorageSync(newRefreshToken, existRefreshInDB.token),
        ).toBeTruthy();
        userInfo.refreshToken = newRefreshToken;
      });
  });

  it('/auth/refresh - rejects reused refresh token (POST)', async () => {
    const staleRefresh = refreshTokenBeforeRotation;
    expect(staleRefresh).toBeTruthy();

    const sessionBeforeReuse = await prismaService.refreshToken.findUnique({
      where: {
        userId_deviceId: {
          userId: userInfo.userId,
          deviceId: registrationDto.deviceId,
        },
      },
    });
    expect(sessionBeforeReuse).toBeDefined();
    expect(staleRefresh).not.toBe(userInfo.refreshToken);
    expect(
      refreshTokenMatchesStorageSync(userInfo.refreshToken, sessionBeforeReuse.token),
    ).toBe(true);
    expect(
      refreshTokenMatchesStorageSync(staleRefresh, sessionBeforeReuse.token),
    ).toBe(false);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${staleRefresh}`])
      .expect(401);

    const session = await prismaService.refreshToken.findUnique({
      where: {
        userId_deviceId: {
          userId: userInfo.userId,
          deviceId: registrationDto.deviceId,
        },
      },
    });

    expect(session).toBeNull();
  });

  it('/auth/resend-verification - resends verification email (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: userInfo.email })
      .expect(201)
      .then(async ({ body }) => {
        expect(body.success).toBe(true);

        const tokenRecord = await prismaService.emailToken.findFirst({
          where: { userId: userInfo.userId, type: EmailTokenType.VERIFY_EMAIL },
        });

        expect(tokenRecord).toBeDefined();
        verifyEmailToken = tokenRecord.token;
      });
  });

  it('/auth/resend-verification - unknown email returns success (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/resend-verification')
      .send({ email: 'nobody@example.com' })
      .expect(201)
      .then(({ body }) => {
        expect(body.success).toBe(true);
      });
  });

  it('/auth/verify-email - verifies email with valid token (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: verifyEmailToken })
      .expect(201)
      .then(async ({ body }) => {
        expect(body.success).toBe(true);

        const user = await prismaService.user.findUnique({
          where: { id: userInfo.userId },
        });
        expect(user.emailVerified).toBe(true);
      });
  });

  it('/auth/verify-email - invalid token returns 400 (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token: 'invalid-token-xyz' })
      .expect(400);
  });

  it('/auth/forgot-password - sends password reset email (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: userInfo.email })
      .expect(201)
      .then(async ({ body }) => {
        expect(body.success).toBe(true);

        const tokenRecord = await prismaService.emailToken.findFirst({
          where: { userId: userInfo.userId, type: EmailTokenType.RESET_PASSWORD },
        });

        expect(tokenRecord).toBeDefined();
        resetPasswordToken = tokenRecord.token;
      });
  });

  it('/auth/forgot-password - unknown email returns success (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(201)
      .then(({ body }) => {
        expect(body.success).toBe(true);
      });
  });

  it('/auth/reset-password - resets password with valid token (POST)', async () => {
    const newPassword = 'newPassword456';

    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: resetPasswordToken, newPassword })
      .expect(201)
      .then(async ({ body }) => {
        expect(body.success).toBe(true);

        const refreshTokens = await prismaService.refreshToken.findMany({
          where: { userId: userInfo.userId },
        });
        expect(refreshTokens).toHaveLength(0);

        userInfo.password = newPassword;
      });
  });

  it('/auth/reset-password - invalid token returns 400 (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: 'invalid-token-xyz', newPassword: 'somePassword123' })
      .expect(400);
  });
});
