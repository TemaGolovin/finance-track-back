import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUserGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'family',
    required: true,
    type: String,
  })
  @IsString()
  name: string;
}
