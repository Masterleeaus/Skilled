-- ACA-028: company-scoped uniqueness for external identities. ADDITIVE ONLY. Static, unverified.
--
-- * No row is changed, removed or re-scoped.
-- * "companyId" already exists. 20261102190000_academy_identity_tenant_scope created "organisationId", and
--   20261108090000_academy_tenant_company_rename renames it. IF NOT EXISTS keeps this idempotent.
-- * The existing global key "academy_external_identities_service_externalUserRef_key" is NOT dropped here.
--   Its drop is in apps/backend/prisma/disabled-migrations/ and must be enabled by a human after the preflight passes.
-- * A unique index treats NULL companyId as distinct, so legacy unscoped rows are not constrained by this key.
--   Those rows stay denied by application code until re-provisioned.
-- * Run apps/backend/prisma/preflight-20261108100000-external-identity-scope.sql before applying.
-- * The index name matches the @@unique map in schema.prisma: academy_external_identities_svc_org_ref_key.

ALTER TABLE "academy_external_identities" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "academy_external_identities_svc_org_ref_key"
  ON "academy_external_identities" ("service", "companyId", "externalUserRef");
