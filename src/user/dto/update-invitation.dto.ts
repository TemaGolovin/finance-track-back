import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@prisma/client';

export class UpdateInvitationDto {
  @ApiProperty({
    example: 'ACCEPTED',
    required: true,
    enum: InvitationStatus,
    description: 'invitation status',
  })
  status: InvitationStatus;
}
