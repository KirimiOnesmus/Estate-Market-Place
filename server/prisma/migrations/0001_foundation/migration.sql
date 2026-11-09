-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstateAccessStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('RESIDENT', 'ESTATE_ADMIN', 'COMMITTEE_MEMBER', 'ACCOUNT_HOLDER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'REMOVED');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('OWNER_OCCUPIED', 'TENANT_OCCUPIED', 'VACANT');

-- CreateEnum
CREATE TYPE "HouseholdStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChallengePurpose" AS ENUM ('INITIAL_PASSWORD', 'PASSWORD_RESET', 'EMAIL_VERIFICATION');

-- CreateTable
CREATE TABLE "Estate" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "accessStatus" "EstateAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingStatus" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustResetPassword" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMPTZ(6),
    "phoneVerifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateLocation" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EstateLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstateMembership" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'RESIDENT',
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EstateMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "representativeId" UUID NOT NULL,
    "occupancy" "OccupancyStatus" NOT NULL,
    "householdSize" INTEGER NOT NULL,
    "status" "HouseholdStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "nextOfKinName" TEXT NOT NULL,
    "nextOfKinPhone" TEXT NOT NULL,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "tokenHash" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "occupancy" "OccupancyStatus" NOT NULL,
    "householdSize" INTEGER NOT NULL,
    "nextOfKinName" TEXT NOT NULL,
    "nextOfKinPhone" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ(6),
    "reviewNote" TEXT,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "ChallengePurpose" NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Estate_accessStatus_idx" ON "Estate"("accessStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "EstateLocation_estateId_status_idx" ON "EstateLocation"("estateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EstateLocation_estateId_label_unitCode_key" ON "EstateLocation"("estateId", "label", "unitCode");

-- CreateIndex
CREATE UNIQUE INDEX "EstateLocation_estateId_id_key" ON "EstateLocation"("estateId", "id");

-- CreateIndex
CREATE INDEX "EstateMembership_estateId_status_role_idx" ON "EstateMembership"("estateId", "status", "role");

-- CreateIndex
CREATE INDEX "EstateMembership_userId_status_idx" ON "EstateMembership"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EstateMembership_estateId_userId_key" ON "EstateMembership"("estateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EstateMembership_estateId_id_key" ON "EstateMembership"("estateId", "id");

-- CreateIndex
CREATE INDEX "Household_estateId_locationId_status_idx" ON "Household"("estateId", "locationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationRequest_tokenHash_key" ON "RegistrationRequest"("tokenHash");

-- CreateIndex
CREATE INDEX "RegistrationRequest_estateId_status_createdAt_idx" ON "RegistrationRequest"("estateId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RegistrationRequest_phone_status_idx" ON "RegistrationRequest"("phone", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordChallenge_tokenHash_key" ON "PasswordChallenge"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordChallenge_userId_purpose_expiresAt_idx" ON "PasswordChallenge"("userId", "purpose", "expiresAt");

-- AddForeignKey
ALTER TABLE "EstateLocation" ADD CONSTRAINT "EstateLocation_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateMembership" ADD CONSTRAINT "EstateMembership_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstateMembership" ADD CONSTRAINT "EstateMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_estateId_locationId_fkey" FOREIGN KEY ("estateId", "locationId") REFERENCES "EstateLocation"("estateId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_estateId_representativeId_fkey" FOREIGN KEY ("estateId", "representativeId") REFERENCES "EstateMembership"("estateId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "Estate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordChallenge" ADD CONSTRAINT "PasswordChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce a single active or pending household for each unit while retaining history.
CREATE UNIQUE INDEX "Household_one_current_per_location"
ON "Household" ("estateId", "locationId")
WHERE "status" IN ('PENDING_REVIEW', 'VERIFIED');

