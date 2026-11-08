# Titan Academy — Pass 51 deployment verification

Status: source-side safety controls verified; full production build and live database tests **not** verified.

## What this pass provides

1. `node scripts/check-academy-database-target.mjs` reads DATABASE_URL and rejects any database/role other than `titan_academy` / `titan_academy` on loopback. It does not open a database connection, print a password, execute SQL or run migrations. This guard is intended to run immediately **before** any Academy-only Prisma migration command, not as a replacement for migration review.
2. `node scripts/academy-runtime-smoke.mjs https://academy.titanzero.io` checks frontend HTML, `/api/health` (PostgreSQL, Redis and object storage), and the public `/api/courses` API. It makes only unauthenticated GET requests. It returns nonzero on a failed check.
3. The backend additionally rejects production misconfiguration: wrong database/role, non-HTTPS CLIENT_URL, short or duplicate JWT secrets, and partially configured Stripe credentials.
4. Express trusts forwarded client IPs only from loopback proxy addresses. The backend should still be bound to `127.0.0.1` and protected by Apache.

## Server-specific discovery still required

Previous read-only server output indicated AlmaLinux 9.8, Node 20.20.2, pnpm 9.12.0, Docker installed but inaccessible to the `admin` user, PostgreSQL client 13.23, port 3002 occupied, port 5002 apparently unoccupied, and `academy.titanzero.io` resolving to the server but presenting a certificate for the server hostname. These are historical observations, not reverified in this pass. Check them again before allocation. Frontend port 3004 is only a candidate and must be checked.

## Safe commands after transferring this Master Copy to an isolated directory

From the unpacked repository root:

```bash
node scripts/run-source-verification.mjs
node scripts/preflight-server.mjs
# Set DATABASE_URL in the private shell environment without echoing it:
node scripts/check-academy-database-target.mjs
```

The DB guard will fail if DATABASE_URL is absent. Do not paste secrets into chat, command history, or reports. The server preflight is read-only, but it may report current infrastructure problems. After a correctly configured application is running:

```bash
node scripts/academy-runtime-smoke.mjs https://academy.titanzero.io
```

Do not run `prisma migrate reset`, `prisma db push --force-reset` or any inherited development Compose stack. Review and back up before migrations. Existing Field and Desk databases, containers, process files and Apache virtual hosts are out of scope.

## Major outstanding verification

- Install exact pnpm 10.0.0 in an isolated project context and execute locked dependency installation, backend type-checked build, frontend Next.js production build and test suite.
- Verify PostgreSQL 13 compatibility or deploy an isolated compatible PostgreSQL instance; inspect and run all Academy-only Prisma migrations after approved backups and database-target verification.
- Test Redis/BullMQ workers, MinIO permissions, TLS certificate, reverse proxy routing and end-to-end course-to-certificate journey.
- Validate organisation-level tenant isolation with actual database-backed tests before storing independent customer data.
- Confirm human approval provenance for assessment publication; this pass did not change curriculum or approval data.
