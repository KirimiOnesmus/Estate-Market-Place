ALTER TABLE "MarketplaceListing"
  ADD COLUMN "sellerMpesaPhone" TEXT;

UPDATE "MarketplaceListing" listing
SET "sellerMpesaPhone" = COALESCE(
  NULLIF(listing."paymentDetails" #>> '{M-Pesa,phone}', ''),
  seller_user."phone"
)
FROM "EstateMembership" membership
JOIN "User" seller_user ON seller_user."id" = membership."userId"
WHERE listing."sellerMembershipId" = membership."id";

ALTER TABLE "MarketplaceListing"
  DROP COLUMN "paymentOptions",
  DROP COLUMN "paymentDetails";

ALTER TABLE "MarketplaceOrder"
  ADD COLUMN "sellerMpesaPhone" TEXT;

UPDATE "MarketplaceOrder" purchase
SET "sellerMpesaPhone" = listing."sellerMpesaPhone"
FROM "MarketplaceListing" listing
WHERE purchase."listingId" = listing."id";
