import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { getJWTConfig } from 'src/config/jwt.config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-jwt.strategy';
import { AuthRepository } from './auth.repository';
import { JwtAuthGuard } from './guard/jwt.guard';
import { CategoryModule } from 'src/category/category.module';
import { MailModule } from 'src/mail/mail.module';
import { EmailTokenModule } from 'src/email-token/email-token.module';

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
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
})
export class AuthModule {}
