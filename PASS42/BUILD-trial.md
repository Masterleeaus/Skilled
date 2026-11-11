# PASS42 build trial: TypeScript 5.6 pin, backend and frontend build, test run

Date: 2026-11-02. Scope: build engineer pass on `/home/claude/p29m/lms-main/apps`.
Baseline copy taken before any change: `/home/claude/work/build-pass42-baseline/` (apps tree). Lockfile and shared manifest originals: `/home/claude/work/build-pass42-pnpm-lock.yaml.orig`, `/home/claude/work/build-pass42-shared-package.json.orig`.
No git commit. No Prisma schema or migration edits (schema md5 `c0a1246d83a9cc32b7d05b6e9ce1a0fa` before and after). No Playwright install.

## Result

| Check | Result |
|---|---|
| Backend build (`npm run build`, tsc, TypeScript 5.6.3) | PASS (exit 0) |
| Backend test typecheck (`npm run typecheck:tests`) | PASS (exit 0) |
| Frontend typecheck (`tsc --noEmit`) | PASS (0 errors) |
| Frontend build (`npm run build`, next build) | PASS (exit 0) |
| Backend vitest | 18 of 18 files passed; 257 tests passed, 1 skipped (258 total) |
| Backend `node tests/pass22-inactive-identity.test.cjs` | PASS (11 source checks) |
| Frontend browser suite (`tests/browser/academy-browser-suite.mjs`) | 11 passed, 0 failed |
| Frontend verify scripts (`scripts/verify-*.mjs`) | 3 pass, 1 FAIL (`verify-academy-progress-ui.mjs`, see Failures) |
| Frozen install (`pnpm install --frozen-lockfile`) | PASS |

## Environment for the database run

- PostgreSQL 16.15 started with `pg_ctlcluster 16 main start` (cluster was down; it is still running).
- Role `lms` created with CREATEDB, password `lms` (matches `docker-compose.yml`). Scratch databases created: `lms_trial_test` (vitest) and `lms_trial_seed_test` (seed and import checks). The existing `lms_schema_check` database was not touched.
- Redis 7.0.15 started as `redis-server --port 6399 --daemonize yes` (the harness default `REDIS_URL` is port 6399). Still running. The default port 6379 was not started.
- Migrations applied to `lms_trial_test`: `prisma migrate deploy --schema=prisma/schema.prisma` (all migrations applied).

Env for the final vitest run (matches the harness `SAFE_DEFAULTS`; `auth.test.ts` and `health.test.ts` load `config/env` directly and need these set):

```
DATABASE_URL=postgresql://lms:lms@127.0.0.1:5432/lms_trial_test?schema=public
REDIS_URL=redis://127.0.0.1:6399
CLIENT_URL=http://localhost:3000
JWT_ACCESS_SECRET=integration-test-access-secret
JWT_REFRESH_SECRET=integration-test-refresh-secret
MINIO_ACCESS_KEY=integration-test
MINIO_SECRET_KEY=integration-test
NODE_ENV=test
```

## Commands and results, in order

