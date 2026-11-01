import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class GetCategoriesDto {
  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  @ApiProperty({
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    example: 'EXPENSE',
  })
  type?: 'EXPENSE' | 'INCOME';
}
