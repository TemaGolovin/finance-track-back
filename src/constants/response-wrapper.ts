import { ApiProperty } from '@nestjs/swagger';

export class ResponseWrapper<T> {
  @ApiProperty({
    type: Boolean,
    example: true,
  })
  success: boolean;

  data: T;
}
