CREATE TYPE "CampaignPaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED');

CREATE TABLE "CampaignPayment" (
  "id" UUID NOT NULL,
  "campaignId" UUID NOT NULL,
  "contributorMembershipId" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "phone" TEXT NOT NULL,
  "status" "CampaignPaymentStatus" NOT NULL DEFAULT 'INITIATED',
  "merchantRequestId" TEXT,
  "checkoutRequestId" TEXT,
  "mpesaReceiptNumber" TEXT,
  "resultCode" INTEGER,
  "resultDescription" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  "completedAt" TIMESTAMPTZ(6),
  CONSTRAINT "CampaignPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CampaignPayment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CampaignPayment_contributorMembershipId_fkey" FOREIGN KEY ("contributorMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CampaignPayment_checkoutRequestId_key" ON "CampaignPayment"("checkoutRequestId");
CREATE UNIQUE INDEX "CampaignPayment_mpesaReceiptNumber_key" ON "CampaignPayment"("mpesaReceiptNumber");
CREATE INDEX "CampaignPayment_campaignId_status_createdAt_idx" ON "CampaignPayment"("campaignId", "status", "createdAt");
CREATE INDEX "CampaignPayment_contributorMembershipId_createdAt_idx" ON "CampaignPayment"("contributorMembershipId", "createdAt");
