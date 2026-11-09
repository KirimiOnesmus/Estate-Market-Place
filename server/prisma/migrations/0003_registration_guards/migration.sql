-- Prevent concurrent pending registrations from duplicating a household contact.
CREATE UNIQUE INDEX "RegistrationRequest_one_open_email_per_estate"
ON "RegistrationRequest" ("estateId", lower("email"))
WHERE "status" IN ('PENDING', 'APPROVED') AND "email" IS NOT NULL;

CREATE UNIQUE INDEX "RegistrationRequest_one_open_phone_per_estate"
ON "RegistrationRequest" ("estateId", "phone")
WHERE "status" IN ('PENDING', 'APPROVED');

CREATE UNIQUE INDEX "EstateLocation_active_name_per_estate"
ON "EstateLocation" ("estateId", lower("label"))
WHERE "status" = 'ACTIVE';
