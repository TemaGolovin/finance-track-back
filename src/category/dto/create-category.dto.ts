import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(3, { message: 'name must be at least 3 characters long' })
  @ApiProperty({description: 'Category name', example: "Food"})
  name: string;
}