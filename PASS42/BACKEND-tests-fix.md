# BACKEND test fix (backend test engineer)

Scope: apps/backend. Database credentials and roles were not changed. No schema, migration, curriculum, level CSV or course map files were touched. Nothing was committed.

## Backup
Command: `cp -a apps/backend/src/tests/. /home/claude/work/backend-test-fix-backup/`
Result: 15 entries copied (all files and the integration and support folders).

## Environment used for test runs
- `REDIS_URL=redis://127.0.0.1:6399`
- `DATABASE_URL=postgresql://test:<password redacted>@127.0.0.1:5432/lms_merge_test` (the test role password is rejected by Postgres)
- Redis was not listening on 6399 at start. It was started with:
  `redis-server --port 6399 --bind 127.0.0.1 --save "" --appendonly no --dir /home/claude/work/redis-6399 --daemonize yes`
  Check: `redis-cli -p 6399 ping` returned PONG. This is a local, non-persistent test Redis.

## Lesson-review tests
- Command: `npx vitest run src/tests/lesson-review.test.ts`
- Result before any change: 32 passed (32). The two failures reported earlier were not reproduced.
- Result after all changes: 32 passed (32). `src/tests/lesson-review.test.ts` is byte-identical to the backup.
- Decision: no code or test edit. The file already passes, so no test was weakened.

## Failure 1: auth.test.ts and health.test.ts failed at import (env validation)
- Cause: `src/config/env.ts` calls `process.exit(1)` at import when required names are unset. Missing: CLIENT_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY.
- SMTP was not the cause. Every SMTP_* name has a default or is optional. The email worker (`src/jobs/email.worker.ts`) is not imported by any test, so an absent SMTP config does not crash the test run.
- Fix: added `apps/backend/src/tests/support/test-env.ts`, which fills only unset required non-database names with synthetic values. DATABASE_URL and REDIS_URL are not defaulted. Registered it in `apps/backend/vitest.config.ts` via `setupFiles`.
- Values in that file are placeholders, not secrets.

## Email configuration (step 3)
- `.env.example` (repo root) already lists SMTP_HOST, SMTP_PORT, SMTP_FROM, SMTP_TLS_MODE, SMTP_USER, SMTP_PASSWORD. Names only were checked. No change made.

## Full suite
- Command: `REDIS_URL=... DATABASE_URL=... npx vitest run --fileParallelism=false`
- Run 1 (before the setup fix): Test Files 7 failed | 14 passed (21); Tests 239 passed | 64 skipped (303). Log: /home/claude/work/backend-full-run1.log
- Run 2 (after the setup fix, final): Test Files 8 failed | 14 passed (22); Tests 1 failed | 239 passed | 74 skipped (314). Log: /home/claude/work/backend-full-run2.log
  The total rose because another agent added `academy-course-selection-http.test.ts` and extended other files during the session.

### Database-only failures (Postgres password rejected; expected until credentials are supplied)
- src/tests/auth.test.ts (`Authentication failed against database server, the provided database credentials for test are not valid`)
- src/tests/integration/contract.test.ts
- src/tests/integration/credential-lifecycle.test.ts
- src/tests/integration/cross-tenant.test.ts
- src/tests/integration/identity-linking.test.ts
- src/tests/integration/learner-status.test.ts

### Non-database failures (not fixed; owned by other agents' areas)
1. src/tests/academy-course-selection-http.test.ts (new file): fails at import with `InvalidEndpointError: Invalid endPoint : undefined`. Cause: the file mocks `../config/env` with a partial object that has no MINIO_* fields, then imports the full app, which builds the MinIO client. Test-side fix needed (add MINIO fields to the mock or mock `../config/minio`). Course-selection area, not fixed.
2. src/tests/academy-levels.test.ts > "does not block a deselected lesson..." (PASS42 course selection narrows the gate): `group` is undefined at line 417 because no placement with sourceId LVL-group1 appears in the outline for a deselected lesson. The test expects it to be present with levelLock null. Whether the test or the outline behaviour is wrong is a level-gate and course-selection decision. Not fixed. Reproduces when the file runs alone (26 passed, 1 failed).

### Verification
- `npx tsc -p tsconfig.test.json --noEmit`: exit 0.
