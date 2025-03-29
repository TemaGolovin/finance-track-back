import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';

@Injectable()
export class UserGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUserGroup(groupDto: CreateUserGroupDto, userId: string) {
    return await this.prisma.userRelationGroup.create({
      data: {
        name: groupDto.name,
        creatorId: userId,
        users: {
          create: {
            userId: userId,
          },
        },
      },
    });
  }

  async addUserToGroup(userId: string, groupId: string) {
    return await this.prisma.userRelationGroup.update({
      where: {
        id: groupId,
      },
      data: {
        users: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async removeUserFromGroup(userId: string, groupId: string) {
    return await this.prisma.userRelationGroup.update({
      where: {
        id: groupId,
      },
      data: {
        users: {
          disconnect: {
            id: userId,
          },
        },
      },
    });
  }

  async getUserGroupsByUserId(userId: string) {
    return await this.prisma.userRelationGroup.findMany({
      where: {
        users: {
          some: {
            user: {
              id: userId,
            },
          },
        },
      },
      include: {
        users: {
          select: {
            user: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
        creator: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  async getUserGroupById(groupId: string) {
    return await this.prisma.userRelationGroup.findUnique({
      where: {
        id: groupId,
      },
      include: {
        users: {
          select: {
            user: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
        creator: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  async deleteUserGroup(groupId: string) {
    return await this.prisma.userRelationGroup.delete({
      where: {
        id: groupId,
      },
    });
  }
}
