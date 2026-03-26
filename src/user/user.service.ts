import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { UserGroupService } from 'src/user-group/user-group.service';
import { InviteToGroupByUserIdsDto } from './dto/invite-to-group-by-name.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userGroupService: UserGroupService,
    private readonly i18n: I18nService,
  ) {}
  async findUsersByUsername(username: string, userId: string) {
    return await this.userRepository.findUsersByUsername(username, userId);
  }

  async inviteToGroupByName(inviteByNameDto: InviteToGroupByUserIdsDto, senderId: string) {
    const { userIds, groupId } = inviteByNameDto;
    const findUsers = await this.userRepository.findUsersByIds(userIds);

    if (findUsers.length !== userIds.length) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'users', id: 'some users', fieldName: 'ids' },
        }),
      );
    }

    if (findUsers.some((user) => user.id === senderId)) {
      throw new ConflictException(this.i18n.t('user.SELF_INVITATION'));
    }

    const targetUserGroup = await this.userGroupService.getUserGroupById(groupId, senderId);

    if (!targetUserGroup) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'group', id: groupId, fieldName: 'id' },
        }),
      );
    }

    if (targetUserGroup.creatorId !== senderId) {
      throw new ForbiddenException(this.i18n.t('user.FORBIDDEN_INVITATION_THIS_GROUP'));
    }

    const invitations = await this.userRepository.createInvitations({
      groupId,
      recipientId: userIds,
      senderId,
    });

    return invitations;
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
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'invitation', id: invitationId, fieldName: 'id' },
        }),
      );
    }

    if (invitation.recipientId !== userId && invitation.senderId !== userId) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: 'invitation', id: invitationId, fieldName: 'id' },
        }),
      );
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
      throw new ForbiddenException(this.i18n.t('errors.FORBIDDEN'));
    }

    if (status === InvitationStatus.ACCEPTED) {
      await this.userGroupService.addToGroup(userId, invitation.groupId);
    }

    const updatedInvitation = await this.userRepository.updateInvitation({ status }, invitationId);

    return updatedInvitation;
  }
}
