# Migration rehearsal, 2026-11-08

Covers register items ACA-003 (recovery and rollback) and ACA-027 (same-prefix migration ordering).
Branch `claude/verify-migrations`, base `origin/main` at `1fbf352`.
Reproduce with `lms-main/scripts/migration-rehearsal.sh <work-dir>`. The script creates and drops only databases named `lms_I_*`.

No migration file, schema file or application code was changed. The rehearsal used scratch copies of the migration folders cut at chosen points. No deployed migration folder was renamed.

## Result

- Every rehearsed path applied with exit 0. The full chain applies from an empty database, from an init-only database with core learner data, and from a representative pre-November-8 database with academy data. Schemas after each path are identical.
- The same-prefix pair `20261102000100_*` is order-independent. Its two folders share no tables and do not reference each other.
- Rollback is restore. There are no down migrations. A `pg_dump -Fc` backup restored with `pg_restore` returns the exact data at the backup point. Re-applying the newer migrations gives the same data and schema as the forward path.
- One failure was reproduced and recovered (section 6). `20261108130000_payment_coupon_redemptions` fails if a learner has two PENDING payments for one course. It is atomic and leaves no partial columns. Recovery was verified.
- The staged order in `PREFLIGHT-ORDER.md` cannot be run with one `prisma migrate deploy`. Preflights 2 and 4 fail before the rename (section 4). This is an open item for maintainers.

## 1. Environment

| Item | Value |
|---|---|
| PostgreSQL server | 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, localhost:5432 (shared; not started or stopped by the rehearsal) |
| psql, pg_dump, pg_restore | 16.15 |
| Prisma CLI and client | 6.19.3 |
| Node | v22.23.4 |
| Migration folders | 29 (plus `migration_lock.toml`) |
| Work directory | session scratchpad `rehearsal-final/` (logs, snapshots, scratch schemas, backup). Not committed. |

## 2. Commands

Set-up (as in the issue brief):

```bash
git fetch origin main && git checkout -b claude/verify-migrations origin/main
cd lms-main
pnpm install --frozen-lockfile
pnpm -C apps/backend exec prisma generate
```

Rehearsal:

```bash
lms-main/scripts/migration-rehearsal.sh <work-dir>
```

The results in this report come from a full run of the script. After that run, one unused helper that wrote a scratch SQL file was removed from the script. No command the rehearsal executes changed.

The script runs these steps. Each step is also shown with the exact command as it ran.

1. Create the database: `psql -h localhost -U postgres -c 'CREATE DATABASE "lms_I_pre" OWNER titan;'`
2. Make a scratch schema cut. The script copies `schema.prisma` and the migration folders sorted at or before the cut into `<work-dir>/schemas/<label>/`. Cut points: `20261103120000_licence_track_enrolment` (last pre-November-8 migration), `20261108090000_academy_tenant_company_rename` (rename), `20260717195126_init`.
3. Deploy to the cut: `DATABASE_URL=postgresql://titan:…@localhost:5432/lms_I_pre pnpm -C apps/backend exec prisma migrate deploy --schema <work-dir>/schemas/<label>/schema.prisma`
4. Seed representative data: `psql <url> -v ON_ERROR_STOP=1 -f seed-core.sql` then `-f seed-academy.sql`. The SQL is embedded in the script.
5. Back up: `pg_dump -Fc --no-owner --no-privileges -f pre_nov8.dump lms_I_pre`, then `sha256sum` and `pg_restore --list pre_nov8.dump | grep -c 'TABLE DATA'`.
6. Preflight 1: `psql <url> -v ON_ERROR_STOP=1 -f apps/backend/prisma/preflight-20261108090000-company-rename.sql`
7. Deploy through the rename (scratch cut at `20261108090000_…`).
8. Preflights 2, 3, 4 in that order, each with `psql -v ON_ERROR_STOP=1 -f apps/backend/prisma/preflight-20261108100{000,100,200}-….sql`.
9. Deploy the remaining migrations from the repo folder: `pnpm -C apps/backend exec prisma migrate deploy --schema apps/backend/prisma/schema.prisma`
10. Check: `prisma migrate status`, `prisma migrate diff --from-url <url> --to-schema-datamodel apps/backend/prisma/schema.prisma --script`, `pg_dump --schema-only` (the `\restrict` token lines pg_dump 16 writes are removed before comparing).
11. Restore: `pg_restore --no-owner --no-privileges --exit-on-error -d <url> pre_nov8.dump`, then steps 6 to 10 on the restored database.

## 3. Row counts and content digests

Counts and digests are per table, taken at three points. `before` is the backup point (`20261103120000` applied plus seeds). `after rename` is after `20261108090000`. `final` is after the full chain. The digest is md5 over the ordered text of all rows.

