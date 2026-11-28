import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { getAuthThrottleLimit, getAuthThrottleTtlMs } from 'src/config/auth-throttle.config';
import { AllowUnverifiedEmail } from 'src/decorators/allow-unverified-email.decorator';
import { UserInfo } from 'src/decorators/user-auth-info.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

const feedbackThrottle = {
  auth: {
    limit: getAuthThrottleLimit(),
    ttl: getAuthThrottleTtlMs(),
  },
};

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @AllowUnverifiedEmail()
  @UseGuards(ThrottlerGuard)
  @Throttle(feedbackThrottle)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Feedback stored (and emailed when FEEDBACK_RECIPIENT is set)' })
  submitFeedback(
    @Body() dto: CreateFeedbackDto,
    @UserInfo() userInfo: { email: string; name: string; id: string },
  ) {
    return this.feedbackService.submitFeedback(dto, {
      id: userInfo.id,
      email: userInfo.email,
    });
  }
}
