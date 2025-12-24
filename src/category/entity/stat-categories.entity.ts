import { ApiProperty } from '@nestjs/swagger';

class Category {
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
    description: 'sum operation in category',
    example: 100,
    required: true,
    type: Number,
  })
  sum: number;

  @ApiProperty({
    description: 'Category proportion in percent',
    example: 23,
    required: true,
    type: Number,
  })
  proportion: number;

  @ApiProperty({
    description: 'Category color',
    example: '#ff0000',
    required: true,
    type: String,
  })
  type: string;
}

export class StatCategoriesEntity {
  @ApiProperty({
    description: 'Total sum of all operations',
    example: 100,
    required: true,
  })
  totalSum: number;

  @ApiProperty({ type: [Category] })
  categories: Category[];
}
