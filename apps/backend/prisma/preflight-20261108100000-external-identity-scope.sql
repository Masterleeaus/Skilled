-- Preflight for 20261108100000_academy_external_identity_org_unique. READ-ONLY. Static, unverified.
-- Run against the target database before applying the migration.

-- Run after 20261108090000_academy_tenant_company_rename (the column is "companyId" from that point on).

-- 1. Must return ZERO rows. Duplicate (service, "companyId", "externalUserRef") triples would block the new unique index.
--    Because (service, "externalUserRef") is already globally unique, this should always be empty.
SELECT "service", "companyId", "externalUserRef", COUNT(*) AS duplicates
FROM "academy_external_identities"
WHERE "companyId" IS NOT NULL
GROUP BY "service", "companyId", "externalUserRef"
HAVING COUNT(*) > 1;

-- 2. Informational. Legacy rows with NULL "companyId". They are not constrained by the new key and remain denied in
--    application code. Record the count. A human decides whether to re-provision them before enabling the drop.
SELECT "service", COUNT(*) AS legacy_unscoped_rows
FROM "academy_external_identities"
WHERE "companyId" IS NULL
GROUP BY "service"
ORDER BY legacy_unscoped_rows DESC;

-- 3. Informational. "companyId" has no foreign key in this migration. Rows pointing at a missing academy_companies row
--    would be orphans if a foreign key is added later. Must return ZERO rows before any foreign key is considered.
SELECT ei."id", ei."service", ei."companyId"
FROM "academy_external_identities" ei
LEFT JOIN "academy_companies" c ON c."id" = ei."companyId"
WHERE ei."companyId" IS NOT NULL AND c."id" IS NULL;

-- 4. Drop readiness for disabled-migrations/20261108100300_DISABLED_academy_external_identity_drop_global_key.sql.
--    Informational. Counts the legacy rows the global key does not scope. The drop must not run until the application
--    provisions identities with companyId set, and the business has accepted the change in cross-company behaviour.
SELECT "service", COUNT(*) AS rows_without_company
FROM "academy_external_identities"
WHERE "companyId" IS NULL
GROUP BY "service";
