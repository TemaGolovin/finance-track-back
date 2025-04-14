import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(3, { message: 'name must be at least 3 characters long' })
  @ApiProperty({
    description: 'Category name',
    example: 'Food',
    required: true,
    type: String,
    uniqueItems: true,
  })
  name: string;

  @IsEnum(['INCOME', 'EXPENSE'])
  @ApiProperty({
    description: 'Category type',
    example: 'INCOME',
    required: true,
    enum: ['INCOME', 'EXPENSE'],
  })
  categoryType: 'INCOME' | 'EXPENSE';
}
