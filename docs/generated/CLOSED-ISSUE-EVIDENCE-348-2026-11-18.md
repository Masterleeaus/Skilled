# Closed-issue evidence for batch #348 (2026-11-18)

Evidence that the fixes for closed issues #2 to #11 are present on `Main` at commit 41007b6. Each row cites the file or test checked. No code changed in this record.

| Issue | Finding | Evidence on Main |
|---|---|---|
| #2 | Install docs point at an existing env template and the backend-local `.env`. | `apps/backend/.env.example` and `apps/frontend/.env.example` exist. `README.md` line 44 copies `apps/backend/.env.example`. `docs/INSTALL.md` line 214 records the resolution. |
| #3 | Backend no longer exits on startup when MinIO is unreachable outside production. | `apps/backend/src/config/minio.ts` `initializeStorage()` rethrows only when `NODE_ENV === "production"`. Other environments log a warning and resolve `false`. |
| #4 | Backend lint uses ESLint flat config, not legacy `.eslintrc`. | `apps/backend/eslint.config.mjs` exists. `git ls-files` finds no `.eslintrc*` file. |
| #5 | Seed refuses to wipe without an environment guard. | `apps/backend/prisma/local-demo-seed-guard.ts` is called from `apps/backend/prisma/seed.ts` line 5 and 23. Guard test: `apps/backend/src/tests/local-demo-seed-guard.test.ts`. |
| #6 | Install docs use `prisma migrate deploy` and warn against `migrate dev`. | `docs/INSTALL.md` lines 108-110 (validate, status, deploy) and line 113 (no `migrate dev` on shared or production). `docs/PASS20-MIGRATION-PREFLIGHT.md` documents the preflight. |
| #7 | Stale root `package-lock.json` removed. | `git ls-files` finds no root `package-lock.json`. `pnpm-lock.yaml` is the lockfile. |
| #8 | Skipped suites now have documented setup. | `README.md` lines 58-65 list the test commands and state that CI runs disposable PostgreSQL-backed Vitest. `docs/CENTRAL-SSO-ADAPTER.md` line 204 gives the `DATABASE_URL` needed for the skipped DB test. Local bare runs still skip DB-gated suites, as before. |
| #10 | Root `1-init.sh` and `2-setup.sh` stubs removed. | `git ls-files` finds neither file at the repository root. |
| #11 | pnpm build-script allowlist present. | `package.json` `pnpm.onlyBuiltDependencies` lists esbuild, bcrypt, @prisma/client, prisma, @prisma/engines, sharp. |

Verification run: `git ls-files` checks and file reads only. No `pnpm install`, `tsc` or test run was made in this record.
