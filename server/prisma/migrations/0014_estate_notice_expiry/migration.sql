ALTER TABLE "EstateNotice"
ADD COLUMN "expiresOn" TEXT;

CREATE INDEX "EstateNotice_estateId_expiresOn_idx"
ON "EstateNotice"("estateId", "expiresOn");
