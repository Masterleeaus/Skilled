# Pass 16 — Skilled OIDC production state composition and PostgreSQL replay tests

## Code integration
`createDurableOidcState` now combines the previously separate Prisma encrypted OIDC state writer and parameterized PostgreSQL `DELETE ... RETURNING` reader. The verifier receives one `save` / `consume` contract; no Prisma `deleteMany` count-only fallback is allowed. State, PKCE and browser cookies remain opaque, AES-256-GCM sealed and application-scoped. A second process cannot reuse a consumed browser transaction.

`createConfiguredSkilledOidcProvider` composes the real authorization-code PKCE implementation with the durable state adapter; it accepts only explicit OIDC configuration with a protected base64-encoded 32-byte state key, registered HTTPS callback and nonempty secrets. `SKILLED_CENTRAL_OIDC_ENABLED` defaults to disabled, and the provider remains unmounted in `app.ts`.

Additional modules provide expiry cleanup, callback metadata validation, secret-free audit fields and a readiness decision. Readiness deliberately remains false until database migrations, authenticated Central access decision transport, proxy rate limiting and two real tenants have been verified. A successful build is not equivalent to operational readiness.

## Verification
The dedicated GitHub Actions job starts a real PostgreSQL 16 service, applies ONLY the additive OIDC state migration in an isolated test database, and executes Prisma-backed tests of encrypted state persistence, wrong-browser rejection, one-use replay rejection across two separate database clients, expiry and key rotation failure. Other focused tests verify configuration, secret scrubbing, callback metadata, SQL parameterization, retention and feature-disabled behavior.

## Security limits and activation
OIDC remains disabled and unmounted; the identity provider, app registry and Central decision transport must be configured and verified by an operator. Do not treat test keys as deployment secrets. Existing password login remains the rollback route, and the published curriculum review gate remains unaffected. #71 and #68 remain open until actual login and logout across two isolated tenants are verified.
