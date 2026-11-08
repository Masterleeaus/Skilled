# PASS42 course lesson customisation: fix pass

Date: 2026-11-02. Scope: `apps/backend` (course-selection, outline and progress, tests). No git commits, no memory tools, no secrets in files, no lesson, course-map, level-file, trial-content, frontend type, gate service or gate loader edits.
Backups before edits: `/home/claude/work/customise-fix-backup/` (originals of every edited file, same relative paths).

## Status of open items

1. Outline and progress list only the selected lessons: DONE.
   - `course-selection.service.ts`: new `loadSavedSelection(courseId)` returns the saved sourceId set, or `undefined` when no rows exist.
   - `curriculum.routes.ts` (`GET /courses/:courseId/outline`): placements filtered to the selection when one exists.
   - `completion-report.service.ts` (`buildCourseLessonProgress`, used by `GET /courses/:courseId/progress/me`): slots filtered to the selection when one exists.
   - `courseSlots` and the completion report (`buildLearnerCompletionReport`, organisation reports) are unchanged. See "Not closed" below.

2. Organisation scope: NOT DONE. Blocked by schema.
   - `academy_course_lesson_selections` has `courseId`, `sourceId`, `savedById`, `savedAt` and no `organisationId`. The unique key is `(courseId, sourceId)`.
   - Every read and write path is course-wide: `getCoursePool`, `getCourseSelection`, `saveCourseSelection`, `loadCourseSelections` (gate loader, not editable here) and `loadSavedSelection`.
   - Write path: `assertCanManageSelection` lets an OWNER of any organisation with an assignment for the course save the course-wide selection. This affects other organisations on the same course, which conflicts with owner decision 3 as it stands.
   - Fixing it needs a migration (add `organisationId` to the model, change the unique key, backfill). The rules say to stop and report a migration, so no schema or migration change was made.
   - Decision for review (default applied): none taken. The current cross-organisation write is left in place and flagged.

3. Mount and base path: CONFIRMED, no change needed.
   - `apps/backend/src/app.ts` line 30 imports `courseSelectionRoutes`; line 70 mounts `app.use("/api/academy/course-selection", courseSelectionRoutes);`.
   - Frontend `apps/frontend/src/lib/api-client.ts` sets `baseURL` to `NEXT_PUBLIC_API_URL ?? "/api"`. `frontend/.env.production.example` sets `NEXT_PUBLIC_API_URL=/api`.
   - `course-selection.api.ts` calls `/academy/course-selection/courses/:courseId/...`, so the full path is `/api/academy/course-selection/courses/:courseId/...`, which matches the mount.

4. HTTP tests: DONE.
   - New file `apps/backend/src/tests/academy-course-selection-http.test.ts`, 20 tests. It imports the real `app`, so the `app.ts` mount is exercised.
   - Covers lesson-pool, lesson-selection GET and PUT for: course owner (TEACHER), platform ADMIN, a TEACHER who does not own the course, a learner (enrolled and assigned), an OWNER of another organisation (course not assigned to it), an OWNER of the assigned organisation (allowed), unauthenticated, unknown course (404).
   - Unknown lesson ID (422, `UNKNOWN_LESSON`, previous selection kept). A lesson in the database but outside this course's pool (422).
   - Outline and progress over HTTP: full list with no selection; only selected lessons after a save; completion percent counts only selected lessons; the outline changes when the selection changes.
   - Mutation check: with the original outline and progress files restored, 3 of the 20 new tests fail. The edited files were then restored (checksums verified).

## Test results

Environment: all suites run on the in-memory Prisma double. No real database was connected. `DATABASE_URL` was set to `postgresql://lms_test@localhost:5432/lms_customise_test` (no password) for the process only. No migration was applied in this pass.

- Full backend vitest run: 15 files passed. Tests: 259 passed, 0 failed, 64 skipped (323 total).
- Related suites: `academy-course-selection-http.test.ts` 20 passed. `academy-course-selection.test.ts` 15 passed. `academy-course-progress.test.ts`, `academy-completion-report.test.ts`, `academy-enrolment-progress.test.ts` passed. `academy-levels.test.ts` 27 passed (after one assertion change, below).

Suites that could not run (7 files):
- `src/tests/auth.test.ts` and `src/tests/health.test.ts`: fail on `src/config/env.ts` (required environment variables missing). Same as `PASS42/QUALITY-ops.md`.
- `src/tests/integration/contract.test.ts`, `credential-lifecycle.test.ts`, `cross-tenant.test.ts`, `identity-linking.test.ts`, `learner-status.test.ts`: need a live PostgreSQL connection (`createFixtures` in `integration/harness.ts`). No database password is available, so they fail at fixture creation. 64 tests in these files were skipped by the harness.

Builds:
- `npm run build` (backend, `tsc`): exit 0. Log: `/home/claude/work/customise-fix-build.txt`.
- `npm run typecheck:tests` (`tsc -p tsconfig.test.json`): exit 0. Log: `/home/claude/work/customise-fix-typecheck.txt`.

## Test change outside the new file (review)

`apps/backend/src/tests/academy-levels.test.ts`, test "does not block a deselected lesson...":
- Old assertion expected the deselected `LVL-group1` to appear in the outline with `levelLock` null. That is the behaviour open item 1 removes, so the test failed after the outline change.
- New assertion: `LVL-group1` is not in the outline. The acknowledgement still returns 200, and the selected specialised lesson is still locked.
- Gate service and loader were not touched. This file belongs to the gate suite, so it is listed here for the gate owner to review.

## Files changed

- `apps/backend/src/modules/course-selection/course-selection.service.ts` (added `loadSavedSelection`)
- `apps/backend/src/modules/curriculum/curriculum.routes.ts` (outline filter and import)
- `apps/backend/src/modules/curriculum/completion-report.service.ts` (progress filter and import)
- `apps/backend/src/tests/academy-levels.test.ts` (one outline assertion)
- `apps/backend/src/tests/academy-course-selection-http.test.ts` (new)
- `PASS42/CUSTOMISE-fix.md` (this file)

Unchanged and checked: `apps/backend/src/app.ts`, `course-selection.routes.ts`, `apps/frontend/src/lib/course-selection.api.ts`, schema, migrations.

## Decisions for review

1. With a saved selection, outline and progress hide any track lesson that is not in the selection. The selection can only contain lessons from the level CSV pool, so a track lesson outside that pool is also hidden. With no selection the full list stays.
2. The completion report (`buildLearnerCompletionReport` and the organisation roll-up) still uses `courseSlots` unchanged, so it still lists unselected lessons. The open item named only the outline and progress. Change this if the completion report should follow the selection too.
3. Open item 2 is blocked. The cross-organisation write (any organisation owner can change the course-wide selection) remains, and it conflicts with owner decision 3. The owner should decide whether to disable the organisation owner path until the migration lands, or to accept it temporarily.

## Not closed

- Item 2 (organisation scope): needs a migration. Stopped as the rules require.
- Gate loader `loadCourseSelections` is course-wide and not organisation-scoped. It belongs to the gate agent.
