-- AlterTable
ALTER TABLE "PersonalCategoryMap" ADD COLUMN "groupId" TEXT;

-- Backfill groupId from GroupCategory
UPDATE "PersonalCategoryMap" AS pcm
SET "groupId" = gc."groupId"
FROM "GroupCategory" AS gc
WHERE gc.id = pcm."groupCategoryId";

-- Remove duplicates per (groupId, categoryId, userId), keep the row with the largest id
DELETE FROM "PersonalCategoryMap"
WHERE id NOT IN (
  SELECT DISTINCT ON ("groupId", "categoryId", "userId") id
  FROM "PersonalCategoryMap"
  ORDER BY "groupId", "categoryId", "userId", id DESC
);

-- AlterTable
ALTER TABLE "PersonalCategoryMap" ALTER COLUMN "groupId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserRelationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "PersonalCategoryMap_groupId_categoryId_userId_key" ON "PersonalCategoryMap"("groupId", "categoryId", "userId");
