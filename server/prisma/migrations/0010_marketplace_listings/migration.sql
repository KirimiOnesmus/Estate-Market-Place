CREATE TYPE "ListingStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REMOVED', 'SOLD');

CREATE TABLE "MarketplaceListing" (
  "id" UUID NOT NULL,
  "estateId" UUID NOT NULL,
  "sellerMembershipId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "condition" TEXT NOT NULL,
  "paymentOptions" TEXT[] NOT NULL,
  "paymentDetails" JSONB NOT NULL DEFAULT '{}',
  "images" JSONB NOT NULL DEFAULT '[]',
  "status" "ListingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewedById" UUID,
  "reviewedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceListing_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MarketplaceListing_sellerMembershipId_fkey" FOREIGN KEY ("sellerMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "MarketplaceListing_estateId_status_createdAt_idx" ON "MarketplaceListing"("estateId", "status", "createdAt");
CREATE INDEX "MarketplaceListing_sellerMembershipId_createdAt_idx" ON "MarketplaceListing"("sellerMembershipId", "createdAt");
