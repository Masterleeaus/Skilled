# Central browser HTTP lifecycle — Pass 19

This pass provides a **real Express router implementation** for the Central browser lifecycle: `GET /start`, `GET /callback`, `GET /session` and `POST /logout`. **It is intentionally unmounted** in Skilled `app.ts`. The router must be mounted under `/auth/titan/academy` only after genuine Central authorization and account scope verification is ready, with the callback URL registered with the real identity provider.

## Security controls

- Start creates a random per-browser correlation secret, stores it in an HTTPS-only, HttpOnly, SameSite=Lax cookie scoped to `/auth/titan/academy` with a five-minute maximum life, and redirects only to an HTTPS Authorization Code + S256 PKCE URL returned from the trusted provider.
- Callback enforces navigation metadata, verifies correlation cookie uniqueness and well-formed OIDC state/code, clears the correlation cookie on success or failure, and invokes the **already verified** OIDC / Central decision / tenant session chain. After a successful session result, it sets the host-only opaque Skilled session cookie and redirects to a fixed configured origin. No browser-supplied post-login redirect is accepted.
- Session inspection uses the existing opaque token parser and injected session-store `authenticate`, which must check current company, membership, Central authorization and revocation. It returns only local user ID, company ID and local role, not Central credentials.
- Logout requires a browser request `Origin` exactly matching the server-configured HTTPS origin. It revokes the supplied session and clears the browser cookie even if the remote backing store is unavailable. Requests without the expected Origin fail closed.
- Failure responses contain generic messages without tokens, subjects, tenant existence or provider error details. Responses are marked `no-store`.

## Verification

Eighteen separate Supertest/Vitest suites cover HTTPS redirects, cookie security, misconfigured provider responses, provider outages, correct callback completion, missing and duplicate correlation cookies, invalid state, Origin/iframe rejection, authorization denial, session visibility, missing/revoked sessions, logout revocation, CSRF Origin requirements and idempotent cookie clearing. CI also runs full backend and scoped TypeScript checking.

## Release blockers

This router **must not be mounted** until a real authenticated Central decision endpoint confirms the contract in `CENTRAL-AUTHENTICATED-DECISION-TRANSPORT-PASS18.md`; the application has correctly configured callback/issuer/audience and complete server-to-server scope controls; HTTP rate limiting, production proxy/TLS, real two-tenant and concurrent revocation testing, and session-cookie compatibility are validated in staging. In particular these tests use trusted injectable fakes, NOT live Central and NOT a production tenant.

The previous password login remains untouched. No assessment approvals or course mappings are changed; issue #71 remains open.
