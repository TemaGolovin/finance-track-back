import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common';
import { I18nService, I18nValidationException } from 'nestjs-i18n';
import { formatI18nErrors } from 'nestjs-i18n/dist/utils/util';

const FALLBACK_I18N_LANG = 'en';

@Injectable()
@Catch(I18nValidationException)
export class SafeI18nValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: I18nValidationException, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<{ i18nLang?: string }>();
    const lang = request.i18nLang ?? FALLBACK_I18N_LANG;
    const i18nService = this.i18n;

    const message = formatI18nErrors(exception.errors ?? [], i18nService, {
      lang,
    });

    if (host.getType() === 'http') {
      const response = host.switchToHttp().getResponse();
      const statusCode = exception.getStatus();
      response.status(statusCode).send({
        statusCode,
        message,
        error: exception.getResponse(),
      });
    }
  }
}
