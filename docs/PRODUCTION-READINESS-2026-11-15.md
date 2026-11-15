# Production readiness audit, 2026-11-15

Status: read-only audit. No application code was changed.

- Baseline: `origin/Main` at `1b447a3` ("Remove completed Skilled merged-branch cleanup workflow").
- Method: code reading with file:line evidence, the repo's own typecheck, lint, test and build commands, and the open issues #35, #34 and #9 for context.
- Side effects: `pnpm install --frozen-lockfile`, `prisma generate`, and `next build` wrote only gitignored output (`node_modules`, `.next`, generated Prisma client). The tracked tree was clean before and after.

## Overall verdict: NOT READY for production launch

Three blockers remain. All three are process or verification gaps rather than defects found in the code paths reviewed. The code areas that were reviewed are mostly sound. Several risks below are cheap to fix and should go in before launch.

## Blockers (fix or formally accept before launch)

### B1. Backup, restore and migration rollout are unrehearsed
- Evidence:
  - `docs/runbooks/recovery.md:3` says backup and restore "have not been tested against a real PostgreSQL instance, and no recovery time or recovery point objective has been agreed."
  - `docs/runbooks/deployment.md:3` says the staging restore and deploy rehearsal "has not been performed."
  - The repo contains no backup automation, no Dockerfile and no deploy scripts. Migrations are applied by hand with `prisma migrate deploy` (`README.md:149`, `README.md:189-196`).
  - Open issue #35 (`[P1][ACA-022]`) tracks this.
- Suggested fix: take a `pg_dump -Fc` and a MinIO backup in staging. Restore both into a scratch database and run the integrity checks in `recovery.md` section 4. Record the RPO and RTO. Schedule backups in the environment. Only then run migrations, following `apps/backend/prisma/PREFLIGHT-ORDER.md`.

### B2. Current main has no end-to-end verification
- Evidence:
  - Open issue #9 (`[P1] Verify current main end to end: API, browser, learner and assessor flows`).
  - The browser suite (`apps/frontend`: `pnpm test:browser`) was not run in this audit. It needs a running API, PostgreSQL, Redis and MinIO.
  - The PostgreSQL-backed backend tests were not run either (see the test results below).
- Suggested fix: run `pnpm test:browser` and the PostgreSQL-gated backend tests (`SKILLED_CENTRAL_SESSION_PG_TEST=1`) against a staging stack with PostgreSQL 16 and the `titan_academy` role. Attach the reports to the release.

### B3. Regulated curriculum has no expert review
- Evidence: open issue #34 (`[P0][ACA-024] Obtain expert review for high-risk and regulated curriculum`).
- Scope note: this audit did not review curriculum content.
- Suggested fix: obtain and record sign-off for every high-risk or regulated course before learners can enrol in it. Gate publication on that record.

## Verdicts by area

| # | Area | Verdict | Summary |
|---|---|---|---|
| 1 | Env validation | Risk | Strong production guards. `NODE_ENV` defaults to `development`, which silently disables every production check. `MINIO_USE_SSL` is not enforced in production. |
| 2 | Security headers and CORS | Ready (API), Risk (frontend) | API uses `helmet()` and a single-origin CORS policy with loopback-only trust proxy. The frontend sets no CSP or other headers, and the Apache config is not in the repo. |
| 3 | Error handling | Risk | Stack traces are never sent to clients. Framework errors (malformed JSON, oversize body) are mapped to 500. |
| 4 | Logging of secrets | Ready (app logs), Risk (access log and rotation) | No token or password logging found. Morgan logs full URLs including query strings, and file logs have no rotation. |
| 5 | Auth and session | Risk | Strong hashing and rotation. Refresh-token reuse does not revoke the session family. Reset and verification tokens are stored in plaintext. Login rate limit is per IP only. |
| 6 | Rate limits | Risk | Limiters use in-process memory, so limits are per instance. Redis is available but not used for this. |
| 7 | Payment webhook and idempotency | Ready | Raw-body signature verification, claim-based idempotency, and amount and currency checks on fulfilment. Minor: the Stripe API version is not pinned. |
| 8 | File upload and video | Ready (with caveats) | Video and assignment uploads check MIME, extension and magic bytes, and enforce quotas. Playback uses a path-scoped grant cookie. No malware scanning. Quotas are per process. |
| 9 | Database migrations | Risk | 20+ migrations with manual preflight scripts. Schema and migration parity passes in `test:source`. Rollout depends on B1. |
| 10 | Health and backup | Health: Ready. Backup: Blocker | Health endpoint exposes no secrets. Backup is covered by B1. |
| 11 | Frontend build and metadata | Ready (minor risk) | `next build` passes and metadata checks pass 11/11. A missing `NEXT_PUBLIC_SITE_URL` falls back to `localhost`. |
| 12 | Socket.io | Risk (low) | No auth middleware on connections. No events are emitted today. |
| 13 | Central SSO | Off by default | When enabled, OIDC authorisation codes will appear in the access log (see area 4). |

