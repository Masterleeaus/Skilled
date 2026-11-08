# PROGRESS-route: learner course progress endpoint and UI

Date: 2026-11-02. Scope: `/home/claude/p29m/lms-main/apps`. No Prisma schema or migration edits. No git commit.
Backups of edited files (pre-change copies): `/home/claude/work/progress-route-backup/` (curriculum.routes.ts, completion-report.service.ts, curriculum.api.ts, SharedCurriculumPlayer.tsx).

## Result

| Check | Before this change | After this change |
|---|---|---|
| `node scripts/verify-academy-progress-ui.mjs` | FAIL (first check, no backend route) | PASS, 10 source-contract assertions passed, exit 0 |
| Other verify scripts (business-context, manager-context, template-lesson) | PASS | PASS (exit 0) |
| Backend build (`npm run build`) | PASS | PASS, exit 0 |
| Backend typecheck of tests (`npm run typecheck:tests`) | PASS | PASS, exit 0 |
| Backend vitest (`npx vitest run`) | 18 files, 257 passed, 1 skipped (258) | 19 files, 265 passed, 1 skipped (266) |
| Targeted: `academy-course-progress.test.ts` + `academy-completion-report.test.ts` | n/a | 2 files, 26 passed |
| `node src/tests/pass22-inactive-identity.test.cjs` | PASS (11 checks) | PASS (11 checks) |
| Frontend typecheck (`tsc --noEmit`) | PASS | PASS, exit 0 |
| Frontend build (`npm run build`) | PASS | PASS, exit 0 |
| Browser suite (`tests/browser/academy-browser-suite.mjs`) | 11 passed | 11 passed, 0 failed, 11 total |

Backend environment for vitest matched the PASS42 trial (`DATABASE_URL` to `lms_trial_test`, `REDIS_URL` port 6399, JWT and MinIO test values). The academy tests use the in-memory Prisma double and do not touch the database.

## Behaviour

`GET /api/academy/curriculum/courses/:courseId/progress/me` (authenticated):
- Refuses a learner with no enrolment, or a `CANCELLED` enrolment, with 403. Uses `assertEnrolled` from `enrollment.service.ts`, so the rule is the existing one.
- Returns `courseId`, `lessonCount`, `completedCount`, `completionPercent`, `required {total, completed}`, `optional {total, completed}`, and `lessons[]` with `lessonId`, `revisionId`, `sourceId`, `title`, `required`, `completed`, `completedAt`.
- Lesson slots come from the existing `courseSlots` in `completion-report.service.ts`: published revisions only, one entry per lesson revision across tracks, required if any required path reaches it. The new `buildCourseLessonProgress` reuses it; no second calculation was written.

Frontend:
- `fetchAcademyCourseProgress` in `curriculum.api.ts` validates the response shape. A malformed body is an error, so the player falls back to outline counts.
- `SharedCurriculumPlayer.tsx` loads progress in a non-blocking query. The header shows server totals when available, plus a required/optional line. If progress fails, a `role="status"` note appears and the counts come from the outline, de-duplicated by lesson revision.
- The acknowledgement mutation invalidates the progress query. The completed state is announced to screen readers via visually hidden text. The copy states that acknowledgements do not certify practical competency.

## Tests added

`apps/backend/src/tests/academy-course-progress.test.ts` (8 tests):
1. Enrolled learner who has not started: 0 of 2, 0%, required 0/1, optional 0/1.
2. Partly completed (required lesson done): 1 of 2, 50%, required 1/1, optional 0/1, per-lesson state correct.
3. All lessons acknowledged: 100%.
4. Lesson reached through two tracks counted once, and still required.
5. Learner with no enrolment: 403, no data returned.
6. Cancelled enrolment: 403.
7. Unauthenticated: 401.
8. Learner sees only their own acknowledgements.

## Decisions for review

1. Scope: `verify-academy-progress-ui.mjs` hard-codes `curriculum.routes.ts` and `SharedCurriculumPlayer.tsx`. Both were edited, although the brief listed only progress/enrolment code and the course page. The calculation lives in the curriculum module, which the brief also allows.
2. Enrolment rule: `assertEnrolled` (non-`CANCELLED`), not the outline's `ACTIVE`-only check, so a learner with a `COMPLETED` enrolment can still see progress. The outline route still requires `ACTIVE`; that inconsistency predates this change and was not changed.
3. `completionPercent` is over all unique published lessons (required and optional together). The required percentage is in `required`. The completion report's `requiredPercent` is unchanged.
4. Only published revisions count, matching the outline.
5. Browser suite: the suite does not mock the progress route, so its default mock response (`[]`) exercises the fallback path. The success path is covered by the backend test only.

## Files changed

- `apps/backend/src/modules/curriculum/curriculum.routes.ts` (route and two imports)
- `apps/backend/src/modules/curriculum/completion-report.service.ts` (`buildCourseLessonProgress`)
- `apps/backend/src/tests/academy-course-progress.test.ts` (new)
- `apps/frontend/src/lib/curriculum.api.ts` (`AcademyCourseProgress`, `fetchAcademyCourseProgress`)
- `apps/frontend/src/components/SharedCurriculumPlayer.tsx` (progress query, counts, header, sr-only state)
- Build artifacts regenerated: `apps/backend/dist/`, `apps/frontend/.next/`
