# Skilled Central OIDC-to-tenant completion — Pass 17

An **unmounted** server-only integration boundary now composes verified OIDC completion, an independently authenticated Central authorization decision, current Skilled company/account/membership checks and the existing opaque, locally revocable Central session issuer.

## Source of authority

The OIDC provider must verify signing key, issuer, audience, state, PKCE and nonce before returning a principal. The injected Central decision transport is required to be authenticated server-to-server and to bind its decision to the exact verified `issuer` and `subject`; returned organisation and local account identifiers are never read from HTTP requests. The pre-existing `resolveSkilledCentralAccount` additionally rechecks current Central revisions, exact local mapping, membership, active account, email verification and **local** role. The existing session store must recheck tenant membership and Central access on subsequent requests and support revocation. This new composition DOES NOT create a competing user registry or an alternative login flow.

## Tests

Sixteen independent scenario files prove the successful local-user session, mismatched OIDC principal issuer/audience/application, mismatched Central subject/issuer, denied/missing authorization, provider/decision failures, Central/membership revocation, disabled user, removed tenant binding, session storage failure and preservation of local roles. All use injected deterministic trusted dependency fakes, not a live Central service.

## Remaining limitations

**Do not mount this service on an HTTP route or turn on Central SSO yet.** The authenticated decision transport implementation, true browser redirects, cookie issuing and clearing, live Central membership/entitlements, revocation propagation, two-tenant real PostgreSQL and concurrency rehearsal, deployment callback configuration and operational readiness require separate integration and validation. Passing these injected dependency tests does not verify that a network transport is authenticated or that session issuance is atomic under simultaneous revocation. Issues #71 and #68 remain open. The curriculum gates are independent and unchanged.
