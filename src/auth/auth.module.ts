import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CategoryModule } from 'src/category/category.module';
import { getJWTConfig } from 'src/config/jwt.config';
import { EmailTokenModule } from 'src/email-token/email-token.module';
import { MailModule } from 'src/mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { EmailVerifiedGuard } from './guard/email-verified.guard';
import { JwtAuthGuard } from './guard/jwt.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: getJWTConfig,
    }),
    PassportModule,
    MailModule,
    EmailTokenModule,
    CategoryModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    AuthRepository,
    JwtAuthGuard,
    EmailVerifiedGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: EmailVerifiedGuard },
  ],
})
export class AuthModule {}
