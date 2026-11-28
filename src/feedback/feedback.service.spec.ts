import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackType } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackService } from './feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  const mailService = {
    sendFeedback: jest.fn(),
  };
  const prisma = {
    feedback: {
      create: jest.fn(),
    },
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
    prisma.feedback.create.mockResolvedValue({ id: 'fb-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: MailService, useValue: mailService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(FeedbackService);
  });

  it('stores feedback and skips email when FEEDBACK_RECIPIENT is missing', async () => {
    await expect(service.submitFeedback(dto, user)).resolves.toEqual({ success: true });

    expect(prisma.feedback.create).toHaveBeenCalledWith({
      data: {
        type: FeedbackType.PROBLEM,
        message: dto.message,
        replyEmail: dto.replyEmail,
        accountEmail: user.email,
        userId: user.id,
      },
    });
    expect(mailService.sendFeedback).not.toHaveBeenCalled();
  });

  it('stores feedback and sends email when recipient is configured', async () => {
    process.env.FEEDBACK_RECIPIENT = ' admin@example.com ';
    mailService.sendFeedback.mockResolvedValue(undefined);

    await expect(service.submitFeedback(dto, user)).resolves.toEqual({ success: true });

    expect(prisma.feedback.create).toHaveBeenCalled();
    expect(mailService.sendFeedback).toHaveBeenCalledWith({
      to: 'admin@example.com',
      type: dto.type,
      message: dto.message,
      replyEmail: dto.replyEmail,
      userId: user.id,
      accountEmail: user.email,
    });
  });

  it('still succeeds when mail sending fails after DB save', async () => {
    process.env.FEEDBACK_RECIPIENT = 'admin@example.com';
    mailService.sendFeedback.mockRejectedValue(new Error('smtp down'));

    await expect(service.submitFeedback(dto, user)).resolves.toEqual({ success: true });
    expect(prisma.feedback.create).toHaveBeenCalled();
  });
});
