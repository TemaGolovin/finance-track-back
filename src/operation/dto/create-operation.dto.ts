import { IsNumber, IsString, } from "class-validator";

export class CreateOperationDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  value: number;
}
