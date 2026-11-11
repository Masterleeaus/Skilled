# Consolidation inventory (Issue #72, S5)

Date: 2026-11-08
Baseline: `origin/main` at `98eb855`, checked out as branch `claude/inventory-consolidation`.
Scope: inventory only. No source, test, schema, migration, lockfile or curriculum file was changed.

## 1. Summary

- The active product is `lms-main/apps/backend` (Express, Prisma, BullMQ) and `lms-main/apps/frontend` (Next.js 15). Both are pnpm workspace members and both are built by the root `build` script.
- `lms-main/packages/shared` is a workspace member but holds only `export {};`. No code imports `@lms/shared`. It is inactive.
- The six root-level zip archives are not read by the code. Five image zips (`*-part-02` to `*-part-06`) hold copies of the tracked `brand/` and `library/` files (1,495 of 1,495 entries match by path and content). The code zip (`*-part-01`) is an older snapshot of `lms-main/`. It differs in 89 files and holds generated files and a `node_modules` fragment.
- Two curriculum copies are stale. `lms-main/curriculum/lessons/converted/` (511 files) and `lessons/ready/` (216 files) are marked superseded. They are not read by code. The curriculum audit found 162 and 216 of them out of step with source.
- Several capabilities have a second implementation. The clearest cases are the unmounted tutor chatbot, the two certificate concepts, and two deployment runbooks. Section 6 lists them.
- Generated files are committed and used by code (`course-level-map.json`) or by CI and tests (report and index JSON). Build output (`build/`, `logs/`, `*.tsbuildinfo`, `next-env.d.ts`) is not committed in the tree. It is covered by `lms-main/.gitignore`. It exists only in the code zip.
- The frontend serves `/academy/brand/...` and `/academy/library/...` from `apps/frontend/public/academy/`. That directory is not in git and not in the code zip. No copy step was found in the repo. This is an open deployment question (section 9).

## 2. Method and limits

- Tracked files were listed with `git ls-files` and hashed with SHA-256. Duplicates were found by content hash and by basename.
- Each root zip was read with Python `zipfile` (read-only). Its entries were compared with tracked files by path and by SHA-256. The code zip was extracted to a scratch directory outside the repo and compared with `diff -rq`.
- Activity was decided from `package.json` scripts, the pnpm workspace file, `app.ts` route mounts, `worker.ts`/`server.ts` imports, `tsconfig` include/exclude, the vitest include pattern, and `grep` for import and path references. Comments and docs were used only where no code reference exists, and that is marked.
- "Mounted" means `app.use(...)` in `apps/backend/src/app.ts`. "Imported" means an `import` or `require` in tracked code.
- Not run: `pnpm install`, builds, tests, Prisma commands, and any database or server command. Statements about runtime behaviour are from reading code and are not verified by execution.

## 3. Top-level inventory

### 3.1 Repository root (`/`)

| Path | Purpose | Active? | Classification | Evidence |
|---|---|---|---|---|
| `.github/workflows/curriculum-ci.yml` | CI gate. Runs `pnpm curriculum:ci` in `lms-main/` on curriculum, scripts and package changes. | Active | Active CI | Workflow file. Sets `working-directory: lms-main`. |
| `.gitignore` | Ignores `.claude/worktrees/` only. | Active | Active config | File content. Root `.gitignore` does not cover the zips or any build output. |
| `README.md` | Explains that `lms-main/` holds the LMS and `brand/`, `library/` hold images extracted from archives. | Active | Active doc | File content. |
| `brand/` | 43 industry folders, 491 files (icons, logos, banners, topic images). | Active assets | Assets, also duplicated in `*-part-0[2-6]-images.zip` | All 491 paths are listed in `apps/frontend/src/lib/academy-brand.manifest.json` (43 distinct `/academy/brand/<dir>/` prefixes). |
| `library/` | `photos/` (660), `icons/` (258), `logos/` (86). 1,004 files. | Active assets | Assets, also duplicated in the image zips | Matches the 1,004-entry catalogue `apps/frontend/src/lib/academy-library.json`. 278 distinct `/academy/library/` paths are referenced from `curriculum/**/*.json`. The filter that renders them is in `CurriculumLessonBody.tsx`. |
| `2037e4b8-part-01-code-and-curriculum.zip` | Archive of an older `lms-main/` tree (about 12 MB). | Not used by code | Archived snapshot, superseded | Section 5.1. |
| `11c64ccc-part-03-images.zip` (24 MB), `724d989d-part-02-images.zip` (26 MB), `17b4e877-part-04-images.zip` (26 MB), `9d7e2a65-part-05-images.zip` (26 MB), `127f77ce-part-06-images.zip` (5 MB) | Image archives. Each holds files that also exist as tracked `brand/` or `library/` files. | Not used by code | Archived duplicates | Section 5.2. |

