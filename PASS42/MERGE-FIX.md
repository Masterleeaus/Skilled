# MERGE-FIX: Pass 56 merge fixes and classification

Date: 2026-11-02. Scope: `/home/claude/p29m/lms-main`. Pre-fix backup: `/home/claude/work/merge-fix-backup/lms-main` (taken before any change in this pass; excludes node_modules and .next). No git commits. No curriculum file or level CSV changed (0 differences against the backup). `schema.prisma` and migrations were not edited by this pass. Memory tools not used.

## Premise corrections

- MERGE-E-audit.md has no "Unexplained differences" section. The 74 files were rebuilt from the live trees: non-curriculum files that differ between OURS and THEIRS and are not in PASS56-CHANGE-MANIFEST.json. The count is 74, which matches the brief.
- The brief said 62 files were copied. THEIRS has 0 paths that OURS lacks, so no copy was needed in this pass.
- THEIRS equals the Pass 55 cumulative tree plus the 15 manifest files. No Pass 55 zip is on disk, so Pass 41 (`/home/claude/work/pass41-base/lms-main`) was used as the common ancestor. A file where OURS equals Pass 41 means OURS has no later change there.
- Audit items now resolved before this pass: assignment.service.ts equals THEIRS (MERGE-D); the teacher course page and assignments/new page were merged in MERGE-B and then switched to the private management fetch in this pass.

## Classification of the 74 files

Method: three-way comparison of OURS, THEIRS and Pass 41. OURS-NEWER: only OURS differs from Pass 41, so kept OURS. THEIRS-NEWER: only THEIRS differs from Pass 41, so taken from THEIRS. UNCLEAR: both differ from Pass 41, so read both sides and merged by intent (`git merge-file` with Pass 41 as base, then resolved by hand).

Counts: OURS-NEWER 19, THEIRS-NEWER 37, UNCLEAR 18. Total 74.

