# Titan Academy LMS: installation guide

This guide lists the steps to install the Titan Academy backend (`apps/backend`) and frontend (`apps/frontend`) on a server. Each command is taken from a script or package file in this repository, or from `curriculum/research/DEPLOY-RUNBOOK.md`. Where the repository does not confirm a step, this guide says so.

Related documents:
- `curriculum/research/DEPLOY-RUNBOOK.md`: server checklist, including PostgreSQL 16 setup on port 5433 and the health and lesson checks.
- `docs/runbooks/deployment.md`: release gates, rollback triggers and post-deploy record.
- `docs/runbooks/secrets-handling.md`: which variables are secrets and how to rotate them.
- `docs/runbooks/recovery.md`: backup and restore, required before migrations.
- `.env.production.example`: every variable the code reads, with placeholders.

Placeholders in angle brackets (for example `<set-in-secret-store>`) are values you supply. Do not paste a real value into this file, a commit, a ticket or a chat.

## 1. Requirements

| Item | Requirement | Source |
|---|---|---|
| Node.js | 20 or later | root `package.json` `engines` |
| pnpm | 10.0.0 | root `package.json` `packageManager` |
| PostgreSQL | 16, on a dedicated Academy instance | `DEPLOY-RUNBOOK.md` section 1 |
| Redis | Required. Version not confirmed; the compose candidate uses 7.4 | `DEPLOY-RUNBOOK.md` section 2 |
| Object storage | MinIO or S3-compatible, with a bucket | `apps/backend/src/config/minio.ts` |
| SMTP | Required for account emails | `apps/backend/src/jobs/email.worker.ts` |

Node 22 and pnpm 10.0.0 are what the repository's verification evidence used (`DEPLOY-RUNBOOK.md` section 3). Node 20 is the minimum the repository declares.

Do not use `docker-compose.local-dev.yml` on a server. It publishes port 5432 and uses development credentials (`DEPLOY-RUNBOOK.md` section 0).

## 2. Get the code and install dependencies

Run from the repository root:

```bash
pnpm install --frozen-lockfile
```

`--frozen-lockfile` stops the install if it would change `pnpm-lock.yaml`. Do not run the legacy scripts. They are kept as `docs/legacy-bootstrap/1-init.stub.sh` and `docs/legacy-bootstrap/2-setup.stub.sh`, and both exit with an error on purpose.

## 3. Configure the environment

1. Copy `.env.production.example` to a private file that only the service user can read. The runbook suggests `/home/admin/apps/academy/.env` with mode `0600`. That path is not confirmed as the chosen location.
2. Replace every placeholder with a value from your secret store. Use separate values for each environment. Never reuse Field or Desk values.
3. Do not commit the filled-in file.

The backend reads the environment at start. `apps/backend/src/config/env.ts` validates the core variables. If a required value is missing or invalid, it prints the field errors and exits with code 1. Check the start-up output first.

### Production checks in `env.ts`

When `NODE_ENV=production`, startup is refused unless:
- `DATABASE_URL` points to a database and role both named exactly `titan_academy`.
- `CLIENT_URL` starts with `https://`.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are each at least 32 characters and differ from each other.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are both set, or both empty.
- `SMTP_TLS_MODE` is `starttls` or `implicit`, not `none`.

`SMTP_USER` and `SMTP_PASSWORD` must be set together or both left empty, in every mode.

### Fail-closed variables

These variables refuse access when they are unset or invalid. They do not fall back to a permissive setting.

**`INTEGRATION_SERVICE_SCOPES`.** The integration routes (`apps/backend/src/modules/curriculum/integration.routes.ts`) read it on each request. It must be JSON with both keys, `field-services` and `ai-workforce`, each an array of external company references:

```
{"field-services":["<ref>"],"ai-workforce":["<ref>"]}
```

- An empty array allows nothing for that caller.
- If the variable is unset, is not valid JSON, is not an object, or lacks either key, every integration call returns 401.
- A service credential works only for a company reference in its own caller's list.

