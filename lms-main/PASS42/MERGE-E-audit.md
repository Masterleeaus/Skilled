# MERGE-E audit: Titan Academy Pass 56 into OURS

Scope: read-only audit. No file under apps/, scripts/ or curriculum/ was changed. No git commits. No memory tools used.
Checked: OURS = /home/claude/p29m/lms-main, THEIRS = /home/claude/work/pass56/lms-main, manifest = PASS56-CHANGE-MANIFEST.json.
Snapshot time: 2026-11-02 21:45 to 21:46 AEDT. OURS is still changing (schema.prisma mtime 21:44:30, assignment.routes.ts changed between 21:04 and 21:46). Re-run these checks on the final merged tree before sign-off.

Owner column: no written A to D map was found under /home/claude/work. Owners marked "inferred" come from the merge-*-backup folders (merge-A-scripts checks imports and symbols, merge-C-tools parses the Prisma schema, merge-D-backup holds the assignment routes and service). Anything marked "unowned" needs a decision from the main session.

## Premise check (the brief does not match the trees)

- Theirs-only files: 0, not 62. Every one of THEIRS' 2869 paths exists in OURS (comm -23 is empty).
- The four migrations 20261102210000 to 20261102240000 are not theirs-only. All four exist in OURS and are byte-identical to THEIRS. OURS also has 20261102200000_academy_template_pathway_review, which THEIRS lacks.
- The real Pass 56 delta is the manifest: 3 added and 12 modified files. The 3 added files match OURS byte for byte. Of the 12 modified files, 7 match OURS, and 5 differ from OURS: schema.prisma, assignment.routes.ts, assignment.service.ts, assignments/new/page.tsx, teacher/courses/[slug]/page.tsx. Those 5 are the merge conflicts.
- The trees diverge broadly (about 1,000 common files differ). The checks below cover the 15 manifest files, the four migrations, the test scripts, the package.json files, and the compose and env examples.
- False positives discarded: `crypto` and `path` in assignment-upload.service.ts are Node built-ins.

## Check 1: imports and exports of added and modified files

Four findings.

1. apps/frontend/src/app/teacher/courses/[slug]/assignments/page.tsx, lines 7 and 17. Imports `fetchCourseForManagement` from `@/lib/course-detail.api`. OURS course-detail.api.ts does not export it (its exports are fetchCourseBySlug, fetchCourseProgress, markLessonProgress, fetchLessonVideoUrl and types). THEIRS defines it at course-detail.api.ts:37, so the fix is to add it to OURS or switch the page to fetchCourseBySlug. Owner: A (inferred).
2. THEIRS apps/frontend/src/app/teacher/courses/[slug]/page.tsx, lines 8 and 27, and THEIRS apps/frontend/src/app/teacher/courses/[slug]/assignments/new/page.tsx, line 7. Same missing symbol. OURS versions of both files already use fetchCourseBySlug, so this bites only if THEIRS versions are taken. Owner: A (inferred).
3. apps/backend/src/modules/assignments/assignment.service.ts, line 5 (in both trees). Imports `recalculateCourseProgress` from `../enrollment/enrollment.service`. In OURS, enrollment.service.ts:166 declares it as a non-exported `async function`, so the calls at assignment.service.ts:38 and :108 break. THEIRS exports it at enrollment.service.ts:174. Owner: D (inferred).
4. Note only: the added page.tsx also depends on `useRequireAuth`, `Topbar` (title, backHref, backLabel props), `updateAssignmentPassingMarks`, `@tanstack/react-query`, `assertCourseOwnership`, `assertEnrolled`, `prisma` and `AppError`. All resolve in OURS.

## Check 2: migrations 20261102210000 to 20261102240000 against OURS schema and earlier migrations

No blocking findings. Every referenced object exists.

- 20261102210000 (`certificates_studentId_courseId_key` on certificates(studentId, courseId)): table and columns exist in init migration line 266. Matches schema.prisma:464 `@@unique([studentId, courseId])`.
- 20261102220000 (`answers_attemptId_questionId_key`, plus partial index `quiz_attempts_one_active_per_student_quiz_key` on quiz_attempts(studentId, quizId) WHERE status = 'IN_PROGRESS'): columns exist in init migration (lines 184 and 197). The enum value IN_PROGRESS exists (schema.prisma:39). The plain unique index matches schema.prisma:360. The partial index cannot be expressed in Prisma and is absent from the schema by design.
- 20261102230000 (`answers.selected_option_ids` JSONB): matches schema.prisma:355 (`selectedOptionIds Json? @map("selected_option_ids")`).
- 20261102240000 (`assignments.passingMarks` INTEGER plus check constraint `assignments_passing_marks_valid`): table `assignments` exists (init line 209, `totalMarks` present). The column is absent from earlier migrations and present in OURS schema.prisma (Assignment model, currently line 378). No duplicate constraint name.

