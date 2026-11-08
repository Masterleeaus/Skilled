# Titan Academy Pass 45 — Worker isolation and certificate safety

## Deployment impact

- `apps/backend/src/server.ts` is the API process. It creates queue producers but **never starts queue workers**.
- `apps/backend/src/worker.ts` is the dedicated background worker process. Run exactly one managed worker initially; increase concurrency only after measuring load.
- Production backend package scripts include `start` and `start:worker`. Both processes must receive the same Academy-specific environment configuration and reach their own Academy database, Redis and MinIO instances.
- SMTP now requires `SMTP_TLS_MODE=starttls` or `implicit` in production, with paired credentials when authentication is used. Email sending is only performed by the worker.
- Certificate jobs have stable IDs and retries. Prisma `Certificate` has a new `(studentId,courseId)` uniqueness constraint to prevent concurrent duplicate issuance.

## Pre-migration safety gate

The new migration `20261102210000_academy_certificate_idempotency` must be run **only against Academy's dedicated PostgreSQL database**. Before applying it to an existing populated Academy database, execute the **read-only** SQL at `scripts/check-certificate-duplicates.sql` using an Academy-scoped database account. If any rows are returned, STOP and reconcile duplicate certificate records and PDF links with an authorised reviewer. Do not delete records automatically. The migration is designed for a new empty Academy database; it has **not** been executed here.

Check the correct database identity using `SELECT current_database(), current_user;` in a safe session before applying reviewed Prisma migrations. Preserve snapshots and a recovery plan first. Never execute against `ai_fsm` or `titan_desk`.

## Verification scope

Offline source tests and TypeScript parsing do not prove Redis queue processing, SMTP delivery, PostgreSQL transaction behavior, PDF storage, build success or production startup. Those require a real isolated deployment. The API and worker must be independently managed and monitored for restart recovery.
