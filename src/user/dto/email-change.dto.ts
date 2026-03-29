import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail()
  @ApiProperty({ description: 'new email address', required: true })
  newEmail: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  @ApiProperty({ description: 'email change token', required: true })
  token: string;
}
