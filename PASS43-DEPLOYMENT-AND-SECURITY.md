# Titan Academy — Pass 43 (source-only, not installed)

## Verified source improvements

1. Protected requests now validate current Academy user account state (active, email verified, not soft-deleted) and current database role, instead of trusting stale access-token role claims. Database errors remain operational failures rather than being misclassified as invalid credentials.
2. Existing Vitest auth integration suite gained tests for deactivated access tokens and live role demotion. **Tests added but not executed** because backend dependencies and database are unavailable here.
3. Static migration preflight now checks ordering, table creation, index/FK targets, destructive DDL patterns and timestamp collisions. Added exact Prisma model-to-migration-created-table parity test.
4. Introduced a separately named Redis/MinIO-only deployment candidate, requiring isolated credentials and listening only on loopback. The original developer stack remains available under `docker-compose.local-dev.yml` but is explicitly unsuitable for DirectAdmin production.
5. Preserved destructive/lockfile-modifying legacy bootstrap scripts under `docs/legacy-bootstrap`; safe root wrappers refuse execution.
6. Added production environment template and detailed DirectAdmin-compatible deployment preflight without real secrets or modifications to Field/Desk.

## Actual local verification

- `node scripts/run-source-verification.mjs`: 11/11 scripts passed (includes curriculum checks and new migration/security/deployment contracts).
- `node scripts/audit-migration-readiness.mjs`: 13 migrations, 42 tables, no static errors, one same-timestamp warning.
- Schema-to-migration parity: 42 models == 42 created tables.
- JS script syntax checks passed; 137 TS/TSX files parsed without syntax errors using globally available TypeScript 5.8.3 (not the locked compiler, not a semantic typecheck).
- Docker Compose candidate parsed as YAML; no Docker/container runtime test completed.
- Shell wrappers passed `bash -n`.
- Original curriculum source files are byte-identical to Pass 42.

## Not verified / no claims of readiness

`pnpm install --frozen-lockfile`, `prisma validate/generate`, `tsc`, `next build`, live database migrations, PostgreSQL 13 compatibility, auth integration tests, admin/course browser journeys, file storage, SSL and process recovery have **not been run**. npm registry hostname resolution failed in the execution environment. No installation, live database, or DirectAdmin changes occurred.

## Priority for Pass 44

1. On an isolated supported Node/PG staging runtime, install locked pnpm dependencies; validate Prisma and run 13 migrations against an empty dedicated test database.
2. Address any Next 15 / eslint-config-next 16 and backend TypeScript 7 compatibility failures from **actual builds**.
3. Run the new auth tests plus cross-tenant negative tests in isolation and fix failures.
4. Test Academy-specific Redis, MinIO and background jobs without touching existing apps; pin and verify image versions.

See `docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md` for safe server sequence.
