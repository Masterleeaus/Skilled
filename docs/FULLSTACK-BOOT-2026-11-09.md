# Full-stack boot verification, 2026-11-09

Base commit: `f9cf64e6696b15454d91df6e3f2a2ddaedd3c1ae` (origin/main), branch `claude/verify-fullstack-main`.
No application code was changed. Only this report was added.

## Environment

- Node v22.23.4, pnpm 10.0.0.
- PostgreSQL 16 at localhost:5432 and Redis at localhost:6379, owned by the lead. They were down at first and came up during the run. Neither was started or stopped by this run.
- MinIO not running (expected).
- Test database: `lms_fullstack_test`, owner `titan`.
- `apps/backend/.env` and `apps/frontend/.env.local` were copied from their `.env.example` files for this run. Both are git-ignored. `DATABASE_URL` was set to the titan/lms_fullstack_test database.

## Commands and results

1. `git fetch origin && git checkout -b claude/verify-fullstack-main origin/main` in the worktree. Result: branch created at `f9cf64e`.
2. `pnpm install --frozen-lockfile` in `lms-main/`. Result: success, 676 packages. Warning: build scripts ignored for `msgpackr-extract` and `unrs-resolver`.
3. `pnpm -C apps/backend exec prisma generate`. Result: success.
4. `psql ... CREATE DATABASE lms_fullstack_test OWNER titan;`
   - First attempt (services down): connection refused.
   - Second attempt (services up): `CREATE DATABASE`.
5. `DATABASE_URL=... pnpm -C apps/backend exec prisma migrate deploy`. Result: all migrations applied.
   - An earlier attempt against the down database failed with P1001 and was not a valid run.
6. `SEED_CONFIRM_WIPE=1 pnpm -C apps/backend exec tsx prisma/seed.ts`. Result: seed complete. Accounts: `admin@skilled.local` (ADMIN), `teacher@skilled.local` (TEACHER), `student@skilled.local` (STUDENT). Password `Password123!`.
7. Backend start, first attempt (services down): `pnpm -C apps/backend dev` exited with Prisma P1001 at `src/server.ts:26` and Redis ECONNREFUSED. It did not start.
8. Backend start, second attempt (services up): `pnpm -C apps/backend dev`. Result: running. Logs show "Redis connected", then "MinIO not ready at localhost:9000, retrying bucket setup" warnings, as expected without MinIO.
9. `GET /api/health`. Result: HTTP 503, `{"success":true,"message":"One or more dependencies are down","data":{"checks":{"database":"ok","redis":"ok","storage":"down"},"healthy":false}}`. Database and Redis are ok. Storage is down because MinIO is absent. The 503 is expected in this setup.
10. `POST /api/auth/login` for each demo account (password `Password123!`):
    - admin: HTTP 200, `success: true`, role ADMIN, returns `accessToken`.
    - teacher: HTTP 200, `success: true`, role TEACHER, returns `accessToken`.
    - student: HTTP 200, `success: true`, role STUDENT, returns `accessToken`.
11. `GET /api/auth/me` with each Bearer token: HTTP 200 for all three. Each returns the matching email and role.
12. `GET /api/courses` with each Bearer token: HTTP 200 for all three. Each returns 1 course: `nodejs-masterclass`, "Demo course: Node.js basics".
13. `pnpm -C apps/frontend dev -p 3000`. Result: "Ready in 1483ms" on http://localhost:3000. `GET /login` returned HTTP 200. The `.env.local` used `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.
14. Headless Chromium check (Playwright from the global install, `executablePath=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, `--no-sandbox`):
    - Login page: title "SkilledAt.Work", email field present.
    - Login form submitted as the student. The URL stayed at `/login`, but the course page then showed "Demo Learner" in the header, so the session appears to have been established. This was not separately confirmed.
    - Course page `/courses/nodejs-masterclass?track=non-licensed`: title "SkilledAt.Work". Body contains "Demo course: Node.js basics", "by Demo Teacher · 1 students · 2 lessons", and "2 lessons" in the track list. The lesson count rendered.
15. Servers stopped with `pkill -f "src/server.ts"` and `pkill -f "next dev"`. Confirmed no processes remained.

## Not verified

- MinIO-dependent flows: storage uploads, the video and assignment upload paths, and the `storage: down` health state.
- Stripe, SMTP and email delivery (MailHog was not running).
- Teacher and admin course pages in the browser. Only the student course page was loaded.
- Lesson playback, quizzes, and the learner progress flow.
- The browser login flow was not confirmed to redirect after sign-in. The URL stayed at `/login`.
- Backend and frontend test suites were not run.
- Development only. No production build or production-mode checks.
