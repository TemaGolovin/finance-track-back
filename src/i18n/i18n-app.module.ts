import * as path from 'node:path';
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { SafeI18nValidationExceptionFilter } from './safe-i18n-validation-exception.filter';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      fallbacks: {
        'en-*': 'en',
        'ru-*': 'ru',
      },
      loaderOptions: {
        path: path.join(__dirname, '..', '..', 'i18n'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [AcceptLanguageResolver],
    }),
  ],
  exports: [I18nModule],
  providers: [
    { provide: APP_FILTER, useClass: SafeI18nValidationExceptionFilter },
  ],
})
export class I18nAppModule {}
