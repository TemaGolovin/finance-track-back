import { BadRequestException, Injectable } from '@nestjs/common';
import { EmailTokenType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const TTL_24H = 24 * 60 * 60 * 1000;
const TTL_1H = 60 * 60 * 1000;

@Injectable()
export class EmailTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(
    userId: string,
    type: EmailTokenType,
    newEmail?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;
    await db.emailToken.deleteMany({ where: { userId, type } });

    const ttl = type === EmailTokenType.RESET_PASSWORD ? TTL_1H : TTL_24H;

    return db.emailToken.create({
      data: {
        userId,
        type,
        newEmail,
        expiresAt: new Date(Date.now() + ttl),
      },
    });
  }

  async findValidToken(token: string, type: EmailTokenType) {
    const record = await this.prisma.emailToken.findUnique({ where: { token } });

    if (!record || record.type !== type) {
      throw new BadRequestException('Invalid token');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.emailToken.delete({ where: { id: record.id } });
      throw new BadRequestException('Token expired');
    }

    return record;
  }

  async deleteToken(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    await db.emailToken.delete({ where: { id } });
  }

  async deleteUnexpiredToken(id: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const deleted = await db.emailToken.deleteMany({
      where: { id, expiresAt: { gt: new Date() } },
    });

    if (deleted.count === 0) {
      throw new BadRequestException('Invalid token');
    }
  }
}
