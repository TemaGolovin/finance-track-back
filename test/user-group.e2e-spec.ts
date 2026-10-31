import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CreateUserGroupDto } from 'src/user-group/dto/create-user-group.dto';
import { UserGroupRepository } from 'src/user-group/user-group.repository';
import request = require('supertest');

const mockUser = {
  id: '87654321-1234-1234-1234-abcdefghijkl',
  email: 'user-group-test@example.com',
  name: 'UserGroup Test User',
};

const createUserGroupDto: CreateUserGroupDto = {
  name: 'Test Group',
};

describe('UserGroupController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userGroupRepository: UserGroupRepository;
  let userGroupId: string;
  let groupCategoryId: string;
  let personalCategoryId: string;

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
    userGroupRepository = moduleFixture.get<UserGroupRepository>(UserGroupRepository);

    await prismaService.user.create({
      data: {
        id: mockUser.id,
        email: mockUser.email,
        password: 'password',
        name: mockUser.name,
      },
    });

    await prismaService.category.create({
      data: {
        name: `Test Category for user: ${mockUser.name}`,
        userId: mockUser.id,
        operations: {
          create: {
            comment: 'Test Operation',
            value: 100,
            operationDate: new Date(),
            userId: mockUser.id,
          },
        },
      },
    });

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.personalCategoryMap.deleteMany({ where: { userId: mockUser.id } });
      await prismaService.operation.deleteMany({ where: { userId: mockUser.id } });
      await prismaService.category.deleteMany({ where: { userId: mockUser.id } });
      await prismaService.user.delete({ where: { id: mockUser.id } });
      await prismaService.$disconnect();
    }

    await app.close();
  });

  it('/user-group (POST) - create user group', async () => {
    return request(app.getHttpServer())
      .post('/user-group')
      .send(createUserGroupDto)
      .expect(201)
      .then(async ({ body }) => {
        expect(body).toBeDefined();
        expect(body.id).toBeDefined();
        expect(body.name).toBe(createUserGroupDto.name);
        expect(body.creatorId).toBe(mockUser.id);

        const groupCategory = await prismaService.groupCategory.create({
          data: {
            name: 'Test Group Category',
            groupId: body.id,
          },
        });

        const category = await prismaService.category.create({
          data: {
            name: `Test Category for user: ${mockUser.name}, after group creation`,
            userId: mockUser.id,
            operations: {
              create: {
                comment: 'Test Operation after group creation',
                value: 399,
                operationDate: new Date(),
                userId: mockUser.id,
              },
            },
          },
        });

        personalCategoryId = category.id;

        groupCategoryId = groupCategory.id;
        userGroupId = body.id;
      });
  });

  it('/user-group (GET) - get user groups', async () => {
    return request(app.getHttpServer())
      .get('/user-group')
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('/user-group/:id (GET) - get user group by id - success', async () => {
    return request(app.getHttpServer())
      .get(`/user-group/${userGroupId}`)
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.id).toBe(userGroupId);
        expect(body.name).toBe(createUserGroupDto.name);
        expect(body.creatorId).toBe(mockUser.id);
      });
  });

  it('/user-group/:id (GET) - get user group by id - not found', async () => {
    return request(app.getHttpServer()).get('/user-group/random-id').expect(404);
  });

  it('/user-group/:id/stat (GET) - get user group stat', async () => {
    return request(app.getHttpServer())
      .get(`/user-group/${userGroupId}/stat`)
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.totalSum).toBeDefined();
        expect(body.byCategories).toBeDefined();
        expect(body.totalSum).toBe('100');

        expect(body.byCategories.length).toBe(1);
      });
  });

  it('/user-group/:groupId/operations - filter by group category without maps returns empty', async () => {
    const unmappedGroupCategory = await prismaService.groupCategory.create({
      data: {
        name: 'Unmapped group category',
        groupId: userGroupId,
      },
    });

    return request(app.getHttpServer())
      .get(`/user-group/${userGroupId}/operations?categoryId=${unmappedGroupCategory.id}`)
      .expect(200)
      .then(({ body }) => {
        expect(body.totalSum).toBe('0');
        expect(body.operationsByDate).toEqual([]);
      });
  });

  it('/user-group/:groupId/category/connect - type mismatch returns 400', async () => {
    const incomePersonal = await prismaService.category.create({
      data: {
        name: 'Income personal for connect mismatch',
        userId: mockUser.id,
        categoryType: 'INCOME',
      },
    });

    return request(app.getHttpServer())
      .patch(`/user-group/${userGroupId}/category/connect`)
      .send({
        relatedCategories: [
          {
            personalCategoryId: incomePersonal.id,
            groupCategoryId,
          },
        ],
      })
      .expect(400)
      .then(async () => {
        await prismaService.category.delete({ where: { id: incomePersonal.id } });
      });
  });

  it('/user-group/:groupId/category/connect - connect group categories to personal categories - success', async () => {
    return request(app.getHttpServer())
      .patch(`/user-group/${userGroupId}/category/connect`)
      .send({
        relatedCategories: [
          {
            personalCategoryId,
            groupCategoryId,
          },
        ],
      })
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.length).toBe(1);
        expect(body[0].id).toBe(groupCategoryId);
        expect(body[0].personalCategories.length).toBe(1);
        expect(body[0].personalCategories[0].categoryId).toBe(personalCategoryId);
      });
  });

  it('/user-group/:id/stat (GET) - excludes operations with wrong type in category', async () => {
    const statBeforeWrongOp = await request(app.getHttpServer())
      .get(`/user-group/${userGroupId}/stat?operationType=EXPENSE`)
      .expect(200);

    await prismaService.operation.create({
      data: {
        comment: 'Wrong type in expense category',
        value: 9999,
        type: 'INCOME',
        operationDate: new Date(),
        userId: mockUser.id,
        categoryId: personalCategoryId,
      },
    });

    return request(app.getHttpServer())
      .get(`/user-group/${userGroupId}/stat?operationType=EXPENSE`)
      .expect(200)
      .then(({ body }) => {
        expect(body.totalSum).toBe(statBeforeWrongOp.body.totalSum);
      });
  });

  it('removeUserFromGroup deletes personal category maps for the group', async () => {
    const mapsBefore = await prismaService.personalCategoryMap.count({
      where: { userId: mockUser.id, groupId: userGroupId },
    });
    expect(mapsBefore).toBeGreaterThan(0);

    const statBefore = await request(app.getHttpServer())
      .get(`/user-group/${userGroupId}/stat`)
      .expect(200);

    expect(Number(statBefore.body.totalSum)).toBeGreaterThan(0);

    await userGroupRepository.removeUserFromGroup(mockUser.id, userGroupId);

    const mapsAfter = await prismaService.personalCategoryMap.findMany({
      where: { userId: mockUser.id, groupId: userGroupId },
    });
    expect(mapsAfter).toHaveLength(0);

    await userGroupRepository.addUserToGroup(mockUser.id, userGroupId);

    const statAfter = await request(app.getHttpServer())
      .get(`/user-group/${userGroupId}/stat`)
      .expect(200);

    expect(statAfter.body.totalSum).toBe('0');
    expect(statAfter.body.byCategories).toEqual([]);
  });

  it('/user-group/:id (PATCH) - update user group - success', async () => {
    return request(app.getHttpServer())
      .patch(`/user-group/${userGroupId}`)
      .send({ name: 'Updated Group' })
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.id).toBe(userGroupId);
        expect(body.name).toBe('Updated Group');
        expect(body.creatorId).toBe(mockUser.id);
      });
  });

  it('/user-group/:id (PATCH) - update user group - not found', async () => {
    return request(app.getHttpServer())
      .patch('/user-group/random-id')
      .send({ name: 'Updated Group' })
      .expect(404);
  });

  it('/user-group/:id (DELETE) - delete user group - success', async () => {
    return request(app.getHttpServer())
      .delete(`/user-group/${userGroupId}`)
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.group.id).toBe(userGroupId);
        expect(body.message).toBeDefined();
      });
  });
});
