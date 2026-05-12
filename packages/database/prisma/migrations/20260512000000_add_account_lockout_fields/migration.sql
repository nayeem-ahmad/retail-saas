-- AlterTable
ALTER TABLE "User" ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "locked_until" TIMESTAMP(3);
