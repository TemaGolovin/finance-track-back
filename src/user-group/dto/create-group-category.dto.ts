import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { OperationType } from '@prisma/client';

export class CreateGroupCategoryDto {
  @ApiProperty({ example: 'Food', type: String })
  @IsString()
  name: string;

  @ApiProperty({ enum: OperationType, example: OperationType.EXPENSE })
  @IsEnum(OperationType)
  categoryType: OperationType;
}
