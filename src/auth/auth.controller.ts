import { Body, Controller, Header, Headers, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegistrationDto } from './dto/auth.dto';
import { ApiWrapperOkResponse } from 'src/decorators/ApiWrapperResponse';
import { RegistrationEntity } from './entity/registration.entity';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';
import { ApiConflictResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { LoginEntity } from './entity/login.entity';
import { Response } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { JwtAuthRefreshGuard } from './guard/refresh-jwt.guard';
import { UserRefreshInfo } from 'src/decorators/user-auth-refresh-info.decorator';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registration')
  @ApiWrapperOkResponse(RegistrationEntity)
  @ApiConflictResponse({ description: 'name or email already exists', type: TemplateErrorResponse })
  async registration(
    @Res() response: Response,
    @Body() registrationDto: RegistrationDto,
    @Headers('User-agent') userAgent: string,
  ) {
    const { success, data } = await this.authService.registration(registrationDto, userAgent);

    const { refreshToken, ...dataWithoutRefresh } = data;

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });

    return response.status(200).json({
      success,
      data: dataWithoutRefresh,
    });
  }

  @Public()
  @Post('login')
  @ApiWrapperOkResponse(LoginEntity)
  async login(
    @Res() response: Response,
    @Body() loginDto: LoginDto,
    @Headers('User-agent') userAgent: string,
  ) {
    const { data } = await this.authService.login(loginDto, userAgent);

    const { refreshToken, ...dataWithoutRefresh } = data;

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });

    return response.status(200).json({
      success: true,
      data: dataWithoutRefresh,
    });
  }

  @Public()
  @UseGuards(JwtAuthRefreshGuard)
  @Post('refresh')
  async refresh(
    @Res() response: Response,
    @UserRefreshInfo() user: { email: string; name: string; id: string; deviceId: string },
    @Headers('User-agent') userAgent: string,
  ) {
    const responseData = await this.authService.refresh(user, userAgent);

    const { refreshToken: newRefreshToken, ...dataWithoutRefresh } = responseData.data;

    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });

    return response.status(200).json(dataWithoutRefresh);
  }

  @Post('logout')
  @ApiCreatedResponse({
    description: 'logout',
    content: { 'application/json': { example: { success: true } } },
  })
  async logout(
    @Res() response: Response,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    await this.authService.logout(userInfo);
    response.clearCookie('refreshToken');
    return response.status(200).json({
      success: true,
    });
  }
}
