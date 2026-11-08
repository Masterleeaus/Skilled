# External rename: company reference (static, unverified)

Status: static, unverified. Checked by grep of `apps/backend/src/modules/curriculum/integration.routes.ts` on 8 Nov 2026. No tests or database runs.

## Decided contract

- Response key: `companyRef`. The skills response returns the external company reference under this key.
- URL parameter: `externalOrganisationRef`. The path is unchanged: `GET /api/titan/integration/organisations/:externalOrganisationRef/learners/:externalUserRef/skills`.
- Internal tenant: `Company` / `companyId`. The external reference maps to `Company.externalRef` at the route boundary only.

## Field Services must update

Date: 8 Nov 2026. Static, unverified.

1. Response parsing: read `companyRef` from the skills response. The previous response key was `organisationRef`. Stop reading `organisationRef`.
2. Request URL: the `/organisations/` segment is unchanged, and the external reference value is unchanged. Only the parameter name changed, so no URL values need to change.
3. Operator CLI JSON (`integration:credentials` and `integration:provision`): the company reference key is `companyRef`. Any saved scripts that send the old key must be updated.

## Where this is implemented

- `apps/backend/src/modules/curriculum/integration.routes.ts`: response key and URL parameter.
- `apps/backend/prisma/manage-titan-credentials.ts` and `apps/backend/prisma/provision-titan-integration.ts`: CLI input keys.