| # | File | Class | Decision | Reason |
|---|---|---|---|---|
| 1 | `.env.example` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 2 | `apps/backend/prisma/provision-titan-integration.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 3 | `apps/backend/src/modules/admin/admin.routes.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 4 | `apps/backend/src/modules/auth/token.utils.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 5 | `apps/backend/src/modules/certificates/certificate.routes.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 6 | `apps/backend/src/modules/classes/class.routes.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 7 | `apps/backend/src/modules/courses/category.routes.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 8 | `apps/backend/src/modules/discussions/discussion.routes.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 9 | `apps/backend/src/modules/payments/coupon.service.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 10 | `apps/backend/src/modules/reviews/review.routes.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 11 | `apps/backend/src/utils/token.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 12 | `apps/backend/vitest.config.ts` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 13 | `apps/frontend/src/app/layout.tsx` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 14 | `apps/frontend/src/app/page.tsx` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 15 | `apps/frontend/src/app/teacher/courses/new/page.tsx` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 16 | `apps/frontend/src/components/AdminNav.tsx` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 17 | `apps/frontend/src/components/CurriculumLessonBody.tsx` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 18 | `packages/shared/package.json` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 19 | `pnpm-lock.yaml` | OURS-NEWER | KEEP OURS | Only OURS changed this file since Pass 41, and THEIRS still equals Pass 41. Taking THEIRS would revert our later work. |
| 20 | `2-setup.sh` | THEIRS-NEWER | TAKE THEIRS | THEIRS Pass 43 safety version. |
| 21 | `apps/backend/src/config/env.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS adds SMTP_TLS_MODE, SMTP_USER and SMTP_PASSWORD with production guards (fix 4 names mirror these). |
| 22 | `apps/backend/src/config/minio.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 23 | `apps/backend/src/jobs/certificate.queue.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS exports CertificateJobData, which the copied worker imports (fix 2). |
| 24 | `apps/backend/src/jobs/email.queue.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS exports EmailJobData, which the copied worker imports (fix 2). |
| 25 | `apps/backend/src/middleware/authenticate.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS fresh user lookup (isActive, isEmailVerified). Test fixtures were updated to match (see post-merge edits). |
| 26 | `apps/backend/src/modules/auth/auth.controller.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 27 | `apps/backend/src/modules/auth/auth.routes.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 28 | `apps/backend/src/modules/auth/auth.service.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 29 | `apps/backend/src/modules/auth/auth.validators.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 30 | `apps/backend/src/modules/certificates/certificate.service.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS issueCertificate checks evaluateCertificateEligibility before issuing. |
| 31 | `apps/backend/src/modules/courses/module.service.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 32 | `apps/backend/src/modules/courses/video-upload.service.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 33 | `apps/backend/src/modules/enrollment/enrollment.service.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS adds the eligibility-gated completion (recalculateCourseProgress calls evaluateCertificateEligibility). Post-copy, the OURS lesson write (no monotonic completed or watchedSeconds) is restored, to keep the ACA-014 revert and our progress logic. |
| 34 | `apps/backend/src/modules/enrollment/enrollment.validators.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 35 | `apps/backend/src/modules/payments/payment-provider.interface.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 36 | `apps/backend/src/modules/payments/payment.service.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 37 | `apps/backend/src/modules/quizzes/quiz.service.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS recalculates progress after grading and adds multi-select answers. |
| 38 | `apps/backend/src/modules/quizzes/quiz.validators.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 39 | `apps/backend/src/server.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS worker and certificate wiring (PASS45-WORKERS-AND-CERTIFICATES.md). |
| 40 | `apps/backend/src/tests/auth.test.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS test. Post-copy, the self-appointed TEACHER assertion is changed from 400 to 422, the validation status used by the shared error handler. |
| 41 | `apps/frontend/src/app/(auth)/login/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 42 | `apps/frontend/src/app/(auth)/register/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 43 | `apps/frontend/src/app/student/courses/[slug]/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 44 | `apps/frontend/src/app/student/quizzes/[quizId]/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 45 | `apps/frontend/src/app/teacher/courses/[slug]/discussions/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 46 | `apps/frontend/src/app/teacher/courses/[slug]/live-classes/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 47 | `apps/frontend/src/app/teacher/courses/[slug]/quizzes/new/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 48 | `apps/frontend/src/app/teacher/courses/[slug]/students/[studentId]/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 49 | `apps/frontend/src/app/teacher/courses/[slug]/students/page.tsx` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 50 | `apps/frontend/src/lib/api-client.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 51 | `apps/frontend/src/lib/auth.api.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 52 | `apps/frontend/src/lib/course-detail.api.ts` | THEIRS-NEWER | TAKE THEIRS | THEIRS adds fetchCourseForManagement, which calls /courses/:slug/manage. That route exists in the merged backend (fix 2). |
| 53 | `apps/frontend/src/lib/quiz.api.ts` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 54 | `scripts/test-assessment-inventory.mjs` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 55 | `scripts/test-assessment-publication.mjs` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 56 | `scripts/validate-assessment-publication.mjs` | THEIRS-NEWER | TAKE THEIRS | Only THEIRS changed this file since Pass 41, and OURS still equals Pass 41. No OURS-only content was lost. |
| 57 | `1-init.sh` | UNCLEAR | THEIRS | Pass 56 turned the scaffold into a stop guard. The OURS scaffold rewrites package manifests and existing source, which the Pass 43 safety notes forbid on a cumulative tree. |
| 58 | `README.md` | UNCLEAR | MERGED | OURS title and tree kept. THEIRS Pass 43 production-safety banner and local-dev compose reference added. The setup line now uses docker-compose.local-dev.yml, labelled local only. |
| 59 | `apps/backend/package.json` | UNCLEAR | MERGED (clean 3-way) | Adds THEIRS start:worker and dev:worker. Keeps OURS typecheck:tests and integration/curriculum scripts. Fix 3 scripts present. |
| 60 | `apps/backend/src/app.ts` | UNCLEAR | MERGED (clean 3-way) | Non-overlapping THEIRS and OURS changes combined. Checked: no conflict markers, typecheck and build pass. |
| 61 | `apps/backend/src/modules/courses/course.routes.ts` | UNCLEAR | MERGED (clean 3-way) | THEIRS identity forwarding kept. Handler typed Request<{ slug: string }> so req.params.slug (the form test-course-publication-access asserts) typechecks. |
| 62 | `apps/backend/src/modules/courses/course.service.ts` | UNCLEAR | MERGED (clean 3-way) | Non-overlapping changes combined. Verified by typecheck and vitest. |
| 63 | `apps/backend/src/modules/courses/module.routes.ts` | UNCLEAR | THEIRS for security logic, OURS param style kept | Upload rollback (remove MinIO object if DB update fails) and signed playback grant with HttpOnly cookie are taken from THEIRS. Those lines use param() or typed Request<{ lessonId }>, and the literal req.params forms asserted by test-lesson-privacy and test-private-video-playback are kept. |
| 64 | `apps/backend/src/modules/curriculum/curriculum.routes.ts` | UNCLEAR | OURS | Levels/me, progress/me and the level-gate code are kept. THEIRS deleted progress/me, which OURS had moved to a new position with the progress work. OURS also keeps the removal of POST /revisions/:id/publish (REVIEW-publication.md). |
| 65 | `apps/backend/src/modules/curriculum/integration.routes.ts` | UNCLEAR | OURS | OURS logger and filterToFinishedLevels imports kept. THEIRS removed the BUSINESS_LESSON_FIELDS import, which neither version uses after the change. |
| 66 | `apps/backend/src/modules/enrollment/enrollment.routes.ts` | UNCLEAR | MERGED | THEIRS assertCourseOwnership check on the roster and student routes, plus typed Request<{ courseId }> with req.params.courseId (asserted by test-certificate-eligibility). |
| 67 | `apps/backend/src/modules/payments/payment.routes.ts` | UNCLEAR | MERGED | THEIRS verifyAndCompletePayment(providerReference, userId) signature, which payment.service (THEIRS) requires. Handler typed Request<{ providerReference }>. |
| 68 | `apps/backend/src/modules/payments/stripe.provider.ts` | UNCLEAR | OURS | OURS keeps the Stripe API version pinned to 2024-06-20 (behaviour unchanged). THEIRS removed the pin. Review item: the pin change is a behaviour change, so it is not taken. |
| 69 | `apps/backend/src/modules/quizzes/quiz.routes.ts` | UNCLEAR | MERGED | THEIRS listQuizzesForCourse(courseId, userId, role) signature, which quiz.service (THEIRS) requires. Handlers typed Request<{ courseId }> and Request<{ quizId }>. |
| 70 | `apps/backend/tsconfig.json` | UNCLEAR | OURS | OURS excludes src/tests and *.test.ts from the build. THEIRS removed that exclude. The build passes with OURS. |
| 71 | `apps/frontend/package.json` | UNCLEAR | OURS | Fix 3 keeps the OURS value lint = next lint and the OURS test:browser script. THEIRS lint = eslint src is not taken. |
| 72 | `apps/frontend/src/components/SharedCurriculumPlayer.tsx` | UNCLEAR | OURS | All four conflicts are OURS level-status, progress and de-duplicated fallback UI. THEIRS non-conflicting changes are present. |
| 73 | `apps/frontend/src/lib/curriculum.api.ts` | UNCLEAR | MERGED (clean 3-way) | Result equals OURS. THEIRS changes are already present or were absorbed. Frontend typecheck passes. |
| 74 | `package.json` | UNCLEAR | MERGED | OURS scripts kept. Fix 3 adds test:source from THEIRS (scripts/run-source-verification.mjs). |

