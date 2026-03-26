import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateCategoryDto {
  @IsString()
  @MinLength(3, {
    message: i18nValidationMessage('validation.NAME_MIN_LENGTH'),
  })
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
