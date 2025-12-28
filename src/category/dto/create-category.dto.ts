import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
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

  @ApiProperty({
    description: 'Category color in hex format',
    example: '#FF0000',
    required: true,
    type: String,
  })
  color: string;

  @ApiProperty({
    description: 'Category icon in string format',
    example: 'CategoryIcon',
    required: true,
    type: String,
  })
  icon: string;
}
