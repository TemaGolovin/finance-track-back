import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { InvitationEntity } from 'src/user/entity/invitation.entity';
import { ConnectGroupCategoryDto } from './dto/connect-group-category.dto';
import { CreateGroupCategoryDto } from './dto/create-group-category.dto';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { GetUserGroupStatDto } from './dto/get-user-group-stat.dto';
import { UpdateGroupCategoryDto } from './dto/update-group-category.dto';
import { UserGroupEntity } from './entities/user-group.entity';
import { UserGroupService } from './user-group.service';

@Controller('user-group')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Post()
  @ApiCreatedResponse({ type: UserGroupEntity })
  create(
    @Body() createUserGroupDto: CreateUserGroupDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userGroupService.create(createUserGroupDto, userInfo.id);
  }

  @Get()
  @ApiResponse({ status: 200, type: UserGroupEntity, isArray: true })
  @ApiNotFoundResponse({
    example: {
      message: 'User with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  findAll(@UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string }) {
    return this.userGroupService.findAll(userInfo.id);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: UserGroupEntity })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  findOne(
    @Param('id') id: string,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userGroupService.findOne(id, userInfo.id);
  }

  @Get(':groupId/stat')
  @ApiOkResponse({
    example: {
      totalSum: 21342,
      byCategories: [
        {
          id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          name: 'family',
          totalAmount: 2000,
          proportion: 9.2,
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  async getStat(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Query() { startDate, endDate, operationType }: GetUserGroupStatDto,
  ) {
    return await this.userGroupService.getUserGroupStat({
      groupId,
      userId: userInfo.id,
      startDate,
      endDate,
      operationType,
    });
  }

  @Get(':groupId/operations')
  @ApiOkResponse({
    example: {
      totalSum: 21342,
      operationsByDate: [
        {
          date: '21.12.2023',
          operations: [
            {
              id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
              comment: 'Food',
              value: 100,
              type: 'INCOME',
              categoryId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
              operationDate: '2023-01-01T00:00:00.000Z',
              createAt: '2023-01-01T00:00:00.000Z',
              updateAt: '2023-01-01T00:00:00.000Z',
              userId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
              category: {
                name: 'Food',
                color: '#FF0000',
                icon: 'CategoryIcon',
              },
            },
          ],
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  async getOperations(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Query() {
      startDate,
      endDate,
      operationType,
      categoryId,
    }: GetUserGroupStatDto & { categoryId?: string },
  ) {
    return await this.userGroupService.getUserGroupOperations({
      groupId,
      userId: userInfo.id,
      startDate,
      endDate,
      operationType,
      categoryId,
    });
  }

  @ApiResponse({
    status: 200,
    example: {
      message: 'Group "family" deleted successfully',
      group: {
        id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        name: 'family',
      },
    },
  })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userGroupService.remove(id, userInfo.id);
  }

  @ApiResponse({
    status: 200,
    example: { count: 1 },
  })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  @ApiForbiddenResponse({
    examples: {
      notCreator: {
        summary: 'Requester is not the group creator',
        value: {
          message: 'Only the group creator can remove members',
          statusCode: 403,
          error: 'Forbidden',
        },
      },
      removeCreator: {
        summary: 'Attempt to remove the group creator',
        value: {
          message: 'Cannot remove the group creator',
          statusCode: 403,
          error: 'Forbidden',
        },
      },
    },
  })
  @Delete(':groupId/members/:memberId')
  removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userGroupService.removeMember(groupId, memberId, userInfo.id);
  }

  @Patch(':groupId/category/connect')
  @ApiOkResponse({
    example: [
      {
        id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        name: 'family',
        groupId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        categoryType: 'EXPENSE',
        defaultKey: 'family',
        personalCategories: [
          {
            id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
            groupCategoryId: '915b0044-0ad3-4790-bc1e-0d0d6d726207',
            categoryId: 'd8f4e185-fa72-4ead-97d3-2818ad965e6d',
            userId: '87654321-1234-1234-1234-abcdefghijkl',
          },
        ],
      },
    ],
  })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  connectGroupCategoriesToPersonalCategories(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Body() groupCategoryDto: ConnectGroupCategoryDto,
  ) {
    return this.userGroupService.connectGroupCategoriesToPersonalCategories(
      groupCategoryDto,
      groupId,
      userInfo.id,
    );
  }

  @Get(':groupId/categories')
  @ApiOkResponse({
    example: [
      {
        id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        name: 'Food',
        categoryType: 'EXPENSE',
        defaultKey: 'food',
        connectedPersonalCategoryId: 'd8f4e185-fa72-4ead-97d3-2818ad965e6d',
      },
    ],
  })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  getGroupCategories(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
  ) {
    return this.userGroupService.getGroupCategories(groupId, userInfo.id);
  }

  @Post(':groupId/categories')
  @ApiCreatedResponse({
    example: { id: 'uuid', name: 'Food', categoryType: 'EXPENSE', defaultKey: null },
  })
  @ApiForbiddenResponse({
    example: {
      message: 'Only the group creator can manage group categories',
      statusCode: 403,
      error: 'Forbidden',
    },
  })
  createGroupCategory(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Body() dto: CreateGroupCategoryDto,
  ) {
    return this.userGroupService.createGroupCategory(groupId, dto, userInfo.id);
  }

  @Patch(':groupId/categories/:categoryId')
  @ApiOkResponse({
    example: { id: 'uuid', name: 'Food', categoryType: 'EXPENSE', defaultKey: null },
  })
  @ApiForbiddenResponse({
    example: {
      message: 'Only the group creator can manage group categories',
      statusCode: 403,
      error: 'Forbidden',
    },
  })
  updateGroupCategory(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateGroupCategoryDto,
  ) {
    return this.userGroupService.updateGroupCategory(groupId, categoryId, dto, userInfo.id);
  }

  @Delete(':groupId/categories/:categoryId')
  @ApiOkResponse({
    example: { id: 'uuid', name: 'Food' },
  })
  @ApiForbiddenResponse({
    example: {
      message: 'Only the group creator can manage group categories',
      statusCode: 403,
      error: 'Forbidden',
    },
  })
  deleteGroupCategory(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.userGroupService.deleteGroupCategory(groupId, categoryId, userInfo.id);
  }

  @Get(':id/invitations')
  @ApiResponse({
    type: [InvitationEntity],
    isArray: true,
    example: [
      {
        id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        groupId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        senderId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        recipientId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        status: 'PENDING',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        recipient: [
          {
            id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
            name: 'username',
          },
        ],
      },
    ],
  })
  @ApiNotFoundResponse({
    example: {
      message: 'Group with id UUID not found',
      statusCode: 404,
      error: 'Not Found',
    },
  })
  async getGroupInvitations(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('id') groupId: string,
  ) {
    return await this.userGroupService.getGroupInvitations(userInfo.id, groupId);
  }
}
