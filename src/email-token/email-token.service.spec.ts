import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailTokenType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailTokenService } from './email-token.service';

const TTL_1H = 60 * 60 * 1000;
const TTL_24H = 24 * 60 * 60 * 1000;
const FIXED_NOW = 1_700_000_000_000;

const prismaMock = {
  emailToken: {
    deleteMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
};

describe('EmailTokenService', () => {
  let service: EmailTokenService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTokenService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EmailTokenService>(EmailTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createToken', () => {
    beforeEach(() => {
      prismaMock.emailToken.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.emailToken.create.mockResolvedValue({ id: '1', token: 'tok' });
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    });

    it('RESET_PASSWORD — creates token with 1h TTL', async () => {
      await service.createToken('user-1', EmailTokenType.RESET_PASSWORD);

      const { data } = prismaMock.emailToken.create.mock.calls[0][0];
      expect(data.expiresAt).toEqual(new Date(FIXED_NOW + TTL_1H));
    });

    it('VERIFY_EMAIL — creates token with 24h TTL', async () => {
      await service.createToken('user-1', EmailTokenType.VERIFY_EMAIL);

      const { data } = prismaMock.emailToken.create.mock.calls[0][0];
      expect(data.expiresAt).toEqual(new Date(FIXED_NOW + TTL_24H));
    });

    it('CHANGE_EMAIL — creates token with 24h TTL and stores newEmail', async () => {
      await service.createToken('user-1', EmailTokenType.CHANGE_EMAIL, 'new@example.com');

      const { data } = prismaMock.emailToken.create.mock.calls[0][0];
      expect(data.newEmail).toBe('new@example.com');
      expect(data.expiresAt).toEqual(new Date(FIXED_NOW + TTL_24H));
    });

    it('deletes existing tokens of the same type before creating', async () => {
      await service.createToken('user-1', EmailTokenType.VERIFY_EMAIL);

      expect(prismaMock.emailToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', type: EmailTokenType.VERIFY_EMAIL },
      });
      expect(prismaMock.emailToken.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('passes userId and type to create', async () => {
      await service.createToken('user-42', EmailTokenType.RESET_PASSWORD);

      const { data } = prismaMock.emailToken.create.mock.calls[0][0];
      expect(data.userId).toBe('user-42');
      expect(data.type).toBe(EmailTokenType.RESET_PASSWORD);
    });
  });

  describe('findValidToken', () => {
    it('throws BadRequestException when token is not found', async () => {
      prismaMock.emailToken.findUnique.mockResolvedValue(null);

      await expect(
        service.findValidToken('no-such-token', EmailTokenType.VERIFY_EMAIL),
      ).rejects.toThrow(new BadRequestException('Invalid token'));
    });

    it('throws BadRequestException when token type does not match', async () => {
      prismaMock.emailToken.findUnique.mockResolvedValue({
        id: '1',
        token: 'tok',
        type: EmailTokenType.RESET_PASSWORD,
        expiresAt: new Date(Date.now() + 10_000),
        userId: 'user-1',
      });

      await expect(
        service.findValidToken('tok', EmailTokenType.VERIFY_EMAIL),
      ).rejects.toThrow(new BadRequestException('Invalid token'));
    });

    it('deletes token and throws BadRequestException when token is expired', async () => {
      const expired = {
        id: '1',
        token: 'expired',
        type: EmailTokenType.VERIFY_EMAIL,
        expiresAt: new Date(Date.now() - 1_000),
        userId: 'user-1',
      };
      prismaMock.emailToken.findUnique.mockResolvedValue(expired);
      prismaMock.emailToken.delete.mockResolvedValue(expired);

      await expect(
        service.findValidToken('expired', EmailTokenType.VERIFY_EMAIL),
      ).rejects.toThrow(new BadRequestException('Token expired'));

      expect(prismaMock.emailToken.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('returns record for a valid token', async () => {
      const valid = {
        id: '1',
        token: 'valid',
        type: EmailTokenType.VERIFY_EMAIL,
        expiresAt: new Date(Date.now() + 10_000),
        userId: 'user-1',
      };
      prismaMock.emailToken.findUnique.mockResolvedValue(valid);

      const result = await service.findValidToken('valid', EmailTokenType.VERIFY_EMAIL);

      expect(result).toEqual(valid);
      expect(prismaMock.emailToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteToken', () => {
    it('deletes token by id', async () => {
      prismaMock.emailToken.delete.mockResolvedValue({ id: '1' });

      await service.deleteToken('1');

      expect(prismaMock.emailToken.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
