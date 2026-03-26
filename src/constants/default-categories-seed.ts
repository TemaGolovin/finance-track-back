import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma } from '@prisma/client';
import { DEFAULT_CATEGORY_TEMPLATES } from './default-category-templates';

const SEED_LOCALE = 'ru';

function loadSeedLabels(): Record<string, string> {
  const file = join(__dirname, `../i18n/${SEED_LOCALE}/defaultCategories.json`);
  const raw = readFileSync(file, 'utf8');
  return JSON.parse(raw) as Record<string, string>;
}

const labelsCache = loadSeedLabels();

export function getDefaultCategoriesForSeed(
  userId: string,
  groupId?: string,
): Prisma.CategoryCreateManyInput[] {
  return DEFAULT_CATEGORY_TEMPLATES.map((t) => ({
    name: labelsCache[t.defaultKey],
    categoryType: t.categoryType,
    userId,
    defaultKey: t.defaultKey,
    color: t.color,
    icon: t.icon,
    ...(groupId ? { groupId } : {}),
  }));
}