## Fixes (brief items 1 to 5)

1. Certificate gate: `enrollment.service.ts` `recalculateCourseProgress` calls `evaluateCertificateEligibility` and sets COMPLETED only when `eligibility.eligible`. `certificate.service.ts` `issueCertificate` checks eligibility. The lesson-progress write keeps OURS behaviour (see the enrollment.service.ts row). Verified by `scripts/test-certificate-eligibility.mjs` (64 checks).
2. Exports: `recalculateCourseProgress` exported; `CertificateJobData` and `EmailJobData` exported; `fetchCourseForManagement` present in `course-detail.api.ts` and calls `/courses/:slug/manage`, which exists in the merged backend. Teacher pages that need drafts now use it.
3. package.json: backend `start:worker` and `dev:worker` present; root `test:source` added. Frontend `lint` keeps the OURS value `next lint`, which the brief asks for.
4. SMTP names added to the root `.env.example`: `SMTP_TLS_MODE`, `SMTP_USER`, `SMTP_PASSWORD` (empty values). No values written. No other `.env.example` file exists in the backend or frontend.
5. `PATCH /assignments/:assignmentId/passing-marks` already present in `assignment.routes.ts` (MERGE-D). The frontend client calls it. Nothing added.

## Post-merge edits outside the 74 files

