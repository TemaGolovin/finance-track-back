import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import { TemplateErrorResponse } from 'src/constants/TemplateErrorResponse';
import { Public } from 'src/decorators/public.decorator';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { ConfirmEmailChangeDto, RequestEmailChangeDto } from './dto/email-change.dto';
import { InviteToGroupByUserIdsDto } from './dto/invite-to-group-by-name.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { InvitationEntity } from './entity/invitation.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('find/by-name')
  @ApiQuery({ name: 'name', required: true })
  @ApiOkResponse({
    example: [{ id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b', name: 'voin123' }],
    isArray: true,
  })
  findUsersByUsername(
    @Query('name') name: string,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    if (!name) {
      return [];
    }
    return this.userService.findUsersByUsername(name, userInfo.id);
  }

  @Post('invitation')
  @ApiCreatedResponse({
    type: InvitationEntity,
    description: 'invitation created successfully',
    isArray: true,
  })
  @ApiForbiddenResponse({
    description: "when user can't invite to this group",
    type: TemplateErrorResponse,
    example: {
      message: 'You cannot invite to a group unless you are the creator of the group.',
      statusCode: 403,
      error: 'Forbidden',
    },
  })
  @ApiConflictResponse({
    description: 'when user invite himself',
    type: TemplateErrorResponse,
    example: { message: "You can't invite yourself", statusCode: 409, error: 'Conflict' },
  })
  inviteToGroupByName(
    @Body() inviteByNameDto: InviteToGroupByUserIdsDto,
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
  ) {
    return this.userService.inviteToGroupByName(inviteByNameDto, userInfo.id);
  }

  @Get('invitation')
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
          status: InvitationStatus.PENDING,
          sender: {
            name: 'voin123',
          },
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
          status: InvitationStatus.PENDING,
          recipient: {
            name: 'voin123',
          },
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

  @Patch('invitation/:id')
  @ApiResponse({ status: 200, description: 'change status of invitation', type: InvitationEntity })
  @ApiQuery({ name: 'id', required: true, description: 'invitation id' })
  changeInvitationStatus(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Param('id') invitationId: string,
    @Body() updateDto: UpdateInvitationDto,
  ) {
    return this.userService.updateInvitation(updateDto, invitationId, userInfo.id);
  }

  @Post('request-email-change')
  requestEmailChange(
    @UserInfo() userInfo: { email: string; name: string; id: string; deviceId: string },
    @Body() dto: RequestEmailChangeDto,
  ) {
    return this.userService.requestEmailChange(userInfo.id, dto);
  }

  @Public()
  @Post('confirm-email-change')
  confirmEmailChange(@Body() dto: ConfirmEmailChangeDto) {
    return this.userService.confirmEmailChange(dto);
  }
}
