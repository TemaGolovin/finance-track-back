/*
  Warnings:

  - Added the required column `creatorId` to the `UserRelationGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRelationGroup" ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserRelationGroup" ADD CONSTRAINT "UserRelationGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
