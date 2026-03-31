import { Module } from '@nestjs/common';
import { CategoryService } from 'src/category/category.service';
import { CategoryRepository } from 'src/category/category.repository';
import { UserGroupModule } from 'src/user-group/user-group.module';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { OperationRepository } from './operation.repository';

@Module({
  imports: [UserGroupModule],
  controllers: [OperationController],
  providers: [OperationService, OperationRepository, CategoryService, CategoryRepository],
})
export class OperationModule {}
