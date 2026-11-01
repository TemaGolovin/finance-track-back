import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { GetUserGroupStatDto } from './get-user-group-stat.dto';

export class GetUserGroupOperationsDto extends GetUserGroupStatDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    required: false,
    type: String,
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
  })
  categoryId?: string;
}
