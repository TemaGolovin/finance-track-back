import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { getAuthThrottlerModuleConfig } from './config/auth-throttle.config';
import { CategoryModule } from './category/category.module';
import { HealthModule } from './health/health.module';
import { I18nAppModule } from './i18n/i18n-app.module';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserGroupModule } from './user-group/user-group.module';
import { UserModule } from './user/user.module';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([...getAuthThrottlerModuleConfig()]),
    I18nAppModule,
    HealthModule,
    OperationModule,
    PrismaModule,
    CategoryModule,
    AuthModule,
    UserModule,
    UserGroupModule,
  ],
})
export class AppModule {}
