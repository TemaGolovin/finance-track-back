import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryResponseEntity {
  @ApiProperty({
    description: 'Category id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Food',
    required: true,
    type: String,
    uniqueItems: true,
  })
  name: string;

  @ApiProperty({
    description: 'Category creation date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  createAt: Date;

  @ApiProperty({
    description: 'Category update date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  updateAt: Date;
}

export class CategoryResponseEntity extends CreateCategoryResponseEntity {
  @ApiProperty({
    description: 'Operation id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    type: String,
  })
  operationId: string;
}
