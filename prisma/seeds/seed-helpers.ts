import { Category, PrismaClient } from '@prisma/client';
import { genSalt, hash } from 'bcryptjs';
import { getDefaultCategories } from '../../src/constants/get-default-categories';

const genInteger = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

export const createDefaultCategoriesWithOperations = async (
  prisma: PrismaClient,
  userId: string,
) => {
  const newDefaultCategories = getDefaultCategories(userId);

  await prisma.category.createMany({
    data: newDefaultCategories,
  });

  const createdCategories = await prisma.category.findMany({
    where: {
      userId,
    },
  });

  await prisma.operation.createMany({
    data: createdCategories.map((category, index) => {
      return {
        categoryId: category.id,
        comment: index % 2 === 0 ? `Operation ${index + 1} ${category.name}` : undefined,
        type: category.categoryType,
        value: genInteger(10, 10000),
        userId,
        operationDate: new Date(),
      };
    }),
  });
};

export const createUser = async (prisma: PrismaClient) => {
  const userNumber = genInteger(100, 100000);

  const salt = await genSalt(10);
  const hashPassword = await hash('123', salt);

  const user = await prisma.user.create({
    data: {
      email: `email${userNumber}@example.com`,
      name: `User.${userNumber}`,
      password: hashPassword,
    },
  });

  return user;
};

export const createUserGroup = async (prisma: PrismaClient, userId: string) => {
  const group = await prisma.userRelationGroup.create({
    data: {
      name: `Group ${genInteger(0, 100000)}`,
      creatorId: userId,
      users: {
        create: {
          userId: userId,
        },
      },
    },
  });

  return group;
};

export const createUserGroupCategories = async (
  prisma: PrismaClient,
  groupId: string,
  personalCategories: Category[],
) => {
  return await prisma.$transaction(async (tx) => {
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
};

export const addUserToGroup = async (prisma: PrismaClient, userId: string, groupId: string) => {
  return await prisma.userRelationGroup.update({
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
};

export const getCategoriesByUserId = async (prisma: PrismaClient, userId: string) => {
  return await prisma.category.findMany({
    where: {
      userId,
    },
  });
};

export const getGroupCategoriesByGroupId = async (prisma: PrismaClient, groupId: string) => {
  return await prisma.groupCategory.findMany({
    where: {
      groupId,
    },
  });
};

export const mapCategoryToGroup = async (
  prisma: PrismaClient,
  relatedCategoriesIds: { groupCategoryId: string; categoryId: string }[],
  userId: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const groupCategoriesPromises = relatedCategoriesIds.map((category) => {
      return tx.groupCategory.update({
        where: {
          id: category.groupCategoryId,
        },
        data: {
          personalCategories: {
            create: {
              categoryId: category.categoryId,
              userId,
            },
          },
        },
      });
    });

    return await Promise.all(groupCategoriesPromises);
  });
};

export const getGroupCategory = async (prisma: PrismaClient, groupId: string) => {
  return await prisma.groupCategory.findMany({
    where: {
      groupId,
    },
  });
};

export const createUsersWithCategoriesAndJoinToGroup = async (prisma: PrismaClient) => {
  const firstUser = await createUser(prisma);
  await createDefaultCategoriesWithOperations(prisma, firstUser.id);
  const firstUserCategories = await getCategoriesByUserId(prisma, firstUser.id);

  const secondUser = await createUser(prisma);
  await createDefaultCategoriesWithOperations(prisma, secondUser.id);
  const secondUserCategories = await getCategoriesByUserId(prisma, secondUser.id);

  const group = await createUserGroup(prisma, firstUser.id);

  await createUserGroupCategories(prisma, group.id, firstUserCategories);

  const groupCategories = await getGroupCategoriesByGroupId(prisma, group.id);

  const mappedCategoriesIds = groupCategories.map((category) => {
    return {
      groupCategoryId: category.id,
      categoryId: secondUserCategories.find((cat) => cat.defaultKey === category.defaultKey)?.id,
    };
  });

  await addUserToGroup(prisma, secondUser.id, group.id);

  await mapCategoryToGroup(prisma, mappedCategoriesIds, secondUser.id);

  return { firstUser, secondUser, group };
};

export const clearDatabase = async (prisma: PrismaClient) => {
  await prisma.operation.deleteMany({});
  await prisma.personalCategoryMap.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.groupCategory.deleteMany({});
  await prisma.userRelationGroup.deleteMany({});
  await prisma.user.deleteMany({});
};
