CREATE TYPE "IssueReportStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'RESOLVED');

CREATE TABLE "EstateNotice" (
  "id" UUID NOT NULL,
  "estateId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "displayDate" TEXT NOT NULL,
  "displayTime" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "EstateNotice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EstateNotice_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "IssueReport" (
  "id" UUID NOT NULL,
  "estateId" UUID NOT NULL,
  "reporterMembershipId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "status" "IssueReportStatus" NOT NULL DEFAULT 'RECEIVED',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IssueReport_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "IssueReport_reporterMembershipId_fkey" FOREIGN KEY ("reporterMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "IssueReportUpdate" (
  "id" UUID NOT NULL,
  "reportId" UUID NOT NULL,
  "authorUserId" UUID NOT NULL,
  "status" "IssueReportStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IssueReportUpdate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IssueReportUpdate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "IssueReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "EstateNotice_estateId_createdAt_idx" ON "EstateNotice"("estateId", "createdAt");
CREATE INDEX "IssueReport_estateId_status_updatedAt_idx" ON "IssueReport"("estateId", "status", "updatedAt");
CREATE INDEX "IssueReport_reporterMembershipId_createdAt_idx" ON "IssueReport"("reporterMembershipId", "createdAt");
CREATE INDEX "IssueReportUpdate_reportId_createdAt_idx" ON "IssueReportUpdate"("reportId", "createdAt");
