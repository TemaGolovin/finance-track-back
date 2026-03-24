import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { CreateGroupCategoryDto } from './dto/create-group-category.dto';
import { UpdateGroupCategoryDto } from './dto/update-group-category.dto';
import { Category, OperationType, Prisma } from '@prisma/client';

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
    return await this.prisma.userRelationGroupUser.deleteMany({
      where: {
        userId,
        userRelationGroupId: groupId,
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

  async getUserGroupById(groupId: string, userId: string) {
    return await this.prisma.userRelationGroup.findUnique({
      where: {
        id: groupId,
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
                receivedInvitations: true,
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

  async getUserGroupStat(
    groupId: string,
    categoryType?: OperationType,
    startDate?: string,
    endDate?: string,
  ) {
    const operationDateFilter: Record<string, Date> = {};

    if (startDate) {
      operationDateFilter.gte = new Date(startDate);
    }

    if (endDate) {
      operationDateFilter.lte = new Date(endDate);
    }

    return this.prisma.groupCategory
      .findMany({
        where: { groupId, categoryType },
        include: {
          personalCategories: {
            include: {
              personalCategory: {
                include: {
                  operations: {
                    where: {
                      ...(Object.keys(operationDateFilter).length > 0 && {
                        operationDate: operationDateFilter,
                      }),
                    },
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
          totalAmount: group.personalCategories.reduce((sum: Prisma.Decimal, pc) => {
            const categorySum = pc.personalCategory.operations.reduce(
              (catSum: Prisma.Decimal, op) => catSum.plus(op.value),
              new Prisma.Decimal(0),
            );
            return sum.plus(categorySum);
          }, new Prisma.Decimal(0)),
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
            categoryType: category.categoryType,
            defaultKey: category.defaultKey,
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

  async getUserGroupOperations(
    groupId: string,
    categoryType?: OperationType,
    startDate?: string,
    endDate?: string,
    categoryId?: string,
  ) {
    const operationDateFilter: Record<string, Date> = {};

    if (startDate) {
      operationDateFilter.gte = new Date(startDate);
    }

    if (endDate) {
      operationDateFilter.lte = new Date(endDate);
    }

    // If categoryId is provided, we need to check if it's a groupCategoryId
    // Get all personal category IDs mapped to this groupCategoryId
    let personalCategoryIds: string[] = [];
    if (categoryId) {
      const mappedCategories = await this.prisma.personalCategoryMap.findMany({
        where: {
          groupCategoryId: categoryId,
        },
        select: {
          categoryId: true,
        },
      });

      personalCategoryIds = mappedCategories.map((m) => m.categoryId);
    }

    const whereClause: Prisma.OperationWhereInput = {
      category: {
        groupsMapping: {
          some: {
            groupCategory: {
              groupId,
            },
          },
        },
      },
      type: categoryType,
      ...(Object.keys(operationDateFilter).length > 0 && {
        operationDate: operationDateFilter,
      }),
      ...(personalCategoryIds.length > 0 && {
        categoryId: {
          in: personalCategoryIds,
        },
      }),
    };

    return this.prisma.operation.findMany({
      where: whereClause,
      orderBy: {
        operationDate: 'desc',
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });
  }

  async connectGroupCategoriesToPersonalCategories(
    relatedCategories: { personalCategoryId: string; groupCategoryId: string }[],
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const groupCategoriesPromises = relatedCategories.map((category) => {
        return tx.groupCategory.update({
          where: {
            id: category.groupCategoryId,
          },
          data: {
            personalCategories: {
              upsert: {
                where: {
                  groupCategoryId_userId: {
                    groupCategoryId: category.groupCategoryId,
                    userId,
                  },
                },
                create: {
                  userId,
                  categoryId: category.personalCategoryId,
                },
                update: {
                  categoryId: category.personalCategoryId,
                },
              },
            },
          },
          include: {
            personalCategories: true,
          },
        });
      });

      return await Promise.all(groupCategoriesPromises);
    });
  }

  async getGroupCategories(groupId: string, userId: string) {
    return this.prisma.groupCategory.findMany({
      where: { groupId },
      include: { personalCategories: { where: { userId } } },
    });
  }

  async getGroupInvitations(groupId: string) {
    return await this.prisma.invitation.findMany({
      where: {
        groupId,
      },
      include: {
        recipient: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  async createGroupCategory(groupId: string, dto: CreateGroupCategoryDto) {
    return this.prisma.groupCategory.create({
      data: {
        name: dto.name,
        categoryType: dto.categoryType,
        groupId,
      },
      select: {
        id: true,
        name: true,
        categoryType: true,
        defaultKey: true,
      },
    });
  }

  async updateGroupCategory(categoryId: string, dto: UpdateGroupCategoryDto) {
    return this.prisma.groupCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.categoryType !== undefined && { categoryType: dto.categoryType }),
      },
      select: {
        id: true,
        name: true,
        categoryType: true,
        defaultKey: true,
      },
    });
  }

  async deleteGroupCategory(categoryId: string) {
    return this.prisma.groupCategory.delete({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async findGroupCategoryById(categoryId: string) {
    return this.prisma.groupCategory.findUnique({
      where: { id: categoryId },
    });
  }
}