## Area details

### 1. Environment validation (Risk)
Evidence: `apps/backend/src/config/env.ts`
- Ready: production requires the `titan_academy` database and role (`:106-117`), an HTTPS `CLIENT_URL` (`:118-120`), Stripe keys (`:121-127`), SMTP TLS (`:132-134`), 32-character JWT secrets that differ (`:22-23`, `:82-84`), and a credential-free `REDIS_URL` (`:86-95`). The error output prints field messages only, not values (`:142-146`).
- Risk: `NODE_ENV` defaults to `development` (`:12`). If the deployment omits it, all the production checks above are skipped, and so are the secure cookie flags (`apps/backend/src/modules/auth/auth.controller.ts:20-27`, `apps/backend/src/modules/courses/module.routes.ts:289-293`).
- Risk: `MINIO_USE_SSL` defaults to `false` (`:32-35`) and is not checked in production, even though the template says `true`.
- Risk: `TUTOR_ENABLED` is read straight from `process.env` (`apps/backend/src/app.ts:78`), bypassing validation.
- Fix: make `NODE_ENV` required with no default, or add a separate required `DEPLOY_ENV`. In production, require `MINIO_USE_SSL=true`. Validate `TUTOR_ENABLED` through the schema.

### 2. Security headers and CORS (Ready for API; Risk for frontend)
Evidence: `apps/backend/src/app.ts`
- Ready: `app.set("trust proxy", "loopback")` (`:40`). `helmet()` is applied before CORS (`:42-43`). CORS allows only `CLIENT_URL` with credentials (`:43`). Socket.io uses the same origin (`server.ts:17`).
- Risk: `apps/frontend/next.config.js:1-8` sets no `headers()`, and there is no `middleware.ts` in `apps/frontend/src`. No CSP, `frame-ancestors`, HSTS or `nosniff` is set on the frontend. The Apache configuration that the comment in `app.ts:38` refers to is not in the repo, so these headers cannot be verified.
- Fix: add `headers()` to `next.config.js` with a CSP, `frame-ancestors 'none'`, `Referrer-Policy`, `X-Content-Type-Options` and HSTS. Alternatively, commit the Apache config and check it in the deployment checklist.

### 3. Error handling (Risk)
Evidence: `apps/backend/src/middleware/errorHandler.ts`
- Ready: unknown errors return a generic `Internal server error` (`:46`). Stacks go only to the log (`:42-44`). Prisma `P2002` and `P2025` are mapped (`:29-37`).
- Risk: the handler ignores `err.status` and `err.type`. A malformed JSON body or an oversize body is raised by `express.json` (`app.ts:48`), so it reaches this handler and returns 500 with an error-level log entry. Clients see the wrong status, and attackers can fill the error log cheaply.
- Risk (minor): the Prisma `P2002` response echoes `err.meta.target`, which names the constraint columns (`:31-33`).
- Fix: before the generic branch, honour `err.status` for body-parser errors (`400` for parse failures, `413` for oversize) and return a fixed message. Keep `meta.target` out of the response.

