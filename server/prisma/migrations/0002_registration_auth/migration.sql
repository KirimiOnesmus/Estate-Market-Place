-- CreateEnum
CREATE TYPE "AuditScope" AS ENUM ('ESTATE', 'PLATFORM');

-- AlterTable
ALTER TABLE "EstateLocation" ADD COLUMN     "locationType" TEXT NOT NULL DEFAULT 'BLOCK';

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "nextOfKinEmail" TEXT,
ADD COLUMN     "unitCode" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "RegistrationRequest" ADD COLUMN     "locationId" UUID,
ADD COLUMN     "nextOfKinEmail" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT;

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "scope" "AuditScope" NOT NULL,
    "estateId" UUID,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "requestId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuthSession_membershipId_expiresAt_idx" ON "AuthSession"("membershipId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditEvent_estateId_createdAt_idx" ON "AuditEvent"("estateId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RegistrationRequest_estateId_locationId_unitCode_status_idx" ON "RegistrationRequest"("estateId", "locationId", "unitCode", "status");

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_estateId_locationId_fkey" FOREIGN KEY ("estateId", "locationId") REFERENCES "EstateLocation"("estateId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep prior household records while allowing only one current registration per unit.
DROP INDEX "Household_one_current_per_location";
CREATE UNIQUE INDEX "Household_one_current_per_unit"
ON "Household" ("estateId", "locationId", lower("unitCode"))
WHERE "status" IN ('PENDING_REVIEW', 'VERIFIED');

CREATE UNIQUE INDEX "RegistrationRequest_one_pending_per_unit"
ON "RegistrationRequest" ("estateId", "locationId", lower("unitCode"))
WHERE "status" = 'PENDING' AND "locationId" IS NOT NULL;


