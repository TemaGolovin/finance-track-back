import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateCategoryDto } from 'src/category/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

const testCreateDto: CreateCategoryDto = {
  name: 'test category',
  categoryType: 'INCOME',
  color: '#000000',
  icon: 'CategoryIcon',
};

const testUpdateDto: CreateCategoryDto = {
  name: 'Updated Test Category',
  categoryType: 'INCOME',
  color: '#000000',
  icon: 'CategoryIcon',
};

const mockUser = {
  id: '12341234-1234-1234-1234-123412341234',
  email: 'category-test@example.com',
  name: 'Category Test User',
};

describe('CategoryController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let createdCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
              req.user = mockUser;
              return true;
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await prismaService.user.create({
      data: {
        id: mockUser.id,
        email: mockUser.email,
        password: 'password',
        name: mockUser.name,
      },
    });

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.user.delete({ where: { id: mockUser.id } });
      await prismaService.$disconnect();
    }

    await app.close();
  });

  it('/category - create category (POST)', async () => {
    return request(app.getHttpServer())
      .post('/category')
      .send(testCreateDto)
      .expect(201)
      .then((res) => {
        createdCategoryId = res.body.id;
        expect(createdCategoryId).toBeDefined();
        expect(res.body.name).toBe(testCreateDto.name.toLowerCase());
      });
  });

  it('/category (GET)', async () => {
    return request(app.getHttpServer())
      .get('/category')
      .expect(200)
      .then((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body[0].id).toBe(createdCategoryId);
        expect(res.body[0].name).toBe(testCreateDto.name);
        expect(res.body[0].userId).toBe(mockUser.id);
        expect(res.body.length).toBe(1);
      });
  });

  it('/category/:id - update category (PUT)', async () => {
    return request(app.getHttpServer())
      .put(`/category/${createdCategoryId}`)
      .send(testUpdateDto)
      .expect(200)
      .then((res) => {
        expect(res.body.name).toBe(testUpdateDto.name.toLowerCase());
        expect(res.body.id).toBe(createdCategoryId);
      });
  });

  it('/category/stat (GET)', async () => {
    return request(app.getHttpServer())
      .get('/category/stat')
      .expect(200)
      .then((res) => {
        expect(res.body).toBeDefined();
        expect(res.body.totalSum).toEqual('0');
      });
  });

  it('/category (DELETE)', async () => {
    return request(app.getHttpServer()).delete(`/category/${createdCategoryId}`).expect(200);
  });
});
