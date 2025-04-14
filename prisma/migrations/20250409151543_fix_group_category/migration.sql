/*
  Warnings:

  - You are about to drop the column `groupId` on the `PersonalCategoryMap` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupCategoryId,categoryId,userId]` on the table `PersonalCategoryMap` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupCategoryId` to the `PersonalCategoryMap` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PersonalCategoryMap" DROP CONSTRAINT "PersonalCategoryMap_groupId_fkey";

-- DropIndex
DROP INDEX "PersonalCategoryMap_groupId_categoryId_userId_key";

-- AlterTable
ALTER TABLE "PersonalCategoryMap" DROP COLUMN "groupId",
ADD COLUMN     "groupCategoryId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PersonalCategoryMap_groupCategoryId_categoryId_userId_key" ON "PersonalCategoryMap"("groupCategoryId", "categoryId", "userId");

-- AddForeignKey
ALTER TABLE "PersonalCategoryMap" ADD CONSTRAINT "PersonalCategoryMap_groupCategoryId_fkey" FOREIGN KEY ("groupCategoryId") REFERENCES "GroupCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
