import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UserGroupRepository } from './user-group.repository';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { USER_GROUP_ERRORS } from './common/errors';
import { USER_GROUP_MESSAGES } from './common/messages';

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

  async findOne(groupId: string, userId: string) {
    const group = await this.userGroupRepository.getUserGroupById(groupId);

    if (!group) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Group', groupId));
    }

    const userMemberInGroup = group.users.find((user) => user.user.id === userId);

    if (!userMemberInGroup) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Group', groupId));
    }

    return group;
  }

  async getUserGroupById(id: string) {
    return await this.userGroupRepository.getUserGroupById(id);
  }

  async addToGroup(userId: string, groupId: string) {
    return await this.userGroupRepository.addUserToGroup(userId, groupId);
  }

  async removeFromGroup(userId: string, groupId: string) {
    return await this.userGroupRepository.removeUserFromGroup(userId, groupId);
  }

  async remove(id: string, userId: string) {
    const groupForDelete = await this.userGroupRepository.getUserGroupById(id);

    if (!groupForDelete) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Group', id));
    }

    const userMemberInGroup = groupForDelete.users.find((user) => user.user.id === userId);

    if (!userMemberInGroup) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('Group', id));
    }

    if (groupForDelete.creatorId !== userId) {
      throw new ForbiddenException(USER_GROUP_ERRORS.FORBIDDEN_DELETE);
    }

    const deletedGroup = await this.userGroupRepository.deleteUserGroup(id);

    return {
      group: deletedGroup,
      message: USER_GROUP_MESSAGES.delete(deletedGroup.name),
    };
  }
}
