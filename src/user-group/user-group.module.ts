import { Module } from '@nestjs/common';
import { UserGroupService } from './user-group.service';
import { UserGroupController } from './user-group.controller';
import { UserGroupRepository } from './user-group.repository';
import { CategoryService } from 'src/category/category.service';
import { CategoryRepository } from 'src/category/category.repository';

@Module({
  controllers: [UserGroupController],
  providers: [UserGroupService, UserGroupRepository, CategoryService, CategoryRepository],
})
export class UserGroupModule {}
