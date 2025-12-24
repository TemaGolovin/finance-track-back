-- AlterTable
ALTER TABLE "Category"
ADD COLUMN "color" TEXT,
ADD COLUMN "icon" TEXT;

-- Fill default colors and icons for EXPENSE categories
UPDATE "Category"
SET color = '#4CAF50', icon = 'ShoppingCart'
WHERE "defaultKey" = 'supermarket';

UPDATE "Category"
SET color = '#FF7043', icon = 'Utensils'
WHERE "defaultKey" = 'cafe';

UPDATE "Category"
SET color = '#42A5F5', icon = 'Bus'
WHERE "defaultKey" = 'transport';

UPDATE "Category"
SET color = '#8D6E63', icon = 'Home'
WHERE "defaultKey" = 'home';

UPDATE "Category"
SET color = '#EF5350', icon = 'HeartPulse'
WHERE "defaultKey" = 'health';

UPDATE "Category"
SET color = '#7E57C2', icon = 'GraduationCap'
WHERE "defaultKey" = 'education';

UPDATE "Category"
SET color = '#AB47BC', icon = 'Gamepad2'
WHERE "defaultKey" = 'entertainment';

UPDATE "Category"
SET color = '#26A69A', icon = 'Shirt'
WHERE "defaultKey" = 'clothes';

UPDATE "Category"
SET color = '#29B6F6', icon = 'Smartphone'
WHERE "defaultKey" = 'communication';

UPDATE "Category"
SET color = '#EC407A', icon = 'Gift'
WHERE "defaultKey" = 'expenseGifts';

UPDATE "Category"
SET color = '#26C6DA', icon = 'Plane'
WHERE "defaultKey" = 'travel';

UPDATE "Category"
SET color = '#78909C', icon = 'Car'
WHERE "defaultKey" = 'auto';

UPDATE "Category"
SET color = '#66BB6A', icon = 'Dumbbell'
WHERE "defaultKey" = 'sport';

UPDATE "Category"
SET color = '#FFB300', icon = 'PawPrint'
WHERE "defaultKey" = 'pets';

UPDATE "Category"
SET color = '#9E9E9E', icon = 'MoreHorizontal'
WHERE "defaultKey" = 'expenseOther';

-- Fill default colors and icons for INCOME categories
UPDATE "Category"
SET color = '#43A047', icon = 'Wallet'
WHERE "defaultKey" = 'salary';

UPDATE "Category"
SET color = '#66BB6A', icon = 'Briefcase'
WHERE "defaultKey" = 'part-time';

UPDATE "Category"
SET color = '#FFCA28', icon = 'Gift'
WHERE "defaultKey" = 'incomeGifts';

UPDATE "Category"
SET color = '#9E9E9E', icon = 'MoreHorizontal'
WHERE "defaultKey" = 'incomeOther';
