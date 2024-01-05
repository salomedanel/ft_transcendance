-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorActive" BOOLEAN DEFAULT false,
ADD COLUMN     "twoFactorAuth" BOOLEAN DEFAULT false;
