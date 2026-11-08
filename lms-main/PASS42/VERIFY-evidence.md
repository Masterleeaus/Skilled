# PASS42 Verification Evidence (ACA-001, ACA-002, ACA-003, ACA-027)

Scope: verification only. Schema and migration files were not edited by this work. The register was not edited.
Environment: Node v22.23.4, pnpm 10.0.0 (matches `packageManager`), PostgreSQL 16.15 (Ubuntu), Redis server (local), TypeScript 7.0.2 (backend lock), TypeScript 5.9.3 (frontend lock), Next.js 15.5.20, Prisma 6.19.3.

Note on concurrent change: while this run was in progress, another agent changed the tree. `apps/backend/prisma/schema.prisma` was modified at 19:52, and `apps/backend/prisma/migrations/20261102200000_academy_template_pathway_review/` was added at 19:52:58. The first `prisma generate` ran before that change. Validate, generate, drift and migrate deploy were re-run afterwards (see ACA-002 and ACA-003). The migration set tested is the 14 folders present at deploy time.

---

## ACA-001 — Install locked dependencies and compile backend and frontend

**Status: PARTIAL.** Install passed. Frontend build passed after a one-line type fix. Backend build FAILS and was not fixed.

### 1a. Install with lockfile

Command: `cd /home/claude/p29m/lms-main && pnpm install --frozen-lockfile`

Output (trimmed):
```
Scope: all 4 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +678
...
Done in 17.7s
EXIT=0
```
Notes: the build scripts for `@prisma/engines`, `msgpackr-extract`, `sharp` and `unrs-resolver` were ignored by pnpm (not in `onlyBuiltDependencies`). Prisma generate still succeeded (see ACA-002).

### 1b. Backend build

Command: `cd apps/backend && npx tsc -p tsconfig.json` (the `build` script is `tsc`)

First error (verbatim, first line of output):
```
error TS6059: File '/home/claude/p29m/lms-main/apps/backend/prisma/import-titan-curriculum.ts' is not under 'rootDir' '/home/claude/p29m/lms-main/apps/backend/src'. 'rootDir' is expected to contain all source files.
  The file is in the program because:
    Matched by include pattern 'prisma' in '/home/claude/p29m/lms-main/apps/backend/tsconfig.json'
```
Same TS6059 for `manage-titan-credentials.ts`, `provision-titan-integration.ts`, `seed.ts`. Then:
```
tsconfig.json(5,25): error TS5108: Option 'moduleResolution=node10' has been removed. Please remove it from your configuration.
tsconfig.json(14,5): error TS5102: Option 'baseUrl' has been removed. Please remove it from your configuration.
tsconfig.json(15,24): error TS5090: Non-relative paths are not allowed. Did you forget a leading './'?
```
Exit: 2 (first run), 1 (`--noEmit` rerun against current tree). Seven `error TS` lines in total.

Findings:
- The lockfile pins `typescript@7.0.2` for the backend (`apps/backend/package.json` devDependencies). TypeScript 7 removed `moduleResolution: node` (node10) and `baseUrl`, and it rejects the `"@/*": ["*"]` path target.
- `include: ["src", "prisma"]` pulls the `prisma/*.ts` scripts outside `rootDir: "src"`.
- Config errors suppress semantic checking. To see the real source errors, the compiler was run with a scratch tsconfig outside the repo (`/tmp/aca001-tsc/tsconfig.trial.json`, `include` limited to `src`, `module`/`moduleResolution` `node16`, `baseUrl` removed, `paths` target `./src/*`). Result: 130 `error TS` lines, exit 1. Log: `/tmp/aca001-tsc/final-trial7.log`. Error kinds: TS2345 (`string | string[]` route params), TS2322, TS2769 (`jwt.sign` `expiresIn`), TS7016 (`nodemailer` has no types), TS2307, TS2339.
- The same `src` with the frontend's locked TypeScript 5.9.3 and the original options: 126 `error TS` lines, exit 2. Log: `/tmp/aca001-tsc/ts59-src-only.log`. Correction: an earlier reading of 5.9.3 showed only the 4 TS6059 errors. That was wrong. `tsc` skips semantic checks when program-level errors exist.
- `apps/backend/src` is byte-identical to the baseline, so these source errors predate this run.

