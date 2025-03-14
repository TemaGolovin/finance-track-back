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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registration(
    registrationDto: RegistrationDto,
  ): Promise<ResponseWrapper<RegistrationEntity & { refreshToken: string }>> {
    await this.checkUserExistsByEmail(registrationDto.email);
    await this.checkUserExistsByName(registrationDto.name);

    const salt = await genSalt(10);
    const hashPassword = await hash(registrationDto.password, salt);

    const newUser = await this.prisma.user.create({
      data: {
        ...registrationDto,
        password: hashPassword,
      },
    });

    const { password, ...userData } = newUser;

    const tokens = await this.createTokens(userData.id, userData.email, userData.name);

    return {
      success: true,
      data: {
        ...userData,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const tokens = await this.createTokens(user.id, user.email, user.name);

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

  async refresh(refreshToken: string) {}

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

  private async createTokens(id: string, email: string, name: string) {
    const accessToken = await this.jwtService.signAsync({ id, email, name }, { expiresIn: '15m' });
    const refreshToken = await this.jwtService.signAsync({ id, email, name }, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
    };
  }
}