| Table (name at `before`) | Rows before | Rows after rename | Rows final | Digest before = final |
|---|---:|---:|---:|---|
| users | 44 | 44 | 44 | yes |
| courses | 6 | 6 | 6 | yes |
| categories | 3 | 3 | 3 | yes |
| enrollments | 107 | 107 | 107 | yes |
| payments | 110 | 110 | 110 | no (expected: `couponId`, `checkoutUrl` added by 20261108130000) |
| coupons | 3 | 3 | 3 | no (expected: `redeemedCount` added by 20261108130000) |
| quizzes | 3 | 3 | 3 | yes |
| questions | 6 | 6 | 6 | yes |
| options | 18 | 18 | 18 | yes |
| quiz_attempts | 25 | 25 | 25 | yes |
| answers | 40 | 40 | 40 | yes |
| assignments | 2 | 2 | 2 | yes |
| certificates | 5 | 5 | 5 | yes |
| academy_organisations (now academy_companies) | 3 | 3 | 3 | yes |
| academy_organisation_members (now academy_company_members) | 43 | 43 | 43 | yes |
| academy_content_lessons | 6 | 6 | 6 | yes |
| academy_lesson_revisions | 6 | 6 | 6 | yes |
| academy_curriculum_tracks | 2 | 2 | 2 | yes |
| academy_lesson_placements | 6 | 6 | 6 | yes |
| academy_course_tracks | 3 (1 orphan) | 3 | 3 | yes |
| academy_learner_completions | 40 | 40 | 40 | yes |
| academy_knowledge_attempts | 10 | 10 | 10 | yes |
| academy_knowledge_answer_keys | 12 | 12 | 12 | yes |
| academy_lesson_reviews | 1 | 1 | 1 | yes |
| academy_practical_evidence | 6 (1 legacy, NULL org) | 6 | 6 | yes |
| academy_verified_competencies | 3 | 3 | 3 | yes |
| academy_training_assignments | 60 | 60 | 60 | yes |
| academy_external_identities | 4 (1 legacy, NULL org) | 4 | 4 | yes |
| academy_integration_audit | 12 | 12 | 12 | yes |
| academy_service_credentials | 2 | 2 | 2 | yes |
| academy_business_lesson_fields | 6 | 6 | 6 | yes |
| academy_lesson_context_snapshots | 10 | 10 | 10 | yes |
| academy_course_lesson_selections | 4 | 4 | 4 | yes |
| academy_template_responses | 4 | 4 | 4 | yes |
| academy_curriculum_pathways | 1 | 1 | 1 | yes |
| academy_pathway_courses | 2 | 2 | 2 | yes |
| academy_pathway_enrolments | 8 | 8 | 8 | yes |

The restored database (`restore`) matches `before` exactly for every table (the compare step reports IDENTICAL). Its final state is identical to the forward `final` state, including the two digests that changed by design.

The academy tables with renamed columns keep the same digests after the rename. The rename changes names only, not values.

## 4. Preflight results

| Preflight | Before rename | After rename | Notes |
|---|---|---|---|
| 1, `preflight-20261108090000-company-rename.sql` | passes, exit 0 | refuses, exit 3: `PREFLIGHT FAILED: target names already exist: academy_companies academy_company_members …` | Works as documented. |
| 2, `preflight-20261108100000-external-identity-scope.sql` | fails, exit 3: `column "companyId" does not exist` | 0 duplicates; 1 legacy unscoped row (service `titan-field`); 0 orphans; `rows_without_company` = 1 | Cannot run before the rename. |
| 3, `preflight-20261108100100-course-tracks-fk.sql` | not run (needs no rename, can run first) | returns 1 orphan row (`ctk_orphan`, courseId `crs_retired_2019`); `convalidated = f` | Orphan seeded on purpose. |
| 4, `preflight-20261108100200-training-assignment-index-name.sql` | fails, exit 3: `column "companyId" does not exist` (duplicate query) | index `academy_training_assignments_companyId_learnerId_courseId_` (58 characters) exists; 0 duplicates | Cannot run before the rename. |

Negative and boundary checks:

- VALIDATE of the NOT VALID course-tracks foreign key (the disabled `20261108100400` step), run in a transaction and rolled back: fails with `Key (courseId)=(crs_retired_2019) is not present in table "courses"`. The disabled migration must stay disabled until preflight 3 returns zero rows.
- NOT VALID means migration `20261108100100` still applies with the orphan present. It did.
- Duplicate-certificate check (`20261102210000`) and duplicate-answer / in-progress-attempt checks (`20261102220000`) were run manually against the restored backup. All returned zero rows. These migrations sit before the November-8 cut, so the staged path does not re-run them.

