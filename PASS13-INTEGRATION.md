# Pass 13: read-only Titan Zero service integration

Endpoint: `GET /api/titan/integration/organisations/:externalOrganisationRef/learners/:externalUserRef/skills` (static, unverified, checked 8 Nov 2026 against `apps/backend/src/modules/curriculum/integration.routes.ts`).

The response returns the external company reference under the key `companyRef`. See `apps/backend/src/RENAME-EXTERNAL.md`.

Service request headers:
- `x-titan-service: field-services` or `ai-workforce`
- `Authorization: Bearer <service-specific-secret>`

Configure `TITAN_FIELD_SERVICES_API_KEY` and `TITAN_AI_WORKFORCE_API_KEY` as independently generated secrets of at least 32 characters in the **backend server environment**. Do not put them in frontend environment variables. Use TLS and a private network or gateway with rate limits, audit logs, and key rotation in production.

The organisation must have a trusted `externalRef` set during provisioning. The learner path value is the **external user reference** (`externalUserRef`). The route maps it to the Academy user through a provisioned external identity link. It is not the Academy-local user ID. The API requires membership in the referenced organisation, returns only nonexpired verified competencies, and does not allow callers to create or approve competencies.

This is an initial integration contract, **not a complete identity federation**. Before live deployment, implement service-specific organisation scopes, externally mapped user identities, credential rotation, request audit and integration tests against the actual Field Services/AI Workforce applications. Secrets are service-wide, so a compromised service key could query any provisioned organisation; do not expose this endpoint publicly without gateway scoping.
