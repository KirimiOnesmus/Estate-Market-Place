CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'LIVE', 'REJECTED');
CREATE TYPE "CampaignBeneficiaryType" AS ENUM ('ESTATE', 'RESIDENT');
CREATE TYPE "CommitteeDecision" AS ENUM ('APPROVE', 'REJECT');
CREATE TYPE "ElectionStatus" AS ENUM ('OPEN', 'CLOSED', 'TIE_REVIEW');

CREATE TABLE "Campaign" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAmount" INTEGER NOT NULL,
    "beneficiaryType" "CampaignBeneficiaryType" NOT NULL,
    "beneficiaryLabel" TEXT NOT NULL,
    "beneficiaryHouseholdId" UUID,
    "householdContribution" INTEGER,
    "deadline" DATE NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignVote" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "voterMembershipId" UUID NOT NULL,
    "decision" "CommitteeDecision" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "CampaignVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Election" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "closesAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "ElectionStatus" NOT NULL DEFAULT 'OPEN',
    "winnerCandidateId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionCandidate" (
    "id" UUID NOT NULL,
    "electionId" UUID NOT NULL,
    "householdId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "household" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElectionCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectionVote" (
    "id" UUID NOT NULL,
    "electionId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "voterMembershipId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElectionVote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Campaign_estateId_status_updatedAt_idx" ON "Campaign"("estateId", "status", "updatedAt");
CREATE INDEX "Campaign_beneficiaryHouseholdId_idx" ON "Campaign"("beneficiaryHouseholdId");
CREATE UNIQUE INDEX "CampaignVote_campaignId_voterMembershipId_key" ON "CampaignVote"("campaignId", "voterMembershipId");
CREATE INDEX "CampaignVote_campaignId_decision_idx" ON "CampaignVote"("campaignId", "decision");
CREATE INDEX "Election_estateId_status_closesAt_idx" ON "Election"("estateId", "status", "closesAt");
CREATE UNIQUE INDEX "ElectionCandidate_electionId_householdId_key" ON "ElectionCandidate"("electionId", "householdId");
CREATE INDEX "ElectionCandidate_electionId_idx" ON "ElectionCandidate"("electionId");
CREATE UNIQUE INDEX "ElectionVote_electionId_voterMembershipId_key" ON "ElectionVote"("electionId", "voterMembershipId");
CREATE INDEX "ElectionVote_candidateId_idx" ON "ElectionVote"("candidateId");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_beneficiaryHouseholdId_fkey" FOREIGN KEY ("beneficiaryHouseholdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampaignVote" ADD CONSTRAINT "CampaignVote_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignVote" ADD CONSTRAINT "CampaignVote_voterMembershipId_fkey" FOREIGN KEY ("voterMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Election" ADD CONSTRAINT "Election_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectionCandidate" ADD CONSTRAINT "ElectionCandidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionCandidate" ADD CONSTRAINT "ElectionCandidate_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ElectionVote" ADD CONSTRAINT "ElectionVote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionVote" ADD CONSTRAINT "ElectionVote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ElectionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectionVote" ADD CONSTRAINT "ElectionVote_voterMembershipId_fkey" FOREIGN KEY ("voterMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
