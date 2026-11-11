# Admin lesson preview: runtime verification, 2026-11-09

Status: **verified against a running backend.** Every expectation held.

Code under test: `origin/main` at `f9cf64e`, with no code changes on `claude/verify-admin-preview`.

## Setup

- `pnpm install --frozen-lockfile` and `prisma generate`: done.
- Test database `lms_preview_test` (owner `titan`): created. `prisma migrate deploy` applied all migrations.
- Seed: `SEED_CONFIRM_WIPE=1 pnpm -C apps/backend exec tsx prisma/seed.ts` created the three accounts. It creates no academy lessons, by design.
- Curriculum: `pnpm -C apps/backend curriculum:import` created 221 `AcademyContentLesson` rows, each with one `DRAFT` revision (`sourceVersion` `draft-1`). The test lesson is `U01-01`.
- Backend: `apps/backend`, `tsx src/server.ts`, with `NODE_ENV=development`, `CLIENT_URL=http://localhost:3000`, `REDIS_URL=redis://localhost:6379`, the `.env.example` JWT secrets, and `DATABASE_URL` pointing at `lms_preview_test`.

## Deviations from the brief

- **Port 5071, not 5000.** Port 5000 was held by another session's backend (`agent-a99c383…`). `pkill -f "src/server.ts"` would also have killed that process, so I did not use it. I stopped only my own PIDs.
- **Health returns 503.** `/api/health` reports `storage: down` because MinIO is not available. Database and Redis report `ok`. This does not affect the preview route.

## Requests and results

Lesson: `U01-01`. Course for the learner check: `cmw8je99r00057dg3wtx823vz` (published, learner enrolment `ACTIVE`).

| Role | Request | Status | `preview: true` | Key body fields |
|---|---|---|---|---|
| admin (`admin@skilled.local`) | `GET /api/academy/curriculum/preview/lessons/U01-01` | **200** | yes | `lesson.sourceId` = `U01-01`; `revision.status` = `DRAFT`, `version` = 1; `review.approved` = false; `review.publicationGateAllows` = false; `body` present; `Cache-Control: private, no-store` |
| teacher (`teacher@skilled.local`) | same | **403** `Forbidden` | no | no body |
| learner (`student@skilled.local`) | same | **403** `Forbidden` | no | no body |
| unauthenticated | same, no token | **401** `Invalid or expired token` | no | no body |
| learner | `GET /api/academy/curriculum/courses/<courseId>/lessons/U01-01/body` | **404** `Lesson not found` | n/a | no body |

Other checks:

- The admin preview wrote one audit row: `LESSON_REVISION_PREVIEWED`, with `userId` = the admin's id and `entityId` = the latest revision id.
- No answer-key fields (`answer`, `correctAnswer`, `answerKey`) appeared in any response body.
- Admin preview of a missing id (`NOPE-99`) returned **404**, message `Lesson not found not found`. The doubled "not found" is a cosmetic issue in the error text, not a status problem.

## Not verified

- The learner body route returns 404 for the draft lesson, not 403. The learner check passes because the draft is not served, but the status is 404, which comes from the lesson lookup. I did not check whether a published lesson is served to the learner, which would be the positive control.
- Teacher and learner preview were checked only with the seeded accounts. Other roles, such as a learner with a different enrolment, were not tested.
- Storage-dependent routes (MinIO) were not exercised.
- The backend was stopped with SIGTERM after the checks. Its shutdown behaviour was not checked.
