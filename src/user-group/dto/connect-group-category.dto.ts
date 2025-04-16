import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

class RelatedCategory {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  personalCategoryId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  groupCategoryId: string;
}

export class ConnectGroupCategoryDto {
  @ApiProperty({
    required: true,
    type: [RelatedCategory],
  })
  relatedCategories: RelatedCategory[];
}
