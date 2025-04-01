import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class GetOperationDto {
  @IsDateString()
  @IsOptional()
  @ApiProperty({ required: false, type: String, example: '2025-04-01T16:06:21.740Z' })
  startDate: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({ required: false, type: String, example: '2025-04-01T16:06:21.740Z' })
  endDate: string;

  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'])
  @ApiProperty({ required: false, type: String, example: 'INCOME', enum: ['INCOME', 'EXPENSE'] })
  operationType: 'INCOME' | 'EXPENSE';
}
