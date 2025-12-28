import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateOperationDto {
  @IsString()
  @ApiProperty({
    description: 'Operation comment',
    example: 'Food',
    required: true,
    type: String,
  })
  comment: string;

  @IsUUID()
  @ApiProperty({
    description: 'Operation category id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  categoryId: string;

  @IsNumber()
  @ApiProperty({
    description: 'Operation value',
    example: 100,
    required: true,
    type: Number,
  })
  value: number;

  @IsEnum(['INCOME', 'EXPENSE'], { message: 'type must be INCOME or EXPENSE' })
  @ApiProperty({
    description: 'Operation type',
    example: 'INCOME',
    required: true,
    enum: ['INCOME', 'EXPENSE'],
  })
  type: 'INCOME' | 'EXPENSE';

  @IsDateString()
  @ApiProperty({
    description: 'Operation date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: String,
  })
  operationDate: string;
}
