# PASS42 gate IDs

Date: 2026-11-02. Scope: matching level-file lesson IDs to database lessons for the level gate, and the organisation scope of the gate's selection. Scratch copy only for verification. No schema or migration change. No edits to the level CSVs, the course map, the course selection module or routes, or the lesson files. No git commit. No memory tool used. `lms` and `lms_trial` were only read, never written.

## Current state of `lms_trial` (read at 23:03; changed by another process during this work)

My first read (before the organisation change) found 236 lessons, one course, and no selection table. The database has since changed:
- 858 lessons (all CSV lesson IDs), 236 with a published revision.
- Courses: `commercial` (a CSV slug, published), `titan-academy-trial-course-mvz74vi9` (published), `d2-check-track-only-course` (unpublished).
- Table `academy_course_lesson_selections` exists, but migration `20261102260000_academy_course_lesson_organisation_scope` is not applied (19 migrations applied). The column `organisationId` is missing, so the gate's selection query fails. Read-only run of `getLearnerLevelView` for the trial learner: `Invalid prisma.academyCourseLessonSelection.findMany()` at `course-selection.service.ts:118`.
- Owner action: apply the pending migration to `lms_trial`. Not done here.

## 1. Mapping

- Every lesson in `lms_trial` has a `sourceId` equal to a CSV `lesson_id` string: 858 of 858 at 23:03 (no translation). CSV unique `lesson_id` values: 858.
- Earlier snapshot (before the database changed): 236 of 236 trial lessons matched; 622 CSV IDs were unmatched. Each had a canonical lesson file but was missing from the import manifest the trial loader used. That snapshot is superseded by the current count.
- Scratch seed `lms_trial_seed_test` (not the trial database): 221 `BRIEF` IDs such as `G0101-01`, none in the CSVs. `curriculum/planning/BRIEF-DRAFT-RECONCILIATION.csv` has no confirmed matches (three POSSIBLE rows, marked not counted). No translation added; those lessons stay ungated.

## 2. Map-only rows: the level CSVs changed

- `LEVEL-gates.md` says 2,257 rows are map-only and excluded. The current CSVs have no map-only rows (no `reason` mentions the course map).
- The copy at `/home/claude/work/merge-fix-backup/lms-main/curriculum/levels/` has 8,549 rows, 3,077 map-only. Current files have 5,472 rows; the 3,077 rows are absent and no other row changed.
- `course-level-map.json` matches a fresh regeneration exactly (5,472 entries).
- Effect: the gate covers all 5,472 placements. This reverses the owner decision in `LEVEL-gates.md`. Owner decision needed; CSVs not edited.

## 3. Organisation scope of the gate (new, this change)

- Problem: `loadCourseSelections` read selections by course only, so an organisation's selection applied to every learner's gate.
- Fix: `level.service.ts` no longer has `loadCourseSelections`. `loadLearnerLessons` calls `loadSavedSelection(courseId, learnerId)` from the course selection module, for each enrolled course. That resolves the learner's organisation from their earliest training assignment for the course, uses its own rows if any, else the course-wide default (`organisationId` null), else the full level map.
- The gate and the course selection module now use the same rule, so they agree on which lessons count.
- Tests added in `apps/backend/src/tests/academy-levels.test.ts` (block "course lesson selection is scoped to each organisation"):
  - organisation A's selection does not change organisation B's gate (B sees the full map);
  - the course-wide default applies to an organisation with no selection, and to a learner with no assignment;
  - an organisation's own selection overrides the default for its learners only.

## 4. Per-course verification (scratch copy)

- Copy `lms_gateid_test` is made from `lms_trial` by `run-verify.sh` on each run, then migrations are applied with `prisma migrate deploy` (includes `20261102250000` and `20261102260000`). Any course in the copy that already uses a fixture slug is renamed in the copy only.
- For each of the 43 CSV slugs: one published course with that exact slug, one published track of the trial's published lessons the map places in that course, one ACTIVE learner with no organisation assignment. The fixture course is new, so no selection row can apply to it and the full level map applies.
- Checks use the real `getLearnerLevelView` and `lockForLesson`.
- Result: 43 of 43 courses, 231 checks, 231 passed, 0 failed.
- Control from the earlier run: fixtures with a non-CSV slug were not gated and the group and specialised checks failed. Slug corrected.
- Limits: service-level, not HTTP. The organisation-scope behaviour is tested in the unit suite, not in the per-course run.

Checks per kind:
- every placed lesson is gated in this course (slug matches the CSV): 43
- base lessons open to a new learner: 43
- base finished on the pinned revisions: 43
- group lessons locked while base unfinished: 21
- specialised locked to a new learner: 13
- group still locked with one base lesson open: 21
- finishing base unlocks group lessons: 21
- specialised waits for group after base: 9
- finishing group unlocks specialised: 13
- specialised opens after base when no group lessons: 4

