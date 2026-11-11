# ACA-028: External identity uniqueness, relinking and repair

Status: verified by tests on a local PostgreSQL 16 database (migrations applied, `prisma migrate diff` shows no drift) and by static review. No migration was added. The disabled drop is still disabled.

Scope: `AcademyExternalIdentity` (`academy_external_identities`), the integration read path in `apps/backend/src/modules/curriculum/integration.routes.ts`, and the operator provisioning module `apps/backend/prisma/provision-titan-integration.ts`. The ACA-017 (credentials) and ACA-014 (enrolment progress) findings are in the last two sections.

## 1. Current state

| Item | Where | State |
|---|---|---|
| Global key | `academy_external_identities_service_externalUserRef_key` on `(service, externalUserRef)` | Active. Still declared in `schema.prisma` as `@@unique([service, externalUserRef])`. |
| Org-scoped key | `academy_external_identities_svc_org_ref_key` on `(service, "companyId", "externalUserRef")` | Active (migration `20261108100000_academy_external_identity_org_unique`). Redundant while the global key exists. |
| Legacy rows | `companyId IS NULL` | Possible. Denied by the read path until re-provisioned. |
| Drop of global key | `prisma/disabled-migrations/20261108100300_DISABLED_academy_external_identity_drop_global_key.sql` | Disabled. Not in `migrations/`, so Prisma has not recorded it. |

Consequence today: the database enforces one identity per `(service, externalUserRef)` across all organisations. The org-scoped index never binds on its own, so a second organisation cannot be linked to a ref already held by another organisation, and the database cannot create a cross-organisation duplicate. The read path and the provisioning path both look the row up by the global key and then check `companyId`, so a row for another organisation is denied (fail closed), never returned.

## 2. Uniqueness policy

Target policy, to take effect only when the global key is dropped under section 5:

1. **Identity key.** One Academy learner per `(service, companyId, externalUserRef)`. The same external ref may exist under different organisations, and each row is valid only for its own organisation.
2. **No silent scoping of the wrong learner.** A legacy row (`companyId NULL`) is bound to an organisation only by the same learner, who must be an active member of that organisation, through `link-identity` (audited as `PROVISION_IDENTITY_SCOPED`). No other path writes `companyId` on an existing row.
3. **Membership is required.** A link needs `CompanyMember` for the target organisation. Otherwise the link is refused and nothing is written.
4. **No implicit move.** A link never moves an existing row to another organisation or to another learner. Transfer is `unlink-identity` from the old organisation, then `link-identity` to the new one. Both are audited.
5. **Exact unlink.** Unlink needs the same learner and the same organisation as the row. The one exception is a legacy row, which the same learner may remove so that operators can clear it.
6. **Relink is a new row.** After unlink, a relink creates a new row with a new id. There is no reactivation of old rows.
7. **Stale credentials fail on the next request.** A credential is bound to one organisation. After unlink or transfer, the same credential returns `404 Learner not found` for that ref. Nothing from the old organisation is returned.
8. **Audit metadata only.** Each provisioning operation writes one `academy_integration_audit` row with `service`, `companyRef` (the external organisation ref) and `externalUserRef`. It holds no internal learner id, no organisation id, and no token.

## 3. Lifecycle, as tested

Tests: `apps/backend/src/tests/verify-external-identity.test.ts` (in-memory Prisma, real provisioning and routes, 23 tests) and the existing database suite `apps/backend/src/tests/integration/identity-linking.test.ts`.

| Case | Result |
|---|---|
| Same ref, second organisation, direct insert | Refused by the database (global key). |
| Same ref, second organisation, via `link-identity` | Refused with "manual reconciliation required". The first row is unchanged and no audit row is written. |
| Same ref under another service | Allowed (separate key space). |
| Duplicate legacy rows for one ref | Refused (global key). |
| Legacy row claimed by a different learner | Refused. Row unchanged, no audit row. |
| Legacy row used through the API | `404`, until the same learner re-provisions it. |
| Unlink with wrong learner or wrong organisation | Refused. Nothing deleted, no audit row. |
| Unlink of a ref that was never linked | Refused. |
| Stale credential after unlink | `404 Learner not found`, audited as `NOT_FOUND_IDENTITY`. |
| Unlink, then relink to same organisation | Allowed; new row id; `200` again. |
| Transfer A to B (unlink, then link) | Direct link while still in A is refused. After unlink, link to B works. A returns `404`, B returns `200`. One row, `companyId = B`. |
| Link to a non-member | Refused. No identity row and no audit row (transaction rolled back). |
| Repeated link and unlink cycles | One audit row per operation; no residue. |
| Audit row content | Only `service`, `companyRef`, `externalUserRef`, `outcome`. No internal ids. |
| Extra fields in provisioning input | Refused (strict schema). |

