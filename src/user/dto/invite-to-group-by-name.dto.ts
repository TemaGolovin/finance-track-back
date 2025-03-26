import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class InviteToGroupByNameDto {
  @IsString()
  @ApiProperty({
    description: 'user name',
    example: 'voin123',
    required: true,
    type: String,
    uniqueItems: true,
  })
  name: string;

  @IsUUID()
  @ApiProperty({
    description: 'group id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  groupId: string;
}