### 3.2 `lms-main/` (the project)

| Path | Purpose | Active? | Classification | Evidence |
|---|---|---|---|---|
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Root workspace (`apps/*`, `packages/*`). Scripts: `dev`, `build`, `lint` (filter `apps/*`), `curriculum:ci`, `test:source`, `test:academy:backend`. | Active | Active | Read. Lockfile lists importers `apps/backend`, `apps/frontend`, `packages/shared`. |
| `apps/backend/` | Express API, BullMQ worker, Prisma schema and CLI scripts, tests. | Active | Active (inherited base plus Academy modules) | `src/app.ts` mounts about 25 route modules. `src/worker.ts` and `src/server.ts` are entry points. `tsc` builds `src/` to `dist/`. |
| `apps/frontend/` | Next.js 15 App Router UI, typed API clients, stores, components, browser suite. | Active | Active (inherited base plus Academy pages) | `next build` in root `build`. No `public/` directory is tracked (section 9). |
| `packages/shared/` | `src/index.ts` contains only `export {};`. Declares `@lms/shared`. | Workspace member, not imported | Inactive placeholder (README calls it "reserved") | No importer of `@lms/shared` anywhere in tracked code. Not in any app `dependencies`. Not built by the root `build` filter (`apps/*` only). |
| `curriculum/` | Lesson authoring data, assessments, levels, licence data, structure, reports. | Active (partly) | Active data and documentation mixed | Section 4. |
| `scripts/` | 42 root scripts: curriculum audits, assessment checks, migration readiness, deployment preflight, `test-*.mjs` contract tests. | Active | Active for `curriculum:ci` and `test:source`; others are manual | `run-source-verification.mjs` runs 25 `test-*.mjs` checks. `ci-curriculum-audit.mjs` runs in CI. |
| `tests/` | `pass5-lesson-renderer.test.mjs`, `pass11-source-check.py`. | Not run | Archived (inherited pass check) | No script or config runs these. Referenced only from `PASS5-VERIFICATION.json`. |
| `docs/` | 18 current docs, `runbooks/` (3), `legacy-bootstrap/` (4). | Docs | Mixed: current docs, runbooks, archived bootstrap | Section 5.5 and 5.6. |
| `docs/legacy-bootstrap/` | Original scaffold scripts (`*.original.sh`) and stubs (`*.stub.sh`) that refuse to run. | Not run | Archived inherited bootstrap | Stubs state that the originals overwrite manifests. README says do not run bootstrap scripts. |
| `architecture/` | `architecture-diagram.svg`, `erd.svg`. | Not referenced by code | Archived reference | Only mention: `curriculum/planning/DECISIONS.md` line 62, which calls the plan "superseded for scope, reference only" and points to a path outside this repo. |
| `PASS42/` | 34 files: decision and evidence records (32 `.md`, 2 `.json` browser evidence). | Not built | Historical records, cited by code comments | Code comments cite `PASS42/LEVEL-gates.md`, `PASS42/CUSTOMISE-courses.md`, `PASS42/SCHEMA-design.md` and others. |
| Root `PASS*.md`, `PASS*.json` (50 files), `TITAN-*.md/json` (7 files), `PASS42-*.md` | Pass reports and verification records. | Not built | Historical records, some used by tests | `TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md/.json` is checked by `scripts/test-master-improvement-register.mjs`. `PASS34-CURRICULUM-AUDIT.json` (53 KB) and `PASS38-MERGE-MANIFEST.json` (91 KB) are large generated records. |
| `docker-compose.local-dev.yml` | Original developer Compose file. README says it is not for production. | Dev only | Historical dev config | Renamed from `docker-compose.yml` (the code zip still has the old name, with identical content). |
| `docker-compose.academy-deps.yml` | Redis and MinIO candidate for the deployment preflight. | Read by a contract test | Deployment candidate | `scripts/test-academy-deployment-contract.mjs` reads it. |
| `.env.production.example`, `apps/backend/.env.example`, `apps/frontend/.env.example` | Environment templates. | Docs | Config templates (three files) | No conflict found between them. Not compared line by line. |
| `.editorconfig`, `.prettierrc`, `.gitignore`, `LICENSE`, `README.md` | Config and project docs. | Active | Active | `.gitignore` is in section 7. |
| `1-init.sh`, `2-setup.sh`, `docker-compose.yml`, `package-lock.json`, `.eslintrc.json` | Not in the tree. Present only in the code zip. `1-init.sh` and `2-setup.sh` are byte-identical to the stubs in `docs/legacy-bootstrap/`. | Not in tree | Archive-only | Section 5.1. |

