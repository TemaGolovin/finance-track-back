import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshToken({
    userId,
    deviceId,
    userAgent,
    hashedRefreshToken,
  }: {
    userId: string;
    deviceId: string;
    userAgent: string;
    hashedRefreshToken: string;
  }) {
    await this.prisma.refreshToken.create({
      data: {
        deviceId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    await this.prisma.refreshToken.delete({
      where: {
        id: tokenId,
      },
    });
  }
}
