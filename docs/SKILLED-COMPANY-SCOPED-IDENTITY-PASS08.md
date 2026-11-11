# Skilled Pass 8 — company-scoped external learner identity resolution

Scope: Skilled issue #68, related Central integration issue #71.

## The production change

The service skills read endpoint `GET /api/titan/integration/organisations/:externalOrganisationRef/learners/:externalUserRef/skills` now resolves an identity with a **triple**: `service`, trusted internally resolved `companyId`, `externalUserRef`.

Previously the API used the global `service_externalUserRef` unique key and checked its organisation after retrieval. That worked only while a cross-company unique index was active. It would be an incorrect query after the planned Central-style per-company uniqueness cutover.

The route first verifies the service credential and caller allowlist, then resolves the external organisation reference to an internal company ID. Only then does it query identities scoped by that internal ID. The query selects just `userId` with `take: 2`; two returned matches are treated as ambiguous and denied. Legacy unscoped (NULL company) identities are not considered. No email matches or browser tenant input are trusted. Existing account eligibility, company membership, competency scope, audit events and response privacy remain in place.

## Regression evidence

There are 22 distinct fixtures for exact scoped matches, both machine services, cross-tenant and cross-service isolation, legacy rows, duplicate identity ambiguity, blank IDs, case-sensitive matching, malformed scope inputs and no records. `scoped-identity-policy.test.ts` also tests a corrupt database result and a database error. The job additionally runs the existing real integration HTTP tests with in-memory Prisma and a backend TypeScript check.

## Intentional migration limits

The global uniqueness constraint is **not dropped** and the current trusted provisioning CLI is **not rewritten**. This pass is additive preparation for #68, not a completed company_id schema migration or live Central sign-in. Central's final product registry, issuer/audience, OIDC key refresh and revocation contracts are not yet production-ready. Do not assert federation is active.

The existing credential allowlists remain separate from learner sessions. No assessment approvals or curriculum publication state changes.
