import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { UserGroupRepository } from './user-group.repository';
import { ERRORS_MESSAGES } from 'src/constants/errors';

@Injectable()
export class UserGroupService {
  constructor(private readonly userGroupRepository: UserGroupRepository) {}

  create(createUserGroupDto: CreateUserGroupDto, userId: string) {
    const newGroup = this.userGroupRepository.createUserGroup(createUserGroupDto, userId);

    return newGroup;
  }

  findAll(userId: string) {
    if (!userId) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('User', userId));
    }

    return this.userGroupRepository.getUserGroupsByUserId(userId);
  }

  findOne(id: number) {
    return `This action returns a #${id} userGroup`;
  }

  update(id: number, updateUserGroupDto: UpdateUserGroupDto) {
    return `This action updates a #${id} userGroup`;
  }

  remove(id: number) {
    return `This action removes a #${id} userGroup`;
  }
}
