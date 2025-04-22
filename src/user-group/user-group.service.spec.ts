import { Test, TestingModule } from '@nestjs/testing';
import { UserGroupService } from './user-group.service';
import { CategoryService } from 'src/category/category.service';
import { UserGroupEntity } from './entities/user-group.entity';
import { UserGroupRepository } from './user-group.repository';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ERRORS_MESSAGES } from 'src/constants/errors';

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
      },
    },
    {
      user: {
        id: '2',
        name: 'creator test',
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
    expect(result).toEqual({
      byCategories: [],
      totalSum: 0,
    });
  });

  it('getUserGroupStat method when operation NOT EMPTY - success', async () => {
    const userGroupStat: {
      id: string;
      name: string;
      totalAmount: number;
    }[] = [
      {
        id: '1',
        name: 'category 1',
        totalAmount: 100,
      },
      {
        id: '2',
        name: 'category 2',
        totalAmount: 400,
      },
      {
        id: '3',
        name: 'category 3',
        totalAmount: 500,
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

    expect(result).toEqual({
      byCategories: [
        {
          id: '1',
          name: 'category 1',
          totalAmount: 100,
          proportion: 10,
        },
        {
          id: '2',
          name: 'category 2',
          totalAmount: 400,
          proportion: 40,
        },
        {
          id: '3',
          name: 'category 3',
          totalAmount: 500,
          proportion: 50,
        },
      ],
      totalSum: 1000,
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
      expect(error.getResponse().message).toBe(ERRORS_MESSAGES.NOT_FOUND('Group', '1'));
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
      expect(error.getResponse().message).toBe(ERRORS_MESSAGES.NOT_FOUND('Group', '1'));
    }
  });
});
