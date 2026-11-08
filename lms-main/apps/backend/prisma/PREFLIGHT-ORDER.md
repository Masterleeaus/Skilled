# Preflight order for `prisma migrate deploy`

Source: `MIGRATION-FIX-NOTES.md` (same folder) and the four `preflight-*.sql` files. All of these are read-only checks. Nothing here has been run against a database.

`pnpm -C apps/backend prisma:deploy` runs `prisma migrate deploy`, which applies every pending migration in one run. The notes give an order that interleaves preflights with migrations, so a single deploy cannot stop between them.

## Preflights

| # | File | What it checks or fixes | Must run before `migrate deploy` on an existing database? |
|---|---|---|---|
| 1 | `preflight-20261108090000-company-rename.sql` | Raises an error if a target name (`academy_companies`, `academy_company_members`, any `companyId` column, any `companyRef` column) already exists. The rename migration is guarded and would otherwise skip silently. | Yes, per the notes. It is documented as "run before the rename", and the rename is pending on an existing database, so run it before `migrate deploy`. The notes do not use the words "before migrate deploy". |
| 2 | `preflight-20261108100000-external-identity-scope.sql` | Duplicate `(service, companyId, externalUserRef)` rows (must be 0), legacy NULL `companyId` counts (informational), orphan `companyId` values (must be 0). | Not specified in repo; confirm with maintainers. The header says both "run before applying the migration" and "run after 20261108090000". Its checks need the renamed `companyId` column, so it cannot run before the rename. |
| 3 | `preflight-20261108100100-course-tracks-fk.sql` | Orphan `academy_course_tracks` rows (must be 0 before VALIDATE). Shows the constraint state after the migration. | Not specified in repo. The notes and the migration say the NOT VALID constraint does not need this to be zero, so it is not a blocker for `migrate deploy`. It is required before the disabled VALIDATE migration is enabled. |
| 4 | `preflight-20261108100200-training-assignment-index-name.sql` | Shows which of the two index names exists, and checks for duplicate `(companyId, learnerId, courseId)` rows (must be 0). | Not specified in repo; confirm with maintainers. The header says it runs after the rename, and also that it shows the state "before the rename runs". The two statements conflict. |

## Order the notes give

1. Preflight 1.
2. Rename migration `20261108090000_academy_tenant_company_rename`.
3. Preflights 2, 3 and 4 (order between them as numbered).
4. Migrations `20261108100000`, `20261108100100`, `20261108100200`, then the two later additive migrations.

Preflight 1 is the only one the notes place before the first migration. How to split `migrate deploy` so that preflights 2 to 4 run between migrations is not specified in repo; confirm with maintainers.

## Other items in the folder

- `quiz-answer-preflight.sql` is in this folder but is not one of the four preflights listed in the notes. It is not covered here.
- The disabled migrations under `disabled-migrations/` must not be placed in `migrations/`. Enabling them is a separate, human decision.
- The notes say `migrate diff` against a shadow database should be run before applying anything. This document does not change that.
