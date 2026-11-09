# Admin lesson preview: runtime verification, 2026-11-09

Status: **blocked. No runtime request was made.** PostgreSQL (localhost:5432) and Redis (localhost:6379) were not listening during the run, and the task forbids starting them. The backend was never started, so no status codes were recorded for any role.

## Code under test

- Base: `origin/main` at `f9cf64e` (`docs: define canonical Skilled main branch and safe mirror synchronization (#39)`).
- Branch: `claude/verify-admin-preview`, created from `origin/main` with no code changes.

## What was done

1. `git fetch origin` and branch creation: done.
2. `pnpm install --frozen-lockfile`: done. `pnpm -C apps/backend exec prisma generate`: done.
3. Test database `lms_preview_test`: not created. `psql` to localhost:5432 returned "Connection refused". `pg_isready` reported no response.
4. `prisma migrate deploy` and the seed: failed with `P1001: Can't reach database server at localhost:5432`.
5. Redis at localhost:6379: `redis-cli ping` returned "Connection refused".
6. Rechecked Postgres after about 60 seconds. Still down.

## Static read of the route (not a runtime result)

- `apps/backend/src/modules/curriculum/curriculum.routes.ts`, around line 178: `GET /api/academy/curriculum/preview/lessons/:lessonId` uses `authenticate`, then `requireRole("ADMIN")`. The handler sets `Cache-Control: private, no-store` and returns the preview with `body` passed through `publicLessonBody`.
- `apps/backend/src/middleware/permission.ts`: `requireRole` returns 401 when there is no `req.user`, and 403 when the role is not in the list. This matches the expected refusals for teacher, learner and unauthenticated, but it has not been exercised.
- `apps/backend/src/modules/curriculum/lesson-preview.service.ts`: `previewLatestRevision` looks up the lesson by `sourceId`, takes the highest `version` revision, writes a `LESSON_REVISION_PREVIEWED` audit log, and returns `preview: true`. It does not change any status.
- Seeded accounts (`apps/backend/prisma/seed.ts`): `admin@skilled.local`, `teacher@skilled.local`, `student@skilled.local`. Password not read.

## Results by request

| # | Role | Request | Status | `preview: true` | Key body fields |
|---|------|---------|--------|-----------------|-----------------|
| 1 | admin | `GET /api/academy/curriculum/preview/lessons/<sourceId>` | not run | not run | not run |
| 2 | teacher | same | not run | not run | not run |
| 3 | learner | same | not run | not run | not run |
| 4 | none | same | not run | not run | not run |
| 5 | learner | learner body route for a draft lesson | not run | n/a | not run |

## Not verified

- All runtime behaviour: status codes, the `preview: true` field, the response body, and the audit row.
- The learner body route refusing a draft lesson (step 4).
- Whether the backend starts with the `.env.example` JWT secrets and the given `CLIENT_URL`/`REDIS_URL`.
- Which `sourceId` exists in seeded data.

## To finish

Start PostgreSQL and Redis, then run the steps in the task brief. The database command is `CREATE DATABASE lms_preview_test OWNER titan;`, followed by `prisma migrate deploy` and the seed with `SEED_CONFIRM_WIPE=1`.
