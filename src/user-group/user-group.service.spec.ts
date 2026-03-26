import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { CategoryService } from 'src/category/category.service';
import { UserGroupEntity } from './entities/user-group.entity';
import { UserGroupRepository } from './user-group.repository';
import { UserGroupService } from './user-group.service';

const i18nMock = {
  t: jest.fn((key: string, opts?: { args?: Record<string, string> }) => {
    if (key === 'errors.NOT_FOUND' && opts?.args) {
      const { entity, id, fieldName } = opts.args;
      return `${entity} with ${fieldName} ${id} not found`;
    }
    return key;
  }),
};

const existedUserGroup: UserGroupEntity = {
  createAt: new Date(),
  updateAt: new Date(),
  creatorId: '2',
  creator: {
    id: '2',
    name: 'creator test',
  },
  id: '1',
  name: 'test',
  users: [
    {
      user: {
        id: '1',
        name: 'test user',
        status: 'ACCEPTED',
      },
    },
    {
      user: {
        id: '2',
        name: 'creator test',
        status: 'ACCEPTED',
      },
    },
  ],
};

describe('UserGroupService', () => {
  let service: UserGroupService;

  const userGroupRepositoryMock = {
    getUserGroupsByUserId: jest.fn(),
    createUserGroup: jest.fn(),
    getUserGroupById: jest.fn(),
    addUserToGroup: jest.fn(),
    removeUserFromGroup: jest.fn(),
    connectGroupCategoriesToPersonalCategories: jest.fn(),
    getUserGroupStat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGroupService,
        {
          provide: UserGroupRepository,
          useValue: userGroupRepositoryMock,
        },
        {
          provide: CategoryService,
          useValue: {},
        },
        {
          provide: I18nService,
          useValue: i18nMock,
        },
      ],
    }).compile();

    service = module.get<UserGroupService>(UserGroupService);
  });

  it('should be defined UserGroupService', () => {
    expect(service).toBeDefined();
  });

  it('getUserGroupStat method when operation EMPTY - success', async () => {
    const userGroupStat = [];

    userGroupRepositoryMock.getUserGroupById.mockResolvedValue(existedUserGroup);
    userGroupRepositoryMock.getUserGroupStat.mockResolvedValue(userGroupStat);

    const result = await service.getUserGroupStat({
      groupId: '1',
      userId: '1',
      operationType: 'INCOME',
      startDate: '2025-01-12T20:17:46.384Z',
      endDate: '2025-01-12T20:17:46.384Z',
    });
    expect({
      ...result,
      byCategories: result.byCategories.map((category) => ({
        ...category,
        totalAmount: category.totalAmount.toString(),
      })),
      totalSum: result.totalSum.toString(),
    }).toEqual({
      byCategories: [],
      totalSum: '0',
    });
  });

  it('getUserGroupStat method when operation NOT EMPTY - success', async () => {
    const userGroupStat: {
      id: string;
      name: string;
      totalAmount: Prisma.Decimal;
    }[] = [
      {
        id: '1',
        name: 'category 1',
        totalAmount: new Prisma.Decimal(100),
      },
      {
        id: '2',
        name: 'category 2',
        totalAmount: new Prisma.Decimal(400),
      },
      {
        id: '3',
        name: 'category 3',
        totalAmount: new Prisma.Decimal(500),
      },
    ];

    userGroupRepositoryMock.getUserGroupById.mockResolvedValue(existedUserGroup);
    userGroupRepositoryMock.getUserGroupStat.mockResolvedValue(userGroupStat);

    const result = await service.getUserGroupStat({
      groupId: '1',
      userId: '1',
      operationType: 'INCOME',
      startDate: '2025-01-12T20:17:46.384Z',
      endDate: '2025-01-12T20:17:46.384Z',
    });

    expect({
      ...result,
      byCategories: result.byCategories.map((category) => ({
        ...category,
        totalAmount: category.totalAmount.toString(),
        proportion: category.proportion.toString(),
      })),
      totalSum: result.totalSum.toString(),
    }).toEqual({
      byCategories: [
        {
          id: '1',
          name: 'category 1',
          totalAmount: '100',
          proportion: '10',
        },
        {
          id: '2',
          name: 'category 2',
          totalAmount: '400',
          proportion: '40',
        },
        {
          id: '3',
          name: 'category 3',
          totalAmount: '500',
          proportion: '50',
        },
      ],
      totalSum: '1000',
    });
  });

  it('getUserGroupStat method when group not found - fail', async () => {
    try {
      userGroupRepositoryMock.getUserGroupById.mockResolvedValue(null);

      await service.getUserGroupStat({
        groupId: '1',
        userId: '1',
        operationType: 'INCOME',
        startDate: '2025-01-12T20:17:46.384Z',
        endDate: '2025-01-12T20:17:46.384Z',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(error.getResponse().message).toBe('Group with id 1 not found');
    }
  });

  it('getUserGroupStat method when member in group not found - fail', async () => {
    try {
      userGroupRepositoryMock.getUserGroupById.mockResolvedValue(existedUserGroup);

      await service.getUserGroupStat({
        groupId: '1',
        userId: '333',
        operationType: 'INCOME',
        startDate: '2025-01-12T20:17:46.384Z',
        endDate: '2025-01-12T20:17:46.384Z',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(error.getResponse().message).toBe('Group with id 1 not found');
    }
  });
});
