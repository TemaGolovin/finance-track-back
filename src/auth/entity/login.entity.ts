import { ApiProperty } from '@nestjs/swagger';

export class LoginEntity {
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
}
