import { Module } from '@nestjs/common';
import { CategoryModule } from 'src/category/category.module';
import { UserGroupModule } from 'src/user-group/user-group.module';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { OperationRepository } from './operation.repository';

@Module({
  imports: [UserGroupModule, CategoryModule],
  controllers: [OperationController],
  providers: [OperationService, OperationRepository],
})
export class OperationModule {}
