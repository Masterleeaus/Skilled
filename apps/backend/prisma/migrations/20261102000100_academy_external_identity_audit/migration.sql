CREATE TABLE "academy_external_identities" (
  "id" TEXT NOT NULL, "service" TEXT NOT NULL, "externalUserRef" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "academy_external_identities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academy_external_identities_service_externalUserRef_key" ON "academy_external_identities"("service", "externalUserRef");
CREATE INDEX "academy_external_identities_userId_idx" ON "academy_external_identities"("userId");
ALTER TABLE "academy_external_identities" ADD CONSTRAINT "academy_external_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "academy_integration_audit" (
 "id" TEXT NOT NULL, "service" TEXT NOT NULL, "organisationRef" TEXT,
 "externalUserRef" TEXT, "outcome" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "academy_integration_audit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "academy_integration_audit_service_createdAt_idx" ON "academy_integration_audit"("service", "createdAt");
CREATE INDEX "academy_integration_audit_organisationRef_createdAt_idx" ON "academy_integration_audit"("organisationRef", "createdAt");
