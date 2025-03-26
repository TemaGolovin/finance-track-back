import { ApiProperty } from '@nestjs/swagger';

export class InvitationEntity {
  @ApiProperty({
    description: 'group id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  groupId: string;

  @ApiProperty({
    description: 'invitation id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'sender id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  senderId: string;

  @ApiProperty({
    description: 'recipient id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  recipientId: string;

  @ApiProperty({
    description: 'invitation status',
    example: 'PENDING',
    required: true,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'],
  })
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

  @ApiProperty({
    description: 'invitation creation date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'invitation update date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  updatedAt: Date;
}
