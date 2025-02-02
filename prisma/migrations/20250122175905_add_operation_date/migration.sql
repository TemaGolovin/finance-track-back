/*
  Warnings:

  - Added the required column `operationDate` to the `Operation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Operation" ADD COLUMN     "operationDate" TIMESTAMP(3);

UPDATE "Operation" SET "operationDate" = "createAt";

ALTER TABLE "Operation" ALTER COLUMN "operationDate" SET NOT NULL;