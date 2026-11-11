# Central decision transport: authenticated server-only contract (Pass 18)

This is an **unmounted, disabled** HTTP client for a *future Central-provided* private authorization endpoint. It composes with `central-verified-completion.ts` only when that real endpoint has been implemented, configured, independently reviewed and authenticated.

## Transport trust boundaries

- The endpoint and bearer credential are server-controlled; the browser never supplies either.
- Requests are sent by HTTPS POST with an explicit redirect refusal, 500–10,000 ms timeout, no-cache semantics and one fresh unpredictable request ID. The request includes only the cryptographically verified OIDC issuer/subject and `academy` application ID.
- A successful response must be HTTP 200 JSON and contain **exactly** issuer, subject, requestId and an affirmative decision. The issuer/subject/requestId must equal the pending request, and the decision must contain only supported IDs and safe nonnegative revisions. Extra role, email, company override or other fields are rejected, not silently accepted.
- Network failures, invalid content, oversized bodies, stale/mismatched request IDs and denied decisions result in null. No credentials, JWTs or token contents are logged.
- The separate existing `central-verified-completion.ts` performs OIDC issuer/audience binding and current Skilled mapping, local membership, role and account checks before calling a revocable session issuer.

## Verification

Sixteen separate Vitest security suites cover success, wrong issuer/subject/nonce/audience, forbidden/redirect/HTML/malformed/oversized responses, injected privilege claims, invalid revision, negative Central authorization, network outage and scoped server credentials. CI also typechecks the backend and these tests.

## What this does NOT establish

The Central-side endpoint contract is **proposed**, not yet confirmed to exist. A bearer credential only authenticates the transport when Central verifies it and enforces application-specific scope, rate limits and permitted subjects. Reflected nonce and issuer fields are not cryptographic response signatures. A genuine backend-to-backend authenticated endpoint, revocation semantics, and multi-tenant integration tests remain REQUIRED. Do not treat this module as evidence of a working Central API or enable SSO based on injected mocks.

No app route, environment flag, production credential, database migration, real user/lesson content or assessment approval has been changed. Issues #71 and #68 remain open; the 1,267 assessments requiring human review and 16 unmapped lesson drafts remain blocked by curriculum CI.
