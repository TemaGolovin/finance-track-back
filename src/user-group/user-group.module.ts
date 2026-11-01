import { Module } from '@nestjs/common';
import { CategoryModule } from 'src/category/category.module';
import { UserGroupService } from './user-group.service';
import { UserGroupController } from './user-group.controller';
import { UserGroupRepository } from './user-group.repository';

@Module({
  imports: [CategoryModule],
  controllers: [UserGroupController],
  providers: [UserGroupService, UserGroupRepository],
  exports: [UserGroupService, UserGroupRepository],
})
export class UserGroupModule {}
