-- DropForeignKey
ALTER TABLE "GroupCategory" DROP CONSTRAINT "GroupCategory_groupId_fkey";

-- AddForeignKey
ALTER TABLE "GroupCategory" ADD CONSTRAINT "GroupCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UserRelationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
