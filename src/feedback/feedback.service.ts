import { Injectable, Logger } from '@nestjs/common';
import { FeedbackType } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

const feedbackTypeToPrisma: Record<CreateFeedbackDto['type'], FeedbackType> = {
  problem: FeedbackType.PROBLEM,
  suggestion: FeedbackType.SUGGESTION,
};

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async submitFeedback(
    dto: CreateFeedbackDto,
    user: { id: string; email: string },
  ): Promise<{ success: true }> {
    await this.prisma.feedback.create({
      data: {
        type: feedbackTypeToPrisma[dto.type],
        message: dto.message,
        replyEmail: dto.replyEmail,
        accountEmail: user.email,
        userId: user.id,
      },
    });

    const recipient = process.env.FEEDBACK_RECIPIENT?.trim();
    if (!recipient) {
      this.logger.warn('FEEDBACK_RECIPIENT is not set; feedback stored without email');
      return { success: true };
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
        'Failed to send feedback email; feedback is stored in DB',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return { success: true };
  }
}
