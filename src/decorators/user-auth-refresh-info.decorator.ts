import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserRefreshInfo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { email: string; name: string; id: string } => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