**`ACADEMY_PUBLICATION_GATE`.** The default is on. It is off only when the value is `off`, `false` or `0` (case-insensitive). Unset, empty or any other value keeps the gate on (`lesson-review.service.ts`, `publicationGateEnabled`). Leave it unset in production. With the gate on, a lesson revision is published only when an approving review exists for its current content hash.

## 4. Set up PostgreSQL and Redis

Follow `DEPLOY-RUNBOOK.md` sections 1 and 2. Summary:

- Use a PostgreSQL 16 cluster separate from any other application's database. The runbook uses port 5433 on loopback. The initdb and service commands are not in the repository, so use the owner's recorded setup.
- Create the role and database `titan_academy` (the runbook shows the SQL). Do not change any existing role.
- Run Redis for the Academy only, bound to loopback, with a password and append-only persistence.

Check the database target before any Prisma command. The guard reads `DATABASE_URL` from the process environment, not from `.env`, so export it first:

```bash
cd <REPO_ROOT>
export DATABASE_URL="<set-in-secret-store>"
node scripts/check-academy-database-target.mjs
```

It makes no connection. It reports `BLOCKED` unless the target is `titan_academy` on a loopback host with a password.

## 5. Back up and run migrations

1. Take a backup as described in `docs/runbooks/recovery.md`. Record the backup identifier.
2. Run the static migration audit:
   ```bash
   cd <REPO_ROOT> && python3 apps/backend/scripts/audit-migrations.py
   ```
3. If the database already has data, run the read-only duplicate check as the `titan_academy` role:
   `scripts/check-certificate-duplicates.sql`. If it returns rows, stop. Do not merge or delete certificates automatically.
4. Validate and check status, then apply:
   ```bash
   cd <REPO_ROOT>/apps/backend
   DATABASE_URL="<set-in-secret-store>" npx prisma validate
   DATABASE_URL="<set-in-secret-store>" npx prisma migrate status
   DATABASE_URL="<set-in-secret-store>" npx prisma migrate deploy
   ```

Do not run `npm run prisma:migrate` on a shared or production database. It runs `prisma migrate dev`, which can reset the database. Do not run `prisma:seed` in staging or production. The README says the seed script creates demo accounts for local development only, and `docs/runbooks/deployment.md` section 2 requires that none exist in staging or production.

Two migrations share the timestamp `20261102000100`. Do not rename either one. Prisma migrations have no automatic down step (`DEPLOY-RUNBOOK.md` section 5, `docs/runbooks/deployment.md` section 6).

## 6. Build

Generate the Prisma client and build the backend:

```bash
cd <REPO_ROOT>/apps/backend
npx prisma generate
npm run build            # tsc, output to dist/
```

Build the frontend. `NEXT_PUBLIC_API_URL` is compiled into the browser bundle, so set it before the build. A change needs a new build:

```bash
cd <REPO_ROOT>/apps/frontend
NEXT_PUBLIC_API_URL="https://<api-host>/api" pnpm build
```

Do not place a secret in any `NEXT_PUBLIC_` variable.

## 7. Load knowledge-check answer keys

After publication, load the answer keys for published knowledge checks:

```bash
cd <REPO_ROOT>/apps/backend
DATABASE_URL="<set-in-secret-store>" npx tsx prisma/load-knowledge-answer-keys.ts
```

The loader reads `curriculum/assessments/` from the repository, not `CURRICULUM_DIR`. A check with no key is refused with HTTP 409 when attempted, and is not scored. Keep `CURRICULUM_DIR` pointed at the repository's `curriculum/` folder, or change the loader first.

## 8. Publish the curriculum

Set `CURRICULUM_PUBLISH_ACTOR_ID` to the ID of an existing user, and `CURRICULUM_DIR` if the curriculum is outside the repository. Then run:

```bash
cd <REPO_ROOT>/apps/backend
npm run publish:curriculum
```

