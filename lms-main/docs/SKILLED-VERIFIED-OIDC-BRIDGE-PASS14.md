# Skilled Pass 14 — Verified-only OIDC browser bridge

## What this actually does
The new unmounted `createSkilledCentralOidcRouter` provides the exact GET
`/auth/titan/academy/start` and GET `/auth/titan/academy/callback` route shapes required by Central's `packages/control-plane/src/applications.ts`. It uses the matching Central `titan_academy_oidc_binding` browser correlation cookie and only returns a Central-compatible `academy_sid` session cookie after three separate trusted backend steps:

1. The injected OIDC login provider `begin` starts authorization and binds a server-generated 256-bit browser token to its durable state record.
2. The injected provider `complete` MUST consume that state exactly once, verify PKCE, issuer, audience, ID-token signature, token expiration and nonce, and return a verified issuer/subject.
3. An authenticated server-side Central authorization dependency returns the current allowed Central access decision, and Skilled's existing account resolver and session handoff issue a revocable local session.

The HTTP adapter itself does **not** implement cryptographic OIDC verification. It is intentionally a composition boundary and **has not been mounted in app.ts**: no live authentication claims. Do not inject a mock validator or browser-provided identity in production.

## Security controls
Exact raw route paths reject encoded and traversal variations. Only GET handles start and callback, no browser-provided company/user IDs are accepted, and unknown query keys or duplicate state/code are refused. Browser bindings are random, host-only, Secure/HttpOnly/SameSite=Lax, short-lived and reject duplicates. Login redirects require an exact allowlisted HTTPS identity-provider origin. Failure of Central authorization, OIDC verification or local session issuance returns no authenticated cookie. A separate per-process rate limit supplements required proxy-level global controls; this is not sufficient for a distributed deployment.

The new module is independent of existing password login, service credentials and all editorial curriculum publication gates. Existing `central-session-http.ts` handles status and logout separately.

## Test evidence and deployment requirements
Eleven separate test suites cover registered path checks, cookie parsing, strict callback input, provider redirects, rate-limiting, feature-disabled behavior, provider start, successful callback, denied OIDC/Central access, browser isolation and unsafe HTTP methods. CI also executes existing session and account-resolution suites, Prisma schema validation and backend TypeScript.

**Activation blockers:** Import Central's real OIDC client/verifier/state-store or implement a reviewed equivalent with persistent state; deploy/verify trusted Central decision transport, local product session migration, same-origin HTTPS deployment, production proxy rate controls, exact registered callback URI, approved feature flag and rollback plan. Validate two real tenants end-to-end. Do not close Skilled #71 or Central #27–29 until those checks are complete.
