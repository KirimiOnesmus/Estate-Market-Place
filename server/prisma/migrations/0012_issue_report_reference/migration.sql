ALTER TABLE "IssueReport" ADD COLUMN "referenceCode" TEXT;

UPDATE "IssueReport"
SET "referenceCode" = 'ER-' || LEFT(code, 4) || '-' || SUBSTRING(code FROM 5 FOR 12)
FROM (
  SELECT "id", UPPER(SUBSTRING(MD5(random()::text || clock_timestamp()::text || "id"::text) FROM 1 FOR 16)) AS code
  FROM "IssueReport"
) generated
WHERE "IssueReport"."id" = generated."id";

ALTER TABLE "IssueReport" ALTER COLUMN "referenceCode" SET NOT NULL;
CREATE UNIQUE INDEX "IssueReport_referenceCode_key" ON "IssueReport"("referenceCode");
