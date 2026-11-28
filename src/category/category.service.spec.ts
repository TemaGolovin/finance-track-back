import { ConflictException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { OperationEntity } from 'src/operation/entity/operation.entity';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';
import { CategoryResponseEntity } from './entity/category.entity';

type CategoryWithOperations = CategoryResponseEntity | { operations: Partial<OperationEntity>[] };

const creationDate = new Date();

describe('CategoryService', () => {
  let service: CategoryService;
  let i18n: { t: jest.Mock };

  const categoryRepositoryMock = {
    findManyWithFilterTypeAndDate: jest.fn(),
    findFirstByIdAndUserId: jest.fn(),
    countOperationsByCategoryId: jest.fn(),
    countGroupMappingsByCategoryId: jest.fn(),
    deleteCategory: jest.fn(),
  };

  beforeEach(async () => {
    i18n = { t: jest.fn((key: string) => key) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: categoryRepositoryMock,
        },
        {
          provide: I18nService,
          useValue: i18n,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    jest.clearAllMocks();
    i18n.t.mockImplementation((key: string) => key);
  });

  it('should be defined CategoryService', () => {
    expect(service).toBeDefined();
  });

  it('getStatCategories method when operation EMPTY - success', async () => {
    const categoriesEmpty = [];
    categoryRepositoryMock.findManyWithFilterTypeAndDate.mockResolvedValue(categoriesEmpty);

    const result = await service.getStatCategories({
      userId: '1',
      operationType: 'INCOME',
      startDate: '2025-01-12T20:17:46.384Z',
      endDate: '2025-01-12T20:17:46.384Z',
    });
    expect({
      ...result,
      categories: result.categories.map((category) => ({
        ...category,
        sum: category.sum.toString(),
        proportion: category.proportion.toString(),
      })),
      totalSum: result.totalSum.toString(),
    }).toEqual({
      categories: [],
      totalSum: '0',
    });
  });

  it('getStatCategories method category ONE WITHOUT OPERATIONS - success', async () => {
    const existedOneCategory: CategoryWithOperations[] = [
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '1',
        name: 'test',
        operations: [],
      },
    ];

    categoryRepositoryMock.findManyWithFilterTypeAndDate.mockResolvedValue(existedOneCategory);

    const result = await service.getStatCategories({
      userId: '1',
      operationType: 'INCOME',
      startDate: '2025-01-12T20:17:46.384Z',
      endDate: '2025-01-12T20:17:46.384Z',
    });

    expect({
      ...result,
      categories: result.categories.map((category) => ({
        ...category,
        sum: category.sum.toString(),
        proportion: category.proportion.toString(),
      })),
      totalSum: result.totalSum.toString(),
    }).toEqual({
      categories: [],
      totalSum: '0',
    });
  });

  it('getStatCategories method category ONE WITH OPERATIONS - success', async () => {
    const existedOneCategory: CategoryWithOperations[] = [
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '1',
        name: 'test',
        operations: [
          {
            value: 100,
          },
          {
            value: 200,
          },
        ],
      },
    ];

    categoryRepositoryMock.findManyWithFilterTypeAndDate.mockResolvedValue(existedOneCategory);

    const result = await service.getStatCategories({
      userId: '1',
      operationType: 'INCOME',
      startDate: '2025-01-12T20:17:46.384Z',
      endDate: '2025-01-12T20:17:46.384Z',
    });

    expect({
      ...result,
      categories: result.categories.map((category) => ({
        ...category,
        sum: category.sum.toString(),
        proportion: category.proportion.toString(),
      })),
      totalSum: result.totalSum.toString(),
    }).toEqual({
      categories: [
        {
          id: '1',
          name: 'test',
          sum: '300',
          proportion: '100',
        },
      ],
      totalSum: '300',
    });
  });

  it('getStatCategories method category MANY - success', async () => {
    const existedManyCategories: (CategoryWithOperations & {
      categoryType: 'INCOME' | 'EXPENSE';
    })[] = [
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '0',
        name: 'test',
        categoryType: 'INCOME',
        color: '#000000',
        icon: 'CategoryIcon',
        operations: [
          {
            value: 400,
          },
          {
            value: 100,
          },
        ],
      },
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '1',
        name: 'test 1',
        categoryType: 'INCOME',
        color: '#000000',
        icon: 'CategoryIcon',
        operations: [
          {
            value: 500,
          },
        ],
      },
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '2',
        name: 'test 2',
        categoryType: 'INCOME',
        color: '#000000',
        icon: 'CategoryIcon',
        operations: [],
      },
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '3',
        name: 'test 3',
        categoryType: 'INCOME',
        color: '#000000',
        icon: 'CategoryIcon',
        operations: [
          {
            value: 200,
          },
          {
            value: 200,
          },
          {
            value: 200,
          },
          {
            value: 400,
          },
        ],
      },
    ];

    categoryRepositoryMock.findManyWithFilterTypeAndDate.mockResolvedValue(existedManyCategories);

    const result = await service.getStatCategories({
      userId: '1',
      operationType: 'INCOME',
      startDate: '2025-01-12T20:17:46.384Z',
      endDate: '2025-01-12T20:17:46.384Z',
    });

    expect({
      ...result,
      categories: result.categories.map((category) => ({
        ...category,
        sum: category.sum.toString(),
        proportion: category.proportion.toString(),
      })),
      totalSum: result.totalSum.toString(),
    }).toEqual({
      categories: [
        {
          id: '3',
          name: 'test 3',
          sum: '1000',
          proportion: '50',
          type: 'INCOME',
          color: '#000000',
          icon: 'CategoryIcon',
        },
        {
          id: '0',
          name: 'test',
          sum: '500',
          proportion: '25',
          type: 'INCOME',
          color: '#000000',
          icon: 'CategoryIcon',
        },
        {
          id: '1',
          name: 'test 1',
          sum: '500',
          proportion: '25',
          type: 'INCOME',
          color: '#000000',
          icon: 'CategoryIcon',
        },
      ],
      totalSum: '2000',
    });
  });

  describe('deleteCategory', () => {
    const categoryId = 'cat-1';
    const userId = 'user-1';

    it('throws NotFound when category does not exist', async () => {
      categoryRepositoryMock.findFirstByIdAndUserId.mockResolvedValue(null);

      await expect(service.deleteCategory(categoryId, userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(categoryRepositoryMock.deleteCategory).not.toHaveBeenCalled();
    });

    it('throws Conflict when category has operations', async () => {
      categoryRepositoryMock.findFirstByIdAndUserId.mockResolvedValue({ id: categoryId });
      categoryRepositoryMock.countOperationsByCategoryId.mockResolvedValue(2);

      await expect(service.deleteCategory(categoryId, userId)).rejects.toMatchObject({
        response: expect.objectContaining({
          message: 'errors.CATEGORY_HAS_OPERATIONS',
          statusCode: HttpStatus.CONFLICT,
        }),
      });
      expect(categoryRepositoryMock.deleteCategory).not.toHaveBeenCalled();
    });

    it('throws Conflict when category is mapped to a group', async () => {
      categoryRepositoryMock.findFirstByIdAndUserId.mockResolvedValue({ id: categoryId });
      categoryRepositoryMock.countOperationsByCategoryId.mockResolvedValue(0);
      categoryRepositoryMock.countGroupMappingsByCategoryId.mockResolvedValue(1);

      await expect(service.deleteCategory(categoryId, userId)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(i18n.t).toHaveBeenCalledWith('errors.CATEGORY_MAPPED_TO_GROUP');
      expect(categoryRepositoryMock.deleteCategory).not.toHaveBeenCalled();
    });

    it('deletes when category has no operations and no group mappings', async () => {
      const deleted = { id: categoryId, name: 'food' };
      categoryRepositoryMock.findFirstByIdAndUserId.mockResolvedValue({ id: categoryId });
      categoryRepositoryMock.countOperationsByCategoryId.mockResolvedValue(0);
      categoryRepositoryMock.countGroupMappingsByCategoryId.mockResolvedValue(0);
      categoryRepositoryMock.deleteCategory.mockResolvedValue(deleted);

      await expect(service.deleteCategory(categoryId, userId)).resolves.toEqual(deleted);
      expect(categoryRepositoryMock.deleteCategory).toHaveBeenCalledWith(categoryId, userId);
    });
  });

  // it('getUserGroupStat method when operation NOT EMPTY - success', async () => {
  //   const userGroupStat: {
  //     id: string;
  //     name: string;
  //     totalAmount: number;
  //   }[] = [
  //     {
  //       id: '1',
  //       name: 'category 1',
  //       totalAmount: 100,
  //     },
  //     {
  //       id: '2',
  //       name: 'category 2',
  //       totalAmount: 400,
  //     },
  //     {
  //       id: '3',
  //       name: 'category 3',
  //       totalAmount: 500,
  //     },
  //   ];

  //   userGroupRepositoryMock.getUserGroupById.mockResolvedValue(existedCategories);
  //   userGroupRepositoryMock.getUserGroupStat.mockResolvedValue(userGroupStat);

  //   const result = await service.getUserGroupStat({
  //     groupId: '1',
  //     userId: '1',
  //     operationType: 'INCOME',
  //     startDate: '2025-01-12T20:17:46.384Z',
  //     endDate: '2025-01-12T20:17:46.384Z',
  //   });

  //   expect(result).toEqual({
  //     byCategories: [
  //       {
  //         id: '1',
  //         name: 'category 1',
  //         totalAmount: 100,
  //         proportion: 10,
  //       },
  //       {
  //         id: '2',
  //         name: 'category 2',
  //         totalAmount: 400,
  //         proportion: 40,
  //       },
  //       {
  //         id: '3',
  //         name: 'category 3',
  //         totalAmount: 500,
  //         proportion: 50,
  //       },
  //     ],
  //     totalSum: 1000,
  //   });
  // });

  // it('getUserGroupStat method when group not found - fail', async () => {
  //   try {
  //     userGroupRepositoryMock.getUserGroupById.mockResolvedValue(null);

  //     await service.getUserGroupStat({
  //       groupId: '1',
  //       userId: '1',
  //       operationType: 'INCOME',
  //       startDate: '2025-01-12T20:17:46.384Z',
  //       endDate: '2025-01-12T20:17:46.384Z',
  //     });
  //   } catch (error) {
  //     expect(error).toBeInstanceOf(NotFoundException);
  //     expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
  //     expect(error.getResponse().message).toBe('Group with id 1 not found');
  //   }
  // });

  // it('getUserGroupStat method when member in group not found - fail', async () => {
  //   try {
  //     userGroupRepositoryMock.getUserGroupById.mockResolvedValue(existedCategories);

  //     await service.getUserGroupStat({
  //       groupId: '1',
  //       userId: '333',
  //       operationType: 'INCOME',
  //       startDate: '2025-01-12T20:17:46.384Z',
  //       endDate: '2025-01-12T20:17:46.384Z',
  //     });
  //   } catch (error) {
  //     expect(error).toBeInstanceOf(NotFoundException);
  //     expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
  //     expect(error.getResponse().message).toBe('Group with id 1 not found');
  //   }
  // });
});
