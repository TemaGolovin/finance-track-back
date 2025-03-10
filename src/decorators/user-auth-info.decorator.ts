import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserInfo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { email: string; name: string; id: string } => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
