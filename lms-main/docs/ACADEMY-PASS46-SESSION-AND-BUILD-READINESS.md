# Titan Academy — Pass 46: session lifecycle and build readiness

## Source changes

- Refresh tokens are now rotated atomically: consume the prior row conditionally and create a new session row within the same Prisma transaction. Concurrent replay is rejected.
- Browser refreshes receive the new credential as an HttpOnly cookie; non-cookie API clients receive the replacement token in the JSON response. Consumers using body-provided refresh tokens **must persist the replacement** after every refresh.
- Email verification and password-reset tokens are consumed with conditional database writes, preventing concurrent reuse; password changes and revocation of user sessions happen in a single transaction.
- `/auth/refresh` has its own higher-limit per-IP throttle. Verification and password-reset endpoints use the existing stricter auth limiter.
- Cookie-only logout without a JSON body does not dereference undefined.
- A dependency-free pnpm lockfile audit checks 58 backend/frontend dependency specifiers against the pinned workspace lockfile. It cannot validate registry availability or package integrity.

## Compatibility and rollout notes

- No database schema or migration changes in this pass.
- Existing refresh tokens remain valid until their first use or normal expiry; after use, old tokens cannot be used again. Two near-simultaneous refresh requests made with the same token will produce **one success and one 401**. Coordinate client refresh requests and do not automatically retry the old token.
- This hardening does not implement device-family invalidation on detected replay. Evaluate an indexed session-family identifier and revocation strategy before claiming device compromise detection.
- Frontend Axios client already serializes refresh attempts locally; cross-tab synchronization is not yet implemented.
- Current database role and organisation authorization require live cross-tenant testing, regardless of source checks.

## Actual verification performed

- `node scripts/run-source-verification.mjs`: **15/15 offline scripts pass**.
- TypeScript 5.8.3 parser: **144/144 TypeScript/TSX files parsed**, not a typechecked build.
- `node --check scripts/*.mjs`: **24/24 modules parse**.
- Offline lockfile specifier audit: **58/58 package declarations match**.
- `npm view typescript version --fetch-retries=0`: **failed `EAI_AGAIN registry.npmjs.org`**, so fresh dependency installation and typechecking were not executed.

## Remaining deployment gates

1. On a safe staging host with package registry access, install the pinned pnpm release via an approved mechanism, run `pnpm install --frozen-lockfile`, generate Prisma client, and run `pnpm build` / backend tests. Inspect lifecycle scripts and dependencies before installing.
2. Verify the active PostgreSQL server version. Do not migrate the existing Field/Desk databases. Select a dedicated Academy database or isolated PostgreSQL instance if required by the migration chain.
3. On an isolated Academy test database, execute full migrations and test session refresh concurrency, stale reset/verify tokens, and role changes.
4. Verify worker processing, file storage, actual email delivery, account recovery and a full course-to-certificate journey.
5. Test cross-tab browser token refresh behavior before production traffic.
6. Run DirectAdmin DNS/TLS, Apache proxy and port checks on the actual server. Field and Desk must remain untouched.

**Deployment status:** source-verification only; **not production certified**. No live server files or databases were changed in this pass.