The script prints a JSON summary of counts and warnings. Its exit code is 1 only when the run itself fails. Refused lessons appear as warnings. Courses are never created by the script.

Before the first production run, decide how the publisher interacts with the gate:
- `curriculum-publisher.ts` calls `publishRevision` with the default environment, so `ACADEMY_PUBLICATION_GATE` decides whether each revision needs an approving review. With the default (on), a lesson without an approval stays a draft.
- `DEPLOY-RUNBOOK.md` section 6 says the publisher publishes with the gate switched off. The code does not do that. Resolve this discrepancy with the owner before any production run.

`npm run publish:curriculum:watch` runs the same publish on each change under the curriculum folders. It has no supervisor in the repository. The runbook has an untested unit-file template. A failed run, or a failed file watcher, is logged while the process keeps running, so a supervisor that only checks the process will not notice. Add a health check or restart rule.

There is no dry-run mode in the publish script (`DEPLOY-RUNBOOK.md` section 6).

## 9. Start the services

Run each process under a supervisor that restarts it on failure. Restart both after any change to the environment.

```bash
# API (from apps/backend)
NODE_ENV=production node dist/server.js

# Worker (from apps/backend). Same environment; SMTP and Redis queues run here.
node dist/worker.js

# Frontend (from apps/frontend), after the build in section 6
NODE_ENV=production pnpm start
```

Expose the API and frontend only behind TLS. The API listens on `HOST` and `PORT` (defaults `127.0.0.1` and `5000`). Next.js reads `PORT` for the frontend listener; the repository does not set one.

## 10. Verify the install

Health check on the API, over loopback:

```bash
curl -sS http://127.0.0.1:<PORT>/api/health
```

- HTTP 200 with `"healthy": true` means the database, Redis and object storage responded.
- HTTP 503 with `"healthy": false` means one of them did not. The body names each check as `ok` or `down`. The check calls `bucketExists` on `MINIO_BUCKET`, so a storage outage also returns 503.

Then run the lesson checks in `DEPLOY-RUNBOOK.md` section 9 with a dedicated test learner account. Do not use a real learner's account. The lesson body endpoint returns text only for an active or completed enrolment in a published course.

Before a release, record the gate results from `docs/runbooks/deployment.md` section 1 for the exact commit:

```bash
cd <REPO_ROOT>
pnpm test:academy:backend
pnpm curriculum:ci
```

Those suites use mocks. They do not replace a run against a live API with PostgreSQL. The browser suite is `node apps/frontend/tests/browser/academy-browser-suite.mjs`.

## 11. Rollback

Roll back if the health check fails, learners can see draft or unapproved lesson text, integration audit records show unexpected successful access, or a migration fails midway. Stop the new processes and restart the previous build. Prisma migrations cannot be reversed automatically. Follow `docs/runbooks/recovery.md`. Record the rollback in the incident log, outside the repository.

## 12. Known gaps in the repository

These are open. Check each one before relying on the install:

1. `README.md` tells you to copy `.env.example`. That file does not exist. Use `.env.production.example`.
2. The root `README.md` commands `pnpm prisma:generate` and `pnpm prisma:migrate` do not exist at the root. Use the `apps/backend` commands above.
3. `.gitignore` contains `.env.*` with only `!.env.example` excepted. Git therefore ignores `.env.production.example`. Add an exception before committing it.
4. The answer-key loader ignores `CURRICULUM_DIR` (section 7).
5. The publisher's gate behaviour differs from `DEPLOY-RUNBOOK.md` section 6 (section 8).
6. The PostgreSQL binary path, service unit name, Redis version and port, Node installation method, backend port, and the location of the private environment file are not confirmed by the repository (`DEPLOY-RUNBOOK.md` section 10).
7. Migrations have not been recorded as applied on PostgreSQL 16 for the Academy database (`DEPLOY-RUNBOOK.md` section 5).
8. `docs/runbooks/deployment.md` states that its steps are documented but not rehearsed.
