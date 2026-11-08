# Titan Academy — safe isolated deployment preflight (Pass 43)

This is **source preparation**, not a completed server deployment. Do not assume any migration, build, live integration, or SSL check has passed.

## Server context (user-provided observed environment, 2 November 2026)

- AlmaLinux 9.8 / DirectAdmin / Apache 2.4.68; Node 20.20.2, pnpm 9.12.0 (application specifies pnpm 10.0.0).
- PostgreSQL local client 13.23; server confirmed listening on 127.0.0.1:5432, but server major version was **not** independently queried.
- Field: `/home/admin/apps/ai-fsm`, `field.titanzero.io`, port 3000; Desk: `/home/admin/apps/desk`, `desk.titanzero.io`, port 3001.
- Port 3002 **occupied** by an unidentified process/container. Port 5002 not found in earlier listener inventory; must recheck.
- `academy.titanzero.io` resolves to 216.219.85.159 but currently presents an invalid hostname certificate.
- Docker installed, but `admin` lacks permission to talk to Docker daemon without escalation.
- 2 CPU / 5.5 GiB RAM / approximately 75 GiB disk available. Monitor build peaks before introducing three additional services.

## What Pass 43 changes

- Safer JWT authentication checks account active status, email verification and current server-side role for **every protected request**.
- `scripts/audit-migration-readiness.mjs` performs a purely static, read-only migration review. It does **not** prove migration SQL executes on PostgreSQL 13 or PostgreSQL 16.
- The original unbounded installer/scaffold scripts are archived under `docs/legacy-bootstrap/`; root wrappers fail closed.
- The original local developer Compose file is renamed to `docker-compose.local-dev.yml`. **It must not be run on DirectAdmin**: it publishes 5432, uses weak development credentials and enables anonymous object downloads.
- `docker-compose.academy-deps.yml` starts Redis and MinIO **only** with configurable loopback ports, distinct secrets and no public bucket permissions. It does not start PostgreSQL, Field or Desk. It is an *unexecuted deployment candidate*, not a completed install.
- `.env.production.example` is a placeholder map. It contains no real credentials and must not be used unchanged.

## Prior to running any live commands

1. Verify the repository ZIP and its SHA-256 manifest; extract into a new staging directory under the `admin` account. Do not invoke `docs/legacy-bootstrap/1-init.stub.sh`, `docs/legacy-bootstrap/2-setup.stub.sh`, or `docker compose up` without `-f`.
2. Recheck `ss -lntp`, `docker ps`, existing services and free memory. Identify who owns port 3002; keep 3000 and 3001 untouched.
3. Confirm `psql -Atqc 'SHOW server_version'` using approved database credentials; verify PostgreSQL major compatibility with Prisma 6 and this migration chain. **Do not upgrade the shared PostgreSQL installation** without a backup and approved rollback plan.
4. Create a dedicated `titan_academy` database and least-privilege role only after explicit authorisation. Keep `DATABASE_URL` private; do not share terminal output containing secrets.
5. Install pnpm 10 at project scope (e.g., Corepack) without changing the existing Field/Desk runtime. Run `pnpm install --frozen-lockfile` only after reviewing scripts. Generate Prisma client, build both apps and run API tests in staging.
6. Run all migrations against an isolated temporary Academy database before considering the production Academy database. Never run `prisma migrate reset`, `db push --force-reset`, or unreviewed seed scripts on a live database.
7. Only after capacity/port review, configure distinct Redis and MinIO credentials in a root/admin-readable `0600` private Compose env file. Pin the MinIO image digest after validation. Example invocation **for later approval, not yet authorised**: `docker compose --env-file /private/path/academy-deps.env -f docker-compose.academy-deps.yml config --quiet` followed by a separately approved `up -d`.
8. MinIO buckets must remain private. Create the required bucket explicitly and audit object access policies. Do not enable anonymous download. Use signed links or a protected backend for private learning content.
9. Configure the Academy frontend/backend processes only after clean builds. Bind to loopback and use an available frontend port (3003 may be an option, **not yet verified**) and backend port 5002 only after checking them again.
10. Create an **Academy-only** DirectAdmin Apache reverse proxy and provision an Academy-specific certificate. Leave Field/Desk vhosts unchanged; capture backups before changes.
11. Validate end-to-end learner, instructor, tenant separation, admin, storage, queues and certificate issuance; require unchanged Field/Desk health and document rollback.

## Security and compatibility limitations remaining

- Full TypeScript and Next.js builds unavailable during this offline pass; dependency registry DNS lookup failed in the build environment.
- No database runtime was present in the build environment. PostgreSQL 13 support is **not verified** and the project documents PostgreSQL 16. Treat version decision as blocked until an isolated migration smoke test.
- The two distinct `20261102000100_*` migration names are ordered lexically and are not themselves a proven error; verify them with Prisma migration tooling in isolation.
- Existing application uses runtime role checks but a full tenant-by-tenant RBAC/IDOR review is still needed.
- Mail service, Stripe, curriculum human approval records, training enrolments and background jobs require live testing.
- Existing JWT refresh cookies and web proxy session configuration need deployment-specific HTTPS validation.
- No real secret, Docker container, process, database, vhost, certificate, or server file has been created by this code pass.
