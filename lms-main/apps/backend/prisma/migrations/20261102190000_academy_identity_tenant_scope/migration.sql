-- Additive, fail-closed migration: historical unscoped links remain NULL and cannot be queried.
-- Re-provision trusted identity links against the correct Academy organisation.
ALTER TABLE "academy_external_identities" ADD COLUMN "organisationId" TEXT;
CREATE INDEX "academy_external_identities_organisationId_userId_idx" ON "academy_external_identities"("organisationId", "userId");
