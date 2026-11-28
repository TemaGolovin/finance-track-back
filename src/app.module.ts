import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { getAuthThrottlerModuleConfig } from './config/auth-throttle.config';
import { FeedbackModule } from './feedback/feedback.module';
import { HealthModule } from './health/health.module';
import { I18nAppModule } from './i18n/i18n-app.module';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserGroupModule } from './user-group/user-group.module';
import { UserModule } from './user/user.module';

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
    FeedbackModule,
  ],
})
export class AppModule {}
