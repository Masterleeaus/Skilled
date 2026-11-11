# Skilled Pass 15 — verified OIDC code flow and durable one-use state

**Status:** implemented backend components, not mounted or switched on. Supports Skilled issue #71 and Central integration #27/#28/#29.

## Actual production path
This pass follows Central's published OIDC implementation contracts, adapting their PKCE, AES-256-GCM state sealing, RS256 ID-token requirements and verified issuer/audience/nonce checks for the Skilled TypeScript backend. It adds `SkilledOidcLoginState`, an isolated table holding SHA-256 state and browser-binding digests plus sealed PKCE and nonce values, with a bounded expiry. The backing migration is additive only and is not deployed.

`createPrismaOidcStateStore` provides persistence. `createAtomicOidcStateReader` consumes state using one database `DELETE ... RETURNING` statement with bound query parameters: only exactly the matching state + browser digest + `academy` application + unexpired row can return nonce and PKCE verifier. This ensures simultaneous callbacks can never both consume state in PostgreSQL. An AES-256-GCM auth tag and application/state/field associated data prevent moving sealed values across columns or accounts.

`createSkilledVerifiedOidcLogin` performs the Authorization Code + PKCE setup, server-configured OpenID metadata discovery, bounded code exchange with client authentication, JWKS retrieval and cryptographic RS256 token verification. The returned identity contains only issuer, subject, configured audience and the `academy` application ID. Token-algorithm confusion, incorrect signature, unknown key, issuer mismatch, expired/future/old token, wrong nonce or mismatched audience are refused.

## Integration requirements
The existing unmounted `createSkilledCentralOidcRouter` can accept the `begin`/`complete` methods from `createSkilledVerifiedOidcLogin`. A caller must compose the state writer and *atomic* state reader into one `store` object, obtain a 32-byte random OIDC state encryption key from a protected secret source, configure the actual issuer/Logto client registration and callback URL, and only then inject the authenticated Central authorisation service and verified Skilled account resolver/session issuer.

**Do not use client-chosen tenant IDs or email-based identity matching.** The current Central access-decision transport and live two-organisation account selection are not yet independently verified. No public route or production login is enabled by this pass, and existing password login continues to work.

## Evidence
Ten new cryptography and protocol suites plus previous OIDC/browser + local session regressions run in GitHub CI. PostgreSQL was not executed in a live tenant environment; the atomic SQL contract must be integration-tested with a real PostgreSQL instance before enabling an OIDC callback. The source has no embedded key or live credentials. Rollback consists of leaving the new route unmounted and preserving the existing password-login path.

**Still open**: Skilled #71, #68; Central #27–29. Curriculum assessments remain unpublished pending human approval.