| Course slug | Published lessons in map | Base | Group | Specialised | Checks | Result |
|---|---|---|---|---|---|---|
| appliance | 17 | 17 | 0 | 0 | 3 | pass |
| aquarium | 17 | 17 | 0 | 0 | 3 | pass |
| beauty | 17 | 17 | 0 | 0 | 3 | pass |
| bond | 46 | 23 | 20 | 3 | 9 | pass |
| cardetail | 26 | 18 | 0 | 8 | 6 | pass |
| carpet | 25 | 23 | 2 | 0 | 6 | pass |
| commercial | 76 | 24 | 24 | 28 | 9 | pass |
| construction | 31 | 23 | 8 | 0 | 6 | pass |
| deck | 18 | 17 | 1 | 0 | 6 | pass |
| dogwalk | 17 | 17 | 0 | 0 | 3 | pass |
| flatpack | 17 | 17 | 0 | 0 | 3 | pass |
| furniture | 17 | 17 | 0 | 0 | 3 | pass |
| garden | 35 | 20 | 12 | 3 | 9 | pass |
| groom | 17 | 17 | 0 | 0 | 3 | pass |
| hair | 17 | 17 | 0 | 0 | 3 | pass |
| handyman | 32 | 19 | 10 | 3 | 9 | pass |
| hardfloor | 26 | 23 | 3 | 0 | 6 | pass |
| healthcare | 34 | 23 | 0 | 11 | 6 | pass |
| irrigation | 21 | 17 | 4 | 0 | 6 | pass |
| landscaping | 21 | 17 | 4 | 0 | 6 | pass |
| lawn | 21 | 17 | 4 | 0 | 6 | pass |
| locksmith | 17 | 17 | 0 | 0 | 3 | pass |
| massage | 17 | 17 | 0 | 0 | 3 | pass |
| medequip | 23 | 17 | 0 | 6 | 6 | pass |
| painting | 18 | 17 | 1 | 0 | 6 | pass |
| petsit | 17 | 17 | 0 | 0 | 3 | pass |
| plastering | 18 | 17 | 1 | 0 | 6 | pass |
| pond | 17 | 17 | 0 | 0 | 3 | pass |
| pool | 22 | 17 | 0 | 5 | 6 | pass |
| portfolio | 17 | 17 | 0 | 0 | 3 | pass |
| postcon | 32 | 23 | 9 | 0 | 6 | pass |
| pressure | 27 | 18 | 3 | 6 | 9 | pass |
| pt | 17 | 17 | 0 | 0 | 3 | pass |
| residential | 54 | 23 | 30 | 1 | 9 | pass |
| roof | 26 | 17 | 5 | 4 | 9 | pass |
| shortstay | 46 | 23 | 20 | 3 | 9 | pass |
| solar | 62 | 57 | 5 | 0 | 6 | pass |
| stone | 17 | 17 | 0 | 0 | 3 | pass |
| strata | 32 | 24 | 8 | 0 | 6 | pass |
| tiling | 17 | 17 | 0 | 0 | 3 | pass |
| timber | 17 | 17 | 0 | 0 | 3 | pass |
| window | 58 | 50 | 5 | 3 | 9 | pass |
| yoga | 17 | 17 | 0 | 0 | 3 | pass |

## 5. Tests and checks

- `academy-levels.test.ts`, `academy-level-ids.test.ts`, `academy-course-selection.test.ts`: 56 passed.
- `npm run build` (backend): exit 0.
- `npm run typecheck:tests`: exit 0.

## 6. Decisions for review

1. Owner: apply migration `20261102260000` to `lms_trial` (`prisma migrate deploy`). Until then, lesson access for enrolled learners fails.
2. Map-only rows: 3,077 rows are no longer in the CSVs, so the gate covers all 5,472 placements. Restore the rows or accept.
3. `commercial` is now a published CSV course in `lms_trial` with an enrolled tester. Its gate will apply once the migration is applied. Confirm that is intended.
4. The gate uses the learner's earliest training assignment to find their organisation, the same rule as the course selection module. A learner in two organisations is treated by that rule.
5. Seed `BRIEF` IDs: confirm the three POSSIBLE rows, or leave ungated.

## Files

- Changed: `apps/backend/src/modules/levels/level.service.ts` (course-only loader replaced); `apps/backend/src/tests/academy-levels.test.ts` (organisation tests; earlier comment and test name); `apps/backend/src/tests/academy-level-ids.test.ts` (new, 4 tests).
- Not changed: level rules, `course-level-map.json`, CSVs, course selection module and routes, schema, migrations, `lms` and `lms_trial`.
- Backups: `/home/claude/work/gateid-backup/` (first backup), `/home/claude/work/gateid-backup/org-scope/` (level service and level test before this change).
- Scratch: `lms_gateid_test` (recreated on each run). Scripts: `/home/claude/work/gateid/` (`run-verify.sh` reads the password from the environment).
