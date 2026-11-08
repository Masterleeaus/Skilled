# PASS42 level gates

Date: 2026-11-02. Scope: `apps/backend` and `apps/frontend`. No schema or migration changes. No git commits.
Backups (pre-edit copies): `/home/claude/work/levels-pass42-backup/` (see the gap note below).

## Level source (decision for the owner to confirm)

- Level is read per course from `curriculum/levels/<slug>.csv` (43 files, 7,729 rows), compiled to `apps/backend/src/modules/levels/course-level-map.json` by `apps/backend/scripts/build-course-level-map.py`.
- The CSV `level` column is authoritative. It carries overrides (51 rows, for example `appliance / NEW-APP-03`: layer business, level base). Values: base, group, specialised. Specialised covers business and high-risk.
- The lesson `layer` field is not used to decide a level.
- Map-only rows are excluded. A row is map-only when its `reason` mentions the course map (`map` in the text). These are placements the course map makes that the lesson file does not list. 2,257 rows are excluded in total, 33 to 78 per course. The coordinator's rule: these are not part of that course's gate until the course map is confirmed.
- Layer `app` is never gated. No CSV row carries it.
- A lesson with no entry for a course is not gated in that course. Its count is reported as `ungatedLessonCount`.

## Gate rules

- Finished: every gated lesson revision in the level is acknowledged, and every lesson with knowledge checks has a passed attempt on that revision. Practical sign-off is not part of the gate.
- Unlock is a chain: base always open; group needs base finished; specialised needs group and base finished.
- A level with no assigned lessons counts as finished for lesson access (nothing to protect). For the AI workforce it never counts as readable.
- Learner scope: every published course the learner is enrolled in (ACTIVE or COMPLETED). A lesson in several enrolled courses is locked if any of its entries is in a locked level.
- Exempt from the gate: global ADMIN and TEACHER, and any user with an organisation OWNER, MANAGER or ASSESSOR membership.

## Files changed

Backend (new):
- `apps/backend/src/modules/levels/level-rules.ts`: pure rules, the map lookup, a test-only map setter.
- `apps/backend/src/modules/levels/level.service.ts`: loads the learner's lessons and facts, lock checks, exemption, agent filter, `LevelLockedError` (403, `errors: [{code, level, waitingOn}]`).
- `apps/backend/src/modules/levels/course-level-map.json`: generated. Do not hand-edit.
- `apps/backend/scripts/build-course-level-map.py`: generator, run as `python3 -I apps/backend/scripts/build-course-level-map.py curriculum/levels apps/backend/src/modules/levels/course-level-map.json`.
- `apps/backend/src/tests/academy-levels.test.ts`: 22 tests.

Backend (edited):
- `modules/curriculum/completion-report.service.ts`: `courseSlots` exported; slot carries `knowledgeChecks`. No logic change.
- `modules/curriculum/curriculum.routes.ts`: the outline withholds the body of locked lessons and marks them with `levelLock` (listed, not a 403 on the whole list). Gate on completions POST, knowledge-check attempts POST, and the context-presentation POST. New `GET /levels/me` (no learner parameter).
- `modules/curriculum/integration.routes.ts`: auth, scope and identity checks unchanged. After them, `verifiedSkills` is filtered to lessons in finished, unlocked levels.
- `modules/templates/template.routes.ts`: gate on the template lesson GET, draft PUT and submit POST.
- `tests/integration/harness.ts`: fixture course and lesson registered through the test hook. Cleanup now raw-deletes courses and categories, which the soft-delete extension would otherwise keep.

Frontend (new): `apps/frontend/src/components/LevelStatus.tsx`.
Frontend (edited): `apps/frontend/src/lib/curriculum.api.ts` (types, `fetchMyLevels`), `apps/frontend/src/components/SharedCurriculumPlayer.tsx` (level panel, locked label, locked message in place of the body).

## Courses that cannot be fully gated, and why

- **All 43 courses, against the current databases.** Neither scratch database has a CSV lesson ID or a CSV course slug. `lms_trial_seed_test` has 221 lessons with IDs such as `U01-01` and layers Universal, Vertical and Service group. `lms_trial_test` is empty. So the gate matches nothing there today.
- **Every course, for map-only lessons.** 33 to 78 rows per course are excluded until the course map is confirmed.

## Tests and checks

- Backend baseline before changes: 19 files, 265 passed, 1 skipped.
- Backend build (`npm run build`): exit 0, before and after.
- Backend test typecheck (`npm run typecheck:tests`): exit 0.
- `academy-levels.test.ts`: 22 passed.
- Full backend vitest: 20 files, 289 passed, 1 skipped (exit 0). The 6 integration failures seen mid-work were the old ungated behaviour (integration fixtures had no level). They are now fixed in the harness.
- Mutation check (earlier version, unlock chain disabled): 11 of 20 failed, file restored byte-for-byte.
- Frontend `tsc --noEmit`: 10 errors, all in files not touched here (payment, teacher assignments and quizzes). None in the changed files.
- `apps/frontend/scripts/verify-academy-progress-ui.mjs`: 10 of 10 passed.
- Not run: frontend build, browser suite, any real-PostgreSQL run of the level queries. The new tests use the in-memory Prisma double, as the other academy tests do. The scratch PostgreSQL (`lms_trial_test`) was set as `DATABASE_URL` for the run.

## Trial impact

- Today: none. No tester's lessons match a CSV entry in the scratch databases, so no one is blocked by this change.
- Once the curriculum is imported under the CSV IDs: any enrolled learner who has not finished base across their enrolled courses is blocked from group lessons, and any learner who has not finished base and group is blocked from specialised lessons. Those lessons would show their reason. I did not check which trial testers are enrolled, because that data is not in the repo.

## Gap and decisions to review

- `harness.ts` was edited without a prior backup. Its original can be reconstructed by reverting the four edits listed above.
- Integration fixtures register their course and lesson through `setCourseLevelMapForTests` (test-only).
- Trial rows from earlier failed integration runs (prefix `p42-`, 5 courses) were deleted from `lms_trial_test` before the rerun.
- The learner-facing levels endpoint takes no learner parameter. No endpoint lets one learner, or staff, read another learner's levels.
- Practical evidence endpoints are not gated, by design.