### 4. Logging of secrets (Ready for app logs; Risk for access log and rotation)
Evidence: `apps/backend/src/config/logger.ts`, `apps/backend/src/app.ts:50`
- Ready: no logging of passwords, tokens or the Authorization header was found. Stripe errors are logged as `String(error)` (`stripe.webhook.ts:37`, `:55`).
- Risk: morgan `combined` logs `req.originalUrl`, including the query string (`app.ts:50`, `logger.ts:43`). The central OIDC callback receives `code` and `state` in the query (`apps/backend/src/modules/auth/central/central-routes.ts:69`, `central-browser-lifecycle.ts:83-92`). When Central SSO is enabled, authorisation codes would be written to `logs/combined.log`.
- Risk: the file transports have no size limit or rotation (`logger.ts:22-28`), and the logs go under `process.cwd()/logs`.
- Fix: log the path without the query string (`morgan` token `:url` replaced with a path-only token). Add `maxsize` and `maxFiles` to both file transports, or ship logs to the host's logging system.

### 5. Authentication and session handling (Risk)
Evidence: `apps/backend/src/modules/auth/*.ts`, `apps/backend/src/middleware/authenticate.ts`
- Ready: refresh tokens are stored as hashes (`auth.service.ts:113`). Rotation uses a conditional update, so concurrent replay fails (`:131-135`). `authenticate` re-reads the user on every request, so disabled or deleted accounts lose access immediately (`authenticate.ts:32-40`). Password reset revokes every session (`auth.service.ts:204-206`). The refresh cookie is `HttpOnly` and `SameSite=Lax`, with `Secure` in production (`auth.controller.ts:22-29`). The frontend keeps the access token in memory only (`apps/frontend/src/store/auth.store.ts:20`).
- Risk: a replayed, already-rotated refresh token returns 401 but does not revoke the session family (`auth.service.ts:114-119`). If a token is stolen and the legitimate user then refreshes, the attacker keeps a live token.
- Risk: email-verification and password-reset tokens are stored in plaintext (`auth.service.ts:52-60`, `:175-180`, compared directly at `:72` and `:204`). They are 256-bit random values (`token.utils.ts:34-37`), so guessing is not the issue. A database read exposes live reset tokens for up to one hour (`RESET_TOKEN_TTL_MS`, `:16`).
- Risk: login and password-reset limits are per IP only (`auth.routes.ts:9-15`), with no per-account lockout.
- Risk (low): the video playback signing key is an HMAC of `JWT_ACCESS_SECRET` (`apps/backend/src/modules/courses/video-playback.service.ts:20`). Key reuse across purposes means rotating the access secret also breaks playback.
- Fix: on refresh replay, revoke every token for that user or device. Store SHA-256 hashes of verification and reset tokens and compare hashes. Add a per-account failure counter. Derive the playback key with a separate secret.

### 6. Rate limits (Risk)
Evidence: `apps/backend/src/middleware/globalRateLimit.ts:26-33`, `apps/backend/src/modules/auth/auth.routes.ts:9-27`, `apps/backend/package.json`
- Ready: the global ceiling is per IP (default 1000 per 15 minutes), `/api/health` is exempt, and the Stripe webhook sits before the limiter (`app.ts:47` before `:53`) so Stripe retries are never throttled.
- Risk: `express-rate-limit` uses its default in-memory store. `rate-limit-redis` is not a dependency. Each instance keeps its own counters, so the effective limit scales with instance count.
- Fix: add a Redis store to the global, auth and refresh limiters. Redis is already configured (`config/redis.ts`).

