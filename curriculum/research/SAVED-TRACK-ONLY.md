# Saved licence track only for enrolled learners

Owner decision: for an enrolled learner the licence track is the track saved on their enrolment (`enrollment.licenceTrack`). A `?track=` query value must not change what they can read or see. Not-enrolled visitors still get the public course page with the track chooser, where `?track=` only previews.

## Behaviour change

| Endpoint | Caller | Before | After |
| --- | --- | --- | --- |
| `GET /api/courses/:slug` | enrolled learner (ACTIVE or COMPLETED) | `?track=` overrode the saved track | saved track; `?track=` ignored, no 422 |
| `GET /api/courses/:slug` | visitor, not enrolled | `?track=` previews; unknown value 422 | unchanged |
| `GET /api/academy/curriculum/courses/:courseId/outline` | enrolled learner | `?track=` overrode the saved track | saved track; `?track=` ignored, no 422 |
| `GET /api/academy/curriculum/courses/:courseId/lessons/:lessonId/body` | enrolled learner | `?track=licensed` on a non-licensed enrolment returned the licence-required body (200) | saved non-licensed track; the same request gets 403 `LICENCE_TRACK_EXCLUDED` |
| `GET /api/academy/curriculum/courses/:courseId/progress/me` | enrolled learner | `?track=` changed the counts and the lesson list | saved track; `?track=` ignored |
| Any of the above | staff (see decision 2) | `?track=` previewed | unchanged: `?track=` previews, saved track when none is sent |
| `POST /api/academy/curriculum/completions` | learner | already used the saved track | unchanged |
| `GET /api/academy/curriculum/courses/:courseId/licence-tracks` | anyone | fixed non-licensed summary | unchanged |
| `PATCH /api/enrollments/:courseId/licence-track` | learner | saves the track | unchanged |

## Changed files

All paths are relative to `apps/backend/`.

1. `src/modules/curriculum/licence-track.ts`
   - Added `resolveLicenceTrack({ queryTrack, enrolment, staffPreview })`:
     - no enrolment: `requestedLicenceTrack(queryTrack, undefined)` (preview, 422 on an unknown value, default otherwise);
     - enrolled and staff: `requestedLicenceTrack(queryTrack, saved)` (old behaviour kept);
     - enrolled learner: `savedLicenceTrack(saved)`. The query is not read at all.
   - `requestedLicenceTrack` is unchanged in code. It now serves only the no-enrolment and staff paths.
   - Header comment updated to describe the new rule.
   - Not imported from `levels/level.service` to avoid a cycle, since `level.service` already imports this module.

2. `src/modules/courses/course.routes.ts`
   - `GET /:slug` now calls `resolveLicenceTrack`. `isLevelGateExempt` is checked only when an enrolment exists, so public visitors do no extra query.
   - Imports: `resolveLicenceTrack` replaces `requestedLicenceTrack`; `isLevelGateExempt` added from `../levels/level.service`.

3. `src/modules/curriculum/curriculum.routes.ts`
   - Outline, lesson body and progress each call `resolveLicenceTrack`, with `staffPreview` from `isLevelGateExempt`.
   - Body route: the licence check still goes through `assertLicenceTrackAllows(track, ...)`. Because `track` is now the saved track, the existing refusal produces the 403 for `?track=licensed`. No separate branch was needed.
   - Imports: `isLevelGateExempt` added, `resolveLicenceTrack` replaces `requestedLicenceTrack`.

4. `src/tests/academy-licence-track.test.ts`
   - `beforeEach` saves learner-2 on the licensed track (learner-1 stays non-licensed from the fixture).
   - Outline licensed-content test now uses learner-2 with no query.
   - Unknown `?track=` on the outline for an enrolled learner: was 422, now 200 with the saved track.
   - Required-lesson body positive case moved to learner-2 (saved licensed).
   - Progress test: `?track=licensed` for learner-1 keeps 2 lessons; learner-2 with no query gets 3.
   - Outline with the licence file unavailable: learner-1 with `?track=licensed` gets 503 (saved non-licensed); learner-2 gets 200.
   - The public course-page 422 test at the bottom of the file is unchanged.

5. `src/tests/academy-licence-track-saved.test.ts`
   - Replaced "`?track=` overrides the saved track for previewing" (outline) with "does not override".
   - Replaced "`?track=` still overrides on the body" with: a licensed learner with `?track=non-licensed` gets 200. Added the required case: a non-licensed enrolled learner with `?track=licensed` gets 403 `LICENCE_TRACK_EXCLUDED` and no lesson text.
   - Unknown `?track=` on the outline for an enrolled learner: 200, saved track.
   - Staff case: an enrolled org manager keeps the preview (`?track=licensed` gives the licensed list), and gets the saved track when none is sent.
   - Course detail: replaced "`?track=` preview overrides" with "does not override" for enrolled learners. Added: unknown `?track=` on the course page for an enrolled learner gives 200 with the saved track. Added: a visitor with no enrolment previews with `?track=licensed`.

No migration, schema, or frontend file changed.

## Decisions (for review)

1. Enrolled learners: `?track=` is ignored outright, not validated. I removed the 422 for them rather than keeping it, because a 422 on a value the server then ignores would be misleading. The 422 remains on the public course page for visitors and for staff previews.
2. "Staff" means `isLevelGateExempt` in `level.service.ts`: platform ADMIN or TEACHER, or an organisation OWNER, MANAGER or ASSESSOR. This is the codebase's existing staff definition. Staff keep the preview, as they do now. If the owner meant platform roles only, change the `staffPreview` argument in the three curriculum routes and the course route.
3. The course detail still uses enrolment status ACTIVE or COMPLETED, as before. A cancelled enrolment counts as a visitor, which is unchanged.
4. The body route did not need a new refusal. The existing `assertLicenceTrackAllows` fires once `track` is the saved track.

## Test results

Command: `npx vitest run` in `apps/backend`.

- Before the change: 21 files passed, 7 skipped; 386 tests passed, 75 skipped.
- After the change: 21 files passed, 7 skipped; 391 tests passed, 75 skipped (+5 net new tests).
- The two licence-track files alone: 66 tests passed. Before the test edits, 8 failed. Those were exactly the tests that pinned the URL override.

`npx tsc --noEmit`: exit 0. `npx tsc -p tsconfig.test.json --noEmit`: exit 0.

Not run:
- The 7 skipped files and 75 skipped tests need `DATABASE_URL` and `REDIS_URL` pointing at real services. Postgres 16 is installed but not running, Redis is not running, and docker is unavailable. None of the skipped suites reference licence tracks.
- ESLint could not run. The backend has no ESLint flat config file, so `eslint` exits with a configuration error. This is pre-existing and was not changed.

## Follow-up outside this change (frontend, not edited)

- `apps/frontend/src/hooks/useLicenceTrack.ts` still says a `?track=` value "overrides the saved track for previewing". For enrolled learners that is no longer true. A shared link or bookmark with `?track=licensed` on a non-licensed enrolment will show the licensed heading while the server returns the non-licensed outline. The chooser's PATCH keeps normal use consistent. The UI should read the server's `licenceTrack` field, or ignore the URL once enrolled.
