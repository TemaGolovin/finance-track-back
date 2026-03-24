import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OperationType } from '@prisma/client';

export class UpdateGroupCategoryDto {
  @ApiProperty({ example: 'Food', type: String, required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: OperationType, example: OperationType.EXPENSE, required: false })
  @IsEnum(OperationType)
  @IsOptional()
  categoryType?: OperationType;
}
