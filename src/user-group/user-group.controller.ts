import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserGroupService } from './user-group.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { ApiResponse } from '@nestjs/swagger';
import { UserGroupEntity } from './entities/user-group.entity';

@Controller('user-group')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Post()
  create(
    @Body() createUserGroupDto: CreateUserGroupDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userGroupService.create(createUserGroupDto, userInfo.id);
  }

  @Get()
  @ApiResponse({ status: 200, type: UserGroupEntity, isArray: true })
  findAll(@UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string }) {
    return this.userGroupService.findAll(userInfo.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userGroupService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserGroupDto: UpdateUserGroupDto) {
    return this.userGroupService.update(+id, updateUserGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userGroupService.remove(+id);
  }
}
