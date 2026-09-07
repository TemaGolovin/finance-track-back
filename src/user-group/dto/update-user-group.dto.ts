import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateUserGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'family',
    required: true,
    type: String,
  })
  @IsString()
  @MinLength(1)
  name: string;
}
