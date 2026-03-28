import * as fs from 'node:fs';
import * as path from 'node:path';

// Nest copies src/i18n JSON to dist/i18n/, while compiled JS is under dist/src/i18n/.
export function getI18nTranslationsRoot(): string {
  const nestCompiledLayout = path.join(__dirname, '..', '..', 'i18n');
  if (fs.existsSync(path.join(nestCompiledLayout, 'en'))) {
    return nestCompiledLayout;
  }
  if (fs.existsSync(path.join(__dirname, 'en'))) {
    return path.join(__dirname);
  }
  return path.join(process.cwd(), 'src', 'i18n');
}
