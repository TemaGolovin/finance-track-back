import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateInvitationDto {
  @IsEnum(InvitationStatus)
  @ApiProperty({
    example: 'ACCEPTED',
    required: true,
    enum: InvitationStatus,
    description: 'invitation status',
  })
  status: InvitationStatus;
}
