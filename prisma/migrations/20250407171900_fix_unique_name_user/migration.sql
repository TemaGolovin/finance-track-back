/*
  Warnings:

  - A unique constraint covering the columns `[name,userId,categoryType]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[defaultKey,userId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Category_name_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_userId_categoryType_key" ON "Category"("name", "userId", "categoryType");

-- CreateIndex
CREATE UNIQUE INDEX "Category_defaultKey_userId_key" ON "Category"("defaultKey", "userId");
