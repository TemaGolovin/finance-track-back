import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateFeedbackDto {
  @IsIn(['problem', 'suggestion'])
  @ApiProperty({
    description: 'Feedback type',
    enum: ['problem', 'suggestion'],
    example: 'problem',
  })
  type: 'problem' | 'suggestion';

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10, {
    message: i18nValidationMessage('validation.FEEDBACK_MESSAGE_MIN_LENGTH'),
  })
  @MaxLength(2000, {
    message: i18nValidationMessage('validation.FEEDBACK_MESSAGE_MAX_LENGTH'),
  })
  @ApiProperty({
    description: 'Feedback message',
    example: 'Не получается сохранить операцию с дробной суммой',
    minLength: 10,
    maxLength: 2000,
  })
  message: string;

  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL_INVALID') })
  @ApiProperty({
    description: 'Email to reply to',
    example: 'user@example.com',
  })
  replyEmail: string;
}
