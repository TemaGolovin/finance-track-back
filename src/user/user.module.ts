import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserGroupService } from 'src/user-group/user-group.service';
import { UserGroupRepository } from 'src/user-group/user-group.repository';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, UserGroupService, UserGroupRepository],
})
export class UserModule {}
