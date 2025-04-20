import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { Category, OperationType } from '@prisma/client';

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
      select: {
        id: true,
        name: true,
        creatorId: true,
        createAt: true,
        updateAt: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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
          create: {
            userId,
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

  async getUserGroupStat(groupId: string, categoryType?: OperationType) {
    return this.prisma.groupCategory
      .findMany({
        where: { groupId, categoryType },
        include: {
          personalCategories: {
            include: {
              personalCategory: {
                include: {
                  operations: {
                    select: {
                      value: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((groups) =>
        groups.map((group) => ({
          id: group.id,
          name: group.name,
          totalAmount: group.personalCategories.reduce((sum, pc) => {
            const categorySum = pc.personalCategory.operations.reduce(
              (catSum, op) => catSum + op.value,
              0,
            );
            return sum + categorySum;
          }, 0),
        })),
      );
  }

  async deleteUserGroup(groupId: string) {
    return await this.prisma.userRelationGroup.delete({
      where: {
        id: groupId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getUserHaveAccessToMe(targetUserId: string, currentUserId: string) {
    return (
      (await this.prisma.userRelationGroupUser.count({
        where: {
          userId: targetUserId,
          userRelationGroup: {
            users: {
              some: {
                userId: currentUserId,
              },
            },
          },
        },
      })) > 0
    );
  }

  async createInitGroupCategories(personalCategories: Category[], groupId: string) {
    return this.prisma.$transaction(async (tx) => {
      const groupCategoriesPromises = personalCategories.map((category) => {
        return tx.groupCategory.create({
          data: {
            groupId,
            name: category.name,
            personalCategories: {
              create: {
                categoryId: category.id,
                userId: category.userId,
              },
            },
          },
        });
      });

      return await Promise.all(groupCategoriesPromises);
    });
  }

  async connectGroupCategoriesToPersonalCategories(
    relatedCategories: { personalCategoryId: string; groupCategoryId: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const groupCategoriesPromises = relatedCategories.map((category) => {
        return tx.groupCategory.update({
          where: {
            id: category.groupCategoryId,
          },
          data: {
            personalCategories: {
              connect: {
                id: category.personalCategoryId,
              },
            },
          },
        });
      });

      return await Promise.all(groupCategoriesPromises);
    });
  }
}
