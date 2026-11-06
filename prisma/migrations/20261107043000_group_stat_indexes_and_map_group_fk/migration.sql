-- Align denormalized groupId with GroupCategory before the composite foreign key.
UPDATE "PersonalCategoryMap" AS pcm
SET "groupId" = gc."groupId"
FROM "GroupCategory" AS gc
WHERE gc.id = pcm."groupCategoryId"
  AND pcm."groupId" IS DISTINCT FROM gc."groupId";

-- One membership row per user in a group.
DELETE FROM "UserRelationGroupUser" AS duplicate
USING "UserRelationGroupUser" AS kept
WHERE duplicate."userId" = kept."userId"
  AND duplicate."userRelationGroupId" = kept."userRelationGroupId"
  AND duplicate.id > kept.id;

-- DropForeignKey
ALTER TABLE "PersonalCategoryMap" DROP CONSTRAINT "PersonalCategoryMap_groupCategoryId_fkey";

-- CreateIndex
CREATE INDEX "GroupCategory_groupId_categoryType_idx" ON "GroupCategory"("groupId", "categoryType");

-- CreateIndex
CREATE UNIQUE INDEX "GroupCategory_id_groupId_key" ON "GroupCategory"("id", "groupId");

-- CreateIndex
CREATE INDEX "Operation_userId_type_operationDate_idx" ON "Operation"("userId", "type", "operationDate");

-- CreateIndex
CREATE INDEX "Operation_categoryId_type_operationDate_idx" ON "Operation"("categoryId", "type", "operationDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelationGroupUser_userId_userRelationGroupId_key" ON "UserRelationGroupUser"("userId", "userRelationGroupId");

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_groupCategoryId_groupId_fkey" FOREIGN KEY ("groupCategoryId", "groupId") REFERENCES "GroupCategory"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;
