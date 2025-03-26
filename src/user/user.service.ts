import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './user.repository';
import { InviteToGroupByNameDto } from './dto/invite-to-group-by-name.dto';
import { ERRORS_MESSAGES } from 'src/constants/errors';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  async findUsersByUsername(username: string) {
    return await this.userRepository.findUsersByUsername(username);
  }

  async inviteToGroupByName(inviteByNameDto: InviteToGroupByNameDto, senderId: string) {
    const { name, groupId } = inviteByNameDto;
    const user = await this.userRepository.findUserByUsername(name);

    if (!user) {
      throw new NotFoundException(ERRORS_MESSAGES.NOT_FOUND('user', name, 'name'));
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
}