- `apps/backend/src/modules/assignments/assignment.validators.ts` (manifest file): `createAssignmentSchema.partial()` threw at import ("zod 4 .partial() cannot be used on object schemas containing refinements"), which broke the app and two test files. The object shape is now shared, and each schema applies the passing-marks rule.
- `apps/backend/src/tests/support/academy-fixtures.ts`, `lesson-review.test.ts`, `aca-012-013-assessment-evidence.test.ts`: seeded users now set `isActive` and `isEmailVerified`. THEIRS `authenticate.ts` does a fresh user lookup and rejects unverified accounts, which is the intended security rule. `lesson-review.test.ts` also seeds `student-x` as a verified student, so the 403 role check is still what is tested.
- `apps/backend/src/tests/auth.test.ts` (THEIRS file): self-appointed TEACHER registration asserts 422 instead of 400. The request is still rejected (the role is a STUDENT-only literal), and 422 is the shared validation status.
- Express 5 typing: `req.params` reads in THEIRS code use `param()` or a typed `Request<{ name: string }>` handler, in `course.routes.ts`, `module.routes.ts`, `enrollment.routes.ts`, `payment.routes.ts` and `quiz.routes.ts`. The literal `req.params.x` form the Pass 56 contract scripts assert is kept.
- `apps/frontend/src/app/teacher/courses/[slug]/page.tsx`: "Assessments & grading" link to `/quizzes` restored (Pass 56 contract `test-teacher-grading-workflow.mjs`; not in the P41 base, so not a deliberate OURS removal). Switched to `fetchCourseForManagement`.
- `apps/frontend/src/app/teacher/courses/[slug]/assignments/new/page.tsx`: switched to `fetchCourseForManagement` (required by `test-course-publication-access.mjs`).
- `apps/frontend/src/app/payment/success/page.tsx`: `sessionId ?? ""` in the verify URL (type-only; the guard above already ensures a non-null value). This was the single frontend typecheck error.
- `README.md`, `1-init.sh`: see the table.

## Verification (final, on this tree)

- a. Backend `tsc --noEmit`: exit 0. `npm run build`: exit 0. `npm run typecheck:tests`: exit 0.
- b. Backend vitest against scratch database `lms_merge_test` (Postgres on 127.0.0.1:5432, Redis on port 6399), `--fileParallelism=false`: 21 files passed, 313 tests passed, 1 skipped. The academy suites use the in-memory Prisma double, so they do not write to the database. Migrations applied with `prisma migrate deploy` (all migrations, including the customisation migration `20261102250000`, applied without edits). Before the fixes the run had 75 failures across 10 files.
- c. `scripts/test-*.mjs` (26 scripts): all exit 0. Four were run by name: `test-certificate-eligibility.mjs` (64 checks), `test-assignment-integrity.mjs` (32 checks), `test-migration-readiness.mjs` (8 checks), `test-schema-migration-parity.mjs` (50 models, 50 tables, exact match). `scripts/run-source-verification.mjs`: 26/26 passed. Before the fixes, 7 scripts failed on source-pattern checks.
- d. Frontend `tsc --noEmit`: exit 0 (before the fix, 1 error: `payment/success/page.tsx(27,79)`, string or null). `next build`: exit 0.

## Open items for the main session

1. Lesson progress: THEIRS made `completed` and `watchedSeconds` monotonic. That was not taken, because it contradicts the ACA-014 revert test and the brief. Confirm the revert behaviour is wanted.
2. Stripe: OURS keeps the 2024-06-20 API pin. THEIRS unpinned it. Confirm which Stripe API version is intended before going live.
3. `apps/backend/src/tests` now has verified-user fixtures. Stronger authenticate (fresh lookup) means any new academy test needs `isEmailVerified: true` on its users.
4. Other agent: `schema.prisma`, migration `20261102250000_academy_course_lesson_selection`, `course-selection` module, `academy-course-selection.test.ts`, `teacher/courses/[slug]/lessons/page.tsx`, `course-selection.api.ts` and `PASS42/CUSTOMISE-courses.md` appeared after the backup. They were not edited here. `prisma generate` was run so the client matches the current schema.
5. Logs: `apps/backend/logs/combined.log` and `error.log` changed because the test runs write to them. They are not source files.
6. Not run: the browser suite and the frontend `verify-academy-progress-ui.mjs` script.
