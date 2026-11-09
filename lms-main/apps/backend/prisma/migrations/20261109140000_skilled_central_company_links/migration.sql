-- Skilled local Central organisation/account registry. Central is the only
-- authority for Logto identity, entitlements and membership; these two tables
-- contain no Central subject, session credential or password.
-- Additive. No legacy data migrated and no other migration edited.
CREATE TABLE "skilled_central_company_links" (
  "id" TEXT NOT NULL,
  "centralOrganisationId" TEXT NOT NULL,
  "localAccountId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'verified',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "skilled_central_company_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "skilled_central_company_links_state_check" CHECK ("state" IN ('verified', 'revoked')),
  CONSTRAINT "skilled_central_company_links_central_org_length" CHECK (length("centralOrganisationId") BETWEEN 8 AND 128),
  CONSTRAINT "skilled_central_company_links_account_length" CHECK (length("localAccountId") BETWEEN 8 AND 128)
);
CREATE UNIQUE INDEX "skilled_central_company_links_centralOrganisationId_key" ON "skilled_central_company_links"("centralOrganisationId");
CREATE UNIQUE INDEX "skilled_central_company_links_localAccountId_key" ON "skilled_central_company_links"("localAccountId");
CREATE UNIQUE INDEX "skilled_central_company_links_companyId_key" ON "skilled_central_company_links"("companyId");
CREATE INDEX "skilled_central_company_links_state_idx" ON "skilled_central_company_links"("state");
ALTER TABLE "skilled_central_company_links"
  ADD CONSTRAINT "skilled_central_company_links_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "skilled_central_company_link_audits" (
  "id" TEXT NOT NULL,
  "centralOrganisationId" TEXT NOT NULL,
  "localAccountId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "actorRef" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "skilled_central_company_link_audits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "skilled_central_company_link_audits_outcome_check"
    CHECK ("outcome" IN ('LINK_CREATED', 'LINK_CONFIRMED', 'LINK_REVERIFIED', 'LINK_REVOKED'))
);
CREATE INDEX "skilled_central_company_link_audits_centralOrganisationId_createdAt_idx"
  ON "skilled_central_company_link_audits"("centralOrganisationId", "createdAt");
CREATE INDEX "skilled_central_company_link_audits_companyId_createdAt_idx"
  ON "skilled_central_company_link_audits"("companyId", "createdAt");
