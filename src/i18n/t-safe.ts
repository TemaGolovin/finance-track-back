import * as fs from 'node:fs';
import * as path from 'node:path';
import { I18nContext } from 'nestjs-i18n';
import { getI18nTranslationsRoot } from './i18n-translations-root';

type TranslationDict = Record<string, Record<string, string>>;

function loadTranslations(i18nDir: string): TranslationDict {
  const result: TranslationDict = {};
  try {
    const langs = fs
      .readdirSync(i18nDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const lang of langs) {
      result[lang] = {};
      const langDir = path.join(i18nDir, lang);
      const files = fs.readdirSync(langDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const ns = path.basename(file, '.json');
        const raw = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf8')) as Record<string, string>;
        for (const [key, value] of Object.entries(raw)) {
          result[lang][`${ns}.${key}`] = value;
        }
      }
    }
  } catch {
    // silent – will fall back to key
  }
  return result;
}

const i18nDir = getI18nTranslationsRoot();
const cache: TranslationDict = loadTranslations(i18nDir);

export function tSafe(key: string, fallbackLanguage: string): string {
  const lang = I18nContext.current()?.lang ?? fallbackLanguage;
  return cache[lang]?.[key] ?? cache[fallbackLanguage]?.[key] ?? key;
}
