import { IsDateString, IsEnum, IsNumber, IsString, IsUUID, } from "class-validator";

export class CreateOperationDto {
  @IsString()
  name: string;

  @IsUUID()
  categoryId: string;

  @IsNumber()
  value: number;
  
  @IsEnum(['INCOME', 'EXPENSE'], { message: 'type must be INCOME or EXPENSE' })
  type: "INCOME" | "EXPENSE";

  @IsDateString()
  operationDate: string;
}
