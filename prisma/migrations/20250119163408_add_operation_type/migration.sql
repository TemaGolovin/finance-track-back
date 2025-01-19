-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('EXPENSE', 'INCOME');

-- AlterTable
ALTER TABLE "Operation" ADD COLUMN     "type" "OperationType" NOT NULL DEFAULT 'EXPENSE';
