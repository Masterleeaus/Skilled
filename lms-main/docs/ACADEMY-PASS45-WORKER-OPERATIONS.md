# Pass 45 — Titan Academy independent worker and certificate operations

**Status:** source implementation staged; full dependency build, real database migration, email delivery and BullMQ processing have **not** been verified. This is not a deployment authorization.

## Architectural change

The API (`node apps/backend/dist/server.js`) produces Redis/BullMQ jobs but **never starts worker processors**. The worker entry point (`node apps/backend/dist/worker.js`) runs email and certificate processors as an independent long-lived service. Deploy **both** as supervised services with independent restart policies after reviewing runtime dependencies. The worker and API share an Academy-only database and Redis; neither should use Field or Desk service accounts.

The API checks database and Redis connectivity, and verifies/creates the object-storage bucket before listening. The worker checks database and Redis before claiming any jobs. Each responds to SIGINT/SIGTERM by attempting a clean shutdown of queues and connections.

## Email

`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_TLS_MODE`, `SMTP_USER` and `SMTP_PASSWORD` are configured per Academy environment. `SMTP_TLS_MODE=starttls` uses required STARTTLS, `implicit` uses TLS-on-connect (port 465), and `none` is allowed for local development **only**. Production refuses plaintext SMTP settings. Authentication requires both `SMTP_USER` and `SMTP_PASSWORD` or neither. Store the actual password only in a private 0600 environment file, never in git, journal excerpts or chat.

Email jobs retry three times with exponential backoff. Do not expose raw email job payloads to unauthorised users: recovery links contain tokens. Any external SMTP provider and sending identity still require live verification.

## Certificate correctness

BullMQ producer uses a deterministic SHA-256 job ID based on the student/course pair, and retries failures five times. This suppresses concurrent queued duplicates while an entry remains in Redis. It is **not** sufficient by itself: the new database migration adds a unique constraint on `(studentId, courseId)` to prevent multiple certificate rows when completed jobs are retried or multiple workers race. The service handles Prisma `P2002` by returning the existing certificate; it attempts to remove its unused PDF artifact. An interrupted operation may still leave an orphan object and needs a future reconciliation job.

**Migration safety:** Before running migration `20261102210000_academy_certificate_idempotency`, if an Academy database was populated previously, first run a read-only duplicate check there:

```sql
SELECT "studentId", "courseId", COUNT(*)
FROM certificates
GROUP BY "studentId", "courseId"
HAVING COUNT(*) > 1;
```

Never delete or merge existing certificates automatically. If duplicates are found, preserve the records and manually decide a safe resolution before applying this migration. Do not run the migration against Field or Desk. Use only the dedicated Academy credentials and database, and verify full Prisma migration history before applying anything.

## Deployment and verification gate

1. Inspect the installed commit, package scripts and lockfile; install `pnpm@10.0.0` isolated from the existing applications.
2. On an isolated test target, run `pnpm install --frozen-lockfile`, generate Prisma, validate schema, compile the backend and build the frontend. Record actual exit codes.
3. Provision Academy-only PostgreSQL, Redis, MinIO and SMTP after verifying independent ports, resources and backups. Do **not** launch the inherited developer Compose stack.
4. Apply migrations to Academy only, verifying the certificate uniqueness constraint and migration history.
5. Start the worker and API independently, verify their health and restart recovery. Test message delivery using non-production test addresses.
6. End-to-end test course completion, repeated issuance, concurrent duplicate requests, certificate validation and PDF download. Verify exactly one certificate row per student/course and no exposure between tenants.
7. Configure domain and TLS in DirectAdmin without touching Titan Field or Titan Desk, and verify both remain healthy.

**Unverified in Pass 45:** TypeScript type-checking, pnpm dependency resolution, Prisma migration execution, SMTP TLS handshake, authenticated SMTP, queue execution, concurrency race tests, and actual public HTTPS operation.