Migration checks (static, in the same test file): the active migration is additive (no `DROP`, `DELETE`, `UPDATE`, `RENAME`), it does not drop the global key, the disabled drop is only in `disabled-migrations/` and its statement is commented out, the schema declares both keys under the names the migration uses, and the preflight contains the duplicate check.

## 4. Data repair plan for pre-existing duplicates and legacy rows

Run `prisma/preflight-20261108100000-external-identity-scope.sql` first. It is read-only.

Expected results today:

- Check 1 (duplicates on `(service, "companyId", ref)`): zero rows by construction, because the global key already forbids duplicates on `(service, ref)`. Record the result anyway as evidence.
- Check 2 (legacy NULL rows, by service): record the counts. These rows are the only real repair population.
- Check 3 (rows whose `companyId` has no `academy_companies` row): must be zero before any foreign key is considered.
- Check 4 (rows without a company, by service): same as check 2, recorded for the drop decision.

Procedure for each class:

1. **Legacy row, the learner is still an active member of an organisation that the external system confirms for this ref.** The operator runs `link-identity` with that `companyRef` as the same learner. This sets `companyId` and writes `PROVISION_IDENTITY_SCOPED`. Do not run `UPDATE` by hand.
2. **Legacy row that cannot be confirmed.** The same learner runs `unlink-identity` with the matching organisation, or the operator confirms with the source system first. Writes `PROVISION_IDENTITY_REVOKED`. A row that belongs to a different learner is never changed by the operator. Escalate it.
3. **Row whose company is missing (check 3).** Confirm the `externalRef` with the source system. Then unlink. Do not re-point it to another company by SQL.
4. **After the drop only: one external ref under two organisations.** Each row is valid for its own organisation, so no automatic action is needed. If the source system says it is one person and the two rows belong to two Academy accounts, a human decides which account keeps the link. The other link is removed with `unlink-identity`, which is audited. Record the decision in the ticket.
5. **Nothing is deleted in bulk.** Each change goes through the provisioning module, so each one is audited and each is checked against membership and exact matches.

Competencies, certificates and completions are keyed on `userId`, not on the identity row. Unlinking an identity therefore changes only the external read path. It does not delete evidence.

## 5. Preconditions for enabling the global-key drop

Do not run the disabled file as it stands. Enable it only when all of the following hold:

1. Preflight checks 1 and 3 return zero rows, and the check 2 and 4 counts are recorded and accepted. Legacy rows are re-provisioned or unlinked as in section 4.
2. The business has accepted that the same external ref may now resolve in more than one organisation.
3. **Code changes are made first.** Without them the drop is unsafe:
   - `apps/backend/src/modules/curriculum/integration.routes.ts` looks up with `findUnique({ where: { service_externalUserRef } })`. Change it to `findFirst({ where: { service, companyId: company.id, externalUserRef } })`. The company is already resolved before this lookup.
   - `apps/backend/prisma/provision-titan-integration.ts`, both `link-identity` and `unlink-identity`, look up the same way. Change them to find by `(service, externalUserRef)` plus `companyId`, and re-specify the cross-organisation branch. Today that branch refuses with "linked to another organisation"; after the drop it must allow the create and still refuse a different learner in the same organisation.
   - Remove `@@unique([service, externalUserRef])` from `schema.prisma` in the same change. The typed client then rejects the old `service_externalUserRef` lookups at compile time, so the change cannot be missed. Do not rely on the database alone: if the DB key is dropped while the schema still declares it, the generated client's `findUnique` is not guaranteed to return the caller's row.
   - Tests that assert the global key (`identity-linking.test.ts`, "enforces (service, externalUserRef) uniqueness in the database itself", and `verify-external-identity.test.ts`, "refuses the same external ref in a second organisation") are expected to change with the drop.
4. The drop goes in a **new** migration folder with a later timestamp, not in the applied one. A plain `DROP INDEX` takes an exclusive lock on the table. On a large table, run `DROP INDEX CONCURRENTLY` by hand instead. `CONCURRENTLY` cannot run inside a transaction block, so check that the migration runner does not wrap it.

Rollback: re-create the global key with `CREATE UNIQUE INDEX ... (service, externalUserRef)`. This works only when no `(service, ref)` appears twice. Unlink the extra rows first.

## 6. Operator notes

- The CLI `prisma/provision-titan-integration.ts` reads JSON on stdin and prints one line. Error messages do not include learner or organisation values.
- Duplicate concurrent links for one ref are settled by the database key. One succeeds, the other gets P2002, which the error handler returns as 409. Test: `identity-linking.test.ts`, "settles simultaneous link attempts".

## 7. ACA-017 findings (credentials)

