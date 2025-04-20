/*
  Warnings:

  - A unique constraint covering the columns `[name,groupId,categoryType]` on the table `GroupCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GroupCategory_name_groupId_key";

-- AlterTable
ALTER TABLE "GroupCategory" ADD COLUMN     "categoryType" "OperationType" NOT NULL DEFAULT 'EXPENSE';

-- CreateIndex
CREATE UNIQUE INDEX "GroupCategory_name_groupId_categoryType_key" ON "GroupCategory"("name", "groupId", "categoryType");
