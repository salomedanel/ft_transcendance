-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockedUser" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "friends" INTEGER[] DEFAULT ARRAY[]::INTEGER[];