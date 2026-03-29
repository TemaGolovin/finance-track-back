import { BadRequestException, Injectable } from '@nestjs/common';
import { EmailTokenType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const TTL_24H = 24 * 60 * 60 * 1000;
const TTL_1H = 60 * 60 * 1000;

@Injectable()
export class EmailTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(userId: string, type: EmailTokenType, newEmail?: string) {
    await this.prisma.emailToken.deleteMany({ where: { userId, type } });

    const ttl = type === EmailTokenType.RESET_PASSWORD ? TTL_1H : TTL_24H;

    return this.prisma.emailToken.create({
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

  async deleteToken(id: string) {
    await this.prisma.emailToken.delete({ where: { id } });
  }
}
