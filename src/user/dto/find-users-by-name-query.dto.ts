import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindUsersByNameQueryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'voin123' })
  name: string;
}