### 7. Payment webhook and idempotency (Ready)
Evidence: `apps/backend/src/modules/payments/stripe.webhook.ts`, `payment.service.ts`, `apps/backend/src/app.ts:47-48`
- Ready: the route is registered with `express.raw` before JSON parsing (`app.ts:47-48`). The signature is checked with `constructEvent` on the raw body (`stripe.webhook.ts:22`). A checkout claim is a partial unique index, so concurrent requests get a conflict (`payment.service.ts:10-12`). Stripe calls use an idempotency key derived from the claim (`:30-34`). Fulfilment re-reads the session from Stripe and rejects a different currency or amount (`:267-290`, `:282-287`). Transient failures return 503 so Stripe retries (`stripe.webhook.ts:57`).
- Risk (low): `new Stripe(key)` does not pin `apiVersion` (`stripe.webhook.ts:9`). Pin it to the version the account is tested against.
- Coverage: no live webhook delivery was exercised in this audit. The offline `test-payment-security-contract.mjs` check passed in `test:source` (see below).

### 8. File upload and video (Ready, with caveats)
Evidence: `apps/backend/src/modules/courses/video-upload.service.ts`, `apps/backend/src/modules/assignments/assignment-upload.service.ts`, `apps/backend/src/modules/courses/caption-track.service.ts`, `apps/backend/src/modules/courses/module.routes.ts:282-296`
- Ready: video upload checks the MIME type and extension (`video-upload.service.ts:155-160`, `:211`), the magic bytes (`:175-201`, `:214`), and a 500MB cap (`:17`, `:154`). Temporary files go to a private `0700` directory that is checked at startup (`:36-45`). An in-flight byte budget is enforced per user and is released on close (`:109-140`). Assignments use a per-extension magic-byte table (`assignment-upload.service.ts:33-53`, `:200`). Captions require `WEBVTT` content (`caption-track.service.ts:70-76`). Playback uses a path-scoped, `HttpOnly`, `SameSite=Strict` grant cookie, so no token appears in a URL (`module.routes.ts:282-296`).
- Caveat: no malware scanning, transcoding or re-encoding. Uploaded videos are served as-is.
- Caveat: quotas and the budget are in process memory (`video-upload.service.ts:109-140`). With several instances, each instance enforces its own quota.
- Caveat: no assignment attachment download route exists in `assignment.routes.ts`, so attachment serving was not reviewed. Any future route should use the same grant-cookie pattern.
- Fix: scan uploads (for example ClamAV) before a file is made available, and move quotas to Redis if the API scales out.

### 9. Database migrations (Risk)
Evidence: `apps/backend/prisma/schema.prisma`, `apps/backend/prisma/migrations/` (20+ folders), `apps/backend/prisma/disabled-migrations/`, `apps/backend/prisma/preflight-*.sql`, `README.md:189-196`
- Ready: schema and migration parity is checked (`test-schema-migration-parity.mjs` passed in `test:source`). Destructive changes have preflight scripts.
- Risk: migrations are applied by hand and need a backup first (B1). The `disabled-migrations/` folder holds two migrations that must never be applied. Keep it out of the migrations path in the deploy tooling.
- Fix: run `prisma migrate deploy` only from a release job that requires a recorded backup ID and the preflight sign-off. Rehearse it on staging first.

### 10. Health and backup endpoints
- Health (Ready): `GET /api/health` (`apps/backend/src/routes/health.route.ts:9-48`) checks the database, Redis and storage. It returns only `ok` or `down`, does not require auth, and is exempt from rate limits. Returns 503 when any dependency is down.
- Risk (minor): no separate liveness endpoint. A database outage will cause a load balancer to remove the instance, which may be the wrong response.
- Backup (Blocker): see B1.

### 11. Frontend production build and metadata (Ready, minor risk)
Evidence: `apps/frontend/src/app/layout.tsx:7`, `apps/frontend/next.config.js`
- Ready: `next build` completed and generated 80+ routes (see below). `verify:metadata` passed 11/11. The Open Graph image exists in `public/`.
- Risk (minor): `metadataBase` defaults to `http://localhost:3000` if `NEXT_PUBLIC_SITE_URL` is not set at build time (`layout.tsx:7`). Share URLs would then point at localhost. Make `NEXT_PUBLIC_SITE_URL` required for production builds.
- Minor: `public/` has no `robots.txt` or sitemap. Decide whether the site should be indexed.
- Minor: `images.remotePatterns` allows only `localhost` (`next.config.js:4`). Add the production image host when one is used.