Decision: NOT FIXED. The backend build cannot pass with a tsconfig-only change. It needs either a TypeScript version decision (dependency change, which is outside "install with the lockfile") or about 126 to 130 source fixes across many modules. Both are beyond the "smallest change" rule. Owner decision required.

### 1c. Frontend build

Command: `cd apps/frontend && npx next build`

Before fix (first run, exit 1):
```
✓ Compiled successfully in 21.2s
Linting and checking validity of types ...
⨯ ESLint: Invalid Options: - Unknown options: useEslintrc, extensions - 'extensions' has been removed.
Failed to compile.

./src/app/teacher/courses/new/page.tsx:35:5
Type error: Type 'Resolver<{ title: string; ...; price: unknown; ... }, any, { ...; price: number; ... }>' is not assignable to type 'Resolver<...>'.
  ...
    Type 'unknown' is not assignable to type 'number'.
> 35 |     resolver: zodResolver(schema),
```
Cause: `z.coerce.number()` in zod 4.4.3 has input type `unknown`. `useForm<FormValues>` expects the output type for field values.

Change made (the only source change in this run):
- File: `/home/claude/p29m/lms-main/apps/frontend/src/app/teacher/courses/new/page.tsx`
- Line 34, before: `  } = useForm<FormValues>({`
- Line 34, after: `  } = useForm<z.input<typeof schema>, unknown, FormValues>({`

After fix (`EXIT=0`):
```
✓ Compiled successfully in 14.3s
⨯ ESLint: Invalid Options: - Unknown options: useEslintrc, extensions - 'extensions' has been removed.
✓ Generating static pages (15/15)
Route (app)   ... (route table: 31 app routes, marked ○ static or ƒ dynamic)
┌ ○ /  ...   ├ ƒ /teacher/courses/[slug]  ...   └ ○ /teacher/courses/new   1.8 kB   172 kB
+ First Load JS shared by all   102 kB
FRONTEND_EXIT=0
```
The ESLint "Invalid Options" line is printed but does not stop the build. It is a lint config issue (`next lint` options), not fixed.

The page file is byte-identical to the baseline before this one-line change, so the type error predates this run.

---

## ACA-002 — Validate Prisma schema and generated client

**Status: DONE** for the criterion "prisma validate and generate succeed". A schema-to-database drift finding is recorded below and is not a validate failure.

Commands (in `apps/backend`):
1. `npx prisma validate` with no `DATABASE_URL`: exit 1, `error: Environment variable not found: DATABASE_URL` (`prisma/schema.prisma:7`). This is an environment requirement, not a schema error.
2. `DATABASE_URL="postgresql://u:p@localhost:5432/x" npx prisma validate`: `The schema at prisma/schema.prisma is valid`.
3. `npx prisma generate` (first run, before the concurrent schema change): exit 0, `✔ Generated Prisma Client (v6.19.3)`.
4. Re-run after the concurrent change to `schema.prisma` (19:52):
   - `DATABASE_URL=... npx prisma validate`: `VALIDATE_EXIT=0`, `The schema at prisma/schema.prisma is valid`.
   - `npx prisma generate`: `GENERATE_EXIT=0`, `✔ Generated Prisma Client (v6.19.3)`.

Drift check (current schema against migrated `lms_verify`), command `npx prisma migrate diff --from-url <lms_verify> --to-schema-datamodel prisma/schema.prisma --script`:
```
ALTER INDEX "academy_business_lesson_fields_org_key" RENAME TO "academy_business_lesson_fields_organisationId_fieldKey_key";
ALTER INDEX "academy_business_lesson_fields_org_status_idx" RENAME TO "academy_business_lesson_fields_organisationId_status_idx";
ALTER INDEX "academy_lesson_context_snapshots_org_learner_idx" RENAME TO "academy_lesson_context_snapshots_organisationId_learnerId_c_idx";
ALTER INDEX "academy_training_assignments_organisationId_learnerId_courseId_" RENAME TO "academy_training_assignments_organisationId_learnerId_cours_key";
```
Finding: four index names in the migrations differ from the names `schema.prisma` produces. Nothing is destructive, but the migration history does not exactly match the schema. A later `prisma migrate dev` will generate a rename migration. Not fixed (schema and migrations are owned elsewhere).

---

## ACA-003 — Apply and rollback migrations in isolated PostgreSQL staging