## 4. Packages and build reach

| Package | Workspace | Imported by | Built by root `build` | Built or run by its own script | Status |
|---|---|---|---|---|---|
| `@lms/backend` (`apps/backend`) | yes | nothing (leaf) | yes (`tsc`) | `dev` (tsx), `start` (`dist/server.js`), `start:worker` (`dist/worker.js`), `test`, `test:node`, `curriculum:import`, `publish:curriculum`, `courses:sync`, `integration:*`, `prisma:*` | Active |
| `@lms/frontend` (`apps/frontend`) | yes | nothing (leaf) | yes (`next build`) | `dev`, `start`, `lint`, `test:browser` | Active |
| `@lms/shared` (`packages/shared`) | yes | nothing | no | none | Inactive placeholder |
| Root `lms` | root | n/a | n/a | `curriculum:ci`, `test:source`, `test:academy:backend` | Active |

Backend test reach. `vitest` includes `src/**/*.test.ts` and `tests/**/*.test.ts`. `tsx --test` covers `tests/**/*.test.{mjs,cjs}` (AI runtime, tutor `.mjs`, and `pass22-inactive-identity.test.cjs`). `tsconfig.json` builds `src/` and excludes `src/tests` and `*.test.ts`. The `apps/backend/tests/permissions.ts` file is not a `.test.ts` file and nothing imports it (section 5.3).

Backend route mounts (`src/app.ts`). Mounted: health, auth, categories, courses, modules, enrolments, quizzes, assignments, classes, certificates, reviews, payments (plus raw Stripe webhook), audit logs, discussions, admin, academy curriculum, academy templates, academy completion report, titan integration, academy pathways, academy course selection. Conditionally mounted: tutor (only when `TUTOR_ENABLED=true`, default off). Not mounted anywhere: `src/tutor/chatbot/` (section 6.3).

## 5. Duplicated source and data

For each group: the copies, how they relate, and which copy the build or runtime uses.

### 5.1 Code zip vs working tree

- File: `2037e4b8-part-01-code-and-curriculum.zip` (root).
- Relation: an older snapshot of `lms-main/`. Compared with the tree by path and SHA-256 after extraction to scratch.
  - 3,316 files identical at the same path. 3 more identical at another path (`1-init.sh` and `2-setup.sh` match the `docs/legacy-bootstrap/*.stub.sh` files; `docker-compose.yml` matches `docker-compose.local-dev.yml`).
  - 89 files differ in content at the same path. Examples: `apps/backend/src/worker.ts` (the zip lacks the video-cleanup drain), `apps/backend/prisma/schema.prisma`, `apps/backend/package.json`, `pnpm-lock.yaml`, `README.md`, `.gitignore`.
  - 53 entries (files or folders) exist only in the tree. Examples: migrations `20261108130000`, `20261108140000`, `20261108150000`, `apps/backend/src/modules/curriculum/assessment-approval.ts`, many tests.
  - 8 files exist only in the zip: `package-lock.json`, `.eslintrc.json`, `build/browser-report.json`, `build/curriculum-ci-report.json`, `apps/backend/logs/combined.log`, `apps/backend/logs/error.log`, `apps/frontend/next-env.d.ts`, `apps/frontend/tsconfig.tsbuildinfo`.
  - 3 `node_modules/.pnpm` state files (`.modules.yaml`, `.pnpm/lock.yaml`, `.pnpm-workspace-state.json`) and about 700 directory entries under `node_modules/` are in the zip.
- Used by build: neither. The tree is the source. The zip is older (inferred from the missing migrations and features; not proven file by file).
- Recommendation: section 9, O-2.

### 5.2 Image archives vs `brand/` and `library/`

- Files: `11c64ccc-part-03`, `724d989d-part-02`, `17b4e877-part-04`, `9d7e2a65-part-05`, `127f77ce-part-06` (root zips).
- Relation: all 1,495 image entries in these zips are byte-identical to a tracked file at the same path. The tracked `brand/` (491) and `library/` (1,004) together are 1,495 files.
- Used by build: the tracked `brand/` and `library/` folders. The zips are not read.
- Recommendation: section 9, O-1.

### 5.3 Source duplicates inside the backend and frontend

