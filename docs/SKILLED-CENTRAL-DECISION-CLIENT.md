# Skilled client for Central's service-decision endpoint (issue #158)

Contract: Central `docs/SKILLED-SERVICE-DECISION-CONTRACT-PASS18.md` (Central PR #68).
Code: `apps/backend/src/modules/auth/central-decision-transport.ts`. Tests: `apps/backend/src/tests/central-decision-*.test.ts`.

## Configuration (operator only)

| Name | Meaning |
| --- | --- |
| `TITAN_SKILLED_DECISION_BEARER` | Server-held service credential, 32 to 1024 characters. Absent means the client is not created (unmounted). |
| `TITAN_SKILLED_DECISION_ENDPOINT` | Exact https URL ending in `/v1/integrations/academy/decision`. Required when the credential is set. |
| Issuer and client ID | Taken from the existing Central SSO settings (`CENTRAL_SSO_ISSUER`, `CENTRAL_SSO_CLIENT_ID`). |
| Organisation registry | One-to-one map from verified Central (Logto) organisation ID to Central internal organisation UUID, supplied by the operator. |

The credential is never read from a request, a browser value or a token. It is sent only in the `Authorization` header and never in the body or a log.

## Behaviour

- Request: `{applicationId:"academy", issuer, subject, organisationId, requestId}`. `organisationId` is the Central UUID from the registry. An unmapped organisation returns `null` before any network call.
- Response: accepted only for HTTP 200, JSON, at most 16 KiB, no redirect, exact top-level and decision fields, `allowed: true`, matching `issuer`, `subject` and `requestId`, and `decision.organisationId` equal to the Logto organisation that was asked about.
- Every other outcome (400, 401, 403, 503, network error, timeout, malformed body) returns `null`. The caller treats `null` as a denial.
- Timeout 4 seconds by default (500 ms to 10 s allowed). Redirects are refused.

## Open points for the owner

- The contract has no expiry or freshness field on the decision. Freshness rests on the revision fields. The "expired decision" case in issue #158 cannot be tested until Central defines an expiry. Nothing has been invented here.
- Central issue #71 fixtures are not merged yet. The tests use the contract examples and local fakes.
- The endpoint is not mounted in any route. Enabling it needs live credentials and the organisation registry, both owner decisions.
