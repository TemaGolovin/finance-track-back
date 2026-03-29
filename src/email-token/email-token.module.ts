import { Module } from '@nestjs/common';
import { EmailTokenService } from './email-token.service';

@Module({
  providers: [EmailTokenService],
  exports: [EmailTokenService],
})
export class EmailTokenModule {}
