import { ApiProperty } from '@nestjs/swagger';

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
}

export class CreateOperationEntity extends OperationEntity {}

export class UpdateOperationEntity extends OperationEntity {}
