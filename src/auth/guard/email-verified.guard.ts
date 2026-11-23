import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { ALLOW_UNVERIFIED_EMAIL_KEY } from 'src/decorators/allow-unverified-email.decorator';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type RequestWithUser = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: { id?: string };
};

function languageFromRequest(request: RequestWithUser): 'en' | 'ru' {
  const raw = request.headers?.['accept-language'];
  const header = Array.isArray(raw) ? raw[0] : raw;
  const primary = header?.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (primary === 'ru' || primary.startsWith('ru-')) {
    return 'ru';
  }
  return 'en';
}

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const method = request.method?.toUpperCase() ?? '';
    if (SAFE_METHODS.has(method)) {
      return true;
    }

    const allowUnverified = this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_EMAIL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowUnverified) {
      return true;
    }

    const userId = request.user?.id;
    if (!userId || !(await this.isEmailVerified(userId))) {
      throw new ForbiddenException(
        this.i18n.t('errors.EMAIL_NOT_VERIFIED', { lang: languageFromRequest(request) }),
      );
    }

    return true;
  }

  private async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    return user?.emailVerified === true;
  }
}