Notes (not breaks):
- N1. 20261102230000 adds a column that no OURS code writes. quiz.service.ts (submitAttempt, around line 157 to 174) grades only `selectedOptionId`. The migration comment says the API validates multi-select IDs, which OURS does not do. Owner: unowned (feature gap).
- N2. 20261102210000 and 20261102220000 will fail on a populated database with duplicates. Their comments require a preflight. Operational, not a merge defect. Owner: unowned.

## Check 3: test scripts in scripts/

One failing script.

1. scripts/test-certificate-eligibility.mjs (modified in Pass 56, identical in OURS). Fails against OURS at its first source-string assertion, around line 109 of the script ("Worker checks current eligibility"). Against OURS, 4 of its 5 source-string assertions fail:
   - certificate.service.ts: no `const eligibility = await evaluateCertificateEligibility(...)`. THEIRS has it at line 99. OURS has no caller of evaluateCertificateEligibility anywhere.
   - enrollment.service.ts:183 sets `status: isComplete ? "COMPLETED" : "ACTIVE"` using lesson progress only. The asserted `status: eligibility.eligible ? ...` form is absent.
   - enrollment.routes.ts: uses `param(req, "courseId")` at line 47, so the asserted call form is absent.
   - quiz.service.ts: no `await recalculateCourseProgress(studentId, attempt.quiz.courseId)` after submitAttempt.
   Owner: D (inferred). Severity: high, see top findings. THEIRS could not be executed here (no apps/backend/node_modules), but its 5 of 5 string assertions pass against THEIRS.

Passing or unwired:
- scripts/test-assignment-integrity.mjs (added). Passes against OURS: 32 checks, run read-only at 21:45. Not wired to any package.json script in either tree. Owner: unowned.
- scripts/run-source-verification.mjs (modified). Identical in OURS. Its package.json entry is missing (check 4).

## Check 4: package.json scripts expected by THEIRS and missing in OURS

Three missing, one value difference. No package.json was changed.

1. package.json:9 `test:source` ("node scripts/run-source-verification.mjs"). Missing in OURS root. Target file exists. Owner: unowned (root package.json).
2. apps/backend/package.json:10 `start:worker` ("node dist/worker.js"). Missing in OURS. apps/backend/src/worker.ts exists in OURS. Owner: unowned.
3. apps/backend/package.json:11 `dev:worker` ("tsx watch src/worker.ts"). Missing in OURS. Owner: unowned.
4. Value difference, not missing: apps/frontend/package.json:9 `lint`. THEIRS "eslint src", OURS "next lint". Owner: unowned.

OURS-only scripts (curriculum:ci, test:academy:backend, typecheck:tests, test:browser) are not Pass 56 items and were not assessed.

## Check 5: compose files and env examples against env names read by OURS code

No findings in the compose files or example files. All variable names are documented, except the ones listed below.

- docker-compose.local-dev.yml and docker-compose.academy-deps.yml are byte-identical in both trees.
- .env.production.example (root) and apps/frontend/.env.production.example are byte-identical in both trees.
- Read by code and documented in an example or compose file: DATABASE_URL, REDIS_URL, PORT, NODE_ENV, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, CLIENT_URL, NEXT_PUBLIC_API_URL.
- Read by code and documented nowhere, 7 names. These are in OURS scripts and tests, not Pass 56 files. Owner: unowned.
  - ACADEMY_ASSESSMENT_APPROVALS: scripts/validate-assessment-publication.mjs:11, scripts/ci-curriculum-audit.mjs:127
  - ACADEMY_FRONTEND_PORT, ACADEMY_BACKEND_PORT, ACADEMY_DOMAIN: scripts/preflight-server.mjs:8, 9, 10
  - BASE_URL, AXE_CORE_PATH, CHROMIUM_PATH: apps/frontend/tests/browser/academy-browser-suite.mjs:30, 48, 455 (test-only)

## Other findings that do not belong to one team member

- apps/frontend/src/app/teacher/courses/[slug]/quizzes/page.tsx, lines 7 and 14. Imports `fetchCourseForManagement`, which OURS does not export. This predates Pass 56. Owner: unowned, or A if A adds the symbol under check 1.

## Top findings

1. Certification gate missing in OURS. enrollment.service.ts:183 sets COMPLETED from lesson progress alone, and :189 to :190 queue certificate issuance. Nothing in OURS calls evaluateCertificateEligibility, and issueCertificate checks only the COMPLETED status. Unconfigured or failing assessment thresholds therefore do not block certificates. Owner: D (inferred).
2. assignment.service.ts:5 imports a non-exported `recalculateCourseProgress` from enrollment.service.ts:166. Submit and grade paths fail at runtime. Owner: D (inferred).
3. `fetchCourseForManagement` is undefined in OURS. The Pass 56 assignments page imports it (page.tsx:7, :17), and so do the THEIRS teacher pages. Owner: A (inferred).

## Counts

- Check 1: 3 findings (plus 1 note).
- Check 2: 0 breaks (2 notes).
- Check 3: 1 failing script.
- Check 4: 3 missing scripts, 1 value difference.
- Check 5: 7 undocumented env names.
