import { ApiProperty } from '@nestjs/swagger';

export class RegistrationEntity {
  @ApiProperty({
    description: 'user id',
    example: '0c9a7885-e78a-4854-bcb4-ea411983308a',
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
    description: 'access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNT',
    required: true,
    type: String,
  })
  token: string;

  @ApiProperty({
    description: 'user creation date',
    example: '2025-03-02T16:41:01.486Z',
    required: true,
    type: Date,
  })
  createAt: Date;

  @ApiProperty({
    description: 'user update date',
    example: '2025-03-02T16:41:01.486Z',
    required: true,
    type: Date,
  })
  updateAt: Date;

  @ApiProperty({
    description: 'user relation group id',
    example: '0c9a7885-e78a-4854-bcb4-ea411983308a',
    required: false,
    type: String,
  })
  userRelationGroupId?: string;
}
