import { ApiProperty, OmitType } from '@nestjs/swagger';

class CategoryForOperation {
  @ApiProperty({
    description: 'Category name',
    example: 'Food',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Category color',
    example: '#FF0000',
    type: String,
  })
  color: string;

  @ApiProperty({
    description: 'Category icon',
    example: 'CategoryIcon',
    type: String,
  })
  icon: string;
}

export class OperationEntity {
  @ApiProperty({
    description: 'Operation id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Operation comment',
    example: 'Food',
    required: false,
    type: String,
    uniqueItems: true,
  })
  comment: string;

  @ApiProperty({
    description: 'Operation value',
    example: 100,
    required: true,
    type: Number,
  })
  value: number;

  @ApiProperty({
    description: 'Operation type',
    example: 'INCOME',
    required: true,
    enum: ['INCOME', 'EXPENSE'],
  })
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty({
    description: 'Operation category id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  categoryId: string;

  @ApiProperty({
    description: 'Operation date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  operationDate: Date;

  @ApiProperty({
    description: 'Operation creation date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  createAt: Date;

  @ApiProperty({
    description: 'Operation update date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  updateAt: Date;

  @ApiProperty({
    description: 'Operation user id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Operation category',
    example: {
      name: 'Food',
      color: '#FF0000',
      icon: 'CategoryIcon',
    },
    required: true,
    type: CategoryForOperation,
  })
  category: CategoryForOperation;
}

export class OperationByDateEntity {
  @ApiProperty({
    description: 'Operations Date',
    example: '21.12.2023',
    type: String,
  })
  date: string;

  @ApiProperty({
    description: 'Operations by date',
    isArray: true,
    required: true,
    example: [
      {
        id: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        comment: 'Food',
        value: 100,
        type: 'INCOME',
        categoryId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        operationDate: '2023-01-01T00:00:00.000Z',
        createAt: '2023-01-01T00:00:00.000Z',
        updateAt: '2023-01-01T00:00:00.000Z',
        userId: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
        category: {
          name: 'Food',
          color: '#FF0000',
          icon: 'CategoryIcon',
        },
      },
    ],
    type: [OperationEntity],
  })
  operations: OperationEntity[];
}

export class OperationByDateWithTotalSum {
  @ApiProperty({
    type: String,
    description: 'Total sum of operations by date',
    example: '100',
  })
  totalSum: string;

  @ApiProperty({
    type: [OperationByDateEntity],
    description: 'Operations by date',
    example: [
      {
        date: '21.12.2023',
        operations: [],
      },
    ],
  })
  operationsByDate: OperationByDateEntity[];
}

export class CreateOperationEntity extends OmitType(OperationEntity, ['category']) {}

export class UpdateOperationEntity extends OmitType(OperationEntity, ['category']) {}