Tests: `verify-integration-credentials.test.ts` (26 tests, in-memory) and the existing database suite `integration/credential-lifecycle.test.ts`, which runs the real operator CLI.

Verified: only SHA-256 digests are stored; no clear token is written to any table or audit row; expiry is checked on every request and is exclusive at the exact instant; revocation takes effect on the next request; malformed, short, long, unknown and wrong-caller tokens all get the same `401`; each denial writes one `DENIED_AUTHENTICATION` row without a token; success responses are `Cache-Control: no-store` and echo no credential material; `INTEGRATION_SERVICE_SCOPES` fails closed when unset, invalid, missing a caller key, or not listing the organisation.

Findings, not changed:

- **F-17a Rotation has no overlap window.** `rotate` revokes the old credential in the same transaction that creates the new one. A consumer must switch atomically. If a grace period is wanted, that is a design change to the CLI and the check, and needs a decision.
- **F-17b Credential lifecycle is not audited.** `create`, `rotate` and `revoke` in `prisma/manage-titan-credentials.ts` write no `academy_integration_audit` row. Revocation records no actor, and the rotation link (`replacedId`) is not stored. The credential row keeps `createdAt`, `expiresAt` and `revokedAt`. Recommended: add audit outcomes such as `CREDENTIAL_CREATED`, `CREDENTIAL_ROTATED` and `CREDENTIAL_REVOKED`. Not changed, because the outcome vocabulary is a decision.
- **F-17c Both caller keys are required.** `parseServiceScopes` returns null unless `field-services` and `ai-workforce` are both present, so a deployment that uses one caller must still set the other to `[]`. This is fail-closed and correct, but easy to get wrong.
- **F-17d The `Bearer` scheme is case-sensitive.** `bearer <token>` is refused. Acceptable, and stricter than RFC 7235 requires.

## 8. ACA-014 findings (enrolment and progress)

Tests: `verify-enrolment-progress.test.ts` (16 tests, in-memory, real services), with the existing `academy-enrolment-progress.test.ts` and `academy-course-progress.test.ts` as the baseline.

Verified: repeated completions leave one row and no duplicate certificate job; a write before enrolment leaves no row and a retry records once; the persisted percentage, status and `completedAt` equal the values computed from the lesson rows after a mixed sequence of completions and reversions; the API (`getCourseProgress`) matches the persisted rows; a lesson in another course is refused; a course with no lessons never completes; a cancelled enrolment keeps its status and queues nothing; one learner's writes never change another's enrolment; the curriculum progress counts required and optional lessons separately, draft tracks are excluded, and only the learner's own acknowledgements count.

Findings, not changed:

- **F-14a Two progress models that do not meet.** The enrolment percentage and the certificate gate use `LessonProgress.completed`, which is learner-reported, across every lesson in the course. The academy curriculum progress uses `AcademyLearnerCompletion` (acknowledgements) over placements and course tracks, with the required and optional split. There is no foreign key or shared write between them. The certificate gate ignores academy placements and their `required` flags. A learner can be at 100% in one model and 0% in the other. The UI and reports must say which one they show.
- **F-14b Headline percentage includes optional lessons.** `buildCourseLessonProgress` reports `completionPercent` over all counted lessons, required and optional together. The required figure is in `required.completed / required.total`. Use the required figure for completion decisions.
- **F-14c `progressPercentage` can be 100 while the status is ACTIVE.** This happens while a published quiz or assignment is not passed, or while the course is unpublished. The status is the gate; the percentage is lessons only. Tested.
- **F-14d A cancelled learner cannot re-enrol.** `enrollInCourse` answers `409 Already enrolled` for a CANCELLED row, while `isEnrolled` treats CANCELLED as not enrolled. The pathway service refuses to reuse a cancelled enrolment for the same reason. No code path sets CANCELLED today. A decision is needed on whether a cancelled enrolment can be reactivated.
- **F-14e Re-completion after a reversion queues the certificate again.** The job id dedupes only pending jobs, and the certificate service checks for an existing certificate before issuing one. The end result is right, but the dedupe lives in two places.
- **F-14f A learner can reverse a completion.** `completed: false` after completion moves a COMPLETED enrolment back to ACTIVE with `completedAt` cleared. This is tested in the existing suite and is consistent with the learner-reported model in F-14a.

## 9. Commands run

- `pnpm -C apps/backend exec vitest run` (baseline 623 passed, 75 skipped).
- `DATABASE_URL=postgresql://titan:titan@localhost:5432/lms_h2_test REDIS_URL=redis://localhost:6379 pnpm exec vitest run src/tests/integration src/tests/integration-credential-boundary.test.ts`: 67 passed, 1 skipped.
- `prisma migrate deploy` on `lms_h2_test` and `prisma migrate diff --from-url ... --to-schema-datamodel`: no drift.
