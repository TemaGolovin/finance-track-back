import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  DeleteAccountDto,
  ForgotPasswordDto,
  LoginDto,
  RegistrationDto,
  ResendVerificationDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { RegistrationEntity } from './entity/registration.entity';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginEntity } from './entity/login.entity';
import { Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import {
  getAuthThrottleLimit,
  getAuthThrottleTtlMs,
} from 'src/config/auth-throttle.config';
import { omitAuthTokensFromBody } from './lib/omit-access-token';
import { JwtAuthRefreshGuard } from './guard/refresh-jwt.guard';
import { UserRefreshInfo } from 'src/decorators/user-auth-refresh-info.decorator';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import {
  clearAuthSessionCookies,
  setAuthSessionCookies,
} from './lib/auth-session-cookies';

const authLoginRegistrationThrottle = {
  auth: {
    limit: getAuthThrottleLimit(),
    ttl: getAuthThrottleTtlMs(),
  },
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(authLoginRegistrationThrottle)
  @Post('registration')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RegistrationEntity })
  @ApiConflictResponse({ description: 'name or email already exists', type: TemplateErrorResponse })
  async registration(
    @Res({ passthrough: true }) response: Response,
    @Body() registrationDto: RegistrationDto,
    @Headers('User-agent') userAgent: string,
  ) {
    const { data } = await this.authService.registration(registrationDto, userAgent);
    setAuthSessionCookies(response, {
      refreshToken: data.refreshToken,
      token: data.token,
    });
    return omitAuthTokensFromBody(data);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle(authLoginRegistrationThrottle)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginEntity })
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body() loginDto: LoginDto,
    @Headers('User-agent') userAgent: string,
  ) {
    const { data } = await this.authService.login(loginDto, userAgent);
    setAuthSessionCookies(response, {
      refreshToken: data.refreshToken,
      token: data.token,
    });
    return omitAuthTokensFromBody(data);
  }

  @Public()
  @UseGuards(JwtAuthRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Res({ passthrough: true }) response: Response,
    @UserRefreshInfo()
    user: {
      email: string;
      name: string;
      id: string;
      deviceId: string;
      refreshToken: string;
    },
    @Headers('User-agent') userAgent: string,
  ) {
    const responseData = await this.authService.refresh(user, userAgent);
    setAuthSessionCookies(response, {
      refreshToken: responseData.data.refreshToken,
      token: responseData.data.token,
    });
    return omitAuthTokensFromBody(responseData.data);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({
    description: 'logout',
    content: { 'application/json': { example: { success: true } } },
  })
  async logout(
    @Res({ passthrough: true }) response: Response,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    await this.authService.logout(userInfo);
    clearAuthSessionCookies(response);
    return { success: true };
  }

  @Get('me')
  async me(@UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string }) {
    return this.authService.me(userInfo);
  }

  @Patch('profile')
  async updateProfile(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: UpdateProfileDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Headers('User-agent') userAgent: string,
  ) {
    const { data } = await this.authService.updateProfile(userInfo, dto.name, userAgent);
    setAuthSessionCookies(response, {
      refreshToken: data.refreshToken,
      token: data.token,
    });
    return {
      success: true,
      data: omitAuthTokensFromBody(data),
    };
  }

  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.authService.changePassword(userInfo, dto);
  }

  @Get('sessions')
  async sessions(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.authService.getSessions(userInfo);
  }

  @Delete('sessions/:deviceId')
  async revokeSession(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
  ) {
    return this.authService.revokeSession(userInfo, deviceId);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('delete-account')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'account deleted',
    content: { 'application/json': { example: { success: true } } },
  })
  async deleteAccount(
    @Res({ passthrough: true }) response: Response,
    @Body() dto: DeleteAccountDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    await this.authService.deleteAccount(userInfo.id, dto);
    clearAuthSessionCookies(response);
    return { success: true };
  }
}
