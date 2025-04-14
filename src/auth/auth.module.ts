import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { getJWTConfig } from 'src/config/jwt.config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-jwt.strategy';
import { AuthRepository } from './auth.repository';
import { CategoryService } from 'src/category/category.service';
import { CategoryRepository } from 'src/category/category.repository';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: getJWTConfig,
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    AuthRepository,
    CategoryService,
    CategoryRepository,
  ],
})
export class AuthModule {}
