import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class InviteToGroupByUserIdsDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'user ids',
    example: ['c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b'],
    required: true,
    type: String,
    uniqueItems: true,
    isArray: true,
  })
  userIds: string[];

  @IsUUID()
  @ApiProperty({
    description: 'group id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  groupId: string;
}
