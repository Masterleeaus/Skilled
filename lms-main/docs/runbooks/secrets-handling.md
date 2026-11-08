# Titan Academy secrets handling runbook

Owner: to be assigned. Status: **documented, not rehearsed**. This runbook names variables only. It never records a value, and no value may be pasted into a ticket, a commit, a chat, a log or this file.

## 1. Rules

1. Secrets live in the environment's secret store. Never commit a `.env` file. `.gitignore` excludes `.env`, but check before every commit.
2. Each environment (local, staging, production) has its own value for every secret. A staging value must never be used in production, and the reverse.
3. Placeholders in `.env.example` (for example the `change_me_*` values and the `minioadmin` defaults) are for local development only. Replace them before any shared deployment.
4. Secrets must not be printed to terminals that are logged, to CI logs or to shell history. The credential tool reads its input from stdin for this reason.
5. Anyone who has seen a secret in plain text in an unapproved place treats it as exposed and follows section 5.

## 2. Variables, by purpose

Names only. The "Requirement" column comes from `apps/backend/src/config/env.ts` and `apps/frontend/src`.

### Backend runtime

| Variable | Purpose | Requirement |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Required |
| `REDIS_URL` | Redis connection (queues, cache) | Required |
| `JWT_ACCESS_SECRET` | Signs access tokens | Required, at least 10 characters; use a long random value |
| `JWT_REFRESH_SECRET` | Signs refresh tokens | Required, at least 10 characters; must differ from the access secret |
| `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES` | Token lifetimes (not secret) | Optional, defaults `15m` and `30d` |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | Object storage credentials | Required |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_BUCKET`, `MINIO_USE_SSL` | Object storage location (not secret) | Optional |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Outbound mail (host and sender are not secret) | Optional; SMTP account credentials are not read by the current configuration |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payment provider keys | Optional; live keys must not be used outside production |
| `CLIENT_URL` | Allowed frontend origin for CORS and cookies | Required, must be a valid URL |
| `PORT`, `NODE_ENV` | Listener and environment mode (not secret) | Optional |

### Frontend build and runtime

| Variable | Purpose | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL | Compiled into the browser bundle. Treat as public. Never place a secret in any `NEXT_PUBLIC_` variable. |

### Curriculum tooling

| Variable | Purpose | Notes |
|---|---|---|
| `ACADEMY_ASSESSMENT_APPROVALS` | Optional path to the assessment approval file | Path only. The approval records are review evidence, not secrets. |

### Service credentials (not environment variables)

Machine-to-machine credentials for Field Services and AI Workforce are database records in `AcademyServiceCredential`. Only a SHA-256 hash of each token is stored. The calling service presents the token as a bearer credential, with its service name in the `x-titan-service` header. Those tokens are not environment variables and are never placed in `.env`.

## 3. Storage and access

- Store values in the secret manager for the environment. Limit read access to the people who operate that environment.
- The backend and frontend processes read values from the environment at start. A change requires a restart.
- Keep an access record for each production secret: who has read it, and when it was last rotated.

## 4. Rotation

### JWT secrets
Rotating `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` invalidates existing tokens signed with the old value. Plan a short notice, rotate both secrets in one change, and restart the backend. Rotate the refresh secret when a refresh token may be exposed.

### Object storage and payment keys
Create the new key in the provider, update the secret store, restart the backend, check a file upload and a payment webhook, then revoke the old key.

### Academy service credentials
Use the operator-only script `apps/backend/prisma/manage-titan-credentials.ts`. It reads a JSON request from stdin, prints a new token once, and stores only its hash. The script accepts these actions: `create`, `list`, `rotate`, `revoke`. Expiry is 1 to 365 days. Services that are allowed are `field-services` and `ai-workforce`.

Procedure:

1. `list` the credentials for the service and organisation, and note the identifier of the one to replace.
2. `create` the replacement, or `rotate` the existing credential (rotation revokes the old credential and creates a new one in a single transaction).
3. Give the printed token to the calling service through its own secure channel. Do not keep the terminal output.
4. Confirm the caller succeeds with the new token, then confirm the old token is refused. Both checks should appear in `AcademyIntegrationAudit`.
5. If the old credential was not revoked by rotation, run `revoke` with its identifier.

The register item ACA-017 requires rotation, revocation and expiry to be exercised against a real database. That exercise has not been done.

### External identity links
Identity links between Academy users and external records are created by the offline script `apps/backend/prisma/provision-titan-integration.ts`. It is trusted, offline, and must not be exposed as an API. Each change writes an audit row.

## 5. Suspected exposure

1. Rotate the affected secret immediately (section 4). For a service credential, revoke it first.
2. Review `AcademyIntegrationAudit` for the affected service and organisation since the earliest possible exposure time. Look for `SUCCESS` rows from unexpected sources and for denial spikes.
3. Review the audit log for administrative actions in the same window.
4. Record the exposure, the response times and the people involved in the incident record. Keep that record outside the repository.
5. Do not restore a previous secret value. Issue a new one.

## 6. Checks

Before each deployment, confirm:

- Every required variable in section 2 is set in the target environment, and no placeholder value remains.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` differ from each other and from any other environment.
- No demo account credentials from the seed script are active in a shared environment.
- The repository contains no file that matches the secrets pattern in `.gitignore`.
