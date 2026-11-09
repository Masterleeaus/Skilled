-- Local revocable opaque sessions after Central verified login.
-- Additive only. No existing login/session tables changed.
CREATE TABLE "skilled_central_sessions" (
 "id" TEXT NOT NULL,
 "tokenHash" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "companyId" TEXT NOT NULL,
 "centralOrganisationId" TEXT NOT NULL,
 "localAccountId" TEXT NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 "revokedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastUsedAt" TIMESTAMP(3),
 CONSTRAINT "skilled_central_sessions_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "skilled_central_sessions_hash_length" CHECK (length("tokenHash") = 64),
 CONSTRAINT "skilled_central_sessions_company_fk" FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "skilled_central_sessions_user_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "skilled_central_sessions_tokenHash_key" ON "skilled_central_sessions"("tokenHash");
CREATE INDEX "skilled_central_sessions_userId_revokedAt_idx" ON "skilled_central_sessions"("userId","revokedAt");
CREATE INDEX "skilled_central_sessions_companyId_revokedAt_idx" ON "skilled_central_sessions"("companyId","revokedAt");
CREATE INDEX "skilled_central_sessions_centralOrganisationId_revokedAt_idx" ON "skilled_central_sessions"("centralOrganisationId","revokedAt");
CREATE INDEX "skilled_central_sessions_expiresAt_idx" ON "skilled_central_sessions"("expiresAt");
