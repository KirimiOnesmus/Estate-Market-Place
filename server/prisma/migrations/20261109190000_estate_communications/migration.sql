CREATE TABLE "EstateCommunicationSetting" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT NOT NULL DEFAULT '',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpUsername" TEXT NOT NULL DEFAULT '',
    "smtpPasswordEncrypted" TEXT,
    "emailFromName" TEXT NOT NULL DEFAULT '',
    "emailFromAddress" TEXT NOT NULL DEFAULT '',
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhoneNumberId" TEXT NOT NULL DEFAULT '',
    "whatsappAccessTokenEncrypted" TEXT,
    "whatsappApiVersion" TEXT NOT NULL DEFAULT 'v25.0',
    "whatsappLanguage" TEXT NOT NULL DEFAULT 'en',
    "eventSettings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "EstateCommunicationSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EstateCommunicationSetting_estateId_key" ON "EstateCommunicationSetting"("estateId");
ALTER TABLE "EstateCommunicationSetting" ADD CONSTRAINT "EstateCommunicationSetting_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EstateNotification" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkPath" TEXT NOT NULL DEFAULT '/',
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstateNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EstateNotification_userId_createdAt_idx" ON "EstateNotification"("userId", "createdAt");
CREATE INDEX "EstateNotification_estateId_createdAt_idx" ON "EstateNotification"("estateId", "createdAt");
ALTER TABLE "EstateNotification" ADD CONSTRAINT "EstateNotification_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EstateNotification" ADD CONSTRAINT "EstateNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CommunicationDelivery" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "notificationId" UUID,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "templateName" TEXT NOT NULL DEFAULT '',
    "templateLanguage" TEXT NOT NULL DEFAULT 'en',
    "templateParams" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "nextAttemptAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "CommunicationDelivery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommunicationDelivery_status_nextAttemptAt_idx" ON "CommunicationDelivery"("status", "nextAttemptAt");
CREATE INDEX "CommunicationDelivery_estateId_createdAt_idx" ON "CommunicationDelivery"("estateId", "createdAt");
ALTER TABLE "CommunicationDelivery" ADD CONSTRAINT "CommunicationDelivery_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationDelivery" ADD CONSTRAINT "CommunicationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "EstateNotification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
