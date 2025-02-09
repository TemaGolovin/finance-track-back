import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OperationModule } from './operation/operation.module';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryService } from './category/category.service';
import { CategoryModule } from './category/category.module';


@Global()
@Module({
  imports: [OperationModule, PrismaModule, CategoryModule],
  controllers: [AppController],
  providers: [AppService, CategoryService],
})
export class AppModule {}
