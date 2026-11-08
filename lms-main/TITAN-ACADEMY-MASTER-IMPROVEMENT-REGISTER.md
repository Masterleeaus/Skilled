# Titan Academy — Master Improvement Register

**Baseline:** Pass 52 cumulative (static, unverified). **Status:** open recommendations, not verified fixes. This is the single consolidated handoff register; do not mark completed without evidence.

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
| ACA-001 | P0 | Build | Install locked dependencies and compile backend and frontend | OPEN |
| ACA-002 | P0 | Database | Validate Prisma schema and generated client | OPEN |
| ACA-003 | P0 | Database | Apply and rollback migrations in isolated PostgreSQL staging | OPEN |
| ACA-004 | P0 | Security | Exercise cross-tenant skills and lesson APIs with real credentials | OPEN |
| ACA-005 | P0 | Curriculum | Reconcile 15 drafts lacking usable instructional sections | OPEN |
| ACA-006 | P0 | Curriculum | Map 42 unmapped lessons to approved courses | OPEN |
| ACA-007 | P0 | Curriculum | Review 21 lessons without explicit learning outcomes | OPEN |
| ACA-008 | P0 | Publishing | Block publication of unreviewed and structurally incomplete lessons | OPEN |
| ACA-009 | P1 | Curriculum | Import normalized lessons idempotently into canonical content library | OPEN |
| ACA-010 | P1 | Curriculum | Reconcile 221 briefs against 216 expanded drafts without equating inventories | OPEN |
| ACA-011 | P1 | Curriculum | Review transfer classifications and incorrect cross-service reuse | OPEN |
| ACA-012 | P1 | Assessments | Map assessment evidence to each required lesson and course | OPEN |
| ACA-013 | P1 | Assessments | Validate practical competency award only after assessor approval | OPEN |
| ACA-014 | P1 | Learner | Test full course enrolment, completion and progress calculation | OPEN |
| ACA-015 | P1 | Learner | Test contextual lesson snapshot history and integrity checks | OPEN |
| ACA-016 | P1 | Identity | Verify inactive and deleted learner integration rejection | OPEN |
| ACA-017 | P1 | Operations | Exercise credential rotation, revocation and expiry | OPEN |
| ACA-018 | P1 | Integration | Connect Field Services and AI Workforce contract test environments | OPEN |
| ACA-019 | P1 | Quality | Add browser-based lesson player and manager context regression tests | OPEN |
| ACA-020 | P1 | Quality | Run curriculum structural and normalization audits in CI | OPEN |
| ACA-021 | P2 | Product | Replace inherited portfolio LMS product documentation and branding | OPEN |
| ACA-022 | P2 | Deployment | Create environment-specific deployment, secrets and recovery runbooks | OPEN |
| ACA-023 | P2 | Accessibility | Audit course player keyboard, screen reader and responsive usage | OPEN |
| ACA-024 | P2 | Content | Expert review high-risk safety, licensing and regulated work content | OPEN |
| ACA-025 | P2 | Reporting | Build evidence-backed learner and organisation completion reports | OPEN |
| ACA-026 | P0 | Governance | Preserve source-draft status and do not auto-publish normalized material | OPEN |
| ACA-027 | P1 | Database | Inspect same-prefix migration ordering and dependencies | OPEN |
| ACA-028 | P1 | Security | Audit external identity uniqueness and organisation linking lifecycle | OPEN |

## Acceptance criteria and source anchors

