import { Global, Module } from '@nestjs/common';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';

@Global()
@Module({
  imports: [OperationModule, PrismaModule, CategoryModule, AuthModule],
})
export class AppModule {}
