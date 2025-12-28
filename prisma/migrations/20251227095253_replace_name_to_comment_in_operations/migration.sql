/*
  Warnings:

  - You are about to drop the column `name` on the `Operation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Operation" DROP COLUMN "name",
ADD COLUMN     "comment" TEXT;
