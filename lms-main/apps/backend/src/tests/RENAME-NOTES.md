# Tenant rename notes (R4): AcademyOrganisation to Company

## Mapping applied
- `AcademyOrganisation` to `Company`; `academyOrganisation` to `company` (Prisma delegate and seed key).
- `organisationId` to `companyId` (fields, object keys, compound keys such as `companyId_fieldKey`, and local parameter names).
- Relation key `organisation` to `company` (fake-prisma relation map only).
- `AcademyOrganisationMember` to `CompanyMember`; `academyOrganisationMember` to `companyMember`. **Unconfirmed**, see below.

## Files changed
- src/tests/support/fake-prisma.ts
- src/tests/support/template-memory-store.ts
- src/tests/support/academy-fixtures.ts
- src/tests/integration/harness.ts
- src/tests/integration/identity-linking.test.ts
- src/tests/integration/cross-tenant.test.ts
- src/tests/integration/contract.test.ts
- src/tests/integration/credential-lifecycle.test.ts
- src/tests/integration/learner-status.test.ts
- src/tests/pathways-enrolment.test.ts
- src/tests/academy-snapshot-history.test.ts
- src/tests/aca-012-013-assessment-evidence.test.ts
- src/tests/academy-course-selection.test.ts
- src/tests/academy-course-selection-http.test.ts
- src/tests/academy-levels.test.ts
- src/tests/academy-completion-report.test.ts
- tests/pass22-inactive-identity.test.cjs
- src/app.ts: no matches, unchanged.

## Names I was unsure of
1. `AcademyOrganisationMember` (table `academy_organisation_members`). The owner decision names only AcademyOrganisation. I used `CompanyMember` / `companyMember`. If R1 keeps `AcademyOrganisationMember`, revert these in fake-prisma.ts (relations, uniques, defaults), harness.ts, identity-linking.test.ts, pathways-enrolment.test.ts, academy-course-selection.test.ts, academy-levels.test.ts, academy-completion-report.test.ts, aca-012-013-assessment-evidence.test.ts, and pass22-inactive-identity.test.cjs.
2. Request and response payloads now use `companyId` where they used `organisationId` (for example the pathway enrolment body, the course-selection PUT body and GET query, and `res.body.data`). R3 must emit the same names or these tests will fail.
3. pass22-inactive-identity.test.cjs now expects `identity.companyId !== company.id` and `prisma.companyMember.findUnique`. The `company.id` fragment matches R3's current integration.routes.ts. The `companyMember` fragment still fails because line 98 of that file still reads `prisma.academyOrganisationMember`.
4. Kept unchanged on purpose: `organisationRef` and `externalOrganisationRef` (external references, not FKs), URL segments `/organisations/`, the `ORGANISATION` source enum value, and error messages such as "Organisation not found". Routes and messages live outside my files, so renaming them here would break the tests. Test titles and prose also keep "organisation".

## Test results (node --experimental-transform-types --test)
- tests/pass22-inactive-identity.test.cjs: 0 pass, 1 fail. Fails on `prisma.companyMember.findUnique` in src/modules/curriculum/integration.routes.ts (R3 still to finish). Source-text check only, no DB.
- src/tests/support/fake-prisma.ts and template-memory-store.ts: load fine (no test cases; the runner reports one synthetic pass).
- All other changed files fail before any test runs, from missing dependencies, not from the rename: `supertest` is not installed (pathways-enrolment, academy-snapshot-history, aca-012-013, academy-course-selection, academy-course-selection-http, academy-levels, academy-completion-report); `vitest` is not installed (integration/*). academy-fixtures.ts imports src/modules/auth/token.utils, which does not exist yet.
- No test was run that needs PostgreSQL or Redis. The integration harness switches on only when DATABASE_URL and REDIS_URL are real services. Nothing was run against a database.
