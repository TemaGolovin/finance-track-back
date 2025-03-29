import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({
    description: 'user id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'user email',
    example: 'example@ex.com',
    required: true,
    type: String,
    uniqueItems: true,
  })
  email: string;

  @ApiProperty({
    description: 'user name',
    example: 'voin123',
    required: true,
    type: String,
    uniqueItems: true,
  })
  name: string;

  @ApiProperty({
    description: 'user creation date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  createAt: Date;

  @ApiProperty({
    description: 'user update date',
    example: '2023-01-01T00:00:00.000Z',
    required: true,
    type: Date,
  })
  updateAt: Date;
}
