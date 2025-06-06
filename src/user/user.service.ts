import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { InviteToGroupByNameDto } from './dto/invite-to-group-by-name.dto';
import { ERRORS_MESSAGES } from 'src/constants/errors';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { InvitationStatus } from '@prisma/client';
import { USER_ERRORS } from './common/errors';
import { UserGroupService } from 'src/user-group/user-group.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userGroupService: UserGroupService,
  ) {}
  async findUsersByUsername(username: string, userId: string) {
    return await this.userRepository.findUsersByUsername(username, userId);
  }

  async inviteToGroupByName(inviteByNameDto: InviteToGroupByNameDto, senderId: string) {
    const { name, groupId } = inviteByNameDto;
    const user = await this.userRepository.findUserByUsername(name);

    if (!user) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('user', name, 'name'));
    }

    if (user.id === senderId) {
      throw new ConflictException(USER_ERRORS.SELF_INVITATION);
    }

    const targetUserGroup = await this.userGroupService.getUserGroupById(groupId);

    if (!targetUserGroup) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('group', groupId, 'id'));
    }

    if (targetUserGroup.creatorId === user.id) {
      throw new ForbiddenException(USER_ERRORS.FORBIDDEN_INVITATION_THIS_GROUP);
    }

    const invitation = await this.userRepository.createInvitation({
      groupId,
      recipientId: user.id,
      senderId,
    });

    return invitation;
  }

  async getInvitations(userId: string) {
    const receivedInvitations = await this.userRepository.getInventionsByRecipientId(userId);
    const sentInvitations = await this.userRepository.getInventionsBySenderId(userId);

    return {
      received: receivedInvitations,
      sent: sentInvitations,
    };
  }

  async updateInvitation(
    updateInvitationDto: UpdateInvitationDto,
    invitationId: string,
    userId: string,
  ) {
    const invitation = await this.userRepository.getInventionById(invitationId);

    if (!invitation) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('invitation', invitationId, 'id'));
    }

    if (invitation.recipientId !== userId && invitation.senderId !== userId) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('invitation', invitationId, 'id'));
    }

    const { status } = updateInvitationDto;

    const validTransitions: Record<
      InvitationStatus,
      { sender: InvitationStatus[]; recipient: InvitationStatus[] }
    > = {
      PENDING: {
        sender: [InvitationStatus.CANCELLED],
        recipient: [InvitationStatus.ACCEPTED, InvitationStatus.DECLINED],
      },
      ACCEPTED: {
        sender: [InvitationStatus.CANCELLED],
        recipient: [],
      },
      DECLINED: {
        sender: [],
        recipient: [],
      },
      CANCELLED: {
        sender: [],
        recipient: [],
      },
    };

    const userStatusInInvitation = invitation.recipientId === userId ? 'recipient' : 'sender';

    if (!validTransitions[invitation.status]?.[userStatusInInvitation]?.includes(status)) {
      throw new ForbiddenException(ERRORS_MESSAGES.FORBIDDEN());
    }

    if (status === InvitationStatus.ACCEPTED) {
      await this.userGroupService.addToGroup(userId, invitation.groupId);
    }

    const updatedInvitation = await this.userRepository.updateInvitation({ status }, invitationId);

    return updatedInvitation;
  }
}
