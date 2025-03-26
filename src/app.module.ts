import { Global, Module } from '@nestjs/common';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UserGroupModule } from './user-group/user-group.module';

@Global()
@Module({
  imports: [OperationModule, PrismaModule, CategoryModule, AuthModule, UserModule, UserGroupModule],
})
export class AppModule {}
