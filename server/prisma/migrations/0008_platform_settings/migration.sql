CREATE TABLE "PlatformSetting" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "platformName" TEXT NOT NULL DEFAULT 'Estate Market Place',
    "supportEmail" TEXT NOT NULL DEFAULT '',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedByUserId" UUID,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSetting" ("id") VALUES ('default');
