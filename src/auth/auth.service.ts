import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegistrationDto } from './dto/auth.dto';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { compare, genSalt, hash } from 'bcryptjs';
import { RegistrationEntity } from './entity/registration.entity';
import { ResponseWrapper } from 'src/constants/response-wrapper';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly categoryService: CategoryService,
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
      throw new UnauthorizedException(ERRORS_MESSAGES.UNAUTHORIZED());
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

  async me(user: { email: string; name: string; id: string; deviceId: string }) {
    return {
      success: true,
      data: {
        email: user.email,
        name: user.name,
        id: user.id,
      },
    };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.findUserByEmail(email);

    const isValidPassword = await compare(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException(ERRORS_MESSAGES.WRONG_LOGIN_OR_PASSWORD());
    }
    return user;
  }

  private async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('user', email, 'email'));
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
        ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'user',
          fieldName: 'name',
          fieldValue: name,
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
        ERRORS_MESSAGES.ALREADY_EXISTS({
          entity: 'user',
          fieldName: 'email',
          fieldValue: email,
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
      throw new UnauthorizedException(ERRORS_MESSAGES.UNAUTHORIZED());
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