### ACA-001 — Install locked dependencies and compile backend and frontend
- **Source:** `apps/backend/tsconfig.json`
- **Done only when:** Dependency-enabled clean CI build passes
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-002 — Validate Prisma schema and generated client
- **Source:** `apps/backend/prisma/schema.prisma`
- **Done only when:** prisma validate and generate succeed
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

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
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

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
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-013 — Validate practical competency award only after assessor approval
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Negative and positive integration tests pass
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-014 — Test full course enrolment, completion and progress calculation
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Browser and API tests agree on required/optional completion
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-015 — Test contextual lesson snapshot history and integrity checks
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Historical snapshot hashes verified and access isolated
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-016 — Verify inactive and deleted learner integration rejection
- **Source:** `apps/backend/src/modules/curriculum/integration.routes.ts`
- **Done only when:** Revoked learners yield no skills in integration tests
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

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
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-020 — Run curriculum structural and normalization audits in CI
- **Source:** `scripts/`
- **Done only when:** CI blocks regressions and emits review report
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-021 — Replace inherited portfolio LMS product documentation and branding
- **Source:** `README.md`
- **Done only when:** Accurate Titan Academy documentation, legal attribution retained
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-022 — Create environment-specific deployment, secrets and recovery runbooks
- **Source:** `.env.example`
- **Done only when:** Staging restore and deploy rehearsal documented
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-023 — Audit course player keyboard, screen reader and responsive usage
- **Source:** `apps/frontend/`
- **Done only when:** Accessibility checks and manual review pass
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-024 — Expert review high-risk safety, licensing and regulated work content
- **Source:** `curriculum/research/`
- **Done only when:** Qualified reviewer signs off jurisdiction and currency
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-025 — Build evidence-backed learner and organisation completion reports
- **Source:** `apps/backend/src/modules/curriculum/`
- **Done only when:** Reports reconcile with canonical progress and competency records
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-026 — Preserve source-draft status and do not auto-publish normalized material
- **Source:** `curriculum/lesson-normalization-index.json`
- **Done only when:** All source drafts remain review-gated
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-027 — Inspect same-prefix migration ordering and dependencies
- **Source:** `apps/backend/prisma/migrations/`
- **Done only when:** Clean staging migration ordering confirmed
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

### ACA-028 — Audit external identity uniqueness and organisation linking lifecycle
- **Source:** `apps/backend/prisma/schema.prisma`
- **Done only when:** Cross-org identity tests and migration policy documented
- **Verification:** NOT VERIFIED. **Owner:** Unassigned.

## Maintenance rules

1. Update JSON and Markdown together after each pass; never silently delete unresolved entries.
2. Link every completed item to test output, a commit/source diff and a verified archive.
3. Separate static checks from runtime and live integration evidence.
4. Re-run curriculum audit after edits and keep original source drafts intact.
5. Preserve full cumulative source and compare against the latest archive before each merge.


## Pass 39 assessment inventory update

See `PASS39-ASSESSMENT-AUDIT.md` and `curriculum/assessment-inventory-pass39.json`. Assessment answer keys require question-level reconciliation and editorial sign-off before import/publication. No runtime or database verification was performed.

## Pass 52 fix team (2026-11-08)

Static, unverified. The baseline changed from Pass 35 to Pass 52 (static, unverified). No ACA status, priority or owner was changed; all 28 items remain OPEN, NOT VERIFIED, Unassigned.

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
2. ACA-001 and ACA-002: `PASS42/VERIFY-evidence.md` records a dependency install, a Prisma generate and a backend compile failure as run results; root `PASS42-STABILIZATION-REPORT.md` says those steps were not verified.
3. Database target: `PASS42/LMS-db-load.md` and `PASS42/GRADING-fix.md` record a migration applied and content loaded into database `lms`; root `PASS45`, `PASS48` and `docs/PASS51` require the Academy database to be `titan_academy` only.
4. Accidental write: `PASS42/INTEGRATION-identity.md` says a `CREATE DATABASE` ran on another PostgreSQL instance by mistake and was then dropped.
5. ACA-020: marked DONE in `PASS42/QUALITY-ops.md` with no CI pipeline to wire into.
6. Owner trial approvals: `PASS42/TRIAL-smoke.md` says every lesson revision in the scratch trial was approved by the owner and states these are not an expert review; relevant to ACA-024 and ACA-026.