**Status: PARTIAL.** Deploy, idempotent redeploy, transactional rollback rehearsal and dump/restore recovery all passed. Gaps: no down migrations exist, the four index drift items remain, and the only app-level smoke test was the vitest suite run against a copy of the migrated database.

Isolated cluster: a fresh PostgreSQL 16.15 data directory at `/tmp/aca003-pg/data`, started as the `postgres` user on `127.0.0.1:55432` (socket `/tmp/aca003-pg/run`). Not the shared cluster on 5432. Stopped at the end of this run.

Commands and results:
1. Create database: `CREATE DATABASE lms_verify;` (succeeded).
2. `DATABASE_URL=postgresql://postgres@127.0.0.1:55432/lms_verify npx prisma migrate deploy`:
```
14 migrations found in prisma/migrations
Applying migration `20260717195126_init`
Applying migration `20261102000100_academy_external_identity_audit`
Applying migration `20261102000100_titan_academy_content_inventory`
... (through)
Applying migration `20261102200000_academy_template_pathway_review`
All migrations have been successfully applied.
DEPLOY_EXIT=0
```
3. Redeploy (idempotence): `No pending migrations to apply.`
4. Migration table: `14|14|0|0` (14 rows, 14 finished, 0 rolled back, 0 with logs). Tables in `public`: 50 (including `_prisma_migrations`).
5. `prisma migrate status`: `Database schema is up to date!`
6. Risky-statement scan of all 14 `migration.sql` files for `CONCURRENTLY`, `ADD VALUE`, `VACUUM`, `CREATE DATABASE`, explicit `BEGIN`/`COMMIT`/`ROLLBACK`, `CREATE EXTENSION`, `DROP DATABASE`, `TRUNCATE`, `DROP TABLE`, `DROP COLUMN`, column type changes: no matches.

Rollback rehearsal (Prisma has no down migrations, so this tests whether the chain can be rolled back as one transaction):
7. Database `lms_rollback`. Wrapper script `BEGIN; \i` each of the 14 files in order, then `SELECT count(*)` and `ROLLBACK;`, run with `ON_ERROR_STOP=1`. Result: `ROLLBACK_TXN_EXIT=0`. Inside the transaction 49 public tables were created. After rollback: 0 tables. The whole chain is transactional.

Recovery rehearsal:
8. `pg_dump -Fc lms_verify` (`DUMP_EXIT=0`), then `pg_restore` into fresh `lms_recovered` (`RESTORE_EXIT=0`, 0 error lines).
9. `prisma migrate status` against `lms_recovered`: `Database schema is up to date!`. 50 tables.
10. Schema dump diff (`pg_dump -s`, `lms_verify` against `lms_recovered`): only the random `\restrict`/`\unrestrict` tokens differ. Identical schema.

Smoke test:
11. Backend vitest run against a copy of the migrated database (`lms_tests`, created from `lms_verify` as template, so test writes did not touch `lms_verify`). See the vitest section below: 23 of 23 tests passed.

Gaps keeping this PARTIAL:
- No down migrations exist. The rollback path is restore-from-dump, which was rehearsed (items 8 to 10). The transaction rehearsal (item 7) proves the chain is atomic.
- The four index drift items (ACA-002 section) remain.
- The smoke test is the vitest suite, not a dedicated post-migration smoke.

---

## ACA-027 — Inspect same-prefix migration ordering and dependencies

**Status: DONE** for "Clean staging migration ordering confirmed".

Same-prefix groups: two folders share the prefix `20261102000100`:
- `20261102000100_academy_external_identity_audit/migration.sql` (16 lines): creates `academy_external_identities` (FK to `users`, which is created by `init`), `academy_integration_audit`, and their indexes.
- `20261102000100_titan_academy_content_inventory/migration.sql` (19 lines): creates `academy_content_lessons` and one index. No foreign key or reference to the other group's tables.

Prisma sorts by full folder name, so the applied order is `academy_external_identity_audit` then `titan_academy_content_inventory`. That order is deterministic.

Full ordering as applied (folder names from `ls | sort`):
```
20260717195126_init
20261102000100_academy_external_identity_audit
20261102000100_titan_academy_content_inventory
20261102000200_titan_academy_curriculum_composition
20261102000300_academy_course_composition
20261102002300_business_lesson_fields
20261102060000_academy_knowledge_attempts
20261102070000_academy_practical_evidence
20261102080000_academy_organisations_training
20261102090000_academy_verified_competencies
20261102100000_academy_evidence_tenant_binding
20261102170000_academy_service_credentials
20261102190000_academy_identity_tenant_scope
20261102200000_academy_template_pathway_review
```

