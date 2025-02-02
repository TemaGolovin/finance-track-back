import { IsDateString, IsEnum, IsNumber, IsString, } from "class-validator";

export class CreateOperationDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsNumber()
  value: number;
  
  @IsEnum(['INCOME', 'EXPENSE'], { message: 'type must be INCOME or EXPENSE' })
  type: "INCOME" | "EXPENSE";

  @IsDateString()
  operationDate: string;
}
