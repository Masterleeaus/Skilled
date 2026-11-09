# Historical Titan Academy server deployment proposal (checklist item O)

> **ARCHIVED OPERATOR REFERENCE — NOT CURRENT DEPLOYMENT AUTHORITY.** This document records an unverified 2026-11-03 host-specific proposal. Use [SkilledAt.Work's current deployment entrypoint](../../docs/DEPLOYMENT.md) and [release gates](../../docs/runbooks/deployment.md) for any future release. Historical database names, ports, service names and paths are examples until independently verified on the intended host. Do not execute its provisioning steps without an explicit reviewed host-specific plan.

Status: written from the repository on 2026-11-03. Nothing in this file has been run on a server. Every command below is a checklist to follow, not a record that it was done.

Conventions:
- `<PLACEHOLDER>` marks a value the operator supplies from the secret store or the server. Never paste a real value into this file, a commit, a ticket or chat.
- **UNCONFIRMED** marks anything this runbook could not confirm from the repository. Each one needs an owner decision or a check on the server before it is relied on.
- Paths are relative to the repository root (`lms-main/`) unless shown as absolute.

## 0. Do not touch

- The existing PostgreSQL 13 server on port 5432. Academy uses its own PostgreSQL 16 instance on port 5433.
- The Titan Field and Titan Desk services, their databases, containers, processes and Apache virtual hosts.
- `docker-compose.local-dev.yml`. It publishes 5432, uses weak development credentials and must not run on the server (`docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md`).
- `docs/legacy-bootstrap/1-init.stub.sh` and `docs/legacy-bootstrap/2-setup.stub.sh`. Both exit with an error on purpose. Their archived originals in `docs/legacy-bootstrap/` overwrite package manifests.

## 1. PostgreSQL 16 on port 5433

Requirements from the repository:
- `apps/backend/prisma/schema.prisma` uses the `postgresql` provider with `DATABASE_URL`.
- The root `README.md` states PostgreSQL 16 for the database.
- `docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md` records that the shared server reported PostgreSQL client 13.23 and that the server major version was never verified.

**UNCONFIRMED:** The initdb and port 5433 commands were given to the owner outside the repository. The checklist (`curriculum/research/FINISH-CHECKLIST.md`, section 2) says the owner still has to paste that setup output. A search of the repository found no initdb, `pg_ctl`, `pg_createcluster` or port 5433 commands. Use the owner's pasted output as the reference once it exists, and compare it with the checklist below.

Checklist:

1. Confirm the PostgreSQL 16 server binaries are installed and that the version is 16.x:
   ```bash
   /usr/lib/postgresql/16/bin/postgres --version
   ```
   The binary path is **UNCONFIRMED** for this server.
2. Create a separate data directory for the Academy cluster, owned by the `postgres` OS user. Do not reuse the 5432 data directory. Path: `<ACADEMY_PG_DATA_DIR>`.
3. Initialise the cluster with the locale and encoding the owner chooses, and set the port:
   - `port = 5433` in `postgresql.conf`
   - `listen_addresses = '127.0.0.1'` (loopback only; Apache fronts the app)
   - Leave the 5432 cluster's configuration files untouched.
4. Start the cluster and enable it as a service. The service unit name is **UNCONFIRMED**. Check that `ss -lntp` shows 5433 bound to 127.0.0.1 and that 5432 is unchanged.
5. Create a dedicated role and database. The production check in `apps/backend/src/config/env.ts` requires both names to be exactly `titan_academy`:
   ```sql
   CREATE ROLE titan_academy LOGIN PASSWORD '<DB_PASSWORD_FROM_SECRET_STORE>';
   CREATE DATABASE titan_academy OWNER titan_academy;
   ```
   Run these as a superuser over the local socket. Never record the password in this file.
6. Confirm the server version and identity from the Academy role only:
   ```bash
   psql "host=127.0.0.1 port=5433 dbname=titan_academy user=titan_academy" -Atqc "SHOW server_version; SELECT current_database(), current_user;"
   ```
7. Run the repository's database target guard before any migration. Per `docs/PASS51-DEPLOYMENT-VERIFICATION.md`, it rejects any database or role other than `titan_academy` on loopback, and it does not connect. The script was not read in this pass, so its exact behaviour is **UNCONFIRMED**:
   ```bash
   cd <REPO_ROOT> && node scripts/check-academy-database-target.mjs
   ```

Only the `titan_academy` role and database are used for the Academy. Do not use the 5432 cluster, and do not alter any existing role.

## 2. Redis

Requirements from the repository:
- `REDIS_URL` is required (`apps/backend/src/config/env.ts`).
- The API and the worker both use Redis for BullMQ queues (`docs/ACADEMY-PASS45-WORKER-OPERATIONS.md`).
- The health endpoint pings Redis (`apps/backend/src/routes/health.route.ts`).
- `.env.production.example` says to use a distinct authenticated Redis endpoint, not the Field or Desk Redis.

Checklist:

1. Install Redis for the Academy only. The Redis version is **UNCONFIRMED**. The repository's dependency candidate, `docker-compose.academy-deps.yml`, pins `redis:7.4-alpine` for a container, which is not the same as a native install.
2. Bind Redis to loopback only, require a password, and enable append-only persistence. The compose candidate uses `--requirepass` and `--appendonly yes`. Use a port of the owner's choice in place of `<REDIS_PORT>`. The candidate's default is 16379, which is not confirmed for the server.
3. Put the password in the secret store and build the URL with the placeholder form:
   `REDIS_URL=redis://:<REDIS_PASSWORD>@127.0.0.1:<REDIS_PORT>`
4. Check the connection without printing the password, by passing it through an environment variable:
   ```bash
   REDISCLI_AUTH="$REDIS_PASSWORD_FROM_SECRET_STORE" redis-cli -h 127.0.0.1 -p <REDIS_PORT> ping
   ```
   Expected reply: `PONG`.

## 3. Node 22 and pnpm

Requirements from the repository:
- Root `package.json`: `"engines": { "node": ">=20" }`. The Node 22 requirement comes from the owner's checklist, not from a repository pin. There is no `.nvmrc`.
- `"packageManager": "pnpm@10.0.0"` in the root `package.json`.
- The verification evidence in `PASS42/VERIFY-evidence.md` was produced with Node v22.23.4 and pnpm 10.0.0.
- `docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md` recorded Node 20.20.2 and pnpm 9.12.0 on the server at that time. Those are historical observations and need rechecking.

Checklist:

1. Install Node 22 without changing the Node version that Field or Desk use. The installation method is **UNCONFIRMED**.
2. Install pnpm 10.0.0 for this project only (for example through Corepack). Do not change the global pnpm version used by other apps.
3. From the repository root, install from the lockfile without changes:
   ```bash
   pnpm install --frozen-lockfile
   ```
4. Generate the Prisma client and build the backend. The backend `build` script is `tsc`:
   ```bash
   cd <REPO_ROOT>/apps/backend
   npx prisma generate
   npm run build
   ```
   `pnpm install` must run with `--frozen-lockfile`. The legacy installer ran unpinned `pnpm add` commands, which changed the lockfile.

## 4. Environment variables

Load the variables from a private file that only the service user can read. The repository's `.env.production.example` suggests `/home/admin/apps/academy/.env` with mode `0600`. Using that path is **UNCONFIRMED** as the chosen location. The file must not be committed. The loader in `apps/backend/src/config/env.ts` calls `dotenv.config()` on startup, so a `.env` in the backend working directory is also read.

If a required variable is missing or invalid, `env.ts` prints the field errors and exits with code 1. Check the start-up output first.

Names and placeholders only:

| Variable | Required | Placeholder or rule |
|---|---|---|
| `NODE_ENV` | Yes (defaults to `development`) | `production` |
| `PORT` | No (default `5000`) | `<BACKEND_PORT>`. The 5002 candidate in the docs is **UNCONFIRMED**. |
| `HOST` | No (default `127.0.0.1`) | `127.0.0.1` |
| `CLIENT_URL` | Yes | `https://<FRONTEND_ORIGIN>`. Production requires HTTPS. |
| `DATABASE_URL` | Yes | `postgresql://titan_academy:<DB_PASSWORD>@127.0.0.1:5433/titan_academy?schema=public`. Production requires the database and user to be `titan_academy`. The port is not checked by `env.ts`. |
| `REDIS_URL` | Yes | `redis://:<REDIS_PASSWORD>@127.0.0.1:<REDIS_PORT>` |
| `JWT_ACCESS_SECRET` | Yes | `<JWT_ACCESS_SECRET>`. Production requires at least 32 characters. |
| `JWT_REFRESH_SECRET` | Yes | `<JWT_REFRESH_SECRET>`. At least 32 characters in production, and different from the access secret. |
| `JWT_ACCESS_EXPIRES` | No (default `15m`) | `15m` |
| `JWT_REFRESH_EXPIRES` | No (default `30d`) | `30d` |
| `MINIO_ENDPOINT` | No (default `localhost`) | `<MINIO_HOST>` |
| `MINIO_PORT` | No (default `9000`) | `<MINIO_PORT>` |
| `MINIO_ACCESS_KEY` | Yes | `<MINIO_ACCESS_KEY>` |
| `MINIO_SECRET_KEY` | Yes | `<MINIO_SECRET_KEY>` |
| `MINIO_BUCKET` | No (default `lms-storage`) | `<MINIO_BUCKET>` |
| `MINIO_USE_SSL` | No (default `false`) | `true` or `false` |
| `SMTP_HOST` | No (default `localhost`) | `<SMTP_HOST>` |
| `SMTP_PORT` | No (default `1025`) | `<SMTP_PORT>`. Implicit TLS must use 465. |
| `SMTP_FROM` | No | `<SMTP_FROM_ADDRESS>` |
| `SMTP_TLS_MODE` | No (default `none`) | `starttls` or `implicit`. Production refuses `none`. |
| `SMTP_USER` / `SMTP_PASSWORD` | Set both or neither | `<SMTP_USER>` / `<SMTP_PASSWORD>` |
| `CURRICULUM_DIR` | No (default is the repository's `curriculum/`) | Absolute path to the curriculum root. See section 8. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Set both or neither in production | `<STRIPE_SECRET_KEY>` / `<STRIPE_WEBHOOK_SECRET>`. Leave both empty while Stripe is disabled. |

Read by code but not in `env.ts`:

| Variable | Used by | Notes |
|---|---|---|
| `CURRICULUM_PUBLISH_ACTOR_ID` | `apps/backend/scripts/publish-curriculum.ts` | Required by the publish script. Set it to the ID of an existing user. The script refuses to start without it. The user is recorded on each revision and audit entry it writes. |
| `ACADEMY_PUBLICATION_GATE` | `apps/backend/src/modules/curriculum/lesson-review.service.ts` | Controls the review gate on publishing through the API. The valid values and the production setting are **UNCONFIRMED**. The publish script bypasses the gate for its own revisions (section 6). |
| `ACADEMY_ASSESSMENT_APPROVALS` | `apps/backend/src/modules/curriculum/curriculum-publisher.ts` | Optional path to the assessment approval file. When unset, the publisher reads `assessment-publication-approvals.json` in the curriculum root. An assessment with no approval whose sha256 matches its exact bytes is held: its answer keys are not loaded and its lesson is not published. |
| `INTEGRATION_SERVICE_SCOPES` | `apps/backend/src/modules/curriculum/integration.routes.ts` | Required for any integration call to succeed. JSON with **both** keys, `{"field-services":[...],"ai-workforce":[...]}`, each an array of external company refs (an empty array allows nothing for that caller). If the variable is unset, invalid, or missing either key, every integration call is refused with 401 (fail closed). |

Rules to keep:
- Use different values for every environment. Never reuse Field or Desk values.
- Restart the API and the worker after any change. Both read the environment at start.
- Do not put a secret in a `NEXT_PUBLIC_` variable. The frontend bundle is public.

## 5. Running migrations

Repository facts:
- `apps/backend/prisma/migrations/` holds 21 migration directories.
- Two migrations share the timestamp `20261102000100`: `20261102000100_academy_external_identity_audit` and `20261102000100_titan_academy_content_inventory`. Do not rename either one. Renaming changes the migration history. `PASS20-MIGRATION-PREFLIGHT.md` records the same known issue.
- `20261102210000_academy_certificate_idempotency` adds a unique constraint on certificates per student and course. It must not be applied to a populated database until the duplicate check below returns no rows.
- The backend's `prisma:migrate` script runs `prisma migrate dev`, which can reset and create migrations. Do not use it on the server.

Checklist:

1. Back up the Academy database first. The recovery procedure is in `docs/runbooks/recovery.md`. Record the backup identifier.
2. Run the static migration audit from the repository root:
   ```bash
   cd <REPO_ROOT> && python3 apps/backend/scripts/audit-migrations.py
   ```
3. If the database is already populated, run the read-only duplicate check in `scripts/check-certificate-duplicates.sql` as the `titan_academy` role. If any rows are returned, stop. Do not delete or merge certificates automatically (`PASS45-WORKERS-AND-CERTIFICATES.md`).
4. Validate the schema and show the migration status:
   ```bash
   cd <REPO_ROOT>/apps/backend
   DATABASE_URL="<from secret store>" npx prisma validate
   DATABASE_URL="<from secret store>" npx prisma migrate status
   ```
5. Apply the migrations:
   ```bash
   cd <REPO_ROOT>/apps/backend
   DATABASE_URL="<from secret store>" npx prisma migrate deploy
   ```
6. Confirm that no curriculum publish or import job is running before step 5.

Never run `prisma migrate reset` or `db push --force-reset` on this database. Prisma migrations have no automatic down step. A reversal follows `docs/runbooks/recovery.md`.

Verification of these migrations on PostgreSQL 16 has not been run. The status is **UNCONFIRMED** until a clean database has been migrated and the output recorded.

## 6. The publish script

Entry point: `apps/backend/scripts/publish-curriculum.ts`. npm scripts in `apps/backend/package.json`:
- `npm run publish:curriculum`: publishes once, prints a JSON summary, then exits. The exit code is 1 only when the run itself fails. Lessons refused by the run appear as warnings.
- `npm run publish:curriculum:watch`: publishes now, then again after each change under the watched folders.

What the script reads and writes (from `apps/backend/src/modules/curriculum/curriculum-publisher.ts`):
- Reads `<CURRICULUM_ROOT>/structure/COURSES-MODULES.json` for placement, and the lesson files indexed by `file-lesson-loader.ts`.
- Reads `<CURRICULUM_ROOT>/assessments/<lessonId>.assessment.json` and writes the knowledge-check answer keys to the database itself.
- Writes lessons, revisions, track placements and course links.

Important before the first production run:
- **The publisher does not wait for the review gate.** Each revision it writes is published with the gate switched off for that call only, and the audit log records `LESSON_REVISION_PUBLISHED_GATE_OFF`. Checklist section 5 says every lesson is still DRAFT and NOT REVIEWED. Running publish in production therefore puts unreviewed lesson text in front of enrolled learners. The owner must decide this before any production run (checklist section 1, first item).
- Refused lessons are left as they are and reported as warnings. Courses are never created by the script. A course slug missing from the database is skipped with a warning.

Checklist:

1. Set the environment (section 4), including `CURRICULUM_PUBLISH_ACTOR_ID` and `CURRICULUM_DIR`.
2. Dry-run the planner against the current curriculum (checklist item H). The script has no dry-run flag in the code I read, so this step is **UNCONFIRMED** as a repeatable command. Record the counts it reports.
3. Publish once:
   ```bash
   cd <REPO_ROOT>/apps/backend
   npm run publish:curriculum
   ```
   Save the JSON summary. It contains counts and warnings only.
4. Run the answer-key loader (section 7).
5. Run the watcher as a supervised service (below). Only start it after steps 1 to 4 pass and the review decision above is recorded.

Watcher behaviour from the code:
- It watches `courses`, `shared`, `structure` and `assessments` under the curriculum root, and only `.json` files.
- It waits 1.5 seconds after a change, runs one publish at a time, and queues one more run if a change arrives during a run.
- A failed run is logged and the process keeps running.
- If the file watcher fails, the code logs `Watcher stopped` but the process keeps running without a watcher. A supervisor that only checks the process will not notice. This needs a health check or a restart rule.

Supervisor: the repository has no systemd unit, pm2 file or cron entry for the watcher (checked by search, none found). The unit below is a template only, **UNCONFIRMED** against this server. Save it outside the repository, fill the placeholders, and review it before enabling.

```ini
# /etc/systemd/system/academy-publish-watch.service (template, not in repository)
[Unit]
Description=Titan Academy curriculum publish watcher
After=network-online.target

[Service]
User=<SERVICE_USER>
WorkingDirectory=<REPO_ROOT>/apps/backend
EnvironmentFile=<PRIVATE_ENV_FILE_0600>
ExecStart=/usr/bin/env npm run publish:curriculum:watch
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Also run one API process and one worker process, each under its own supervisor (`docs/PASS45-WORKERS-AND-CERTIFICATES.md`):
- API: `NODE_ENV=production node dist/server.js` from `apps/backend`
- Worker: `node dist/worker.js` from `apps/backend`

The worker must have the same Academy environment and must not use Field or Desk accounts. Only one worker is started at first.

## 7. Knowledge-answer-key loader

Entry point: `apps/backend/prisma/load-knowledge-answer-keys.ts`. It has no npm script; run it with `tsx` from `apps/backend`:

```bash
cd <REPO_ROOT>/apps/backend
DATABASE_URL="<from secret store>" npx tsx prisma/load-knowledge-answer-keys.ts
```

Behaviour from the code:
- It loads keys for every `PUBLISHED` lesson revision that has knowledge checks.
- It reads `curriculum/assessments/<sourceId>.assessment.json`, matched by lesson ID and check ID. Checks with no key are refused and reported, never guessed.
- It is idempotent: it upserts on revision and check ID.
- It prints counts and check IDs only. It never prints a key or a rationale.

Why it matters: when a check has no loaded key, the attempt route refuses the attempt with HTTP 409 and the message "This knowledge check is not ready to be graded". The attempt is not scored as wrong (`apps/backend/src/modules/curriculum/curriculum.routes.ts`).

**Gap to resolve:** the loader resolves the assessments folder from its own file location (`../../../curriculum/assessments` relative to `apps/backend/prisma`). It does not read `CURRICULUM_DIR`. The publisher does read `CURRICULUM_DIR`. If `CURRICULUM_DIR` points anywhere other than the repository's `curriculum/`, the publisher and the loader read different assessment folders. Keep `CURRICULUM_DIR` pointing at the repository's `curriculum/`, or change the loader. Do not assume they agree until this is fixed. (Checklist item L asks for this check.)

## 8. CURRICULUM_DIR and the curriculum folder in production

Where the code looks:
- `apps/backend/src/modules/curriculum/file-lesson-loader.ts`: `curriculumRoot()` returns `CURRICULUM_DIR` if set. Otherwise it returns the repository's `curriculum/` folder, five levels above the compiled file.
- The API loads the lesson index once per process, on first use, and keeps it in memory. A change to the folder needs a restart.

What must be present under the curriculum root:
- `courses/<course>/*.json`: one folder per course. The repository has 45 course folders.
- `shared/**/*.json`: shared lessons. Folders `app`, `business` and `business-stats` are present in the repository.
- `structure/COURSES-MODULES.json`: required by the publish script.
- `assessments/<sourceId>.assessment.json`: required by the publisher and the loader. The repository has 933 files.

Failure modes:
- If `courses/` or `shared/` cannot be read, the loader logs a warning and every lesson returns 404 with no other clue. The health endpoint does not check curriculum files.
- If `structure/COURSES-MODULES.json` is missing, the publish script throws.

Checklist:

1. Decide how the curriculum folder reaches the server. Either deploy the repository checkout, or copy the curriculum folder to a fixed path. The chosen method is **UNCONFIRMED**. The checklist (section 1) lists this as an open owner decision.
2. Set `CURRICULUM_DIR=<ABSOLUTE_CURRICULUM_PATH>` in the private environment file, and make sure the folder contains the four items above.
3. Restart the API after the value changes.
4. Confirm the folder is readable by the service user, and that the counts match the repository (45 courses, 933 assessment files) or a recorded newer count.
5. Keep the assessment-folder gap in section 7 in mind when choosing the path.

## 9. Health endpoint and lesson body check

### Health endpoint

Route: `GET /api/health`, defined in `apps/backend/src/routes/health.route.ts` and mounted at `/api` in `apps/backend/src/app.ts`.

Check from the server, over loopback:
```bash
curl -sS http://127.0.0.1:<BACKEND_PORT>/api/health
```

Expected behaviour:
- HTTP 200 and `"healthy": true` when the database, Redis and object storage all respond.
- HTTP 503 and `"healthy": false` when any one of them is down. The response body names each check as `ok` or `down`.
- The object-storage check runs `bucketExists` against `MINIO_BUCKET`. A MinIO outage therefore returns 503 even when the database and Redis are fine.
- The response is wrapped as `{ "success", "message", "data": { "checks", "healthy" } }`.

The public check is **UNCONFIRMED** through the proxy. The docs name `scripts/academy-runtime-smoke.mjs` for the public URL, which makes only unauthenticated GET requests. The script was not read in this pass.

### Lesson body check with a test account

The body endpoint is `GET /api/academy/curriculum/courses/<COURSE_ID>/lessons/<LESSON_SOURCE_ID>/body`, in `apps/backend/src/modules/curriculum/curriculum.routes.ts`. It serves lesson text only when:
- the caller is authenticated;
- the course is published;
- the caller has an `ACTIVE` or `COMPLETED` enrolment in that course;
- the lesson is placed in the course through a published track with a published revision;
- the lesson is open under the level rules;
- the file's knowledge checks match the published revision (otherwise HTTP 409).

The route checks enrolment, not payment. How payment maps to enrolment is **UNCONFIRMED**, and checklist section 3 asks the owner whether `COMPLETED` should also be accepted.

Steps, using a dedicated test learner account that holds no real customer data:

1. Create or confirm the test learner account. The creation method and whether the account is verified by email are **UNCONFIRMED**. The verification email uses the SMTP settings, which the worker sends.
2. Log in and keep the access token in a shell variable. Do not paste it anywhere:
   ```bash
   curl -sS -X POST http://127.0.0.1:<BACKEND_PORT>/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"<TEST_LEARNER_EMAIL>","password":"<TEST_LEARNER_PASSWORD>"}'
   ```
   The response contains `data.accessToken`. Store it, for example with `read -s ACCESS_TOKEN`, then export it. The exact login response shape beyond `accessToken` and `user` is **UNCONFIRMED**.
3. Enrol the test learner in a published course. The route is `POST /api/enrollments` with `{ "courseId": "<COURSE_ID>" }`. It requires the `STUDENT` role.
4. Check the outline first:
   ```bash
   curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
     http://127.0.0.1:<BACKEND_PORT>/api/academy/curriculum/courses/<COURSE_ID>/outline
   ```
   The outline must show titles and lock status, and no lesson text.
5. Fetch one lesson body:
   ```bash
   curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
     http://127.0.0.1:<BACKEND_PORT>/api/academy/curriculum/courses/<COURSE_ID>/lessons/<LESSON_SOURCE_ID>/body
   ```
   Expect HTTP 200 with the lesson body. Confirm the response has no answer key field, such as `correctIndex`.
6. Negative checks, each expected to be refused:
   - no token: refused as unauthenticated (exact status **UNCONFIRMED**)
   - a learner with no enrolment in the course: HTTP 403, "Active course enrolment required"
   - a lesson the course does not place: HTTP 404
   - a lesson behind a level lock: refused by the level gate (exact status **UNCONFIRMED**)
   - a knowledge check that is out of step with the published revision: HTTP 409

Do not run these checks against a real learner's account.

## 10. Items still UNCONFIRMED

These are gathered here so the owner can close them:

1. The PostgreSQL 16 initdb, port 5433 and service commands given to the owner outside the repository (section 1).
2. The PostgreSQL 16 binary path and service unit name on the server (section 1).
3. The Redis version and native installation method, and the Redis port (section 2).
4. The Node 22 installation method. The repository only requires Node 20 or later (section 3).
5. The backend port, `<BACKEND_PORT>`. The docs mention 5002 as a candidate that was not verified (section 4).
6. The location of the private environment file on the server (section 4).
7. The valid values of `ACADEMY_PUBLICATION_GATE` and the production setting (section 4).
8. The effect of `ACADEMY_ASSESSMENT_APPROVALS`, which code did not read in this pass (section 4).
9. Whether `apps/backend/scripts/publish-curriculum.ts` has a dry-run mode. Checklist item H needs one (section 6).
10. The supervisor for the publish watcher and for the API and worker. No unit files exist in the repository, and the template in section 6 has not been tested (section 6).
11. The owner decision on publishing unreviewed lessons, given that the publisher bypasses the review gate (section 6).
12. The gap between the answer-key loader's fixed assessments path and `CURRICULUM_DIR` (section 7).
13. How the curriculum folder reaches the server (section 8).
14. The public health check through the proxy, and the content of `scripts/academy-runtime-smoke.mjs` and `scripts/check-academy-database-target.mjs` (sections 1 and 9).
15. How the test learner account is created and verified (section 9).
16. Whether `COMPLETED` enrolments and payment should both grant lesson text (section 9, checklist section 3).
17. The HTTP status codes for an unauthenticated request and for a level-locked lesson (section 9).
18. Whether the migrations apply cleanly on PostgreSQL 16, which the repository has not recorded for the Academy database (section 5).
19. The backup and restore procedure's current status. `docs/runbooks/recovery.md` was present but not read in this pass (section 5).

Nothing in this runbook records a secret value. No file other than this one was created or changed.
