import { Global, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { I18nAppModule } from './i18n/i18n-app.module';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserGroupModule } from './user-group/user-group.module';
import { UserModule } from './user/user.module';

@Global()
@Module({
  imports: [
    I18nAppModule,
    OperationModule,
    PrismaModule,
    CategoryModule,
    AuthModule,
    UserModule,
    UserGroupModule,
  ],
})
export class AppModule {}
