-- Drop the old unique constraint
DROP INDEX IF EXISTS "PersonalCategoryMap_groupCategoryId_categoryId_userId_key";

-- Remove duplicate rows, keeping only the last one per (groupCategoryId, userId)
DELETE FROM "PersonalCategoryMap"
WHERE id NOT IN (
  SELECT DISTINCT ON ("groupCategoryId", "userId") id
  FROM "PersonalCategoryMap"
  ORDER BY "groupCategoryId", "userId", "id" DESC
);

-- Add the new unique constraint
CREATE UNIQUE INDEX "PersonalCategoryMap_groupCategoryId_userId_key" ON "PersonalCategoryMap"("groupCategoryId", "userId");
