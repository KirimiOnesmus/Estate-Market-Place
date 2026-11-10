ALTER TABLE "MarketplaceOrder"
  ADD COLUMN "originatorConversationId" TEXT,
  ADD COLUMN "payoutConversationId" TEXT;

CREATE UNIQUE INDEX "MarketplaceOrder_originatorConversationId_key"
  ON "MarketplaceOrder"("originatorConversationId");
