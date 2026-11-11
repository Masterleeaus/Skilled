# Central browser security hardening — Pass 21

This pass hardens the **existing unmounted Express router**, not a new SSO implementation. The previous version accepted any HTTPS authorization URL returned from its provider adapter and trusted a cookie string returned by the completion adapter. Both are security-sensitive trust boundaries, even if the adapters are expected to be trustworthy.

## New enforced invariants

- A server-configured `authorizationOrigin` must exactly match the selected provider's HTTPS origin. No query strings, credentials, fragments, arbitrary paths or redirects to other domains are allowed.
- The OIDC authorization redirect must contain one and only one each of `client_id`, `redirect_uri`, `response_type=code`, `state`, `nonce`, `code_challenge`, `code_challenge_method=S256`. State/nonce/challenge are URL-safe 43-character values. The callback URI is fixed to the configured Skilled origin and callback path.
- The completion result may create only the canonical host-only opaque `academy_sid` cookie, Secure, HttpOnly, SameSite=Lax, Path=/ and with an allowed TTL. No Domain, CRLF injection, arbitrary Set-Cookie attributes, expired result or longer-than-supported TTL is accepted.
- Existing password login and the Central session store remain unchanged. The OIDC router is still unmounted in `app.ts`.

## Measurable regression coverage

18 independent adversarial tests exercise other HTTPS hosts, embedded credentials, fragments, parameter pollution, wrong callback, missing PKCE, malformed nonce, invalid issuer configuration, cookie domain/attribute injection, CRLF smuggling, expired completion and invalid session tokens. A dedicated CI workflow additionally runs the 18 existing Supertest scenarios and both backend and scoped TypeScript checks.

## Deployment boundary

These changes **do not authorize enabling Central SSO**. A real authenticated Central authorization endpoint, credential scoping, callback registration, trusted JWKS and issuer, exact account mapping, rate limits, live multi-tenant browser rehearsals and production operations review are still required. All tests use injected internal clients with no external Central account. The curriculum human-approval gate stays untouched.
