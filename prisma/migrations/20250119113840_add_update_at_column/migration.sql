/*
  Warnings:

  - Added the required column `updateAt` to the `Operation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Operation" ADD COLUMN "updateAt" TIMESTAMP(3) NOT NULL;
