import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegistrationDto } from 'src/auth/dto/auth.dto';
import { compareSync } from 'bcryptjs';

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      userInfo.token &&
        (await prismaService.refreshToken.delete({
          where: {
            userId_deviceId: { userId: userInfo.userId, deviceId: registrationDto.deviceId },
          },
        }));
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
        expect(compareSync(refreshToken, existRefreshInDB.token)).toBeTruthy();
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
      });
  });

  it('/auth/refresh - refresh token (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${userInfo.refreshToken}`])
      .expect(200)
      .then(async ({ header }) => {
        const setCookieHeader = header['set-cookie'];
        const token = setCookieHeader[0].split(';')[0].split('=')[1];
        expect(token).toBeDefined();

        const existRefreshInDB = await prismaService.refreshToken.findUnique({
          where: {
            userId_deviceId: {
              userId: userInfo.userId,
              deviceId: registrationDto.deviceId,
            },
          },
        });

        expect(existRefreshInDB).toBeDefined();
        expect(compareSync(token, existRefreshInDB.token)).toBeTruthy();
        userInfo.token = token;
      });
  });

  // it('/auth/logout - logout (POST)', async () => {
  //   return request(app.getHttpServer())
  //     .post('/auth/logout')
  //     .expect(200)
  //     .then(async () => {
  //       const existRefreshInDB = await prismaService.refreshToken.findUnique({
  //         where: {
  //           userId_deviceId: {
  //             userId: userInfo.userId,
  //             deviceId: registrationDto.deviceId,
  //           },
  //         },
  //       });
  //       expect(existRefreshInDB).toBeNull();
  //     });
  // });
});