| Copy A | Copy B | Relation | Used by | Action class |
|---|---|---|---|---|
| `apps/backend/src/utils/token.ts` | `apps/backend/src/modules/auth/token.utils.ts` | Same 52 lines, except the `env` import path. | `token.utils.ts` is imported by auth service, `authenticate.ts` and tests. `utils/token.ts` has no importer. | Safe-now (S-1) |
| `apps/backend/src/tests/permissions.test.ts` | `apps/backend/tests/permissions.ts` | Byte-identical. | Vitest runs the `src/tests` copy. Nothing imports or runs `tests/permissions.ts`. | Safe-now (S-2) |
| `apps/frontend/src/app/student/courses/[slug]/discussions/[threadId]/page.tsx` | `apps/frontend/src/app/teacher/courses/[slug]/discussions/[threadId]/page.tsx` | Byte-identical. Both are App Router routes for different roles. | Both routes are live. | Safe-now (S-4) |
| `apps/backend/src/tests/` (55 entries) | `apps/backend/tests/` (tutor, ai-runtime, pass22, auth/health/permissions helpers) | Two test trees, both run by `pnpm test`. Not duplicates of each other; the split is a layout choice. | Both. | No action proposed |
| `apps/backend/src/config/permissions.ts` | `apps/backend/src/middleware/permission.ts` | Not duplicates. `middleware/permission.ts` imports the matrix from `config/permissions.ts`. | Both. | None |

### 5.4 Curriculum data copies

| Copy A | Copy B | Relation | Used by build or runtime | Action class |
|---|---|---|---|---|
| `lms-main/curriculum/lessons/converted/` (511 files) | `lms-main/curriculum/courses/**` and `shared/**` (source) | Stale copies. Their `SUPERSEDED.md` records a check dated 2026-11-04. The curriculum audit (`curriculum/research/STALE-COPIES-AUDIT.md`) found 162 of 511 out of step with source. No script generates them. | Not read by code. `scripts/reconcile-assessment-questions.mjs` reads them. | Needs-owner-decision (O-4) |
| `lms-main/curriculum/lessons/ready/` (216 files) | Same as above | Stale copies. Marked SUPERSEDED. 216 of 216 out of step (title, knowledge checks, outcomes or learner text). 222 source files cite `lessons/ready/` as provenance. | `scripts/reconcile-lesson-formats.mjs` reads it. | Needs-owner-decision (O-4) |
| `lms-main/curriculum/` (file lessons, `courses/`, `shared/`) | `apps/backend/prisma/curriculum/titan-three-layer-lessons.json` | Different content. The JSON holds 221 "PLANNED" lesson briefs with IDs such as `U01-01`. No IDs from the brief file appear elsewhere in `curriculum/` except `curriculum/planning/BRIEF-DRAFT-RECONCILIATION.csv`. | `prisma/import-titan-curriculum.ts` (DB import). Also `pathway.seed.ts` and `pathways-seed.test.ts`. | Needs-owner-decision (O-5) |
| `apps/backend/prisma/curriculum/cleaning/*.json` | `curriculum/shared/cleaning/` | Different schemas (`titan-academy.cleaning-lessons.*/1` vs lesson JSON). Not duplicates. | `validate-cleaning-lessons.mjs` (package script `curriculum:validate-cleaning`) only. | None |
| `apps/backend/src/modules/levels/course-level-map.json` | `curriculum/levels/*.csv` | Generated copy. `course-level-map.json` is written by `apps/backend/scripts/build-course-level-map.py` from the 44 CSV files. | Imported by `level-rules.ts` and by `academy-level-ids.test.ts`. | Safe-now (S-5, add a freshness check) |
| `apps/frontend/src/lib/academy-library.json` | `library/**` | Catalogue of the same 1,004 files. | Frontend (the catalogue consumer is not fully traced). | Uncertain (section 8) |

### 5.5 Deployment and install guidance

| Copy A | Copy B | Relation | Action class |
|---|---|---|---|
| `docs/runbooks/deployment.md` | `curriculum/research/DEPLOY-RUNBOOK.md` | Two runbooks. A third doc, `docs/INSTALL.md`, cites the research runbook for server steps. Both runbooks say they are not rehearsed. | Needs-owner-decision (O-9) |
| `docs/runbooks/recovery.md`, `docs/runbooks/secrets-handling.md` | none | Single copies. | None |
| `TITAN-INTEGRATION-PROVISIONING.md` (lms-main root) | `docs/ACA-028-external-identity-uniqueness.md`, `docs/FIELD_SERVICES_CONTEXT_SYNC.md` | Overlapping integration notes. | Needs-owner-decision (part of O-3) |

### 5.6 Bootstrap scripts

- `docs/legacy-bootstrap/1-init.original.sh` and `2-setup.original.sh` are the archived originals. They are not run.
- `docs/legacy-bootstrap/1-init.stub.sh` and `2-setup.stub.sh` refuse to run. The same stubs sit at the zip root as `1-init.sh` and `2-setup.sh` (section 5.1).
- Recommendation: keep as archive. No runtime path uses them.

### 5.7 Repeated image files (inside `brand/` and `library/`)

