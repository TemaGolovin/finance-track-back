import { Module } from '@nestjs/common';
import { UserGroupService } from './user-group.service';
import { UserGroupController } from './user-group.controller';
import { UserGroupRepository } from './user-group.repository';

@Module({
  controllers: [UserGroupController],
  providers: [UserGroupService, UserGroupRepository],
})
export class UserGroupModule {}
