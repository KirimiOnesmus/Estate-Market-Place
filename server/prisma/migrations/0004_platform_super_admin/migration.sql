-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN');

-- AlterTable
ALTER TABLE "AuthSession" ADD COLUMN     "estateId" UUID,
ALTER COLUMN "membershipId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "platformRole" "PlatformRole";

-- CreateIndex
CREATE INDEX "AuthSession_estateId_expiresAt_idx" ON "AuthSession"("estateId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_platformRole_key" ON "User"("platformRole");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

