import { Module } from '@nestjs/common';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { OperationRepository } from './operation.repository';
import { CategoryService } from 'src/category/category.service';
import { CategoryRepository } from 'src/category/category.repository';

@Module({
  controllers: [OperationController],
  providers: [OperationService, OperationRepository, CategoryService, CategoryRepository],
})
export class OperationModule {}
