import { ApiProperty } from '@nestjs/swagger';

export class TemplateErrorResponse {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  error: string;
}
