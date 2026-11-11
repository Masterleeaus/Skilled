# Migration notes (tenant rename organisation -> company, ACA-027 / ACA-028)

Status: static, unverified. No Prisma, npm or database commands were run. All SQL was checked by reading only.
Source of truth for names: `schema.prisma`, which starts from the delta schema.

## Names

- Tenant model `Company`, table `academy_companies` (was `academy_organisations`).
- Membership model `CompanyMember`, table `academy_company_members` (was `academy_organisation_members`).
  Prisma delegate `companyMember`.
- Tenant column `companyId`, camelCase, no `@map` (was `organisationId`, and an earlier draft used `company_id`).
- Integration column `companyRef` on `academy_integration_audit` and `academy_service_credentials` (was `organisationRef`).
- Route segment `/organisations/` and the external path parameter are unchanged. See `src/RENAME-EXTERNAL.md`.

## Migrations (order)

| Folder | Purpose |
|---|---|
| `20261108090000_academy_tenant_company_rename` | Renames 2 tables, 10 `organisationId` columns, 2 `organisationRef` columns, and the matching indexes and foreign keys to Prisma default names. Every statement is guarded. |
| `20261108100000_academy_external_identity_org_unique` | Additive. Adds the unique index `academy_external_identities_svc_org_ref_key` on (service, companyId, externalUserRef). Global key kept. |
| `20261108100100_academy_course_tracks_course_fk` | Adds `academy_course_tracks_courseId_fkey` to `courses(id)`, NOT VALID. |
| `20261108100200_academy_training_assignment_index_name` | Renames the truncated live index to `academy_training_assignments_org_learner_course_key` (the name schema.prisma maps). |
| `20261108120000_academy_tutor_store` | Promoted from migrations-draft. Additive tables for tutor conversations, messages and tool audits. |
| `20261108120100_academy_chatbot` | Promoted from migrations-draft. Additive chatbot tables, with CHECK constraints added by hand. |

The rename runs first on purpose. The fix migrations and the tutor and chatbot tables all use `companyId` and `academy_companies`.

## Preflights (read-only, run in this order)

1. `preflight-20261108090000-company-rename.sql`: raises an error if a target name already exists. Run before the rename.
2. `preflight-20261108100000-external-identity-scope.sql`: duplicate triples (must be 0), legacy NULL counts, orphan `companyId` (must be 0).
3. `preflight-20261108100100-course-tracks-fk.sql`: orphan `academy_course_tracks` rows (must be 0 before VALIDATE).
4. `preflight-20261108100200-training-assignment-index-name.sql`: shows which index name exists. Duplicate check (must be 0).

## Names kept in the live database and mapped in schema.prisma

These names have no `organisation` word, so they are not renamed. The schema maps them with `map:`:

- `academy_business_lesson_fields_org_key`, `academy_business_lesson_fields_org_status_idx`
- `academy_lesson_context_snapshots_org_learner_idx`
- `academy_course_lesson_selections_companyId_courseId_so_key` (renamed from the live `..._organisationId_courseId_so_key`; 58 characters)
- `academy_training_assignments_org_learner_course_key` (set by 20261108100200)
- `academy_external_identities_svc_org_ref_key`

The partial index `academy_course_lesson_selections_course_default_key` (course-wide rows) is unchanged.

## Disabled files (human only, later)

- `disabled-migrations/20261108100300_DISABLED_academy_external_identity_drop_global_key.sql`: drops the global identity key. Enable only after the identity rows are provisioned with `companyId` and the cross-company change is accepted. Copy into a NEW migration folder with a later timestamp.
- `disabled-migrations/20261108100400_DISABLED_academy_course_tracks_fk_validate.sql`: VALIDATE for the course-tracks FK. Enable only when preflight 3 returns zero rows.

Do not place disabled files inside `migrations/`. Prisma records applied migrations by checksum.

## Unverified

- `prisma validate`, `prisma generate` and `prisma migrate diff` have not been run. Run `migrate diff` against a shadow DB before applying anything.
- The SQL has not been executed on PostgreSQL. `to_regclass`, `ALTER INDEX`, `RENAME CONSTRAINT` and the `DO $$` blocks must be checked on the target version.
- `CREATE UNIQUE INDEX` is not CONCURRENTLY. It takes a SHARE lock on `academy_external_identities` while it builds. Check table size first.
- The CHECK constraints in the chatbot migration are not in the schema, so `migrate diff` will not show them.
- Not addressed: `academy_external_identities.companyId` has no foreign key (by design, see preflight 3). `academy_course_tracks` uses ON DELETE CASCADE, matching `academy_course_lesson_selections`.
