# Skilled Pass 18 — Central authenticated service decision wire contract

**Cross-repository integration:** Central PR #68 adds POST `/v1/integrations/academy/decision` behind `TITAN_SKILLED_DECISION_BEARER`; Skilled's client now supports that exact endpoint and an operator-controlled internal-organisation UUID resolver.

## The trust boundary

- Central's database organisation primary key (UUID) is not interchangeable with its Logto organisation ID. The operator maintains `SKILLED_CENTRAL_ORG_REGISTRY_JSON`, mapping provisioned Logto organisation IDs to Central UUIDs.
- The new `createCentralOrganisationSelector` derives a single company from the verified OIDC issuer/subject and existing company-scoped `AcademyExternalIdentity`, `CompanyMember` and verified `CentralCompanyLink` records. Zero or multiple matches **deny** rather than guessing an organisation. It never searches by email.
- The extended `createAuthenticatedCentralDecisionClient` requests the actual Central organisation UUID through a backend callback, while keeping a separate bearer service credential, exact issuer, subject and a fresh correlation ID.
- The response must match the authenticated original OIDC subject/issuer/request ID and the exact current local account/revision contract. Existing `createCentralRuntimeDependencies` continues to verify decisions against local company mappings on issue and on subsequent session access.
- Central's new endpoint evaluates `academy` `session:open` via `CentralAccessService` within a row-level-security read-only snapshot. It responds with the verified Logto organisation ID for the local product.

## Deployment / activation limits

The new service endpoint is opt-in and requires operator secret provisioning in **both** repositories, HTTPS reverse proxy isolation and a verified Central UUID registry. Real service credentials, data migration and two-company replay/login/logout rehearsal have not been performed here. Skilled's OIDC route remains unmounted. Do not treat source integration as live SSO or close issue #71 yet.

## CI

Six new focused suites exercise exact UUID selection, ambiguous identity denial, revoked links, mismatch rejection, credential-bearing POST requests and existing decision response validation. Existing transport and runtime suites also run with Prisma generation and backend TypeScript.

Legacy client callers without the explicit UUID resolver remain supported for existing standalone tests; the **new Central endpoint will refuse** their requests without a Central organisation ID.
