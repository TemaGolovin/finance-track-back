import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class RegistrationDto {
  @IsString()
  @ApiProperty({
    description: 'user nickname',
    example: 'voin123',
    required: true,
    type: String,
    uniqueItems: true,
  })
  name: string;

  @IsEmail()
  @ApiProperty({
    description: 'user email',
    example: 'example@ex.com',
    required: true,
    type: String,
    uniqueItems: true,
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: 'user password',
    example: '123456',
    required: true,
    type: String,
  })
  password: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({
    description: 'user group id',
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: false,
    type: String,
  })
  groupId: string;
}

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: 'user email',
    example: 'example@ex.com',
    required: true,
    type: String,
    uniqueItems: true,
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: 'user password',
    example: '123456',
    required: true,
    type: String,
  })
  password: string;
}
