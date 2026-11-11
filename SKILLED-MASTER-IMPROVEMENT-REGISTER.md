# Skilled — Master Improvement Register

**Baseline:** Pass 52 cumulative (static, unverified); reconciled to main 1fbf352 on 2026-11-08 (issue #41). **Status:** open recommendations, not verified fixes. This is the single consolidated handoff register; do not mark completed without evidence.

## Priority key

- **P0**: blocks safe release or curriculum publication.
- **P1**: core learner/integration completeness and correctness.
- **P2**: productisation, operational maturity and enhancement.

## Evidence and limitations

- Pass 35 normalizes 216 source drafts (97 native, 119 specialist format); all remain review drafts.
- Pass 35 reported 21 missing explicit outcomes, 42 missing course mappings, and 15 missing usable instructional sections; counts can overlap.
- Pass 34 original audit recorded 373 findings across 135 files, but its 119 missing-content diagnoses were largely format mismatches; treat it as historical.
- Prior 221-brief inventory is a different dataset; reconcile identifiers before merging or claiming 437 unique lessons.
- Curriculum reuse review sampled 231 of 487 classification rows, with significant corrections; unreviewed rows must not be automatically approved.
- Full dependency-enabled build, PostgreSQL migration execution, browser workflow and live Field Services / AI Workforce integration have not been verified.

## Action register

| ID | Priority | Area | Required action | Status |
|---|---|---|---|---|
| ACA-001 | P0 | Build | Install locked dependencies and compile backend and frontend | IN PROGRESS |
| ACA-002 | P0 | Database | Validate Prisma schema and generated client | DONE |
| ACA-003 | P0 | Database | Apply and rollback migrations in isolated PostgreSQL staging | OPEN |
| ACA-004 | P0 | Security | Exercise cross-tenant skills and lesson APIs with real credentials | OPEN |
| ACA-005 | P0 | Curriculum | Reconcile 15 drafts lacking usable instructional sections | OPEN |
| ACA-006 | P0 | Curriculum | Map 42 unmapped lessons to approved courses | OPEN |
| ACA-007 | P0 | Curriculum | Review 21 lessons without explicit learning outcomes | OPEN |
| ACA-008 | P0 | Publishing | Block publication of unreviewed and structurally incomplete lessons | IN PROGRESS |
| ACA-009 | P1 | Curriculum | Import normalized lessons idempotently into canonical content library | OPEN |
| ACA-010 | P1 | Curriculum | Reconcile 221 briefs against 216 expanded drafts without equating inventories | OPEN |
| ACA-011 | P1 | Curriculum | Review transfer classifications and incorrect cross-service reuse | OPEN |
| ACA-012 | P1 | Assessments | Map assessment evidence to each required lesson and course | IN PROGRESS |
| ACA-013 | P1 | Assessments | Validate practical competency award only after assessor approval | IN PROGRESS |
| ACA-014 | P1 | Learner | Test full course enrolment, completion and progress calculation | IN PROGRESS |
| ACA-015 | P1 | Learner | Test contextual lesson snapshot history and integrity checks | IN PROGRESS |
| ACA-016 | P1 | Identity | Verify inactive and deleted learner integration rejection | IN PROGRESS |
| ACA-017 | P1 | Operations | Exercise credential rotation, revocation and expiry | OPEN |
| ACA-018 | P1 | Integration | Connect Field Services and AI Workforce contract test environments | OPEN |
| ACA-019 | P1 | Quality | Add browser-based lesson player and manager context regression tests | IN PROGRESS |
| ACA-020 | P1 | Quality | Run curriculum structural and normalization audits in CI | IN PROGRESS |
| ACA-021 | P2 | Product | Replace inherited portfolio LMS product documentation and branding | IN PROGRESS |
| ACA-022 | P2 | Deployment | Create environment-specific deployment, secrets and recovery runbooks | IN PROGRESS |
| ACA-023 | P2 | Accessibility | Audit course player keyboard, screen reader and responsive usage | IN PROGRESS |
| ACA-024 | P2 | Content | Expert review high-risk safety, licensing and regulated work content | OPEN |
| ACA-025 | P2 | Reporting | Build evidence-backed learner and organisation completion reports | IN PROGRESS |
| ACA-026 | P0 | Governance | Preserve source-draft status and do not auto-publish normalized material | IN PROGRESS |
| ACA-027 | P1 | Database | Inspect same-prefix migration ordering and dependencies | OPEN |
| ACA-028 | P1 | Security | Audit external identity uniqueness and organisation linking lifecycle | IN PROGRESS |

## Acceptance criteria and source anchors

### ACA-001 — Install locked dependencies and compile backend and frontend
- **Source:** `apps/backend/tsconfig.json`
- **Done only when:** Dependency-enabled clean CI build passes
- **Verification:** PARTIAL (2026-11-08): install, lint, typecheck and build verified locally; clean CI build not yet run. Re-run on main 1fbf352 on 2026-11-08: backend and frontend lint, backend tsc (app and test configs) and frontend tsc exit 0. **Owner:** Unassigned.
- **Evidence (2026-11-08):** In a fresh worktree from origin/main (03dec3e), `pnpm install --frozen-lockfile`, `pnpm -C apps/backend lint`, `pnpm -C apps/frontend lint`, `pnpm -C apps/backend build` (tsc) and `pnpm -C apps/frontend build` (Next.js) all exit 0. Merged PRs: #12 and #13 (start without MinIO, install docs), #14 (install, backend lint, tsc --noEmit), #31 (backend lint rules), #32 (test typecheck, 46 to 0 errors). Not yet verified: a clean build run in CI; no workflow runs it (see ACA-020).

### ACA-002 — Validate Prisma schema and generated client
- **Source:** `apps/backend/prisma/schema.prisma`
- **Done only when:** prisma validate and generate succeed
- **Verification:** VERIFIED (2026-11-08): prisma validate and generate pass. **Owner:** Unassigned.
- **Evidence (2026-11-08):** In apps/backend, `prisma validate` (Prisma 6.19.3, placeholder DATABASE_URL, no connection) and `prisma generate` exit 0. PR #14 also records `tsc --noEmit` passing after prisma generate. Migration execution against PostgreSQL is ACA-003 and remains OPEN.

### ACA-003 — Apply and rollback migrations in isolated PostgreSQL staging
- **Source:** `apps/backend/prisma/migrations/`
- **Done only when:** Migration deploy, smoke test and recovery rehearsal pass
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-004 — Exercise cross-tenant skills and lesson APIs with real credentials
- **Source:** `apps/backend/src/modules/curriculum/integration.routes.ts`
- **Done only when:** Foreign-tenant requests denied and audit events recorded
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-005 — Reconcile 15 drafts lacking usable instructional sections
- **Source:** `curriculum/lesson-normalization-index.json`
- **Done only when:** Human-reviewed sections exist and original source retained
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-006 — Map 42 unmapped lessons to approved courses
- **Source:** `curriculum/lesson-normalization-index.json`
- **Done only when:** Every publishable lesson has validated course placement
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-007 — Review 21 lessons without explicit learning outcomes
- **Source:** `curriculum/lesson-normalization-index.json`
- **Done only when:** Reviewer-approved measurable outcomes attached
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-008 — Block publication of unreviewed and structurally incomplete lessons
- **Source:** `scripts/reconcile-lesson-formats.mjs`
- **Done only when:** Publish path refuses all unapproved drafts
- **Verification:** PARTIAL (2026-11-08): publication gates merged (PR #61); curriculum-publication-paths unit tests pass. Not verified against PostgreSQL. `pnpm curriculum:ci` exits 1 on main. **Owner:** Unassigned.
- **Evidence (2026-11-08):** PR #61 (gate every curriculum publish path; hold fields until the revision publishes) merged. The Vitest run on main f9cf64e on 2026-11-09 (61 files passed, 9 skipped; 928 tests passed, 114 skipped, after `prisma generate`) includes curriculum-publication-paths.test.ts and curriculum-publisher.test.ts. `pnpm curriculum:ci` on 1fbf352 fails with `[assessment-gate] 1267 assessments are blocked from publication`, which is the gate refusing unapproved answer keys. Structurally incomplete lessons depend on ACA-005 to ACA-007.

### ACA-009 — Import normalized lessons idempotently into canonical content library
- **Source:** `curriculum/lesson-normalization-index.json`
- **Done only when:** Repeat import creates no duplicates and preserves revisions
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-010 — Reconcile 221 briefs against 216 expanded drafts without equating inventories
- **Source:** `curriculum/`
- **Done only when:** Canonical identity map and gap report reviewed
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-011 — Review transfer classifications and incorrect cross-service reuse
- **Source:** `curriculum/planning/REVIEW-SUMMARY.md`
- **Done only when:** All 487 decisions reviewed with safe targets and exclusions
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-012 — Map assessment evidence to each required lesson and course
- **Source:** `curriculum/planning/ASSESSMENT-AUDIT.md`
- **Done only when:** Coverage report includes questions, keys, rubric, pass and evidence
- **Verification:** PARTIAL (2026-11-08): evidence-mapping unit tests pass; no coverage report for every required lesson and course. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `apps/backend/src/tests/aca-012-013-assessment-evidence.test.ts` passed in the 2026-11-08 Vitest run (real curriculum router, in-memory Prisma double). It covers lesson-to-evidence mapping, course incompleteness and the coverage report. `scripts/test-assessment-publication.mjs` (14 gate assertions) and `scripts/test-assessment-inventory.mjs` (16 assertions) exit 0. Coverage for every required lesson remains open.

### ACA-013 — Validate practical competency award only after assessor approval
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Negative and positive integration tests pass
- **Verification:** PARTIAL (2026-11-08): positive and negative award tests pass against an in-memory Prisma double. No PostgreSQL integration run. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `aca-012-013-assessment-evidence.test.ts` (competency award from approved evidence) passed on 1fbf352. Its cases include refusal for pending, rejected and self-approved evidence, and an allowed award for evidence approved by the acting assessor. Not run against a database.

### ACA-014 — Test full course enrolment, completion and progress calculation
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Browser and API tests agree on required/optional completion
- **Verification:** PARTIAL (2026-11-08): enrolment and progress unit tests pass; browser and API agreement not tested. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `academy-enrolment-progress.test.ts` and `academy-course-progress.test.ts` passed in the 2026-11-08 Vitest run (in-memory Prisma double). Browser tests of required and optional completion are not run (see ACA-019).

### ACA-015 — Test contextual lesson snapshot history and integrity checks
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Historical snapshot hashes verified and access isolated
- **Verification:** PARTIAL (2026-11-08): snapshot history unit tests pass; no run against PostgreSQL. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `academy-snapshot-history.test.ts` passed in the 2026-11-08 Vitest run. Its cases cover an immutable snapshot whose hash matches an independent recomputation, no answer keys in presented bodies, and refusal of unpublished revisions and out-of-assignment lessons. Not run against a database.

### ACA-016 — Verify inactive and deleted learner integration rejection
- **Source:** `apps/backend/src/modules/curriculum/integration.routes.ts`
- **Done only when:** Revoked learners yield no skills in integration tests
- **Verification:** PARTIAL (2026-11-08): deleted-account checks have passing unit tests. The integration test is skipped without PostgreSQL and Redis. Two static refresh contract scripts fail on main. **Owner:** Unassigned.
- **Evidence (2026-11-08):** PR #58 (deleted-account checks on login and refresh, #45 and #52) merged. `account-lifecycle.test.ts` passed in the 2026-11-08 Vitest run. `apps/backend/src/tests/integration/learner-status.test.ts` is skipped without services. `scripts/test-session-lifecycle-contract.mjs` (`account state checked on refresh`) and `scripts/test-auth-route-contracts.mjs` (`Refresh validates active verified user`) exit 1 on 1fbf352.

### ACA-017 — Exercise credential rotation, revocation and expiry
- **Source:** `apps/backend/prisma/manage-titan-credentials.ts`
- **Done only when:** Expired and revoked credentials denied after rotation
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-018 — Connect Field Services and AI Workforce contract test environments
- **Source:** `docs/FIELD_SERVICES_CONTEXT_SYNC.md`
- **Done only when:** Signed contract tests pass against both consumers
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-019 — Add browser-based lesson player and manager context regression tests
- **Source:** `apps/frontend/`
- **Done only when:** Headless browser test suite passes in CI
- **Verification:** PARTIAL (2026-11-08): browser suite present but not run in CI or in this reconcile. Frontend lint, tsc and source checks pass. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `apps/frontend/tests/browser/academy-browser-suite.mjs` (PASS42) exists. It mocks the API and needs Playwright and axe. It is not wired into CI. On 1fbf352, the four `apps/frontend/scripts/verify-*.mjs` source checks exit 0, and frontend lint and tsc exit 0.

### ACA-020 — Run curriculum structural and normalization audits in CI
- **Source:** `scripts/`
- **Done only when:** CI blocks regressions and emits review report
- **Verification:** PARTIAL (2026-11-08): the curriculum CI workflow is merged (PR #59). The gate fails on main, so it is not green. **Owner:** Unassigned.
- **Evidence (2026-11-08):** PR #59 added `.github/workflows/curriculum-ci.yml`, which runs `pnpm curriculum:ci` with `--fail-on-blocked` and uploads the report. A local run on 1fbf352 exits 1 with `[index-drift] curriculum/lesson-normalization-index.json is stale` and `[assessment-gate] 1267 assessments are blocked from publication`. No CI run was inspected. Five static contract scripts also fail on main (see the 2026-11-08 reconciliation section).

### ACA-021 — Replace inherited portfolio LMS product documentation and branding
- **Source:** `README.md`
- **Done only when:** Accurate SkilledAt.Work documentation, legal attribution retained
- **Verification:** PARTIAL (2026-11-08): copy audit written and changes applied on this branch. Stays IN PROGRESS until the audit is merged and the owner confirms the email brand. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `lms-main/docs/PRODUCT-COPY-AUDIT-2026-11-08.md` lists each change by file: landing copy, metadata description, origin and licence on the credits page, learner wording in the role label and two API messages, and seed display text. Retained: SkilledAt.Work brand (OWNER-DECISIONS, 2026-11-04), email subjects, `@lms.local` identifiers and the `SMTP_FROM` default. Backend tsc, tsc test config, lint and Vitest (928 passed, 114 skipped; 61 files passed, 9 skipped; main f9cf64e, 2026-11-09) and frontend lint and tsc exit 0 on the branch.

### ACA-022 — Create environment-specific deployment, secrets and recovery runbooks
- **Source:** `.env.example`
- **Done only when:** Staging restore and deploy rehearsal documented
- **Verification:** PARTIAL (2026-11-08): deployment, recovery and secrets runbooks and the production env template exist. The recovery runbook states 'documented, not rehearsed'. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `docs/runbooks/deployment.md`, `recovery.md` and `secrets-handling.md` are on main, and `.env.production.example` was added with PR #59. `recovery.md` records 'documented, not rehearsed'. No staging restore or deploy rehearsal has been run.

### ACA-023 — Audit course player keyboard, screen reader and responsive usage
- **Source:** `apps/frontend/`
- **Done only when:** Accessibility checks and manual review pass
- **Verification:** PARTIAL (2026-11-08): the browser suite includes an axe-based audit, but it was not run in this reconcile and no manual review is recorded. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `apps/frontend/tests/browser/academy-browser-suite.mjs` covers the ACA-023 accessibility audit per its header. It needs Playwright and axe and was not run here. Keyboard, screen-reader and responsive review is not recorded.

### ACA-024 — Expert review high-risk safety, licensing and regulated work content
- **Source:** `curriculum/research/`
- **Done only when:** Qualified reviewer signs off jurisdiction and currency
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-025 — Build evidence-backed learner and organisation completion reports
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Reports reconcile with canonical progress and competency records
- **Verification:** PARTIAL (2026-11-08): completion-report and withholding tests pass. Reconciliation with canonical progress and competency records is not verified against a database. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `completion-report-withholding.test.ts` and `completion-report-assignment-timing.test.ts` passed in the 2026-11-08 Vitest run. The report routes are listed in README 'API Overview'.

### ACA-026 — Preserve source-draft status and do not auto-publish normalized material
- **Source:** `curriculum/lesson-normalization-index.json`
- **Done only when:** All source drafts remain review-gated
- **Verification:** PARTIAL (2026-11-08): publication gating merged (PR #61) and the static review-gate checks pass. Expert review is not done (see ACA-024). **Owner:** Unassigned.
- **Evidence (2026-11-08):** PR #61 merged. `scripts/test-reconcile-lesson-formats.mjs` (12 assertions, including review-gate) and `scripts/test-curriculum-review-queue.mjs` exit 0 on 1fbf352. Owner trial approvals in `PASS42/TRIAL-smoke.md` are not an expert review.

### ACA-027 — Inspect same-prefix migration ordering and dependencies
- **Source:** `apps/backend/prisma/migrations/`
- **Done only when:** Clean staging migration ordering confirmed
- **Verification:** NOT VERIFIED. A static migration readiness check passes; clean staging migration ordering has not been run. **Owner:** Unassigned.
- **Evidence (2026-11-08):** `scripts/test-migration-readiness.mjs` (8 assertions) exits 0 on 1fbf352. This is a static check only.

### ACA-028 — Audit external identity uniqueness and organisation linking lifecycle
- **Source:** `apps/backend/prisma/schema.prisma`
- **Done only when:** Cross-org identity tests and migration policy documented
- **Verification:** PARTIAL (2026-11-08): the org-unique migration is on main. Identity-linking tests need PostgreSQL and are skipped. **Owner:** Unassigned.
- **Evidence (2026-11-08):** Migration `20261108100000_academy_external_identity_org_unique` is on main, with the preflight `apps/backend/prisma/preflight-20261108100000-external-identity-scope.sql`. `apps/backend/src/tests/integration/identity-linking.test.ts` is skipped without PostgreSQL and Redis. Not applied to a database in this reconcile.

## Maintenance rules

1. Update JSON and Markdown together after each pass; never silently delete unresolved entries.
2. Link every completed item to test output, a commit/source diff and a verified archive.
3. Separate static checks from runtime and live integration evidence.
4. Re-run curriculum audit after edits and keep original source drafts intact.
5. Preserve full cumulative source and compare against the latest archive before each merge.


## Pass 39 assessment inventory update

See `PASS39-ASSESSMENT-AUDIT.md` and `curriculum/assessment-inventory-pass39.json`. Assessment answer keys require question-level reconciliation and editorial sign-off before import/publication. No runtime or database verification was performed.

## Pass 52 fix team (2026-11-08)

Static, unverified. The baseline changed from Pass 35 to Pass 52 (static, unverified). On 2026-11-08 only ACA-001 (IN PROGRESS, partially verified) and ACA-002 (DONE, verified) changed status, each with a dated evidence line; no priority or owner changed; all other items remain OPEN, NOT VERIFIED, Unassigned.

- No `/home/claude/tasks/fix-*.md` change log existed when this section was written. The notes below are the static review notes in `/home/claude/tasks/` that propose source-level fixes, cited by name.
- A diff of `handoff-fixed/lms-main` against `handoff-extract/lms-main` (excluding `node_modules` and `.git`) first showed no differences. A later diff, run during this pass, showed source changes made by another fix agent in `handoff-fixed` (static, unverified): `apps/backend/src/modules/curriculum/lesson-review.service.ts` (editor-independence check on approval, ACA-008 and ACA-026); new migrations `20261108100000_academy_external_identity_org_unique` (ACA-028, additive, static) and `20261108100100_academy_course_tracks_course_fk` (course-tracks foreign key, NOT VALID, matching finding 2 in `ACA-027-028-migrations.md`). Their change logs were not present in `/home/claude/tasks/` when this section was written.
- File paths are as written in each note.

| ID | Note cited | Files named as fix targets (static, unverified) |
|---|---|---|
| ACA-002 | `ACA-027-028-migrations.md` | `apps/backend/prisma/schema.prisma`, `apps/backend/prisma/migrations/` |
| ACA-004 | `ACA-004-016-tenant-auth.md` | `curriculum/curriculum.routes.ts`, `curriculum/completion-report.service.ts`, `curriculum/integration.routes.ts`, `config/prisma.ts` |
| ACA-008 | `ACA-008-026-publication-gates.md` | `lesson-review.service.ts` (source change observed), `curriculum.routes.ts`, `curriculum-publisher.ts`, `superadmin-lesson.service.ts`, `scripts/ci-curriculum-audit.mjs`, `scripts/validate-assessment-publication.mjs` |
| ACA-013 | `ACA-004-016-tenant-auth.md` | `curriculum/curriculum.routes.ts` (competency writer; review only) |
| ACA-016 | `ACA-004-016-tenant-auth.md` | `curriculum/integration.routes.ts`, `curriculum/curriculum.routes.ts` |
| ACA-023 | `ACA-023-accessibility.md` | `SharedCurriculumPlayer.tsx`, `CurriculumKnowledgeCheck.tsx`, `CurriculumLessonBody.tsx`, `BusinessContextLesson.tsx`, `student/courses/[slug]/page.tsx`, discussions page (`apps/frontend`) |
| ACA-026 | `ACA-008-026-publication-gates.md` | `superadmin-lesson.service.ts`, `lesson-review.service.ts` (source change observed), `file-lesson-loader.ts` |
| ACA-027 | `ACA-027-028-migrations.md` | `apps/backend/prisma/migrations/` (source change observed: `20261108100100_academy_course_tracks_course_fk`) |
| ACA-028 | `ACA-027-028-migrations.md` | `apps/backend/prisma/schema.prisma`, migrations `20261102000100_academy_external_identity_audit` and `20261102190000`, new migration `20261108100000_academy_external_identity_org_unique` (source change observed) |

This register update is logged in `/home/claude/tasks/fix-register.md` (static, unverified).

## Conflicts for human resolution

1. ACA-014: `PASS42/QUALITY-ops.md` says a progress route is missing and its check fails; `PASS42/PROGRESS-route.md` says the endpoint was added and the check passes.
2. ACA-001 and ACA-002: `PASS42/VERIFY-evidence.md` records a dependency install, a Prisma generate and a backend compile failure as run results; root `PASS42-STABILIZATION-REPORT.md` says those steps were not verified. Resolved 2026-11-08: local install, build, lint and prisma validate/generate pass (see ACA-001 and ACA-002 evidence).
3. Database target: `PASS42/LMS-db-load.md` and `PASS42/GRADING-fix.md` record a migration applied and content loaded into database `lms`; root `PASS45`, `PASS48` and `docs/PASS51` require the Academy database to be `titan_academy` only.
4. Accidental write: `PASS42/INTEGRATION-identity.md` says a `CREATE DATABASE` ran on another PostgreSQL instance by mistake and was then dropped.
5. ACA-020: marked DONE in `PASS42/QUALITY-ops.md` with no CI pipeline to wire into.
6. Owner trial approvals: `PASS42/TRIAL-smoke.md` says every lesson revision in the scratch trial was approved by the owner and states these are not an expert review; relevant to ACA-024 and ACA-026.

## Reconciliation 2026-11-08 (issue #41)

Reconciled to main `1fbf352`. The JSON twin carries the same statuses and the `reconciliation20261108` block.

**Merged PRs since the last reconcile and their effect on this register**

- #12, #13, #14, #31, #32 relate to ACA-001 (install, lint, typecheck and docs). ACA-001 stays IN PROGRESS: the clean CI build is not run.
- #58 (deleted-account checks, #45 and #52) relates to ACA-016. ACA-016 is IN PROGRESS.
- #59 added the curriculum CI workflow (ACA-020), the production env template and the runbooks (ACA-022), and this register. ACA-020 and ACA-022 are IN PROGRESS.
- #61 (publication gates, #16) relates to ACA-008 and ACA-026. Both are IN PROGRESS.
- #53, #60, #62, #63, #64 and #65 do not change an ACA item.

**Status changes** (OPEN to IN PROGRESS unless noted): ACA-008, ACA-012, ACA-013, ACA-014, ACA-015, ACA-016, ACA-019, ACA-020, ACA-021 (audit doc as evidence), ACA-022, ACA-023, ACA-025, ACA-026 and ACA-028. ACA-002 stays DONE. No item was marked DONE beyond ACA-002.

**Test results on main (2026-11-08; Vitest counts refreshed 2026-11-09)**

- Backend Vitest (main f9cf64e, 2026-11-09, after `prisma generate`): 61 files passed, 9 skipped; 928 tests passed, 114 skipped. Without the generated Prisma client, 27 files fail to load (`Cannot find module '.prisma/client/default'`) and the run reports 502 passed, 103 skipped.
- `node scripts/test-master-improvement-register.mjs` passes.
- `pnpm curriculum:ci` exits 1 on main: `index-drift` (the lesson-normalization index is stale) and `assessment-gate` (1267 assessments are blocked from publication). The CI workflow therefore fails on main. The index is not regenerated here because curriculum content is out of scope.
- Static contract scripts that fail on main: `test-auth-route-contracts.mjs` and `test-session-lifecycle-contract.mjs` (refresh checks, ACA-016), `test-payment-security-contract.mjs`, `test-course-publication-access.mjs` (module import), and `test-video-upload-safety.mjs` (module import). These are not fixed here.

**Conflicts resolved or updated**

- Conflict 1 (ACA-014): `academy-course-progress.test.ts` passes on 1fbf352, so the progress route check passes in the Vitest suite. The browser and API agreement is still open.
- Conflict 5 (ACA-020): the CI workflow now exists (PR #59), but the gate fails on main. ACA-020 is IN PROGRESS, not DONE.
