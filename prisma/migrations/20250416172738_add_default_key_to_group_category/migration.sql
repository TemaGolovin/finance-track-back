/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isDefault";

-- AlterTable
ALTER TABLE "GroupCategory" ADD COLUMN     "defaultKey" TEXT;
