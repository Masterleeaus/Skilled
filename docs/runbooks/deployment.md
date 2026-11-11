# SkilledAt.Work — release and rollback runbook

> **Canonical release entrypoint:** [Skilled deployment guide](../DEPLOYMENT.md). This runbook sets release gates; it does not verify provisioned hosts. A separate [historical server checklist](../../curriculum/research/DEPLOY-RUNBOOK.md) is unverified and must not override these gates.

Owner: to be assigned. Status: **documented, not rehearsed**. The staging restore and deploy rehearsal in this runbook has not been performed (register ACA-022). Do not treat any step here as proven until the rehearsal log exists.

Environments: **local** (developer machine, Docker Compose), **staging** (isolated copy of production configuration with non-production data), **production**. Each environment has its own database, Redis, object storage bucket, SMTP account, Stripe keys and JWT secrets. Never share a secret between environments.

## 1. Gates before any deployment

Do not deploy until every gate below is recorded for the exact commit being released.

| Gate | Command or evidence | Blocking when |
|---|---|---|
| Dependency-enabled build | `pnpm install --frozen-lockfile`, then `pnpm build` in each app | Any compile error (register ACA-001 is still open) |
| Prisma schema | `pnpm --filter @skilled/backend prisma:generate` and `prisma validate` | Validation or generation fails (ACA-002) |
| Migrations | Applied to an isolated PostgreSQL copy, with rollback rehearsal | Not rehearsed (ACA-003, ACA-027) |
| Curriculum gate | `pnpm curriculum:ci` | Exit code 1 (structural break, or a regression above the baseline) |
| Academy backend suites | `pnpm test:academy:backend` | Any failing test |
| Lesson player browser suite | `node apps/frontend/tests/browser/academy-browser-suite.mjs` | Any failing test |
| Publication policy | No curriculum draft is marked publishable unless it has a human approval (ACA-008, ACA-026) | Any unapproved publication |

The Academy backend suites and the browser suite use mocks. They do not replace a run against a live API with a real PostgreSQL database.

## 2. Configuration

1. Build the environment file from `.env.production.example` (placeholders only) and the names in [secrets-handling.md](secrets-handling.md). Do not copy `apps/backend/.env.example` or `apps/frontend/.env.example` values into any shared environment; they are placeholders for local development.
2. Set `NODE_ENV=production` for production and staging. Set `CLIENT_URL` to the exact origin of the frontend.
3. `NEXT_PUBLIC_API_URL` is compiled into the frontend bundle. Set it before `next build`; changing it later requires a new build.
4. Confirm that no demo account from `apps/backend/prisma/seed.ts` exists in staging or production.

## 3. Database

Use migration deployment, not development migration. The backend's `prisma:migrate` script runs `prisma migrate dev`, which can reset and create new migrations. It must not be used against a shared database.

```bash
cd apps/backend
DATABASE_URL="<target database from the secret store>" npx prisma migrate deploy
```

Before running it:

1. Take a logical backup (see [recovery.md](recovery.md)) and record its identifier.
2. Confirm the migration list contains no unexpected names. Migrations with the same date prefix must be checked for ordering (ACA-027).
3. Confirm that no curriculum import or publication job is running.

Do not run the curriculum importer (`curriculum:import`) against production until ACA-009 and ACA-010 are closed. It is idempotent by source ID, but it creates canonical content that learners can reach once published.

## 4. Deploy the backend

```bash
cd apps/backend
pnpm build               # tsc to dist/
NODE_ENV=production node dist/server.js
```

Run the backend under a process supervisor with restart on failure. Expose it only behind TLS. Check the health endpoint after start:

```bash
curl -fsS https://<api-host>/api/health
```

Expect a success response. A failure here is a rollback trigger (section 6).

## 5. Deploy the frontend

```bash
cd apps/frontend
NEXT_PUBLIC_API_URL="https://<api-host>/api" pnpm build
NODE_ENV=production pnpm start
```

Smoke test after deploy, as a staging test account:

1. Sign in, then open a shared course lesson. Confirm the pathway loads.
2. Open a manager's lesson configuration page as a test manager. Confirm the page loads and saving a value creates a draft.
3. Confirm that anonymous access to `/api/academy/curriculum/courses/<id>/outline` returns an authentication error.

## 6. Rollback triggers and actions

Roll back when any of these occur within 30 minutes of a deploy:

- The health endpoint fails, or error rates rise after deploy.
- Learners can see unapproved or draft lesson content.
- Integration audit records show unexpected successful access.
- A migration fails midway.

Actions:

1. Stop the new backend and frontend processes.
2. Restart the previous build from its artefact. Keep the previous build artefact until the release is accepted.
3. Prisma migrations have no automatic down step. If a migration must be reversed, follow the recovery runbook; do not hand-edit production tables.
4. Record the rollback, its timing and the trigger in the incident log.

## 7. Post-deploy record

For each deploy, record the commit identifier, the migration names applied, the gate results from section 1, the smoke test outcome, and the operator. Keep this record outside the repository, and link it from the register item that authorised the deploy.
