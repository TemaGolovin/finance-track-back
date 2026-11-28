import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MailService } from 'src/mail/mail.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  async submitFeedback(
    dto: CreateFeedbackDto,
    user: { id: string; email: string },
  ): Promise<{ success: true }> {
    const recipient = process.env.FEEDBACK_RECIPIENT?.trim();
    if (!recipient) {
      throw new ServiceUnavailableException(this.i18n.t('errors.FEEDBACK_NOT_CONFIGURED'));
    }

    try {
      await this.mailService.sendFeedback({
        to: recipient,
        type: dto.type,
        message: dto.message,
        replyEmail: dto.replyEmail,
        userId: user.id,
        accountEmail: user.email,
      });
    } catch (error: unknown) {
      this.logger.error(
        'Failed to send feedback email',
        error instanceof Error ? error.stack : String(error),
      );
      throw new ServiceUnavailableException(this.i18n.t('errors.FEEDBACK_SEND_FAILED'));
    }

    return { success: true };
  }
}
