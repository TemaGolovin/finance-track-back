import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EmailTokenType, InvitationStatus } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

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
    })
      .overrideProvider(MailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
        sendEmailChangeConfirmation: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

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

    await prismaService.userRelationGroupUser.create({
      data: {
        userId: mockUser.id,
        userRelationGroupId: groupId,
      },
    });

    await app.init();
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.emailToken.deleteMany({ where: { userId: mockUser.id } });
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
      .query({ name: 'for find' })
      .expect(200)
      .then(({ body }: { body: { id: string; name: string; email?: string }[] }) => {
        expect(body).toBeDefined();
        const match = body.filter((u) => u.id === userForFind.id);
        expect(match).toHaveLength(1);
        expect(match[0].name).toBe(userForFind.name);
        expect(match[0].email).toBeUndefined();
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

  it('/user/invitation (POST), - invite user by name - success', async () => {
    return request(app.getHttpServer())
      .post('/user/invitation')
      .send({ userIds: [userForFind.id], groupId })
      .expect(201)
      .then(({ body }) => {
        expect(body).toBeDefined();
        expect(body[0].id).toBeDefined();
        invitationId = body[0].id;
        expect(body[0].status).toBe(InvitationStatus.PENDING);
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

  it('/user/request-email-change (POST) - creates email change token', async () => {
    return request(app.getHttpServer())
      .post('/user/request-email-change')
      .send({ newEmail: 'new-email-test@example.com' })
      .expect(201)
      .then(async ({ body }) => {
        expect(body.success).toBe(true);

        const tokenRecord = await prismaService.emailToken.findFirst({
          where: { userId: mockUser.id, type: EmailTokenType.CHANGE_EMAIL },
        });

        expect(tokenRecord).toBeDefined();
        expect(tokenRecord.newEmail).toBe('new-email-test@example.com');
      });
  });

  it('/user/request-email-change (POST) - email already taken returns 409', async () => {
    return request(app.getHttpServer())
      .post('/user/request-email-change')
      .send({ newEmail: userForFind.email })
      .expect(409);
  });

  it('/user/confirm-email-change (POST) - changes email with valid token', async () => {
    const tokenRecord = await prismaService.emailToken.findFirst({
      where: { userId: mockUser.id, type: EmailTokenType.CHANGE_EMAIL },
    });

    return request(app.getHttpServer())
      .post('/user/confirm-email-change')
      .send({ token: tokenRecord.token })
      .expect(201)
      .then(async ({ body }) => {
        expect(body.success).toBe(true);

        const user = await prismaService.user.findUnique({ where: { id: mockUser.id } });
        expect(user.email).toBe('new-email-test@example.com');
        expect(user.emailVerified).toBe(true);
      });
  });

  it('/user/confirm-email-change (POST) - invalid token returns 400', async () => {
    return request(app.getHttpServer())
      .post('/user/confirm-email-change')
      .send({ token: 'invalid-token-xyz' })
      .expect(400);
  });
});
