import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegistrationDto } from 'src/auth/dto/auth.dto';

// const mockUser = {
//   id: '12341234-1234-1234-1234-123412345678',
//   email: 'test@example.com',
//   name: 'Test User',
// };

const registrationDto: Partial<RegistrationDto> = {
  deviceId: '12341234-1234-1234-1234-87654321',
  email: 'auth-test@example.com',
  name: 'Auth Test User',
  password: 'password123',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      // providers: [
      //   {
      //     provide: APP_GUARD,
      //     useValue: {
      //       canActivate: (context: ExecutionContext) => {
      //         const req = context.switchToHttp().getRequest();
      //         req.user = mockUser;
      //         return true;
      //       },
      //     },
      //   },
      // ],
    }).compile();

    app = moduleFixture.createNestApplication();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      userId && (await prismaService.user.delete({ where: { id: userId } }));
      await prismaService.$disconnect();
    }

    await app.close();
  });

  it('/registration - registration user (POST)', async () => {
    return request(app.getHttpServer())
      .post('/auth/registration')
      .send(registrationDto)
      .set('user-agent', 'test-agent')
      .expect(200)
      .then(({ body, header }) => {
        console.log(header['set-cookie']);

        userId = body.id;
      });
  });
});
