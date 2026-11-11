# PASS42 course lesson customisation

Date: 2026-11-02. Scope: `apps/backend` and `apps/frontend`. No CSV edits, no curriculum edits, no git commits, no memory tools.
Backups before edits: `/home/claude/work/customise-backup/` (`*.orig` files, plus `mine/` copies taken during the revert check).

## What it does

- A course's lesson selection is stored as rows in `academy_course_lesson_selections`, one row per included lesson (`courseId`, `sourceId`, `savedById`, `savedAt`).
- No rows: the course uses its full level CSV (current behaviour).
- Rows present: the level gate counts only the selected lessons. Other lessons in the course are not gated and do not block anything.
- The level of each lesson still comes only from `curriculum/levels/<slug>.csv` through `course-level-map.json`.

## Migration

- Name: `20261102250000_academy_course_lesson_selection` (latest existing folder was `20261102240000_assignment_passing_marks`).
- Additive: one `CREATE TABLE`, one unique index, one plain index, two foreign keys (`courseId` to `courses`, cascade; `savedById` to `users`, restrict).
- Excluded on purpose: the four pre-existing index renames Prisma reports (see `PASS42/SCHEMA-design.md`).
- Scratch database: `lms_customise_test` (created for this work). Existing migrations applied with `prisma migrate deploy`, then this one.
- Drift check: `prisma migrate diff` against the migrated scratch database shows only the four pre-existing renames, both before and after this migration.
- `prisma validate`: valid. `prisma format`: re-aligned existing lines and added the new model only. `prisma generate`: run.

## Decisions for review

1. Who may read or save a selection: platform ADMIN, the course's teacher (`Course.teacherId`), or an organisation OWNER of an organisation with a training assignment for that course. Learners and all other roles get 403. A TEACHER who does not own the course gets 403.
2. "Organisation admin" is read as organisation role OWNER, not MANAGER.
3. An organisation OWNER's override applies to the whole course, so it also changes the gate for learners in other organisations on that course. Review before release.
4. An empty selection is refused (422). Selecting every lesson gives the same result as no selection.
5. The pool is the course's level CSV rows, excluding map-only rows. It includes CSV rows that have no lesson record yet; their title is null.
6. Unknown IDs (including inherited object keys such as `constructor`) are refused with 422 and `code: UNKNOWN_LESSON`. The previous selection is kept.
7. Duplicate IDs are collapsed. Saving replaces the whole selection in one transaction.
8. Outline locks use the same gated entries, so a lesson outside the selection is never shown as locked.

## Files

New:
- `apps/backend/prisma/migrations/20261102250000_academy_course_lesson_selection/migration.sql`
- `apps/backend/src/modules/course-selection/course-selection.service.ts`
- `apps/backend/src/modules/course-selection/course-selection.routes.ts`
- `apps/backend/src/tests/academy-course-selection.test.ts` (15 tests)
- `apps/frontend/src/lib/course-selection.api.ts`
- `apps/frontend/src/app/teacher/courses/[slug]/lessons/page.tsx`

Edited:
- `apps/backend/prisma/schema.prisma` (new model, back-relations on `Course` and `User`)
- `apps/backend/src/modules/levels/level-rules.ts` (`courseLevelEntries`, `isSelectedForGate`)
- `apps/backend/src/modules/levels/level.service.ts` (`loadCourseSelections`, selection filter in `loadLearnerLessons`, outline lock from gated entries)
- `apps/backend/src/tests/academy-levels.test.ts` (5 gate tests; `isEmailVerified: true` on seeded users)
- `apps/backend/src/tests/support/fake-prisma.ts` (`deleteMany`, unique key and default for the new model)

Not edited (outside the allowed list, see open items): `apps/backend/src/app.ts`, the teacher course page, curriculum files, level CSVs, merge files.

## Test results

Targeted (`DATABASE_URL` on `lms_customise_test`):
- `src/tests/academy-levels.test.ts` and `src/tests/academy-course-selection.test.ts`: 42 passed, 0 failed (27 + 15).

Mutation checks (file restored, checksum verified):
- Selection filter disabled (`isSelectedForGate` returns true): 4 gate tests fail.
- Manage-access check disabled: 3 API tests fail (learner, other course's owner, org owner with no assignment).

Full backend suite (`npx vitest run`, scratch database): 21 files, 303 tests: 300 passed, 1 skipped, 2 failed. Failing:
- `src/tests/lesson-review.test.ts`: 2 tests. The same 2 fail with the original sources (checked by temporary revert), so they predate this work.
- `src/tests/auth.test.ts` and `src/tests/health.test.ts` do not load (environment variables missing, process exits). `PASS42/QUALITY-ops.md` records the same failure.
- The first full run also had 3 timing-dependent failures in `aca-012-013-assessment-evidence.test.ts` (2) and `academy-enrolment-progress.test.ts` (1). They passed on the next full run and when run alone, so I attribute them to the integration suites sharing the scratch database.

Builds:
- `npm run build` (backend): exit 0, 0 TypeScript errors.
- `npm run typecheck:tests` (backend): exit 0.
- Frontend `tsc --noEmit`: 1 error, in `src/app/payment/success/page.tsx` (not touched, not imported by new code). None in the new files.
- Frontend `npm run build`: "Compiled successfully" (new page included), then exit 1 at the type-check step on that same payment page error. Earlier records differ: `/home/claude/work/fe-candidate2-build.txt` exited 0, and `/home/claude/work/frontend-build.txt` exited 1 with a different failure (`/_document` not found). The payment page has not changed since the repo import (mtime 10:39), so the type error is a current-state issue outside this work.

## Open items

1. The routes are not mounted. Add one line to `apps/backend/src/app.ts`: `app.use("/api/academy/course-selection", courseSelectionRoutes);` with `import courseSelectionRoutes from "./modules/course-selection/course-selection.routes";`. Not applied because `app.ts` is outside the allowed list and another agent is editing it now (Stripe webhook and trust-proxy changes, 21:50).
2. The course outline, progress and completion report still list lessons outside the selection. Only the gate changes. Confirm whether unselected lessons should also disappear from the course.
3. The teacher course page does not link to the new lessons page. That file is outside the allowed list.
4. In the scratch databases no CSV lesson IDs exist, so the pool shows no titles and the gate matches nothing there.
5. The `authenticate` middleware requires `isEmailVerified`. Several existing test fixtures do not set it, which causes the 401s behind the `lesson-review` failures. This predates this work.
6. `npm run build` rewrote `apps/backend/dist` and `apps/frontend/.next`, and Prisma regenerated the client in `node_modules`.