- `brand/hardfloor/icon.png` = `brand/window/icon.png`.
- `library/logos/cleaning-commercial/postcon-logo-{a,b}.png` = `library/logos/wellbeing-personal/massage-logo-{a,b}.png`.
- `library/icons/cleaning-commercial/postcon-icon-{01..06}.png` = `library/icons/wellbeing-personal/massage-icon-{01..06}.png`.
- Both paths in each pair exist in the tracked tree. Whether the catalogue lists both is not re-checked (section 8).

### 5.8 Other naming overlap (not duplicates, no action proven)

- Backend `scripts/audit-migrations.py` and root `scripts/audit-migration-readiness.mjs` have similar purpose. Different languages and inputs. Not compared.
- Backend `scripts/verify-*.mjs` (9 files) and frontend `scripts/verify-*-ui.mjs` (4 files). Run by hand. Not in any test script.

## 6. Authoritative implementation per capability

"Authoritative" means the code path the running app uses, mounted or loaded from `app.ts`, `worker.ts`, `server.ts` or the Prisma CLI. The second column lists any other implementation.

| Capability | Authoritative file or module | Second implementation or related code | Notes |
|---|---|---|---|
| Courses (inherited catalogue) | `apps/backend/src/modules/courses/` (`course.routes.ts`, `course.service.ts`, `module.*`, `lesson.service.ts`, `video-*.service.ts`). Models `Course`, `Module`, `Lesson`. Mounted at `/api/courses`. | Academy course outline and progress in `modules/curriculum/` (file-backed, `file-lesson-loader.ts`). Academy `Course` access also filtered by `licence-track.ts` in `course.routes.ts`. | Two course views exist. The inherited model is used by enrolments and quizzes; the Academy view uses `AcademyCourseTrack`. |
| Curriculum (Academy content) | `apps/backend/src/modules/curriculum/` (`curriculum.routes.ts`, `curriculum-publisher.ts`, `file-lesson-loader.ts`, `lesson-review.*`, `superadmin-lesson.*`). Source: `lms-main/curriculum/`. | DB brief import: `apps/backend/prisma/import-titan-curriculum.ts` plus `curriculum-brief-import.ts` (`AcademyContentLesson`, from `prisma/curriculum/titan-three-layer-lessons.json`). | Two ingestion paths (O-5). |
| Assessments and knowledge checks | `modules/curriculum/curriculum.routes.ts` (knowledge-check endpoints), `knowledge-answer-keys.ts`, `assessment-approval.ts`. Answer keys: `curriculum/assessments/*.assessment.json`, loaded by `prisma/load-knowledge-answer-keys.ts`. | Inherited quizzes: `apps/backend/src/modules/quizzes/` (`Quiz`, `Question`, `Option`, `QuizAttempt`, `Answer`). Assignments: `modules/assignments/`. | Two assessment models. Both are mounted. |
| Evidence (practical) | `apps/backend/src/modules/curriculum/assessment-evidence.ts` (`AcademyPracticalEvidence`, `AcademyVerifiedCompetency`). Routes in `curriculum.routes.ts`. | Inherited `AssignmentSubmission` (not evidence in the Academy sense). | Single Academy implementation. |
| Payments | `apps/backend/src/modules/payments/` (`payment.service.ts`, `stripe.provider.ts`, `stripe.webhook.ts`, `coupon.service.ts`). Webhook registered in `app.ts` before JSON parsing. | None found. `payment-provider.interface.ts` has one implementation (Stripe). | Single implementation. |
| Certificates | Inherited: `apps/backend/src/modules/certificates/certificate.service.ts` (`Certificate` model, `verificationToken` migration `20261108140000`), public route `/api/certificates/verify/:code` (see `docs/certificate-verification.md`). | Academy: `modules/curriculum/completion-report.service.ts` (`AcademyLearnerCompletion`, learner and organisation reports). It does not create a `Certificate` row. | Two concepts (O-7). |
| Tutor (AI tutor) | `apps/backend/src/tutor/route/tutor-wiring.ts` and `tutor-route.ts`, mounted only when `TUTOR_ENABLED=true`. Store: `tutor/store/prisma-store.ts` (`AcademyTutor*` tables, migration `20261108120000`). Retrieval: `tutor/rag/`. Policy: `tutor/policy/`. Access: `tutor/access/`. Models and providers: `apps/backend/src/ai-runtime/` (used only by the tutor). | Chatbot: `apps/backend/src/tutor/chatbot/` (not mounted; not imported by any mounted route; `AcademyChatbot*` tables, migration `20261108120100`). No frontend code calls either. | Two conversation stores (O-6). |
| Auth | `apps/backend/src/modules/auth/` (`auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `token.utils.ts`). Middleware: `middleware/authenticate.ts` (JWT verify), `middleware/permission.ts` (RBAC) using `config/permissions.ts`. Frontend: `lib/auth.api.ts`, `store/auth.store.ts`. | `apps/backend/src/utils/token.ts`: unused copy (S-1). | Single live implementation. |
| Integrations (Field Services and Titan) | `apps/backend/src/modules/curriculum/integration.routes.ts`, mounted at `/api/titan/integration`. Only the skills read route is mounted. CLI: `apps/backend/prisma/provision-titan-integration.ts`, `manage-titan-credentials.ts`. Models: `AcademyExternalIdentity`, `AcademyServiceCredential`, `AcademyIntegrationAudit`. | Draft-only lesson-context sync described in `docs/FIELD_SERVICES_CONTEXT_SYNC.md` is not mounted. The test `contract.test.ts` asserts it is absent. | Single mounted implementation. |
| Workers (background jobs) | `apps/backend/src/worker.ts` (entry, `dist/worker.js`). Queues: `jobs/email.queue.ts`, `jobs/certificate.queue.ts`. Processors: `jobs/email.worker.ts`, `jobs/certificate.worker.ts`. Video cleanup drain: `modules/courses/video-upload.service.ts`. | `server.ts` also runs `cleanupStaleVideoUploads()` at start and imports the email and certificate queues. | Split between two entry points. Not a duplicate. |
| Frontend (learner, teacher, admin, Academy) | `apps/frontend/src/app/` (App Router), API clients in `src/lib/*.api.ts`. | Two course clients: `course.api.ts` (inherited) and `curriculum.api.ts` (Academy). | Two clients (no action proposed). |

## 7. Generated files and `.gitignore` coverage

### 7.1 Committed generated files

| File | Generator (found in repo) | Consumed by | Note |
|---|---|---|---|
| `apps/backend/src/modules/levels/course-level-map.json` | `apps/backend/scripts/build-course-level-map.py` (reads `curriculum/levels/*.csv`) | `level-rules.ts`, `academy-level-ids.test.ts` | Required at runtime. Committed. Safe-now freshness check (S-5). |
| `curriculum/lesson-normalization-index.json` | `scripts/reconcile-lesson-formats.mjs` | `test-reconcile-lesson-formats.mjs` | Committed. |
| `curriculum/lesson-review-queue.json`, `.csv` | `scripts/build-curriculum-review-queue.mjs` | `test-curriculum-review-queue.mjs` | Committed. |
| `curriculum/assessment-publication-report.json` | `scripts/validate-assessment-publication.mjs` (writes only when given an output path) | Test scripts | Committed. `STALE-COPIES-AUDIT.md` (2026-11-03) describes it as 357 records, all blocked. The current file was not re-read for this inventory. |
| `curriculum/assessment-question-reconciliation-pass41.json` | `scripts/reconcile-assessment-questions.mjs` | Test scripts | Committed. |
| `curriculum/assessment-inventory-pass39.json` | `scripts/audit-assessment-inventory.mjs` | `test-assessment-inventory.mjs` | Committed. |
| `curriculum/ci/curriculum-ci-baseline.json` | `scripts/ci-curriculum-audit.mjs` (writes the baseline on request) | CI gate | Committed. |
| `curriculum/import/canonical-import-manifest.json` | `curriculum/import/build-canonical-import-manifest.py` | `academy-level-ids.test.ts` | Committed. |
| `curriculum/licence/licence-index.json` | None found | Mentioned only in `curriculum/licence/README.md` | No reader found. Uncertain (O-12). |
| `curriculum/business-lesson-fields.json` | None found | Mentioned only in curriculum docs | Backend uses the DB model `AcademyBusinessLessonField`. No reader found. Uncertain (O-12). |
| `curriculum/icons/BRAND-ICON-MANIFEST.csv`, `TITAN-ZERO-ICON-MANIFEST.csv` | None found | `PASS42/ICONS-*.md` | Documentation only. |
| `curriculum/lessons/MANIFEST.csv`, `TITLES-ONLY.csv` | None found | Curriculum docs | Documentation only. |
| `curriculum/structure/COURSE-MODULE-LESSON-MAP.csv` | None found | Curriculum docs and PASS42 notes | No code reader found. Uncertain. |
| `apps/frontend/src/lib/academy-brand.manifest.json` | None found | `academy-brand.ts` (imported) | Required at runtime. Generator not located. |
| `apps/frontend/src/lib/academy-library.json` | None found | Frontend catalogue | Generator not located. |
| `curriculum/courses/**/REPORT*.md`, `curriculum/research/*.md` (131 tracked files) | Authored by hand or by agents | Not read by code. `file-lesson-loader.ts` excludes `research/` and `planning/`. | Reports and records. |
| `PASS*.json`, `TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.json`, `PASS42/evidence-browser-*.json` | Pass records | `test-master-improvement-register.mjs` reads the register | Records. |

### 7.2 Build output and logs

- Not committed in the tree: `build/`, `logs/`, `*.log`, `*.tsbuildinfo`, `next-env.d.ts`, `dist/`, `.next/`, `coverage/`, `apps/backend/prisma/generated/`, `node_modules/`.
- `lms-main/.gitignore` covers all of these. `apps/backend/.gitignore` adds `logs/`.
- `apps/frontend` has no `.gitignore` of its own. It relies on `lms-main/.gitignore`.
- The code zip contains `build/*.json`, `apps/backend/logs/*.log`, `apps/frontend/tsconfig.tsbuildinfo` and `apps/frontend/next-env.d.ts`. These were committed to an archive, not to the tree. The root `.gitignore` does not cover the zips.
- `lms-main/.gitignore` lists `test-lms.sh` and `test.txt`. Neither file is in the tree. These entries are stale.

### 7.3 Gaps

- `apps/frontend/public/` is absent from the tree, so nothing in `.gitignore` refers to it. If a copy step is added for the `/academy/*` images, the team must decide whether the copies are tracked or ignored (O-11).
- The root `.gitignore` does not cover any build output. None is expected at the root.

## 8. Uncertainties

- U-1 Frontend asset serving. The frontend resolves `/academy/brand/...` and `/academy/library/...` from `apps/frontend/public/academy/`. That path is not tracked and not in the zip. `curriculum/research/IMAGE-GAPS.md`, `IMAGE-REFS-CHECK.md` and `CHECKLIST-STATUS-2026-11-03.md` describe `public/academy/library/` as existing on disk. This inventory could not confirm that from the repo. A copy from `library/` and `brand/` at deploy time, or an Apache alias, is the likely mechanism. Not verified.
- U-2 Whether the duplicate library pairs (section 5.7) are both listed in the catalogue. The repo's own check says the catalogue has one entry per file. Not re-run.
- U-3 Whether `licence-index.json`, `business-lesson-fields.json`, `COURSE-MODULE-LESSON-MAP.csv` and the icon manifests are read by any operator script outside the repo, or are documentation only.
- U-4 Whether `apps/backend/scripts/verify-*.mjs` and `scripts/test-*.mjs` outside `run-source-verification.mjs` are run by hand, by CI or by owners. Only the names and references were checked.
- U-5 `curriculum-publisher.ts` reads an optional `assessment-publication-approvals.json` (or `ACADEMY_ASSESSMENT_APPROVALS`). No such file is in the tree. It is treated as absent (no approvals). Behaviour not confirmed by running.
- U-6 `ai-runtime/`: only the tutor imports it. Whether the chatbot is meant to use it is not stated in code.
- U-7 The code zip is "older" by inference (missing migrations and features). Per-file timestamps were not used.
- U-8 `scripts/validate-assessment-publication.mjs` and `scripts/ci-curriculum-audit.mjs` write committed reports only under flags. Whether the committed reports are current was not re-run.
- U-9 `pnpm install --frozen-lockfile`, `prisma validate`, `tsc` and `next build` were not run for this inventory. The README reports them as passing at the baseline commit.

## 9. Recommended consolidation steps

Each step is marked **safe-now** (no change to runtime, data or deployment; can be done in a follow-up PR with the usual build and test run) or **needs-owner-decision** (affects product scope, data, history or deployment).

### 9.1 Safe-now

- S-1. Delete `apps/backend/src/utils/token.ts`. No importer. The only difference from `modules/auth/token.utils.ts` is the `env` import path. Confirm with `tsc` and `vitest run`.
- S-2. Delete `apps/backend/tests/permissions.ts`. It is byte-identical to `apps/backend/src/tests/permissions.test.ts`, is not a `.test.ts` file, and is not imported.
- S-3. Confirm and then delete `apps/backend/scripts/verify-business-context.mjs`. No reference in code, docs, CI or package scripts (0 references found). Keep it if it is a manual check you still use.
- S-4. Move the duplicated discussion thread page body (`student/.../discussions/[threadId]/page.tsx` and `teacher/.../discussions/[threadId]/page.tsx`) into one shared component, and keep both routes as thin wrappers. Both files are byte-identical today. Verify with `next build` and `pnpm lint`.
- S-5. Add a freshness check to CI for committed generated files that code imports: `course-level-map.json` (regenerate from `curriculum/levels/*.csv` and diff) and `curriculum/import/canonical-import-manifest.json`. Adds a check; changes no data.
- S-6. Label archived folders in place without moving them: `curriculum/retired/`, `architecture/`, root `tests/`, `docs/legacy-bootstrap/`. Labels only; no file moves.
- S-7. Remove the stale `.gitignore` entries `test-lms.sh` and `test.txt` from `lms-main/.gitignore`.
- S-8. Keep `lms-main/curriculum/lessons/converted/` and `ready/` as they are (already marked SUPERSEDED) and do not regenerate them. Step O-4 covers their removal.

### 9.2 Needs-owner-decision

- O-1. Image archives (`11c64ccc`, `724d989d`, `17b4e877`, `9d7e2a65`, `127f77ce`, about 110 MB together). Their 1,495 files are identical to tracked `brand/` and `library/`. Decide whether to remove them from `main` and rely on `brand/` and `library/` (and the copy step in O-11). Removing them from history is a separate choice.
- O-2. Code zip `2037e4b8-part-01-code-and-curriculum.zip`. It is an older snapshot with generated files and a `node_modules` fragment. Decide whether to retire it from `main` and keep provenance in the PR or release notes.
- O-3. Root-level documentation sprawl (50 `PASS*` files, 7 `TITAN-*` files, `PASS42-*.md`, `PASS42/`). Decide whether to move them to `docs/history/`. Moving requires updating references: `test-master-improvement-register.mjs`, code comments (`level-rules.ts`, `course-selection.routes.ts`, `template.routes.ts`), and migration comments.
- O-4. Stale curriculum copies: `curriculum/lessons/converted/` (511, 162 out of step) and `lessons/ready/` (216, all out of step). 222 source files cite `ready/` as provenance. Decide: retire both, or rebuild from source first. `STALE-COPIES-AUDIT.md` recommends not regenerating from them.
- O-5. Two curriculum ingestion paths. The DB brief import (221 "PLANNED" briefs, `AcademyContentLesson`) and the file-backed loader (`curriculum/courses` and `shared`). Decide which one governs learner-visible content for each course, and whether the brief import stays.
- O-6. Tutor chatbot. `apps/backend/src/tutor/chatbot/` is not mounted and has no frontend. It has its own store and `AcademyChatbot*` tables (migration `20261108120100_academy_chatbot`). Its `CHANGES.md` still describes a `migrations-draft` folder that no longer exists. Decide: ship it (mount and build the UI), or remove the code and table in a planned migration. Do not drop an applied table without a rehearsal.
- O-7. Certificates. Inherited `Certificate` rows (with verification token) and Academy completion reports (no row) are both live. Decide which one is the learner-facing certificate and whether the public verify route covers Academy completions.
- O-8. `packages/shared`. Either remove it from the workspace (edit `pnpm-workspace.yaml` and the lockfile through pnpm) or give it real code and a consumer. README calls it "reserved".
- O-9. Two deployment runbooks: `docs/runbooks/deployment.md` and `curriculum/research/DEPLOY-RUNBOOK.md`, with `docs/INSTALL.md` pointing to the research one. Decide which is authoritative and merge.
- O-10. Two migrations share the timestamp prefix `20261102000100` (`academy_external_identity_audit` and `titan_academy_content_inventory`). Prisma orders by folder name, so both apply. Renaming a folder that has already been applied changes `migration_name` in `_prisma_migrations`. Leave as is unless a rehearsal shows an ordering problem.
- O-11. Frontend image serving. `apps/frontend/public/academy/` is not in git. Decide the mechanism (copy `brand/` and `library/` at build or deploy, or an Apache alias) and document it. Until then, `/academy/*` image URLs have no source in the repo.
- O-12. Committed data with no code reader found: `curriculum/licence/licence-index.json`, `curriculum/business-lesson-fields.json`, `curriculum/structure/COURSE-MODULE-LESSON-MAP.csv`, icon manifests, `curriculum/lessons/MANIFEST.csv`. Decide: keep as documentation, or remove and point to the source of truth.
- O-13. Root `tests/` (two files, not run by any script, referenced only by `PASS5-VERIFICATION.json`). Decide: wire into `test:source` or remove with the evidence reference updated.
- O-14. Generators for `academy-brand.manifest.json` and `academy-library.json` are not in the repo. Decide whether to add a generator or record them as hand-maintained.
- O-15. Identical image pairs (section 5.7). Decide whether both copies stay (they are catalogued under different categories) or one is removed and its catalogue entry is updated.
- O-16. `architecture/` SVG diagrams. Referenced only by a superseded planning note. Decide: keep as archive or delete.

## 10. Where this document sits

- This file is the only change in the branch. Other agents may add their inventories in `lms-main/docs/`. This document does not depend on them.
