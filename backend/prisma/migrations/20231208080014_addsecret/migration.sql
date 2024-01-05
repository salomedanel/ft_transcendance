-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "twoFactorVerified" BOOLEAN DEFAULT false;
