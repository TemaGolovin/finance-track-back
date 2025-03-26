import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InviteToGroupByNameDto } from './dto/invite-to-group-by-name.dto';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { InvitationEntity } from './entity/invitation.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('find/by-name')
  @ApiQuery({ name: 'name', required: true })
  @ApiOkResponse({
    example: [{ id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b', name: 'voin123' }],
    isArray: true,
  })
  findUsersByUsername(@Query('name') name: string) {
    if (!name) {
      return [];
    }
    return this.userService.findUsersByUsername(name);
  }

  @Post('invite-to-group/by-name')
  @ApiCreatedResponse({ type: InvitationEntity })
  inviteToGroupByName(
    @Body() inviteByNameDto: InviteToGroupByNameDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userService.inviteToGroupByName(inviteByNameDto, userInfo.id);
  }

  @Get('invitations')
  @ApiOkResponse({
    example: {
      received: [
        {
          id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          senderName: 'voin123',
          groupName: 'group1',
          groupId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          senderId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          recipientId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        },
      ],
      sent: [
        {
          id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          recipientName: 'voin123',
          groupName: 'group1',
          groupId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          senderId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
          recipientId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        },
      ],
    },
    description: "user's received and sent invitations",
    type: 'object',
  })
  getInvitations(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userService.getInvitations(userInfo.id);
  }
}
