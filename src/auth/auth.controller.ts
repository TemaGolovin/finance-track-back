import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegistrationDto } from './dto/auth.dto';
import { ApiWrapperOkResponse } from 'src/decorators/ApiWrapperResponse';
import { RegistrationEntity } from './entity/registration.entity';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';
import { ApiConflictResponse } from '@nestjs/swagger';
import { LoginEntity } from './entity/login.entity';
import { Response } from 'express';
import { Public } from 'src/decorators/pablic.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('registration')
  @ApiWrapperOkResponse(RegistrationEntity)
  @ApiConflictResponse({ description: 'name or email already exists', type: TemplateErrorResponse })
  async registration(@Res() response: Response, @Body() registrationDto: RegistrationDto) {
    const { success, data } = await this.authService.registration(registrationDto);

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
  async login(@Res() response: Response, @Body() loginDto: LoginDto) {
    const { data } = await this.authService.login(loginDto);

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
}
