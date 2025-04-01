-- DropForeignKey
ALTER TABLE "UserRelationGroupUser" DROP CONSTRAINT "UserRelationGroupUser_userRelationGroupId_fkey";

-- AddForeignKey
ALTER TABLE "UserRelationGroupUser" ADD CONSTRAINT "UserRelationGroupUser_userRelationGroupId_fkey" FOREIGN KEY ("userRelationGroupId") REFERENCES "UserRelationGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
