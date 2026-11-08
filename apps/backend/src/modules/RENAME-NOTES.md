# RENAME-NOTES: AcademyOrganisation to Company (src/modules)

Owner decision applied: `AcademyOrganisation` becomes model `Company` (table `academy_companies`). Every `organisationId` in `src/modules/` becomes `companyId`. Prisma delegate `academyOrganisation` becomes `company`. Relation name `organisation` becomes `company`. Behaviour is unchanged: only identifiers, Prisma keys and field names were renamed.

## Files changed (12)

- templates/template.service.ts
- templates/template.service.test.ts (identifier rename only; no assertions changed)
- templates/template.routes.ts
- templates/template.store.ts
- course-selection/course-selection.service.ts
- course-selection/course-selection.routes.ts
- curriculum/curriculum.routes.ts
- curriculum/completion-report.routes.ts
- curriculum/completion-report.service.ts
- curriculum/integration.routes.ts
- pathways/pathway.service.ts
- pathways/pathway.validators.ts

## API contract changes (old to new)

Route parameters (`:organisationId` to `:companyId`), on every `/organisations/:...` route in:
- curriculum/curriculum.routes.ts (practical-evidence, skills, members, assignments, business-fields, lessons context, lesson-context-snapshots)
- curriculum/completion-report.routes.ts (completion-reports)
- templates/template.routes.ts (submissions, sign-off)

Query parameter:
- `?organisationId=` to `?companyId=` on the course-selection GET routes (course-selection.routes.ts).

Body fields:
- `organisationId` to `companyId` in course-selection save body.
- `organisationId` to `companyId` in template draft/submit body (template.routes.ts).
- `organisationId` to `companyId` in pathway enrol body (pathway.validators.ts).
- `organisationId` to `companyId` in practical-evidence submit body (curriculum.routes.ts, `evidenceInput`).

Response fields:
- `organisationId` to `companyId` in the course-selection response (course-selection.service.ts, scope field).
- `organisationId` to `companyId` in completion-report responses (learner report and organisation roll-up).
- `organisationId` to `companyId` in the lesson context snapshot response (curriculum.routes.ts).
- Template response records now carry `companyId` (template.store.ts ResponseRecord, from the Prisma row).

Validation field names:
- `path: ["organisationId"]` to `path: ["companyId"]` and the message text naming the field, in course-selection.service.ts (`namedCompany`).
- `fieldId: "organisationId"` to `fieldId: "companyId"` in template.service.ts.

Internal identifiers renamed (exported names checked: only pathways-enrolment.test.ts imports `assertCanEnrol`, which is unchanged):
- `namedOrganisation` to `namedCompany`
- `resolveOrganisation` to `resolveCompany`
- `buildOrganisationCompletionReport` to `buildCompanyCompletionReport`
- `ORGANISATION_REPORT_VIEWERS` to `COMPANY_REPORT_VIEWERS`
- Local `organisation` variables to `company` in curriculum.routes.ts and integration.routes.ts.
- Prisma: `prisma.academyOrganisation` to `prisma.company` (curriculum.routes.ts, integration.routes.ts); `include: { organisation: true }` to `include: { company: true }`; `organisation: { memberships ... }` to `company: { ... }`.
- Compound unique keys follow the schema field names: `organisationId_userId` to `companyId_userId`, `organisationId_learnerId_courseId` to `companyId_learnerId_courseId`, `organisationId_fieldKey` to `companyId_fieldKey`.

## Membership model, and names kept on purpose (owner to confirm)

1. Membership model: `CompanyMember` (Prisma model), delegate `companyMember`, table `academy_company_members`. It was `AcademyOrganisationMember` / `academyOrganisationMember`. The rename follows the tenant model, and the FK is `companyId`. The table name and the Prisma model name are both changed in `prisma/schema.prisma`, and the table change needs a migration.
2. `companyRef` (integration.routes.ts): the credential field in the select, the audit create field, and the response field in `res.json({ companyRef: ... })`. It was `organisationRef`. This is an external-facing field name, so see `src/RENAME-EXTERNAL.md`.
3. `externalOrganisationRef` (the route param, unchanged from the original), `externalRef`, and `ServiceScope.organisations` (integration.routes.ts). `externalRef` and `organisations` are kept. `externalCompanyRef` is the renamed param.
4. Path segment `/organisations/...` and `/organisations` POST/GET. Only the parameter names were renamed, as the decision specified. Kept. Route path literals are a contract question for the owner.
5. Assumed R1 renames `identity.organisationId` (AcademyIdentity-style model) to `companyId`. Renamed under the blanket rule. Confirm with R1's schema.
6. Assumed the back-relation on Company is `memberships` (used in the academyTrainingAssignment filter). Kept as it was.
7. Prose in error messages and comments ("Organisation membership required", "Organisation created", "Learner not found in organisation") kept as-is to keep behaviour identical. Tests may match these strings.

## Not run

- Tests were not run. `vitest` and `supertest` are not installed in this working copy, and installing packages was out of scope. All six runnable test files failed at import with ERR_MODULE_NOT_FOUND (vitest or supertest missing), so zero tests ran.

## Cross-scope breakage (outside src/modules, not edited)

- src/tests/support/template-memory-store.ts implements TemplateStore and uses `organisationId` in its in-memory records. It will fail until its owner renames it.
- HTTP and fixture tests in src/tests (for example academy-course-selection-http, aca-012-013, academy-completion-report, support/academy-fixtures) send or assert `organisationId`. They need updating by their owner.
- src/tutor (route/tutor-route.ts, store/prisma-store.ts, chatbot/chatbot-scope.ts, store/retention.ts) references organisation fields and was not inspected.
