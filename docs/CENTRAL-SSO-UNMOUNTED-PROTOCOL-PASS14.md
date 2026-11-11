# Central sign-in protocol — unmounted verification pass 14

This pass reconciles the **pure protocol** portions of draft PR #107 against current Skilled `main`. No public Central route, callback, company link handler, account/session issue endpoint, login UI, environment flag or production mount has been integrated or enabled.

## Protocol elements

- Strict configuration validation for HTTPS issuer, configured JWKS and exact registered callback URI. No enabled Central configuration is required in the existing runtime.
- RS256-only ID token verification from a configured JWKS with issuer, audience, authorised party, expiry, issued-at, nonce and basic signing-key handling. This is not a live Central trust decision.
- Authorization Code with S256 PKCE, one-use random state/nonce/verifier, browser-binding comparison before code exchange, fixed backend token URL, and bounded timeout.
- Shared Redis state store uses `SET NX PX` and `GETDEL`; the in-memory store is test-only.
- Safe structured failure codes do not expose credential material.
- An existing signed RSA protocol suite and 12 independent domain-specific negative tests cover configuration, callback path, disabled configuration, replay, expiry, collision, Redis one-use semantics, malformed state, PKCE challenge/binding, and duplicate/expired callback behavior.

## Excluded deliberately

The old draft #107 `central-link.ts`, `central-routes.ts`, `central-sso.mount.ts`, `src/app.ts`, `env.ts` and fake Prisma changes have NOT been copied. Its draft link resolver accepts raw subjects, infers local company from an external ref and revokes *all* refresh sessions on unlink; this conflicts with the hardened issuer|subject identity and tenant-only session revocation already merged by PRs #131/#133. Wiring those old routes would risk bypassing current Central membership and linked-company controls.

Live Central/Logto endpoint discovery, JWKS keys, issuer, credentials, client IDs, logout policy, tenant membership and database transaction behavior are not verified. This code is **not** authority to enable Central SSO. A new route integration must compose the hardened tenant resolver and session issuer, and pass a live security review.

## Verification

The isolated workflow `skilled-central-oidc-unmounted-protocol` installs dependencies from the frozen lockfile, runs all signed-token/PKCE tests, generates Prisma types and typechecks the backend and protocol. This is deterministic test coverage only; real browser/Redis/PostgreSQL and provider behavior require staging exercises.

Issues #71 and #68 remain open. The strict curriculum gate remains blocked by independent human editorial approval requirements.
