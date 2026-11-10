ALTER TABLE "MarketplaceListing" ADD COLUMN "reservedQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "MarketplaceBid" (
  "id" UUID NOT NULL,
  "listingId" UUID NOT NULL,
  "bidderMembershipId" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "message" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  "respondedAt" TIMESTAMPTZ(6),
  CONSTRAINT "MarketplaceBid_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketplaceBid_listingId_status_createdAt_idx" ON "MarketplaceBid"("listingId", "status", "createdAt");
CREATE INDEX "MarketplaceBid_bidderMembershipId_createdAt_idx" ON "MarketplaceBid"("bidderMembershipId", "createdAt");
ALTER TABLE "MarketplaceBid" ADD CONSTRAINT "MarketplaceBid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceBid" ADD CONSTRAINT "MarketplaceBid_bidderMembershipId_fkey" FOREIGN KEY ("bidderMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketplaceOrder" (
  "id" UUID NOT NULL,
  "reference" TEXT NOT NULL,
  "estateId" UUID NOT NULL,
  "listingId" UUID NOT NULL,
  "buyerMembershipId" UUID NOT NULL,
  "sellerMembershipId" UUID NOT NULL,
  "bidId" UUID,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "phone" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
  "merchantRequestId" TEXT,
  "checkoutRequestId" TEXT,
  "mpesaReceiptNumber" TEXT,
  "resultCode" INTEGER,
  "resultDescription" TEXT,
  "payoutReference" TEXT,
  "releasedByUserId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  "heldAt" TIMESTAMPTZ(6),
  "releasedAt" TIMESTAMPTZ(6),
  CONSTRAINT "MarketplaceOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketplaceOrder_reference_key" ON "MarketplaceOrder"("reference");
CREATE UNIQUE INDEX "MarketplaceOrder_checkoutRequestId_key" ON "MarketplaceOrder"("checkoutRequestId");
CREATE UNIQUE INDEX "MarketplaceOrder_mpesaReceiptNumber_key" ON "MarketplaceOrder"("mpesaReceiptNumber");
CREATE INDEX "MarketplaceOrder_estateId_status_createdAt_idx" ON "MarketplaceOrder"("estateId", "status", "createdAt");
CREATE INDEX "MarketplaceOrder_buyerMembershipId_createdAt_idx" ON "MarketplaceOrder"("buyerMembershipId", "createdAt");
CREATE INDEX "MarketplaceOrder_sellerMembershipId_createdAt_idx" ON "MarketplaceOrder"("sellerMembershipId", "createdAt");
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_buyerMembershipId_fkey" FOREIGN KEY ("buyerMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_sellerMembershipId_fkey" FOREIGN KEY ("sellerMembershipId") REFERENCES "EstateMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplaceOrder" ADD CONSTRAINT "MarketplaceOrder_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "MarketplaceBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;
