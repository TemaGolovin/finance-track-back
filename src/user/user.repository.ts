import { Injectable } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  findUsersByUsername(
    name: string,
    select: { id?: boolean; name?: boolean; email?: boolean } = { id: true, name: true },
  ) {
    return this.prisma.user.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      select: select,
    });
  }

  findUserByUsername(name: string) {
    return this.prisma.user.findUnique({
      where: {
        name: name,
      },
    });
  }

  createInvitation({
    groupId,
    recipientId,
    senderId,
  }: { groupId: string; recipientId: string; senderId: string }) {
    return this.prisma.invitation.create({
      data: {
        groupId,
        recipientId,
        senderId,
        status: InvitationStatus.PENDING,
      },
    });
  }

  getInventionsByRecipientId(recipientId: string) {
    return this.prisma.invitation.findMany({
      where: {
        recipientId,
      },
      include: {
        sender: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  getInventionsBySenderId(senderId: string) {
    return this.prisma.invitation.findMany({
      where: {
        senderId,
      },
      include: {
        recipient: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  getInventionById(invitationId: string) {
    return this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
    });
  }

  findUsersByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        name: true,
      },
    });
  }

  updateInvitation({ status }: { status: InvitationStatus }, invitationId: string) {
    return this.prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        status,
      },
    });
  }
}
