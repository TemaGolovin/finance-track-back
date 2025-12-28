import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CreateOperationDto } from 'src/operation/dto';
import { CreateOperationEntity, OperationEntity } from 'src/operation/entity/operation.entity';

const testCreateDto: Omit<CreateOperationDto, 'categoryId'> = {
  comment: 'operation name comment',
  operationDate: '2025-01-01T00:00:00.000Z',
  value: 100,
  type: 'INCOME',
};

const testUpdateDto: Omit<CreateOperationDto, 'categoryId'> = {
  comment: 'updated operation comment test',
  operationDate: '2025-01-01T00:00:00.000Z',
  value: 5000,
  type: 'INCOME',
};

const mockUser = {
  id: '12341234-1234-1234-1234-123412345678',
  email: 'operation-test@example.com',
  name: 'Operation Test User',
};

describe('OperationController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let createdCategoryId: string;
  let createdOperationId: string;

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

    const newCategory = await prismaService.category.create({
      data: {
        name: 'test category',
        userId: mockUser.id,
        categoryType: 'INCOME',
      },
    });

    createdCategoryId = newCategory.id;

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.user.delete({ where: { id: mockUser.id } });
      await prismaService.category.delete({ where: { id: createdCategoryId } });
      await prismaService.$disconnect();
    }

    await app.close();
  });

  it('/operation - create operation (POST)', async () => {
    return request(app.getHttpServer())
      .post('/operation')
      .send({ ...testCreateDto, categoryId: createdCategoryId })
      .expect(201)
      .then(({ body }: { body: CreateOperationEntity }) => {
        createdOperationId = body.id;
        expect(body.comment).toBe(testCreateDto.comment);
        expect(body.operationDate).toBe(testCreateDto.operationDate);
        expect(body.value).toBe(`${testCreateDto.value}`);
        expect(body.categoryId).toBe(createdCategoryId);
      });
  });

  it('/operation - get all operations (GET)', async () => {
    return request(app.getHttpServer())
      .get('/operation')
      .expect(200)
      .then(({ body }: { body: OperationEntity[] }) => {
        expect(body.length).toBe(1);
        expect(body[0].id).toBe(createdOperationId);
        expect(body[0].comment).toBe(testCreateDto.comment);
        expect(body[0].operationDate).toBe(testCreateDto.operationDate);
        expect(body[0].value).toBe(`${testCreateDto.value}`);
      });
  });

  it('/operation/:id - update operation by id (PUT)', async () => {
    return request(app.getHttpServer())
      .put(`/operation/${createdOperationId}`)
      .send(testUpdateDto)
      .expect(200)
      .then(({ body }: { body: CreateOperationDto }) => {
        expect(body.comment).toBe(testUpdateDto.comment);
        expect(body.operationDate).toBe(testUpdateDto.operationDate);
        expect(body.value).toBe(`${testUpdateDto.value}`);
        expect(body.categoryId).toBe(createdCategoryId);
      });
  });

  it('/operation/:id - delete operation by id (DELETE)', async () => {
    return request(app.getHttpServer()).delete(`/operation/${createdOperationId}`).expect(200);
  });
});
