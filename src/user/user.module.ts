import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserGroupModule } from 'src/user-group/user-group.module';
import { MailModule } from 'src/mail/mail.module';
import { EmailTokenModule } from 'src/email-token/email-token.module';

@Module({
  imports: [MailModule, EmailTokenModule, UserGroupModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
