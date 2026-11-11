# Student course view and player: legacy lessons when the academy outline is empty, 2026-11-08

Issue #9 finding 4 from `docs/E2E-SMOKE-2026-11-08.md`: the learner saw "0 lessons" on the course view and player, while the API lists 2 lessons for the same course.

## Cause

The course view and player read the academy outline (`GET /api/academy/curriculum/courses/:id/outline`). For this course the outline returns `"tracks": []`, because no academy content is published on a fresh database. The UI then showed the academy counts (0) and an empty list. It never fell back to the legacy lessons from `GET /api/courses/:slug`, which the API returns with 2 lessons. On the non-licensed track (the default) the legacy list was hidden on purpose, because it cannot be filtered by licence.

## Fix (frontend only)

When the academy outline has no lesson placements, the course view and player show the legacy lessons. When it has any, nothing changes.

- `components/TrackOutline.tsx`: exports `outlineHasLessons(outline)`.
- `components/SharedCurriculumPlayer.tsx`: renders nothing when the outline has no placements (was: no tracks).
- `components/LicenceTrackChooser.tsx`: optional `countFallback` prop, so the track counts show the legacy total when the academy is empty.
- `app/courses/[slug]/page.tsx`: queries the outline for an enrolled learner on the non-licensed track (same query key as `TrackOutline`, so no extra request). Header count, chooser count and the lesson list use the legacy lessons when the outline is empty. Before enrolment, a zero academy count also uses the legacy lessons.
- `app/student/courses/[slug]/page.tsx`: same outline check. The sidebar shows the legacy lessons when the outline is empty, and progress falls back to the legacy progress.

The backend is unchanged. `smoke-e2e.mjs` is unchanged: its S06 step asserts the API lesson count, and the UI check was done with a separate Playwright script.

## Before and after

Seeded database (`lms_s1`, fresh seed), student `student@skilled.local` enrolled in `nodejs-masterclass`, Chromium at `/opt/pw-browsers/chromium` with `--no-sandbox`. The API returns "Getting Started: Welcome to the demo course | Demo setup notes".

| Page | Before | After |
| --- | --- | --- |
| Course view `/courses/nodejs-masterclass` | "0 lessons" (3 places), "No lessons are listed on this track yet." | "2 lessons" (3 places), both lessons listed |
| Player `/student/courses/nodejs-masterclass` | "0 lessons" (chooser, 2 places), sidebar empty, "Select a lesson from the sidebar to begin." | "2 lessons" (chooser, 2 places), both lessons in the sidebar |
| Outline API (unchanged) | `tracks: []` | `tracks: []` |

The before run was made on the unchanged code and the after run on the fix, with the same database and login.

Titles in the smoke report (`Welcome to the course`, `Setting up your environment`) came from an older database. The fresh seed gives `Welcome to the demo course` and `Demo setup notes`.

## Verification

- `pnpm -C apps/frontend exec tsc --noEmit`: exit 0.
- `pnpm -C apps/frontend lint` (max-warnings 0): exit 0.
- `pnpm -C apps/frontend exec next build`: exit 0.
- Browser check (Playwright, real login form, no mocks): counts and lesson titles as in the table above.

Not run: backend checks and backend vitest, because no backend file changed. The frontend has no unit test suite (only the `test:browser` script, which was not run).
