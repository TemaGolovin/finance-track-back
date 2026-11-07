import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { getRefreshTokenMaxAgeMs } from './lib/auth-token-ttl';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshToken({
    userId,
    deviceId,
    userAgent,
    hashedRefreshToken,
    tx,
  }: {
    userId: string;
    deviceId: string;
    userAgent: string;
    hashedRefreshToken: string;
    tx?: Prisma.TransactionClient;
  }) {
    const db = tx ?? this.prisma;
    await db.refreshToken.create({
      data: {
        deviceId,
        expiresAt: new Date(Date.now() + getRefreshTokenMaxAgeMs()),
        token: hashedRefreshToken,
        userAgent,
        userId,
      },
    });
  }

  async findRefreshToken({
    userId,
    deviceId,
  }: {
    userId: string;
    deviceId: string;
  }) {
    return await this.prisma.refreshToken.findUnique({
      where: {
        userId_deviceId: {
          userId: userId,
          deviceId: deviceId,
        },
      },
    });
  }

  async deleteRefreshTokenByUserIdDeviceId(userId: string, deviceId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
        deviceId: deviceId,
      },
    });
  }

  async deleteRefreshTokenById(tokenId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        id: tokenId,
      },
    });
  }

  findRefreshTokensByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createAt: 'desc' },
      select: {
        deviceId: true,
        userAgent: true,
        createAt: true,
        expiresAt: true,
      },
    });
  }
}
