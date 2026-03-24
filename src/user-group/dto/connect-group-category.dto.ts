import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';

class RelatedCategory {
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: true,
    type: String,
  })
  groupCategoryId: string;

  @ValidateIf((o: RelatedCategory) => o.personalCategoryId != null)
  @IsUUID()
  @ApiProperty({
    example: 'c8e2d4f7-8b6d-4f7b-9f6d-7b6d4f7b6d7b',
    required: false,
    nullable: true,
    type: String,
    description: 'Null removes the link for this group category',
  })
  personalCategoryId: string | null;
}

export class ConnectGroupCategoryDto {
  @ApiProperty({
    required: true,
    type: [RelatedCategory],
  })
  relatedCategories: RelatedCategory[];
}