### 12. Socket.io (Risk, low)
Evidence: `apps/backend/src/server.ts:14-23`
- The server accepts connections with no authentication middleware. The only handlers log connect and disconnect, and no code emits events, so there is no data exposure today. Any future emit would be unauthenticated.
- Fix: add an auth middleware that verifies the access token and the account (as `authenticate` does) before any event is wired.

### 13. Central SSO (off by default)
- Evidence: `apps/backend/src/config/env.ts:72-75`, `apps/backend/src/app.ts:57-58`. The flag defaults to `false`, and `mountCentralSso` mounts nothing unless it is `true`.
- When enabled, the query-string logging issue in area 4 applies. Fix that before enabling it.

## Test and typecheck results (run on `origin/Main` 1b447a3)

| Command | Result | Notes |
|---|---|---|
| `pnpm install --frozen-lockfile` | Pass | 661 packages. Build scripts skipped for `msgpackr-extract` and `unrs-resolver` (not needed for the checks below). |
| `apps/backend`: `pnpm prisma:generate` | Pass | Client v6.19.3. |
| `apps/backend`: `pnpm exec tsc --noEmit` | Pass | Exit 0. |
| `apps/backend`: `pnpm typecheck:tests` | Pass | `tsconfig.test.json`. |
| `apps/backend`: `pnpm lint` | Pass | `--max-warnings=0`. |
| `apps/backend`: `pnpm test` | Fail | Vitest: 1647 passed, 122 skipped, 18 files failed. The failures are all `central-session-pg-*` tests, which throw "Real PostgreSQL security tests require disposable CI DB" unless `SKILLED_CENTRAL_SESSION_PG_TEST=1`. CI sets that flag in `.github/workflows/skilled-ci-gates.yml`, so this is an environment issue, not a regression. Node tests: 124 of 125 passed. The failure is `tests/pass22-inactive-identity.test.cjs`, a static source-text guard. It expects the fragment `const identity = await prisma.academyExternalIdentity.findUnique` in `integration.routes.ts`, which the handler no longer contains. The behaviour is still present through `resolveScopedIdentity` at `integration.routes.ts:96`, followed by the learner check at `:105-110`. The guard is stale and should be rewritten to match the current code. |
| `apps/frontend`: `pnpm typecheck` | Pass | `tsc --noEmit`. |
| `apps/frontend`: `pnpm lint` | Pass | `--max-warnings=0`. |
| `apps/frontend`: `pnpm test` | Fail | Vitest: 8 tests passed. `tests/unit/nav-links.test.ts` reports "No test suite found" because it uses `node:test` syntax, which vitest does not run. Fix by moving it to the `test:unit` script or converting it to vitest. |
| `apps/frontend`: `pnpm build` | Pass | Next.js production build completed. The build and `prebuild` step left no changes in tracked files. |
| `apps/frontend`: `pnpm verify:metadata` | Pass | 11 of 11 checks. |
| root: `pnpm test:source` | Pass | 44 of 44 offline verification scripts. Includes payment security, video upload safety, private video playback, migration readiness, schema parity and the env template contract (52 runtime names checked, 0 missing). |

Not run in this audit:
- `pnpm test:browser` (frontend) and the PostgreSQL-gated backend tests. Both need running services (see B2).
- `pnpm curriculum:ci` (root). It writes a report to `build/`.
- GitHub check-run status for `Main`. The GraphQL endpoint is blocked in this session.

## Scope limits
- No live deployment was inspected. Apache, systemd, DNS, TLS and the production database were not reviewed.
- Curriculum content was not reviewed (see B3).
- Findings are from code reading plus the commands above. No penetration test was run.
