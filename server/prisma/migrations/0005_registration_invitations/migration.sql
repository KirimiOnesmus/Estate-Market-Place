-- CreateTable
CREATE TABLE "RegistrationInvitation" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationInvitation_tokenHash_key" ON "RegistrationInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "RegistrationInvitation_estateId_expiresAt_usedAt_revokedAt_idx" ON "RegistrationInvitation"("estateId", "expiresAt", "usedAt", "revokedAt");

-- AddForeignKey
ALTER TABLE "RegistrationInvitation" ADD CONSTRAINT "RegistrationInvitation_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationInvitation" ADD CONSTRAINT "RegistrationInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

