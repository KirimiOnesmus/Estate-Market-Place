CREATE TYPE "SupportCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

CREATE TABLE "SupportCase" (
    "id" UUID NOT NULL,
    "estateId" UUID,
    "requesterUserId" UUID,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "SupportCaseStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "SupportCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportComment" (
    "id" UUID NOT NULL,
    "supportCaseId" UUID NOT NULL,
    "authorUserId" UUID,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportCase_status_updatedAt_idx" ON "SupportCase"("status", "updatedAt");
CREATE INDEX "SupportCase_estateId_createdAt_idx" ON "SupportCase"("estateId", "createdAt");
CREATE INDEX "SupportCase_requesterUserId_createdAt_idx" ON "SupportCase"("requesterUserId", "createdAt");
CREATE INDEX "SupportComment_supportCaseId_createdAt_idx" ON "SupportComment"("supportCaseId", "createdAt");

ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportCase" ADD CONSTRAINT "SupportCase_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportComment" ADD CONSTRAINT "SupportComment_supportCaseId_fkey" FOREIGN KEY ("supportCaseId") REFERENCES "SupportCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportComment" ADD CONSTRAINT "SupportComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
