import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerificationEmail(email: string, name: string, token: string) {
    const url = `${process.env.APP_URL}/verify-email?token=${token}`;
    await this.mailer.sendMail({
      to: email,
      subject: 'Подтвердите ваш email — Finance Track',
      template: 'verify-email',
      context: { name, url },
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const url = `${process.env.APP_URL}/reset-password?token=${token}`;
    await this.mailer.sendMail({
      to: email,
      subject: 'Сброс пароля — Finance Track',
      template: 'reset-password',
      context: { name, url },
    });
  }

  async sendEmailChangeConfirmation(newEmail: string, name: string, token: string) {
    const url = `${process.env.APP_URL}/confirm-email-change?token=${token}`;
    await this.mailer.sendMail({
      to: newEmail,
      subject: 'Подтвердите новый email — Finance Track',
      template: 'confirm-email-change',
      context: { name, url },
    });
  }
}
