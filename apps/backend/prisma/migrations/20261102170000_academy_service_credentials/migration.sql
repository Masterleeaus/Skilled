CREATE TABLE "academy_service_credentials" (
 "id" TEXT NOT NULL, "service" TEXT NOT NULL, "organisationRef" TEXT NOT NULL,
 "tokenHash" TEXT NOT NULL, "label" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3),
 CONSTRAINT "academy_service_credentials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academy_service_credentials_tokenHash_key" ON "academy_service_credentials"("tokenHash");
CREATE INDEX "academy_service_credentials_service_organisationRef_idx" ON "academy_service_credentials"("service", "organisationRef");