Identifier truncation (ACA-027 index-name fix):

- Before `20261108100200`, the live index name is `academy_training_assignments_organisationId_learnerId_courseId_` at 63 bytes. Migration `20261102080000` created it as a 66-character name, which PostgreSQL truncates. This confirms the note in `20261108100200`.
- After `20261108090000` the name is 58 characters. After `20261108100200` it is `academy_training_assignments_org_learner_course_key` (49 characters).
- At the final state no identifier is 63 bytes long. The longest are 61 characters.
- The final schema dump contains no `organisation` identifiers (case-insensitive count 0).

## 5. Same-prefix migrations (ACA-027)

- The only duplicated prefix is `20261102000100`. Its two folders are `20261102000100_academy_external_identity_audit` and `20261102000100_titan_academy_content_inventory`. No other prefix is duplicated.
- Lexical order (`LC_ALL=C`, which matches Prisma's folder sort) is audit, then inventory. `_prisma_migrations.started_at` confirms that order in every path.
- Dependencies, checked by grep on the folders:
  - Audit creates `academy_external_identities` and `academy_integration_audit`. Inventory does not reference them.
  - Inventory creates `academy_content_lessons`. Audit does not reference it.
  - The first later reference to `academy_content_lessons` is `20261102000200`. The first reference to `academy_external_identities` (column `organisationId`) is `20261102190000`. Both come after the pair.
- Reversed-order test (path S): inventory was renamed in a scratch copy so it sorts first (`20261102000100_0titan_academy_content_inventory`). The full chain applied, and the final schema is identical to the normal path.
- Prerequisites: every path ran every migration against the tables it needs, with exit 0.

## 6. Failed migration reproduced (ACA-003)

File: `apps/backend/prisma/migrations/20261108130000_payment_coupon_redemptions/migration.sql`

Reproduction:

1. Restore `pre_nov8.dump` into a new database.
2. Insert a second PENDING payment for an existing PENDING learner and course:
   `INSERT INTO payments (id, "studentId", "courseId", amount, provider, "transactionId", status, "createdAt") VALUES ('pay_pending_dup','usr_s001','crs_2',100,'stripe','txn_pending_dup','PENDING',now());`
3. The documented check from the migration header returns one row: `usr_s001 | crs_2 | 2`.
4. `prisma migrate deploy --schema apps/backend/prisma/schema.prisma` stops with:
   `ERROR: could not create unique index "payments_one_pending_per_student_course_key" DETAIL: Key ("studentId", "courseId")=(usr_s001, crs_2) is duplicated.` (Prisma error code 23505, exit 1.)

State after failure:

- `_prisma_migrations` has a row for `20261108130000_payment_coupon_redemptions` with `finished_at` NULL. The earlier migrations are committed.
- `payments` has neither `couponId` nor `checkoutUrl`. The failing migration rolled back as a whole.

Recovery, verified:

1. `DELETE FROM payments WHERE id = 'pay_pending_dup';`
2. `prisma migrate resolve --rolled-back 20261108130000_payment_coupon_redemptions --schema apps/backend/prisma/schema.prisma`
3. `prisma migrate deploy --schema apps/backend/prisma/schema.prisma` applies it. `prisma migrate status` reports up to date.
4. The final data digests match the forward path (`neg-final` against `pre-final`: identical).

## 7. Rollback and restore (ACA-003)

- Rollback mechanism: none in the repo. No `*down*` or `*rollback*` migration files exist. `prisma migrate deploy` has no down step. `docs/runbooks/deployment.md` section 6 says the same.
- Rollback exercised: restore from `pg_dump -Fc`. Forward corrective migrations were not rehearsed.
- Backup manifest (final run): `pre_nov8.dump`, 153,525 bytes, sha256 `ce17ef69959e1cac6d43936131cad0c3101294d39a2a93f92fb828a5736caf7b`, 52 TABLE DATA entries. The backup point contains the 22 migration folders up to and including `20261103120000`. The migration history was read after the deploy to that point, not as a separate status run at backup time.
- Restore: `pg_restore --exit-on-error` completed in about 3.7 s. Counts and digests equal the backup point for every table.
- Re-apply: the staged procedure ran against the restored database. The result matches the forward path for data and schema.

## 8. Timings (final run, this sandbox)

Times are wall-clock milliseconds for one command each. They come from a shared development sandbox with about 1,000 rows, so they are not production estimates.

| Step | ms |
|---|---:|
| empty: deploy all (single run) | 6,214 |
| empty staged: deploy through `20261103120000` | 5,978 |
| empty staged: deploy rename | 5,139 |
| empty staged: deploy remaining | 4,812 |
| reversed same-prefix: deploy all | 6,177 |
| init: deploy init | 4,923 |
| init: deploy through `20261103120000` | 6,258 |
| init: deploy rename | 4,485 |
| init: deploy remaining | 4,648 |
| pre: deploy through `20261103120000` | 5,995 |
| pre: `pg_dump -Fc` | 222 |
| pre: deploy rename | 5,325 |
| pre: deploy remaining | 6,220 |
| restore: `pg_restore` | 3,653 |
| restore: deploy rename | 5,238 |
| restore: deploy remaining | 4,937 |
| negative: `pg_restore` | 3,188 |

The timed steps total about 83 seconds. The row-count and digest queries, schema dumps, and the negative-test and recovery commands are not in the timing file.

## 9. Findings for maintainers (not fixed on this branch)

1. **Preflights 2 and 4 cannot run before the rename.** Both reference `"companyId"`, which only exists after `20261108090000`. `PREFLIGHT-ORDER.md` says the interleaving is unspecified. One `prisma migrate deploy` cannot pause between migrations, so a production run needs a split: deploy through the rename, run preflights 2 to 4, then deploy the rest. The rehearsal did this with scratch cut copies. The runbook does not yet describe how to do it safely in production.
2. **`20261108130000` is missing from `PREFLIGHT-ORDER.md`.** Its duplicate-PENDING check exists only in the migration header comment. It would fail the deploy as shown in section 6.
3. **The runbook has no failed-migration recovery step.** `prisma migrate resolve --rolled-back` plus redeploy works (section 6), but `docs/runbooks/recovery.md` and `deployment.md` do not mention it.
4. **Disabled migrations stay disabled.** `20261108100400` (VALIDATE) fails while the orphan row exists, which confirms the preflight-3 gating.
5. **Legacy NULL-company identities.** Representative data has one `titan-field` identity with no company. It stays denied until it is re-provisioned. Preflight 2 reports it, as designed.
6. **Drift.** `prisma migrate diff` from the migrated database to `schema.prisma` returns zero statements. Prisma cannot model partial indexes or CHECK constraints, so this check does not cover them. The schema dumps do cover them, but only for comparison between paths, not against a reference. The drift before the chain was not measured.
7. **`pg_dump --schema-only` (PostgreSQL 16) writes a random `\restrict` token each run.** Schema diffs must strip those lines first. The script does this.

## 10. Not verified

- **Production-scale data and timings.** The data is synthetic and about 1,000 rows. Lock time for `CREATE UNIQUE INDEX` (not `CONCURRENTLY`) was not measured.
- **Real duplicates in real data.** Only synthetic duplicates were tested, and only for the PENDING payment case. The certificate and answer duplicate checks were run and returned zero rows, but no populated production copy was used.
- **Application boot and health check against the restored database** (runbook section 3, steps 4 and 5). Not run. The section 4 snapshot-hash checks through the API were not run.
- **Forward corrective migration as a rollback method.** Not rehearsed.
- **Disabled migrations `20261108100300` and `20261108100400`.** Not enabled. Only the VALIDATE statement was run, in a transaction that was rolled back.
- **Starting the rehearsal before `20261102210000` and `20261102220000`.** The staged path starts at `20261103120000`. Those two migrations were only exercised as part of the empty-database and init-state paths, where no duplicate data existed.
- **`prisma/quiz-answer-preflight.sql`.** Not one of the four listed preflights, so not run.
- **Other PostgreSQL major versions.** Only 16.15 was used.
- **Redis and MinIO.** Not involved in the rehearsal. MinIO was not available. Redis was not touched.
- **Staging restore with production-like configuration and real backup retention.** Not available in this environment.
- **Verification commands.** Only the baseline checks listed in the lead's brief were run on the branch. See section 11.

## 11. Verification of the branch

Files changed by this branch: `lms-main/scripts/migration-rehearsal.sh` (new) and `lms-main/docs/MIGRATION-REHEARSAL-2026-11-08.md` (new). Migrations, schema and application code are unchanged.

Baseline checks, run from `apps/backend` with the local binaries after `prisma generate`:

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `tsc -p tsconfig.test.json --noEmit` | exit 0 |
| `eslint src` (the `lint` script) | exit 0 |
| `vitest run` | Test Files 41 passed, 7 skipped; Tests 623 passed, 75 skipped (matches the baseline) |

Note on the method: `pnpm -C apps/backend exec` failed in this sandbox because corepack selected pnpm 12.18.0 while the repo pins pnpm 10.0.0. Forcing it with `--pm-on-fail=ignore` re-linked `node_modules`, which removed the generated Prisma client. The client was regenerated with `apps/backend/node_modules/.bin/prisma generate`, and the checks above were then run on the regenerated client. The rehearsal runs finished before the re-link, so their results are not affected.
