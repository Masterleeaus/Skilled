# PASS42 quality and operations evidence (QUALITY-ops)

Scope: quality, accessibility, CI, documentation and reporting items ACA-014, 015, 019, 020, 021, 022, 023 and 025 in `TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md`. The register itself was not edited. No schema, migration, lesson template renderer or review screen was touched. No git commit was made. No memory tool was used. `playwright install` was not run.

Date: 2026-11-02. Working tree: `/home/claude/p29m/lms-main`. Backups of every pre-existing file changed: `/home/claude/work/quality-pass42-backup/` (with `SHA256-before-all.txt`). Files created in this pass have no backup because they did not exist before.

## Summary

| Item | Status | Tests run (passed / failed / skipped) | Main limit |
|---|---|---|---|
| ACA-014 enrolment, completion, progress | PARTIAL | 11 / 0 / 0 (enrolment and quiz file), plus required/optional cases in ACA-025 file | In-memory Prisma; browser and API agreement not tested |
| ACA-015 snapshot history and integrity | PARTIAL | 14 / 0 / 0 | In-memory Prisma; no PostgreSQL run |
| ACA-019 browser player and manager regression | PARTIAL | 11 / 0 / 0 (browser suite, of which 8 are ACA-019 and 3 are ACA-023) | API mocked in the browser; no live API |
| ACA-020 curriculum audits in CI | DONE | 4 self-tests passed; gate PASS | No CI pipeline file exists in the repository to wire it into |
| ACA-021 portfolio branding and docs | DONE | n/a (grep re-scan) | Technical identifiers retained by design (listed below) |
| ACA-022 runbooks | PARTIAL | n/a | Written, not rehearsed (the register's done-when requires a rehearsal) |
| ACA-023 player accessibility | PARTIAL | axe 0 violations at 1280px and 375px (within the 11 browser tests) | Manual assistive-technology review still needed |
| ACA-025 completion reports | PARTIAL | 18 / 0 / 0 | In-memory Prisma; no UI; no PostgreSQL run |

Totals for the work in this pass: backend Academy suites 43 passed, 0 failed, 0 skipped. Browser suite 11 passed, 0 failed. Curriculum CI gate PASS with 4 self-tests passed.

No test was skipped. No test needed a schema field that is missing: every field the tests use exists in `apps/backend/prisma/schema.prisma`.

## Environment and limits (read first)

- Node v22.23.4. Playwright 1.63.0 resolves from `/opt/npm-tools`. Chromium is at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and was used without any install.
- axe-core 4.12.1 is the copy in the pnpm store, `node_modules/.pnpm/axe-core@4.12.1/node_modules/axe-core/axe.min.js`. It was not added as a dependency.
- No PostgreSQL server was listening on 5432 (`psql` and `pg_isready` exist, but no server runs). Redis was not listening on 6379. The Docker daemon is not running. Every database-backed check is therefore unverified here.
- `apps/backend/tsconfig.json` cannot be compiled by the installed TypeScript 7.0.2. It fails before checking code, with TS5102 (`baseUrl` removed) and TS5108 (`moduleResolution: node` removed). This is ACA-001 territory and was not changed. To check this pass's files, a temporary config in `/tmp` was used, with `bundler` resolution and `typeRoots` pointing at the backend's `@types`. Result: zero errors in every file this pass created or edited. The remaining 123 errors are in other files.

## ACA-014 Enrolment, completion and progress: PARTIAL

Commands and results:
- `cd apps/backend && npx vitest run src/tests/academy-enrolment-progress.test.ts`: 11 passed, 0 failed.
- Academy completion and required/optional cases: `npx vitest run src/tests/academy-completion-report.test.ts`: 18 passed (includes 3 ACA-014 cases).

What is covered (real `enrollment.service.ts` and `quiz.service.ts`, run against the in-memory Prisma double):
- Enrolment of a free published course at 0% ACTIVE. Duplicate enrolment returns 409, an unpublished course 400, a paid course 402. No rows are written on rejection.
- Watch time without completion leaves progress unchanged.
- Progress rounds to whole percentages (1 of 3 gives 33, 2 of 3 gives 67).
- Completing every lesson gives 100%, COMPLETED, a `completedAt` timestamp, and exactly one certificate queued.
- Marking a lesson incomplete again returns the course to ACTIVE and clears `completedAt`.
- A non-enrolled learner is refused (403) and no progress row is created. A CANCELLED enrolment is treated as not enrolled.
- Quizzes: a single-choice quiz auto-grades, and progress and enrolment status are unchanged by it. A non-enrolled learner cannot start a quiz.
- Academy path: a course is REQUIRED_LESSONS_ACKNOWLEDGED only when every required lesson is acknowledged. Optional lessons do not count towards it.

Findings (not fixed, need a decision):
1. The legacy progress calculation counts every lesson in a course equally. The LMS `Lesson` model has no required/optional flag. Required/optional exists only on the Academy `AcademyCourseTrack` and `AcademyLessonPlacement` records.
2. Quiz attempts do not affect course progress. This is the current behaviour and is asserted by the test.
3. Two existing checks expect a route that does not exist: `GET /api/academy/curriculum/courses/:courseId/progress/me`. `apps/backend/scripts/verify-course-progress.mjs` fails with `progress endpoint registered`. `apps/frontend/scripts/verify-academy-progress-ui.mjs` fails with `backend protected progress endpoint`. Neither the backend nor the frontend references that path (checked with grep). Someone must decide whether to build the endpoint or retire the checks. This pass did not add it to the shared curriculum router.
4. "Browser and API tests agree" is not met. The browser suite (ACA-019) does not compare progress against the API.

Files: created `apps/backend/src/tests/academy-enrolment-progress.test.ts`, `apps/backend/src/tests/support/fake-prisma.ts`, `apps/backend/src/tests/support/academy-fixtures.ts`.

## ACA-015 Snapshot history and integrity: PARTIAL

Commands and results:
- `cd apps/backend && npx vitest run src/tests/academy-snapshot-history.test.ts`: 14 passed, 0 failed.

What is covered (real `curriculum.routes.ts` mounted with supertest, real authenticate and JWT signing):
- Each presentation creates one immutable snapshot. The test recomputes the SHA-256 hash itself and compares it with the stored `contentHash`.
- Answer keys (`correctIndex`) never appear in the presented body. Learner-facing option text does.
- A draft revision returns 404. A non-member returns 403.
- Repeat presentations create separate rows with the same hash.
- The history list returns only the caller's rows, newest first, with four keys only. It never returns `resolvedFields` or the body.
- Cursor paging has no duplicates or gaps. A cursor that belongs to another learner returns the same 404 as an unknown cursor.
- The revision filter works.
- After a business field changes, a historical snapshot still returns the value it was presented with.
- Another learner in the same organisation gets 404 on the detail read. A non-member gets 403.
- Tampering with stored `resolvedFields`, or with the stored `contentHash`, makes the detail read return 403 "Lesson snapshot integrity verification failed".

Limits: the in-memory double does not enforce SQL behaviour beyond unique keys and rollback, and it has no real index or isolation level. The register requires evidence in a real database (ACA-003).

Files: created `apps/backend/src/tests/academy-snapshot-history.test.ts` (uses the two support files above).

## ACA-019 Browser lesson player and manager regression: PARTIAL

Commands and results:
- `cd apps/frontend && node tests/browser/academy-browser-suite.mjs --report ../../PASS42/evidence-browser-final.json`: 11 passed, 0 failed, exit 0. Evidence: `PASS42/evidence-browser-final.json`.
- An earlier run before the brand edits, also 11 passed: `PASS42/evidence-browser-run1.json`.
- The suite starts `next dev -p 3100` with `NEXT_PUBLIC_API_URL=http://localhost:3100/__mock_api`, waits for it, runs the tests, and stops the server. The server stopped after the run (checked).

What is covered:
1. The shared pathway loads with a progress count.
2. Selecting a lesson shows its published content, and the rendered text contains no answer-key field.
3. The knowledge check keeps Submit disabled until every question is answered, then scores 2 of 2 and reports a pass. The posted answers are `[1, 1]`.
4. Acknowledging a lesson posts once, then the control shows "Acknowledged" and is disabled.
5. Lesson B can be reached with the Tab key and selected with Enter.
6. A 403 on the outline shows an alert and does not crash the page.
7. Learner organisation context: the lesson is presented, the snapshot appears in history.
8. Manager regression (`/admin/business-context`): saving a value creates a DRAFT and makes no approve request. Approval is a separate action and is then recorded.

Limits: the API is mocked in the browser, so nothing here proves the live backend. The suite does not exercise the template path that another agent added to the player at 20:03 (see "Concurrent changes" below).

Files: created `apps/frontend/tests/browser/academy-browser-suite.mjs`. Changed `apps/frontend/package.json` (script `test:browser`).

## ACA-020 Curriculum audits in CI: DONE

Commands and results (in order):
- `node scripts/audit-curriculum.mjs`: `216/216 parsed, 373 issues, 10 courses`. With `--strict`, exit 1. This is the pre-existing state.
- Issue codes today: `MISSING_LEARNER` 119, `LEARNER_ID_MISMATCH` 119, `LEARNER_TITLE_MISMATCH` 119, `MISSING_OUTCOMES` 16. The first three come from the 119 source-format drafts, which the audit does not read (it expects the native `content.learner` shape). The normaliser handles those drafts.
- `node scripts/ci-curriculum-audit.mjs --write-baseline`: wrote `curriculum/ci/curriculum-ci-baseline.json`.
- `npm run curriculum:ci` (root script, runs with `--report build/curriculum-ci-report.json`): `Curriculum CI: PASS`, exit 0. Self-tests passed: `test-audit-curriculum`, `test-reconcile-lesson-formats`, `test-curriculum-review-queue`, `test-assessment-reconciliation`. Assessment gate: 0 approved, 894 blocked of 894.
- Negative test, in a scratch copy under `/tmp` (removed afterwards): one draft replaced by invalid JSON. Result: `FAIL [hard-structure] INVALID_JSON`, exit 1. The first version crashed here instead of reporting. That bug was fixed and re-tested.
- Ratchet test: with an empty baseline the gate reports `FAIL [ratchet-audit] MISSING_OUTCOMES rose from 0 to 16` and exits 1.

What the gate does:
1. Zero tolerance for `INVALID_JSON`, `MISSING_ID`, `MISSING_TITLE`, `FILENAME_MISMATCH`, `DUPLICATE_ID`, `MISSING_STATUS`.
2. Ratchet: each audit code and normalisation blocker may not exceed the committed baseline. Known gaps are reported, not hidden.
3. Normalisation: every draft is `publicationApproved: false`, keeps its original status, and the committed index is not stale against a fresh run.
4. Assessment gate: every assessment is accounted for, and none is approved without an approval record.
5. Four self-tests (listed above).

Excluded from the CI command, both failing before this pass (owned by the assessment workstream, status OPEN):
- `scripts/test-assessment-inventory.mjs`: `AssertionError: Sources preserved`.
- `scripts/test-assessment-publication.mjs`: expects 357 approved; the approval file is absent, so 0 are approved.

Files: created `scripts/ci-curriculum-audit.mjs`, `curriculum/ci/curriculum-ci-baseline.json`. Changed root `package.json` (scripts `curriculum:ci`, `test:academy:backend`).

Gap: the repository has no `.github` or other CI configuration. The command is ready; someone has to add it to a pipeline.

## ACA-021 Portfolio branding and documentation: DONE

Changes (before, then after):
1. `README.md`: rewritten. Previously: "portfolio project" wording, a Udemy comparison, the upstream CI badge and clone URL, and a claim of a GitHub Actions CI file that does not exist in this repository. Now: Titan Academy overview, an accurate test section, the commands used in this pass, a link to the register, and an origin and licence section. The MIT notice is kept.
2. `apps/frontend/src/app/layout.tsx`: metadata title "LMS" becomes "Titan Academy". Description "Portfolio-grade Learning Management System" becomes "Titan Academy training platform for field and home-service businesses".
3. `apps/frontend/src/app/page.tsx`: visible header text "LMS" becomes "Titan Academy".
4. `.env.example`: `SMTP_FROM` default `no-reply@lms.local` becomes `no-reply@titan-academy.local`.
5. `1-init.sh`: the README heredoc title and description now read Titan Academy.
6. `apps/backend/src/modules/payments/coupon.service.ts`: comment "for portfolio scope" becomes "for the current scope". Comment only.

Retained on purpose (changing them would break configuration, seeds or tests, or is a legal requirement):
- Package names `lms` (root), `@lms/backend`, `@lms/frontend`, `@lms/shared`.
- Database name and user `lms` (`docker-compose.yml`, `.env.example`, `1-init.sh`).
- MinIO bucket `lms-storage` (`apps/backend/src/config/env.ts` default, `docker-compose.yml`, `.env.example`).
- Seed accounts `admin@lms.local`, `teacher@lms.local`, `student@lms.local` (`apps/backend/prisma/seed.ts`). The README says they are for local development only.
- `LICENSE` copyright line (MIT requires it).
- `2-setup.sh` text referring to the `lms/` folder.
- Historical PASS documents and curriculum lesson text (the word "portfolio" there is subject matter, not branding).

Verification: `grep -rniI "portfolio|udemy|farrukh|masterleeaus|\bLMS\b"` outside curriculum and PASS documents now returns only the retained items above.

## ACA-022 Deployment, secrets and recovery runbooks: PARTIAL

Files created: `docs/runbooks/deployment.md`, `docs/runbooks/secrets-handling.md`, `docs/runbooks/recovery.md`.

Method: variable names were taken from `apps/backend/src/config/env.ts` and from `grep` of `process.env` across backend and frontend. Credential actions and inputs were taken from `apps/backend/prisma/manage-titan-credentials.ts` and `provision-titan-integration.ts`. No value is written in any runbook. `.gitignore` was checked: it excludes `.env` and `.env.*` (keeping `.env.example`).

Status is PARTIAL because the register's done-when requires a staging restore and deploy rehearsal, and none has been performed. Each runbook says so.

Findings to act on:
1. The backend has no `prisma migrate deploy` script. Its `prisma:migrate` script runs `prisma migrate dev`, which is unsafe on a shared database. The deployment runbook uses `prisma migrate deploy` directly. That command is not tested here.
2. RPO and RTO targets are not set. The recovery runbook leaves them as decisions for the business owner.
3. `.env.example` placeholders (`change_me_*`, `minioadmin`) must be replaced before any shared deployment. The runbook says so.

## ACA-023 Course player accessibility: PARTIAL

Automated results (axe-core 4.12.1 through Playwright, tags wcag2a, wcag2aa, wcag21a, wcag21aa, scoped to the shared curriculum section):
- Desktop 1280x900: 0 violations (`axe.desktop` in `PASS42/evidence-browser-final.json`).
- Narrow 375x812: 0 violations (`axe.mobile`). No horizontal overflow (scrollWidth minus innerWidth is 0 or less). The lesson control is at least 200px wide.
- Keyboard: Tab reaches Lesson B from the page, and Enter selects it.
- Screen-reader semantics (checked in the DOM, not with assistive technology): the progress bar has an accessible name; the lesson region is `aria-live="polite"`; each knowledge-check question is a labelled group.

Fixes: none were needed. The player had no violations at the two sizes tested, so `apps/frontend/src/components/SharedCurriculumPlayer.tsx` was not edited by me.

Advisory finding, not changed (in the lesson renderer, which is off limits to this pass): `apps/frontend/src/components/CurriculumLessonBody.tsx` labels external resource links "Open resource (external)" and opens them in a new tab without saying so. Consider adding "opens in a new tab" to the label.

Still needs a human (cannot be checked with axe): a real screen reader pass (for example NVDA, VoiceOver or TalkBack); 200% zoom and text reflow; focus visibility on real devices; and a check with learners using the iPad the platform's owner works on.

## ACA-025 Evidence-backed completion reports: PARTIAL

Commands and results:
- `cd apps/backend && npx vitest run src/tests/academy-completion-report.test.ts`: 18 passed, 0 failed.
- Mutation check: changed the required-lesson rule in `completion-report.service.ts` to `const required = true`. Result: 4 tests failed (`reports acknowledged required lessons separately...`, `reconciles report counts...`, `rolls up learner-level evidence...`, `is REQUIRED_LESSONS_ACKNOWLEDGED only once...`). The original file was restored and its SHA-256 re-checked.

Endpoints (mounted in `apps/backend/src/app.ts` under `/api/academy/curriculum`):
- `GET /organisations/:organisationId/completion-reports/learners/:learnerId`: the learner, or an owner, manager or assessor of the same organisation. A non-member gets 403. A learner who is not a member gets 404.
- `GET /organisations/:organisationId/completion-reports`: owners and managers only.

What a learner report contains, per assigned course: completion state (`IN_PROGRESS` or `REQUIRED_LESSONS_ACKNOWLEDGED` or `NO_REQUIRED_LESSONS`); required and optional counts; required percentage; per lesson, the acknowledgement, the knowledge-check attempts and whether any passed, the practical-evidence status and dates, and the competencies with an `active` flag.

Decisions taken (review these):
1. Acknowledgement is never reported as a competency. A test covers this.
2. Expired competencies are reported with `active: false` and are not counted.
3. Only published, pinned revisions count, matching the learner outline and completion endpoints.
4. Assessors may read a learner's report, but not the organisation roll-up.
5. The report does not return practical-evidence descriptions, URLs or assessor feedback. It returns status, dates and the assessor's identifier only.
6. The roll-up covers LEARNER-role members, up to 500.

Limits: in-memory double; no UI; no PostgreSQL run. Reports are not yet checked against live data.

Files: created `apps/backend/src/modules/curriculum/completion-report.service.ts`, `apps/backend/src/modules/curriculum/completion-report.routes.ts`, `apps/backend/src/tests/academy-completion-report.test.ts`. Changed `apps/backend/src/app.ts` (one import and one `app.use` line).

## Full backend Vitest run (for context)

- Before this pass (19:50): `npx vitest run` in `apps/backend` gave 3 failed suites and 5 passed tests.
- After this pass: `npx vitest run` gave `Test Files 8 failed | 11 passed (19)` and `Tests 176 passed (176)`. No individual test failed.
- The 8 failed files: `tests/pass22-inactive-identity.test.cjs` (a source-level script, not a Vitest suite, so "No test suite found"); `src/tests/auth.test.ts` and `src/tests/health.test.ts` (import fails because environment variables are missing, the same as before this pass); and five `src/tests/integration/*.test.ts` suites (`contract`, `credential-lifecycle`, `cross-tenant`, `identity-linking`, `learner-status`). The integration suites are another workstream's files. They refuse to run without `DATABASE_URL` pointing at a disposable test database, which is their intended guard. This pass did not touch them.

## Existing scripts run (for context)

| Command | Result |
|---|---|
| `node apps/frontend/scripts/verify-manager-context-ui.mjs` | PASS |
| `node apps/frontend/scripts/verify-business-context-ui.mjs` | PASS (10 checks) |
| `node apps/frontend/scripts/verify-academy-progress-ui.mjs` | FAIL, expects the missing progress route (ACA-014 finding 3) |
| `node apps/backend/scripts/verify-course-progress.mjs` | FAIL, expects the missing progress route (ACA-014 finding 3) |
| `node apps/backend/scripts/verify-lesson-snapshot-list.mjs` | PASS (10) |
| `node apps/backend/scripts/verify-snapshot-retrieval.mjs` | PASS (14) |
| `node scripts/test-master-improvement-register.mjs` | PASS (28 items) |
| `node scripts/test-assessment-inventory.mjs` | FAIL (`Sources preserved`), not mine |
| `node scripts/test-assessment-publication.mjs` | FAIL (expects 357 approved), not mine |

## Concurrent changes observed (not made by this pass)

- `apps/frontend/src/components/SharedCurriculumPlayer.tsx` was changed at 20:03 by another agent. It now imports `TemplateLessonForm` and renders it when `body.lessonKind === "template"`. The browser suite ran after that change, but none of its mock lessons use the template path, so the template path was not tested.
- Other agents have added files under `apps/backend/src/tests/` (`aca-012-013-assessment-evidence.test.ts`, `lesson-review.test.ts`, `pathways-enrolment.test.ts`, `pathways-seed.test.ts`, `support/template-memory-store.ts`), under `apps/backend/src/tests/integration/`, and under `PASS42/`. I did not read or verify them beyond their presence in the test run.

## Items needing a human

1. Run the three Academy backend suites, or an equivalent, against a disposable PostgreSQL database (ACA-003). The in-memory double does not prove SQL behaviour.
2. Decide the academy progress endpoint question (ACA-014 finding 3).
3. Add `pnpm curriculum:ci` and the browser suite to a CI pipeline. None exists in this repository.
4. Run the browser suite against a live API with seeded test accounts (ACA-019).
5. Complete the manual accessibility review with assistive technology (ACA-023).
6. Rehearse the runbooks in staging and set RPO and RTO (ACA-022).
7. Fix the backend `tsconfig.json` for TypeScript 7 so the build can run (ACA-001). Outside this pass.
8. Assessment workstream: the two failing assessment scripts (ACA-012 area).
9. Once the template work settles, add a browser test for the template path in the player.

## Files

Created:
- `apps/backend/src/tests/support/fake-prisma.ts`, `apps/backend/src/tests/support/academy-fixtures.ts`
- `apps/backend/src/tests/academy-enrolment-progress.test.ts`, `apps/backend/src/tests/academy-snapshot-history.test.ts`, `apps/backend/src/tests/academy-completion-report.test.ts`
- `apps/backend/src/modules/curriculum/completion-report.service.ts`, `apps/backend/src/modules/curriculum/completion-report.routes.ts`
- `scripts/ci-curriculum-audit.mjs`, `curriculum/ci/curriculum-ci-baseline.json`
- `apps/frontend/tests/browser/academy-browser-suite.mjs`
- `docs/runbooks/deployment.md`, `docs/runbooks/secrets-handling.md`, `docs/runbooks/recovery.md`
- `PASS42/QUALITY-ops.md` (this file), `PASS42/evidence-browser-final.json`, `PASS42/evidence-browser-run1.json`
- Generated, git-ignored: `build/curriculum-ci-report.json`, `apps/frontend/.next/` (from the dev server)

Changed (originals in `/home/claude/work/quality-pass42-backup/`):
- `apps/backend/src/app.ts`
- `apps/backend/src/modules/payments/coupon.service.ts` (comment only)
- `README.md`
- `apps/frontend/src/app/layout.tsx`, `apps/frontend/src/app/page.tsx`
- `apps/frontend/package.json`
- `package.json`
- `.env.example`
- `1-init.sh`

Not changed: `apps/backend/prisma/schema.prisma`, migrations, the register (`.md` and `.json`), `LICENSE`, `CurriculumLessonBody.tsx`, `SharedCurriculumPlayer.tsx` (by this pass), and the review and template screens.
