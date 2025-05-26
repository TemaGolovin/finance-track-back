import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { InvitationStatus } from '@prisma/client';

interface InvitationReceived {
  id: string;
  senderName: string;
  groupName: string;
  groupId: string;
  senderId: string;
  recipientId: string;
  status: InvitationStatus;
  sender: {
    name: string;
  };
}

interface InvitationSent {
  id: string;
  recipientName: string;
  groupName: string;
  groupId: string;
  senderId: string;
  recipientId: string;
  status: InvitationStatus;
  recipient: {
    name: string;
  };
}

interface Invitations {
  received: InvitationReceived[];
  sent: InvitationSent[];
}

const mockUser = {
  id: '12341234-1234-1234-1234-abcdefghijkl',
  email: 'user-controller-test@example.com',
  name: 'User Controller Test User',
};

const userForFind = {
  id: '12341234-1234-1234-1234-999999999999',
  email: 'user-for-find-test@example.com',
  password: 'password',
  name: 'new user for find',
};

const groupId = '12341234-1234-4321-4321-123412341234';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let invitationId: string;

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

    await prismaService.user.create({
      data: userForFind,
    });

    await prismaService.userRelationGroup.create({
      data: {
        creatorId: mockUser.id,
        name: 'group1',
        id: groupId,
      },
    });

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.invitation.deleteMany({ where: { groupId } });
      await prismaService.userRelationGroup.delete({ where: { id: groupId } });
      await prismaService.category.deleteMany({ where: { userId: mockUser.id } });
      await prismaService.operation.deleteMany({ where: { userId: mockUser.id } });
      await prismaService.user.delete({ where: { id: mockUser.id } });
      await prismaService.user.delete({ where: { id: userForFind.id } });
      await prismaService.$disconnect();
    }

    await app.close();
  });

  it('/user/find/by-name (GET), - find user by name - find success', async () => {
    return request(app.getHttpServer())
      .get('/user/find/by-name')
      .query({ name: userForFind.name.slice(0, 3) })
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body).toHaveLength(1);
        expect(body[0].name).toBe(userForFind.name);
        expect(body[0].id).toBe(userForFind.id);
        expect(body[0].email).toBeUndefined();
        expect(body[0].password).toBeUndefined();
      });
  });

  it('/user/find/by-name (GET), - find user by name - find empty', async () => {
    return request(app.getHttpServer())
      .get('/user/find/by-name')
      .query({ name: 'not existing name' })
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body).toHaveLength(0);
      });
  });

  it('/user/find/by-name (GET), - find user by name - find self empty', async () => {
    return request(app.getHttpServer())
      .get('/user/find/by-name')
      .query({ name: mockUser.name })
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body).toHaveLength(0);
      });
  });

  it('/user/invitation/by-name (POST), - invite user by name - success', async () => {
    return request(app.getHttpServer())
      .post('/user/invitation/by-name')
      .send({ name: userForFind.name, groupId })
      .expect(201)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.id).toBeDefined();
        invitationId = body.id;
        expect(body.status).toBe(InvitationStatus.PENDING);
      });
  });

  it('/user/invitation (GET) - get all invitations', async () => {
    return request(app.getHttpServer())
      .get('/user/invitation')
      .expect(200)
      .then(({ body }: { body: Invitations }) => {
        expect(body).toBeDefined();
        expect(body.sent).toHaveLength(1);
        expect(body.received).toHaveLength(0);
        expect(body.sent[0].id).toBeDefined();
        expect(body.sent[0].status).toBe(InvitationStatus.PENDING);
      });
  });

  it('/user/invitation/:id (PATCH) - change invitation status', async () => {
    return request(app.getHttpServer())
      .patch(`/user/invitation/${invitationId}`)
      .send({ status: InvitationStatus.CANCELLED })
      .expect(200)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body.id).toBeDefined();
        expect(body.status).toBe(InvitationStatus.CANCELLED);
      });
  });
});
