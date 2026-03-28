import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcryptjs';
import { I18nService } from 'nestjs-i18n';
import { tSafe } from 'src/i18n/t-safe';
import { CategoryService } from 'src/category/category.service';
import { ResponseWrapper } from 'src/constants/response-wrapper';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthRepository } from './auth.repository';
import { ChangePasswordDto, LoginDto, RegistrationDto } from './dto/auth.dto';
import { RegistrationEntity } from './entity/registration.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly categoryService: CategoryService,
    private readonly i18n: I18nService,
  ) {}

  async registration(
    registrationDto: RegistrationDto,
    userAgent: string,
  ): Promise<ResponseWrapper<RegistrationEntity & { refreshToken: string }>> {
    await this.checkUserExistsByEmail(registrationDto.email);
    await this.checkUserExistsByName(registrationDto.name);

    const { deviceId, groupId, ...registrationDtoWithoutDevice } = registrationDto;

    const salt = await genSalt(10);
    const hashPassword = await hash(registrationDto.password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        ...registrationDtoWithoutDevice,
        password: hashPassword,
      },
    });

    await this.categoryService.createDefaultCategories(newUser.id, groupId);

    const { password, ...userData } = newUser;

    const tokens = await this.createTokens({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      deviceId: deviceId,
    });

    await this.saveRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: userData.id,
      deviceId,
      userAgent,
    });

    return {
      success: true,
      data: {
        ...userData,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async login(loginDto: LoginDto, userAgent: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const { refreshTokenInfo } = await this.findRefreshToken({
      deviceId: loginDto.deviceId,
      email: user.email,
      name: user.name,
      id: user.id,
    });

    if (refreshTokenInfo?.deviceId === loginDto.deviceId) {
      await this.authRepository.deleteRefreshTokenByUserIdDeviceId(user.id, loginDto.deviceId);
    }

    const tokens = await this.createTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      deviceId: loginDto.deviceId,
    });

    await this.saveRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: user.id,
      deviceId: loginDto.deviceId,
      userAgent,
    });

    return {
      success: true,
      data: {
        email: user.email,
        name: user.name,
        id: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async refresh(
    user: { email: string; name: string; id: string; deviceId: string },
    userAgent: string,
  ) {
    const { user: payload, refreshTokenInfo } = await this.findRefreshToken(user);

    if (!refreshTokenInfo) {
      throw new UnauthorizedException(tSafe('errors.UNAUTHORIZED', 'en'));
    }

    await this.authRepository.deleteRefreshTokenById(refreshTokenInfo.id);

    const tokens = await this.createTokens({
      id: refreshTokenInfo.userId,
      email: payload.email,
      name: payload.name,
      deviceId: refreshTokenInfo.deviceId,
    });

    await this.saveRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: payload.id,
      deviceId: refreshTokenInfo.deviceId,
      userAgent,
    });

    return {
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async logout(user: { email: string; name: string; id: string; deviceId: string }) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        deviceId: user.deviceId,
      },
    });
  }

  async me(user: { id: string }) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException(tSafe('errors.UNAUTHORIZED', 'en'));
    }

    return {
      success: true,
      data: dbUser,
    };
  }

  async updateProfile(
    user: { id: string; deviceId: string },
    name: string,
    userAgent: string,
  ): Promise<{
    success: true;
    data: {
      id: string;
      email: string;
      name: string;
      token: string;
      refreshToken: string;
    };
  }> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException(this.i18n.t('validation.NAME_REQUIRED'));
    }

    const nameTaken = await this.prisma.user.findFirst({
      where: { name: trimmed, NOT: { id: user.id } },
    });

    if (nameTaken) {
      throw new ConflictException(
        this.i18n.t('errors.ALREADY_EXISTS', {
          args: { entity: 'user', fieldName: 'name', fieldValue: trimmed },
        }),
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { name: trimmed },
      select: { id: true, email: true, name: true },
    });

    await this.authRepository.deleteRefreshTokenByUserIdDeviceId(user.id, user.deviceId);

    const tokens = await this.createTokens({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      deviceId: user.deviceId,
    });

    await this.saveRefreshToken({
      refreshToken: tokens.refreshToken,
      userId: updated.id,
      deviceId: user.deviceId,
      userAgent,
    });

    return {
      success: true,
      data: {
        ...updated,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async changePassword(user: { id: string }, dto: ChangePasswordDto) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser) {
      throw new UnauthorizedException(tSafe('errors.UNAUTHORIZED', 'en'));
    }

    const isValid = await compare(dto.currentPassword, dbUser.password);
    if (!isValid) {
      throw new UnauthorizedException(tSafe('errors.WRONG_LOGIN_OR_PASSWORD', 'en'));
    }

    const salt = await genSalt(10);
    const hashPassword = await hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword },
    });

    return { success: true };
  }

  async getSessions(user: { id: string; deviceId: string }) {
    const rows = await this.authRepository.findRefreshTokensByUserId(user.id);

    return {
      success: true,
      data: rows.map((r) => ({
        deviceId: r.deviceId,
        userAgent: r.userAgent,
        createdAt: r.createAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
        isCurrent: r.deviceId === user.deviceId,
      })),
    };
  }

  async revokeSession(user: { id: string; deviceId: string }, targetDeviceId: string) {
    if (targetDeviceId === user.deviceId) {
      throw new BadRequestException(this.i18n.t('errors.CANNOT_REVOKE_CURRENT_SESSION'));
    }

    const result = await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id, deviceId: targetDeviceId },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'session', id: targetDeviceId, fieldName: 'deviceId' },
        }),
      );
    }

    return { success: true };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const wrongCreds = () =>
      new UnauthorizedException(tSafe('errors.WRONG_LOGIN_OR_PASSWORD', 'en'));

    if (!user) {
      throw wrongCreds();
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      throw wrongCreds();
    }

    return user;
  }

  private async checkUserExistsByName(name: string) {
    const checkUserName = await this.prisma.user.findUnique({
      where: {
        name: name,
      },
    });

    if (checkUserName) {
      throw new ConflictException(
        this.i18n.t('errors.ALREADY_EXISTS', {
          args: { entity: 'user', fieldName: 'name', fieldValue: name },
        }),
      );
    }
  }

  private async checkUserExistsByEmail(email: string) {
    const checkUserEmail = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (checkUserEmail) {
      throw new ConflictException(
        this.i18n.t('errors.ALREADY_EXISTS', {
          args: { entity: 'user', fieldName: 'email', fieldValue: email },
        }),
      );
    }
  }

  private async createTokens({
    id,
    email,
    name,
    deviceId,
  }: { id: string; email: string; name: string; deviceId: string }) {
    const accessToken = await this.jwtService.signAsync(
      { id, deviceId, email, name },
      { expiresIn: '15m', secret: process.env.JWT_SECRET_CODE },
    );
    const refreshToken = await this.jwtService.signAsync(
      { id, deviceId, name, email },
      { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken({
    refreshToken,
    userId,
    deviceId,
    userAgent,
  }: {
    refreshToken: string;
    userId: string;
    deviceId: string;
    userAgent?: string;
  }) {
    const hashedRefreshToken = await hash(refreshToken, 10);
    await this.authRepository.createRefreshToken({
      userId,
      deviceId,
      userAgent,
      hashedRefreshToken,
    });
  }

  private async findRefreshToken(user: {
    email: string;
    name: string;
    id: string;
    deviceId: string;
  }) {
    if (!user) {
      throw new UnauthorizedException(tSafe('errors.UNAUTHORIZED', 'en'));
    }

    const refreshTokenInfo = await this.authRepository.findRefreshToken({
      deviceId: user.deviceId,
      userId: user.id,
    });

    return {
      user,
      refreshTokenInfo,
    };
  }
}