Order test:
- Database `lms_order`. Same-prefix pair swapped (`titan_academy_content_inventory` first), all other files in order, run with `psql -v ON_ERROR_STOP=1`. Result: `SWAPPED_ORDER_EXIT=0`, no errors.
- `pg_dump -s` of `lms_order` against `lms_verify`: only the `_prisma_migrations` table (absent in `lms_order`) and the `\restrict` tokens differ. The schema is otherwise identical, so the two same-prefix files are order-independent.

Other notes:
- The migration folder changed during the run (`20261102200000_academy_template_pathway_review` added at 19:52:58). It is included in the 14 applied and tested here.
- Hygiene recommendation (not a defect): a duplicate timestamp prefix invites confusion. Renaming is a change to migrations and belongs to the migration owner.

---

## Backend tests (vitest)

Command (`apps/backend`): `npx vitest run` with `DATABASE_URL=postgresql://postgres@127.0.0.1:55432/lms_tests`, `REDIS_URL=redis://127.0.0.1:6399`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `CLIENT_URL`, `NODE_ENV=test`. These values were supplied on the command line and written to no file. Redis was a local `redis-server` on 6399 with no persistence.

Attempt 1 (no env vars): all three suites failed at `src/config/env.ts`, which exits when required variables are missing. Not a code defect.
Attempt 2 (env vars, Redis not running): `Tests 2 failed | 10 passed (12)`. Both failures were 15-second timeouts connecting to Redis (`ECONNREFUSED 127.0.0.1:6399`).
Attempt 3 (env vars, Redis running): 
```
 Test Files  1 failed | 4 passed (5)
      Tests  23 passed (23)
VITEST_EXIT=1
```
The one failed file is `tests/pass22-inactive-identity.test.cjs`, which vitest reports as `No test suite found`. It is a Node `assert` script with no `describe`/`it`. Run directly with `node`, it passes: `PASS: 11 integration security source checks`, exit 0.

So the suite is 23 of 23 test cases passing, with one non-vitest script that fails only the vitest wrapper. The test failures are not hidden: attempt 2 is recorded above.

---

## Files and state changed in this run

Repository source changes:
- `apps/frontend/src/app/teacher/courses/new/page.tsx` line 34: `useForm<FormValues>({` changed to `useForm<z.input<typeof schema>, unknown, FormValues>({`.

Not changed (checked): `apps/backend/tsconfig.json`, `apps/backend/prisma/schema.prisma` (this run did not edit it), all migration files, `pnpm-lock.yaml`, `package.json` files, the register.

Build and generated artifacts (gitignored or install output, not source):
- `node_modules/` (pnpm install; Prisma client regenerated into the pnpm store).
- `apps/frontend/.next/` (next build output).
- Removed: `apps/backend/dist/`, `apps/backend/prisma/*.js` emitted by a `tsc` run that reported errors, `apps/backend/logs/` created by the test run, `apps/frontend/next-env.d.ts`.

External state (temporary, outside the repo):
- PostgreSQL 16 cluster at `/tmp/aca003-pg/data` on port 55432, with databases `lms_verify`, `lms_tests`, `lms_order`, `lms_rollback`, `lms_recovered`. Stopped at the end of this run.
- Redis at port 6399. Stopped at the end of this run.
- Logs: `/tmp/aca001-*.log`, `/tmp/aca002-*.log`, `/tmp/aca003-pg/*.log`, `/tmp/aca001-tsc/*.log`.

## Register status summary

| Item | Status | Evidence |
|---|---|---|
| ACA-001 | PARTIAL | Install (frozen lockfile) PASS. Frontend build PASS after one-line fix. Backend `tsc` FAIL (first error TS6059 at `apps/backend/prisma/import-titan-curriculum.ts`), not fixed. |
| ACA-002 | DONE | `prisma validate` PASS, `prisma generate` PASS. Four index drift items recorded. |
| ACA-003 | PARTIAL | Deploy PASS (14 migrations), redeploy idempotent, transactional rollback rehearsal PASS, dump/restore recovery PASS. No down migrations; drift remains; smoke only via vitest. |
| ACA-027 | DONE | Same-prefix pair confirmed independent; swapped order yields identical schema. |
