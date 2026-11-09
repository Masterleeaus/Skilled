# Skilled Pass 13 — Central session HTTP boundary and handoff

**Status: source implementation, not a live OIDC integration.**

## Functional components

- `central-session-cookie.ts` defines the exact **academy_sid** host-only, secure, HttpOnly, SameSite=Lax cookie mandated by Central's own `apps/control-api/src/oidc-cookie-policy.mjs`. Parsing rejects duplicate/malformed or oversized cookie headers; token values are opaque and random.
- `central-session-http.ts` is an opt-in Express router exposing **GET /session** and **POST /logout**, requiring an explicit `enabled:true` and an exact configured HTTPS origin. Logout rejects cross-site and same-site origins and checks a current session before revoking. GET logout and unexpected methods are rejected; no raw session token is returned.
- `central-session-guard.ts` is an entirely separate route-authorization guard for opaque Central-derived cookies. Existing JWT bearer middleware is unmodified; it never interprets `academy_sid` as a JWT.
- `central-verified-handoff.ts` accepts only an already cryptographically verified OIDC callback principal supplied by a trusted adapter. It checks issuer, audience and the `academy` wire application ID; then resolves the account via current Central and Skilled checks before requesting a new local session and returning a Central-compliant cookie.

## Security constraints

**None of these adapters is mounted in `app.ts`**. Only a trusted Central OIDC callback may call the handoff: the handoff is not itself an ID-token validator, OIDC state store or bearer authorization endpoint. Never pass an HTTP request body containing `allowed:true` into it. Its injected readers must use verified Central transport; account/email matching and client-selected tenant IDs are forbidden.

The cookie name follows Central's established `academy_sid` contract, not a different prefixed name. Cookies require TLS and no Domain attribute. The status endpoint emits user ID, company ID and current role, not email or raw credentials. Logout clears only the Skilled cookie; a separately tested RP/global logout is still needed.

## Tests

24 HTTP scenarios cover disabled feature flag, valid/unknown/duplicate/malformed cookies, legitimate status, revocation, missing/foreign origin and Sec-Fetch-Site headers, unsafe HTTP methods and exact origin matching. The integration suite also verifies trusted handoff and separate middleware; session-store and company-link tests run in the same CI job.

## Still required before activation

Central's actual OIDC ID token verification and nonce/state, durable callback state, signed service-to-service access transport, multi-organisation selection, shared deployment configuration, client integration, production database migrations and live two-tenant validation have not been completed. No live route, customer login or deployment is claimed. Existing password authentication remains the rollback.

Issue #71 remains open.
