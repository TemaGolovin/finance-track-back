import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { InvitationStatus as InvitationStatusEnum } from '@prisma/client';
import { UserEntity } from 'src/user/entity/user.entity';

class InvitationStatus {
  @ApiProperty({
    example: 'PENDING',
    required: true,
    enum: InvitationStatusEnum,
    description: 'invitation status',
  })
  status: InvitationStatusEnum;
}

class UserGroupUserEntity {
  @ApiProperty({
    type: IntersectionType(
      OmitType(UserEntity, ['createAt', 'updateAt', 'email'] as const),
      InvitationStatus,
    ),
  })
  user: Omit<UserEntity, 'createAt' | 'updateAt' | 'email'> & {
    status?: InvitationStatusEnum;
  };
}

export class UserGroupEntity {
  @ApiProperty({
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 'family',
    required: true,
    type: String,
  })
  name: string;

  @ApiProperty({
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  creatorId: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  createAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  updateAt: Date;

  @ApiProperty({
    type: [UserGroupUserEntity],
  })
  users: UserGroupUserEntity[];

  @ApiProperty({
    type: OmitType(UserEntity, ['createAt', 'updateAt', 'email'] as const),
  })
  creator: Omit<UserEntity, 'createAt' | 'updateAt' | 'email'>;
}
