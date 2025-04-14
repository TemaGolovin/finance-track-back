import { Controller, Get, Post, Body, Param, Delete, Query, Patch } from '@nestjs/common';
import { UserGroupService } from './user-group.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiResponse } from '@nestjs/swagger';
import { UserGroupEntity } from './entities/user-group.entity';
import { USER_GROUP_MESSAGES } from './common/messages';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { GetUserGroupStatDto } from './dto/get-user-group-stat.dto';

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
      message: ERRORS_MESSAGES.NOT_FOUND('User', 'UUID', 'id'),
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
      message: ERRORS_MESSAGES.NOT_FOUND('Group', 'UUID', 'id'),
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
  getStat(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Query() { startDate, endDate, operationType }: GetUserGroupStatDto,
  ) {
    return this.userGroupService.getUserGroupStat({
      groupId,
      userId: userInfo.id,
      startDate,
      endDate,
      operationType,
    });
  }

  @ApiResponse({
    status: 200,
    example: {
      message: USER_GROUP_MESSAGES.delete('family'),
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

  @Patch(':groupId/category/connect')
  connectGroupCategoriesToPersonalCategories(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('groupId') groupId: string,
    @Body() relatedCategories: { personalCategoryId: string; groupCategoryId: string }[],
  ) {
    return this.userGroupService.connectGroupCategoriesToPersonalCategories(
      relatedCategories,
      groupId,
      userInfo.id,
    );
  }
}
