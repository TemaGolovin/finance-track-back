import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { MailService } from 'src/mail/mail.service';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  const mailService = {
    sendFeedback: jest.fn(),
  };
  const i18n = {
    t: jest.fn((key: string) => key),
  };

  const user = { id: 'user-1', email: 'account@example.com' };
  const dto = {
    type: 'problem' as const,
    message: 'Something is broken in operations',
    replyEmail: 'reply@example.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.FEEDBACK_RECIPIENT = '';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: MailService, useValue: mailService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();

    service = module.get(FeedbackService);
  });

  it('throws 503 when FEEDBACK_RECIPIENT is missing', async () => {
    await expect(service.submitFeedback(dto, user)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(i18n.t).toHaveBeenCalledWith('errors.FEEDBACK_NOT_CONFIGURED');
    expect(mailService.sendFeedback).not.toHaveBeenCalled();
  });

  it('sends feedback email when recipient is configured', async () => {
    process.env.FEEDBACK_RECIPIENT = ' admin@example.com ';
    mailService.sendFeedback.mockResolvedValue(undefined);

    await expect(service.submitFeedback(dto, user)).resolves.toEqual({ success: true });

    expect(mailService.sendFeedback).toHaveBeenCalledWith({
      to: 'admin@example.com',
      type: dto.type,
      message: dto.message,
      replyEmail: dto.replyEmail,
      userId: user.id,
      accountEmail: user.email,
    });
  });

  it('throws 503 when mail sending fails', async () => {
    process.env.FEEDBACK_RECIPIENT = 'admin@example.com';
    mailService.sendFeedback.mockRejectedValue(new Error('smtp down'));

    await expect(service.submitFeedback(dto, user)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(i18n.t).toHaveBeenCalledWith('errors.FEEDBACK_SEND_FAILED');
  });
});