1. Baseline with the pinned TypeScript 7.0.2: `npx tsc -p tsconfig.json --noEmit` in `apps/backend`. Failed before any semantic check: TS5102 (`baseUrl` removed in TS 7) and TS5090.
2. `pnpm install --lockfile-only` (pnpm 10.0.0). Lockfile regenerated for TypeScript 5.6.3. Only peer warnings: `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react` under `eslint-config-next` 16.2.10 report unmet eslint peer ranges (eslint 10.7.0 installed). The eslint versions were not changed by this pass; I did not investigate the peer ranges.
3. `pnpm install --frozen-lockfile`: exit 0. Repeated at the end: exit 0.
4. `tsconfig.json` include narrowed to `src`. `npx tsc -p tsconfig.json --noEmit`: 195 errors. Many were Prisma types because the client was not generated.
5. `npx prisma generate --schema=prisma/schema.prisma`: generated client (v6.19.3). Schema unchanged.
6. Re-typecheck: 125 errors. Main pattern: `req.params.X` and `req.query.X` typed `string | string[]`. Cascade: Prisma `where` inference failures produced false `placements` and implicit-any errors.
7. Added `src/utils/requestParams.ts` (`param`, `query`). Rewrote route reads in 13 existing route files. Re-typecheck: 15 errors.
8. Fixed the remaining 15 (see Files changed). `npx tsc -p tsconfig.json --noEmit`: exit 0.
9. `npm run build` in `apps/backend`: exit 0. `npm run typecheck:tests`: exit 0.
10. Frontend: `npx tsc --noEmit -p tsconfig.json`: exit 0, 0 errors. `npm run build` (next build): exit 0.
11. `npx vitest run` first attempt (before the vitest include change and before the env values were set): 3 files failed, 250 passed, 1 skipped. Causes: `auth.test.ts` and `health.test.ts` exit at config/env (CLIENT_URL, JWT secrets and MinIO keys unset); `tests/pass22-inactive-identity.test.cjs` is a plain node assert script, not a vitest suite.
12. `vitest.config.ts` include restricted to `src/**/*.test.ts` and `tests/**/*.test.ts`. Final `npx vitest run` with the env above: exit 0. Test Files 18 passed (18); Tests 257 passed | 1 skipped (258); Duration 26.71s.
13. `node tests/pass22-inactive-identity.test.cjs`: `PASS: 11 integration security source checks`, exit 0.
14. `node tests/browser/academy-browser-suite.mjs --report /tmp/browser-report-trial.json`: `Browser suite: 11 passed, 0 failed, 11 total`, exit 0. Playwright resolved from the pre-installed `/opt/npm-tools`, browsers from `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. Nothing was installed.
15. `node scripts/verify-*.mjs` (frontend): `verify-business-context-ui.mjs` PASS (10 checks); `verify-manager-context-ui.mjs` PASS; `verify-template-lesson.mjs` PASS (10 of 10); `verify-academy-progress-ui.mjs` FAIL (AssertionError on "backend protected progress endpoint").
16. Prisma scripts under tsx, against `lms_trial_seed_test`:
    - `tsx prisma/seed.ts`: exit 0.
    - `tsx prisma/seed-pathways.ts`: exit 0.
    - `tsx prisma/manage-titan-credentials.ts` with `{"action":"list",...}` on stdin: exit 0.
    - `tsx prisma/provision-titan-integration.ts` with `{}` on stdin: exit 1 with a schema validation message. This is the expected response to an empty payload.
    - `tsx prisma/import-titan-curriculum.ts` with no arguments: exit 0. It imported 221 lessons into `lms_trial_seed_test`. That is a scratch-database side effect; the test database was not used for it.

## Files changed

Backend (`apps/backend`):
- `package.json`: `typescript` 7.0.2 to `5.6.3`. Added script `typecheck:tests`.
- `tsconfig.json`: `include` is `["src"]` (was `["src","prisma"]`). Test files excluded from the production build. `strict` unchanged.
- `tsconfig.test.json` (new): extends the main config with `rootDir: "."`, `noEmit`, includes `src` and `prisma/provision-titan-integration.ts`.
- `vitest.config.ts`: `include` restricted to `.test.ts` files.
- `src/utils/requestParams.ts` (new): `param(req, name)` returns a string or throws `AppError` 400. `query(req, name)` returns `string | undefined` or throws 400 for a repeated value.
- `src/types/nodemailer.d.ts` (new): `declare module "nodemailer";` (no `@types/nodemailer` in the workspace).
- Route files where every `req.params.X` read (and the `req.query.lessonId` read) was rewritten to `param(req, "X")` / `query(req, "lessonId")`. Feature-module routes (pathways, templates, lesson-review, integration, completion-report, audit) were not touched; they already typecheck. Files: `modules/admin/admin.routes.ts`, `modules/assignments/assignment.routes.ts`, `modules/certificates/certificate.routes.ts`, `modules/classes/class.routes.ts`, `modules/courses/category.routes.ts`, `modules/courses/course.routes.ts`, `modules/courses/module.routes.ts`, `modules/curriculum/curriculum.routes.ts`, `modules/discussions/discussion.routes.ts` (`query` for `lessonId`), `modules/enrollment/enrollment.routes.ts`, `modules/quizzes/quiz.routes.ts`, `modules/reviews/review.routes.ts`, `modules/payments/payment.routes.ts`.
- `modules/curriculum/curriculum.routes.ts`: two destructurings of `req.params` replaced by `param()` calls.
- `modules/courses/module.routes.ts`: `const { orderedIds: order } = reorderModulesSchema.parse(...)` and the same for `reorderLessonsSchema`.
- `modules/payments/stripe.provider.ts`: API version string kept as `"2024-06-20"`, widened with `as Stripe.LatestApiVersion`.
- `modules/auth/token.utils.ts`: `expiresIn` cast to `jwt.SignOptions["expiresIn"]`.
- `utils/token.ts`: import path `../../config/env` to `../config/env`; same `expiresIn` cast. This file is a duplicate of `auth/token.utils.ts` and nothing imports it.

Frontend (`apps/frontend`):
- `package.json`: `typescript` `^5.8.2` to `5.6.3`.
- `tsconfig.tsbuildinfo` and `.next/` regenerated by tsc and next build (build artifacts).

Workspace:
- `packages/shared/package.json`: `typescript` `^7.0.2` to `5.6.3` (not in the brief's list; see Decisions).
- `pnpm-lock.yaml`: regenerated (426 changed diff lines). Root `package.json` lists no TypeScript and is unchanged.
- `apps/backend/dist/` created by `npm run build`.

## Decisions (for review)

1. `packages/shared` was pinned to 5.6.3 too. It was on TypeScript 7 and the owner decision is one TypeScript version. Revert the single line if not wanted.
2. Test files are excluded from the production `tsc` build. They are typechecked by `typecheck:tests` (`tsconfig.test.json`). Reason: `identity-linking.test.ts` imports `prisma/provision-titan-integration.ts`, which violates `rootDir: src` (TS6059).
3. Behaviour change: the module and lesson reorder routes destructured `order`, but the validators emit `orderedIds`. `order` was always `undefined`, so `order.map` threw and the request returned 500. Now they read `orderedIds`. Please confirm this is the intended contract.
4. Stripe API version stays `2024-06-20` (no upgrade). The SDK types accept only its own latest version, so the value is cast. Upgrading is a separate owner decision.
5. `nodemailer` has no type package in the workspace. A shorthand module declaration was added rather than a new dependency.
6. `query()` returns 400 for repeated query values. This is the only new 400 path (`lessonId` in discussions). `param()` returns 400 for a non-string or empty value; Express never produces these for matched routes, so no behaviour change is expected there.
7. Vitest now collects only `.test.ts` files. The `.cjs` script is run with `node`, as PASS22 documents.

## Failures and gaps (not fixed, by brief)

- `apps/frontend/scripts/verify-academy-progress-ui.mjs` FAILS on `backend protected progress endpoint`. The check requires `router.get("/courses/:courseId/progress/me", authenticate` in `apps/backend/src/modules/curriculum/curriculum.routes.ts`. That route does not exist in the backend. The frontend also lacks `AcademyCourseProgress` and the matching API call in `src/lib/curriculum.api.ts`. This looks like unfinished feature work; the logic was not written here.
- `apps/backend/src/tests/integration/contract.test.ts`: one `it.skip` ("field-services sync contract: documented business-fields push (OPEN: route not implemented)"). Pre-existing skip; it is the single skipped test.
- No Prisma schema or migration blocker was found.
