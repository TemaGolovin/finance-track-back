import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { CategoryResponseEntity } from './entity/category.entity';
import { OperationEntity } from 'src/operation/entity/operation.entity';

type CategoryWithOperations = CategoryResponseEntity | { operations: Partial<OperationEntity>[] };

const creationDate = new Date();

describe('CategoryService', () => {
  let service: CategoryService;

  const categoryRepositoryMock = {
    findManyWithFilterTypeAndDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: categoryRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
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
    expect(result).toEqual({
      categories: [],
      totalSum: 0,
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

    expect(result).toEqual({
      categories: [
        {
          id: '1',
          name: 'test',
          sum: 0,
          proportion: 0,
        },
      ],
      totalSum: 0,
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

    expect(result).toEqual({
      categories: [
        {
          id: '1',
          name: 'test',
          sum: 300,
          proportion: 100,
        },
      ],
      totalSum: 300,
    });
  });

  it('getStatCategories method category MANY - success', async () => {
    const existedManyCategories: CategoryWithOperations[] = [
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '0',
        name: 'test',
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
        operations: [],
      },
      {
        createAt: creationDate,
        updateAt: creationDate,
        userId: '1',
        id: '3',
        name: 'test 3',
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

    expect(result).toEqual({
      categories: [
        {
          id: '0',
          name: 'test',
          sum: 500,
          proportion: 25,
        },
        {
          id: '1',
          name: 'test 1',
          sum: 500,
          proportion: 25,
        },
        {
          id: '2',
          name: 'test 2',
          sum: 0,
          proportion: 0,
        },
        {
          id: '3',
          name: 'test 3',
          sum: 1000,
          proportion: 50,
        },
      ],
      totalSum: 2000,
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
  //     expect(error.getResponse().message).toBe(ERRORS_MESSAGES.NOT_FOUND('Group', '1'));
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
  //     expect(error.getResponse().message).toBe(ERRORS_MESSAGES.NOT_FOUND('Group', '1'));
  //   }
  // });
});
