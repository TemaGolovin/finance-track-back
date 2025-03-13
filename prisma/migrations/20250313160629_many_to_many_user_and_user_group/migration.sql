/*
  Warnings:

  - You are about to drop the column `userRelationGroupId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_userRelationGroupId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userRelationGroupId";

-- CreateTable
CREATE TABLE "UserRelationGroupUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRelationGroupId" TEXT NOT NULL,

    CONSTRAINT "UserRelationGroupUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserRelationGroupUser" ADD CONSTRAINT "UserRelationGroupUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationGroupUser" ADD CONSTRAINT "UserRelationGroupUser_userRelationGroupId_fkey" FOREIGN KEY ("userRelationGroupId") REFERENCES "UserRelationGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
