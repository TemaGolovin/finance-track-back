import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { createConfiguredE2eApp } from './e2e-app';
import request = require('supertest');
import { EmailTokenType } from '@prisma/client';
import { RegistrationDto } from 'src/auth/dto/auth.dto';
import { getAccessTokenMaxAgeMs, getRefreshTokenMaxAgeMs } from 'src/auth/lib/auth-token-ttl';
import { refreshTokenMatchesStorageSync } from 'src/auth/lib/refresh-token-hash';
import { getAuthThrottleLimit } from 'src/config/auth-throttle.config';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

function normalizeSetCookieHeader(
  setCookieHeader: string | string[] | undefined,
): string[] | undefined {
  if (!setCookieHeader) {
    return undefined;
  }

  return Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
}

function findCookie(
  setCookieHeader: string | string[] | undefined,
  name: string,
): string | undefined {
  const cookies = normalizeSetCookieHeader(setCookieHeader);
  if (!cookies) {
    return undefined;
  }

  return cookies.find((raw) => {
    const [pair] = raw.split(';');
    return pair.slice(0, pair.indexOf('=')) === name;
  });
}

function getCookieValue(
  setCookieHeader: string | string[] | undefined,
  name: string,
): string | undefined {
  const raw = findCookie(setCookieHeader, name);
  if (!raw) {
    return undefined;
  }

  const [pair] = raw.split(';');
  const separatorIndex = pair.indexOf('=');
  if (separatorIndex === -1) {
    return undefined;
  }

  return pair.slice(separatorIndex + 1);
}

function getCookieMaxAgeSeconds(
  setCookieHeader: string | string[] | undefined,
  name: string,
): number | undefined {
  const raw = findCookie(setCookieHeader, name);
  if (!raw) {
    return undefined;
  }

  const maxAgePart = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('max-age='));
  if (!maxAgePart) {
    return undefined;
  }

  return Number(maxAgePart.slice('max-age='.length));
}

const registrationDto: Partial<RegistrationDto> = {
  deviceId: '87654321-1234-4234-a234-123456789abc',
  email: 'auth-test@example.com',
  name: 'Auth Test User',
  password: 'password123',
};

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  let prismaService: PrismaService;
  let userInfo: {
    email: string | null;
    userId: string | null;
    password: string | null;
    refreshToken: string | null;
  } = {
    email: null,
    userId: null,
    password: null,
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

    app = createConfiguredE2eApp(moduleFixture);
    app.set('trust proxy', 1);

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    const staleUser = await prismaService.user.findUnique({
      where: { email: registrationDto.email },
      select: { id: true },
    });
    if (staleUser) {
      await prismaService.refreshToken.deleteMany({ where: { userId: staleUser.id } });
      await prismaService.emailToken.deleteMany({ where: { userId: staleUser.id } });
      await prismaService.user.delete({ where: { id: staleUser.id } });
    }

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      if (userInfo.userId) {
        await prismaService.refreshToken.deleteMany({
          where: { userId: userInfo.userId },
        });
      }
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
        const refreshToken = getCookieValue(header['set-cookie'], 'refreshToken');
        const accessToken = getCookieValue(header['set-cookie'], 'accessToken');

        expect(refreshToken).toBeDefined();
        expect(accessToken).toBeDefined();
        expect(body.email).toBe(registrationDto.email);
        expect(body.id).toBeDefined();
        expect(body?.token).toBeUndefined();
        expect(body?.password).toBeUndefined();

        userInfo = {
          password: registrationDto.password,
          email: body.email,
          userId: body.id,
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
        expect(refreshTokenMatchesStorageSync(refreshToken, existRefreshInDB.token)).toBeTruthy();
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
        const refreshToken = getCookieValue(header['set-cookie'], 'refreshToken');
        const accessToken = getCookieValue(header['set-cookie'], 'accessToken');

        expect(refreshToken).toBeDefined();
        expect(accessToken).toBeDefined();
        expect(getCookieMaxAgeSeconds(header['set-cookie'], 'accessToken')).toBe(
          Math.floor(getAccessTokenMaxAgeMs() / 1000),
        );
        expect(getCookieMaxAgeSeconds(header['set-cookie'], 'refreshToken')).toBe(
          Math.floor(getRefreshTokenMaxAgeMs() / 1000),
        );
        expect(body.email).toBe(userInfo.email);
        expect(body.id).toBe(userInfo.userId);
        expect(body?.token).toBeUndefined();
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
    expect(refreshTokenMatchesStorageSync(userInfo.refreshToken, sessionBeforeReuse.token)).toBe(
      true,
    );
    expect(refreshTokenMatchesStorageSync(staleRefresh, sessionBeforeReuse.token)).toBe(false);

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

  it('/auth/change-password - revokes refresh tokens of other devices (POST)', async () => {
    const otherDeviceId = '11111111-2222-4333-8444-555555555555';

    const currentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userInfo.email,
        password: userInfo.password,
        deviceId: registrationDto.deviceId,
      })
      .set('user-agent', 'current-device')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);

    const currentAccessToken = getCookieValue(currentLogin.header['set-cookie'], 'accessToken');
    const currentRefreshToken = getCookieValue(currentLogin.header['set-cookie'], 'refreshToken');
    expect(currentAccessToken).toBeDefined();
    expect(currentRefreshToken).toBeDefined();

    const otherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userInfo.email,
        password: userInfo.password,
        deviceId: otherDeviceId,
      })
      .set('user-agent', 'other-device')
      .set('X-Forwarded-For', '203.0.113.20')
      .expect(200);

    const otherRefreshToken = getCookieValue(otherLogin.header['set-cookie'], 'refreshToken');
    expect(otherRefreshToken).toBeDefined();

    const sessionsBefore = await prismaService.refreshToken.findMany({
      where: { userId: userInfo.userId },
    });
    expect(sessionsBefore).toHaveLength(2);

    const newPassword = 'changedPassword789';
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Cookie', [`accessToken=${currentAccessToken}`])
      .send({
        currentPassword: userInfo.password,
        newPassword,
      })
      .expect(201);

    const sessionsAfter = await prismaService.refreshToken.findMany({
      where: { userId: userInfo.userId },
    });
    expect(sessionsAfter).toHaveLength(1);
    expect(sessionsAfter[0].deviceId).toBe(registrationDto.deviceId);
    expect(refreshTokenMatchesStorageSync(currentRefreshToken, sessionsAfter[0].token)).toBe(true);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', [`accessToken=${currentAccessToken}`])
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${otherRefreshToken}`])
      .expect(401);

    userInfo.password = newPassword;
    userInfo.refreshToken = currentRefreshToken;
  });

  it('/auth/login - rate limited after too many attempts (POST)', async () => {
    const limit = getAuthThrottleLimit();
    const failedAttemptsBeforeBlock = Math.max(limit - 1, 0);

    for (let attempt = 0; attempt < failedAttemptsBeforeBlock; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'rate-limit@example.com',
          password: 'wrong-password',
          deviceId: registrationDto.deviceId,
        })
        .set('user-agent', 'rate-limit-test')
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'rate-limit@example.com',
        password: 'wrong-password',
        deviceId: registrationDto.deviceId,
      })
      .set('user-agent', 'rate-limit-test')
      .expect(429);
  });
});
