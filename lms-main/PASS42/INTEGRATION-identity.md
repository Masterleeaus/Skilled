# PASS 42 — Integration, credential and identity evidence

Scope: Titan Academy integration with Field Services and AI Workforce, service credentials, external identity linking, and integration audit.
Register items: ACA-004, ACA-016, ACA-017, ACA-018, ACA-028.
Owner for register status updates: not changed by this pass. The register JSON and Markdown were not edited.

## Environment and method

- Database: a throwaway local PostgreSQL 16.15 cluster started by this pass, bound to `127.0.0.1:55439`, database `titan_academy_test`. Data directory `/home/claude/work/pg42/data`. No production or shared database was used.
- Incident note: my first start attempt used port 55432, which was already served by another PostgreSQL instance. My `CREATE DATABASE titan_academy_test` ran there by mistake. I dropped that database again (`DROP DATABASE`), and the server's database list was returned to its prior state (`lms_order, lms_recovered, lms_rollback, lms_tests, lms_verify, postgres, template0, template1`). I did not use that server for anything else. At the end of the pass, port 55432 was no longer accepting connections. I did not stop it: my stop command only targeted the data directory of my own cluster (`/home/claude/work/pg42/data`), and that postmaster was the only one I signalled. A separate postgres on port 55433 (data `/home/claude/work/pg-private/data`, started 20:05 by someone other than this pass) is running and was not used.
- Test guard: `apps/backend/src/tests/integration/harness.ts` refuses to run unless `DATABASE_URL` names a local host and a database whose name contains `test`.
- Transport: all HTTP calls use supertest against an Express app that mounts the real `integrationRoutes` at `/api/titan/integration`, the same path as `app.ts`. No external service, partner endpoint or network host was contacted. The full `app.ts` was not imported, to avoid starting Redis and MinIO clients.
- Credentials: created and rotated through the real operator CLI (`prisma/manage-titan-credentials.ts`) via stdin. Tokens are held in test memory only. No token value was written to any file, log or report, and tests never print tokens.
- Schema: `schema.prisma` and migrations were not edited. The Prisma client was generated and all 14 migrations were applied to the test database with `prisma migrate deploy`.

### Commands run

```
cd /home/claude/p29m/lms-main/apps/backend
./node_modules/.bin/prisma generate                      # exit 0, client v6.19.3
DATABASE_URL=postgresql://postgres@127.0.0.1:55439/titan_academy_test \
  ./node_modules/.bin/prisma migrate deploy              # exit 0, all migrations applied
DATABASE_URL=... ./node_modules/.bin/vitest run src/tests/integration --fileParallelism=false
node tests/pass22-inactive-identity.test.cjs              # exit 0, 11 checks
node scripts/verify-titan-integration.mjs                 # exit 0, 11/11
node scripts/verify-tenant-identity.mjs                   # exit 0, 6 assertions
node scripts/verify-field-services-sync.mjs               # exit 1 (pre-existing, see ACA-018)
node /home/claude/p29m/lms-main/node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc --noEmit -p tsconfig.json --rootDir .
```

Note on type checking: the repo's `tsconfig.json` is rejected by the TypeScript 7 beta in `node_modules` (`TS5102`, `TS5090`). With TypeScript 5.9.3 the `rootDir` setting also fails (`TS6059`, pre-existing for `prisma/*.ts`). I ran with `--rootDir .` to get semantic checks. Result: 131 errors repo-wide, all pre-existing in other modules. Zero errors in `integration.routes.ts`, `provision-titan-integration.ts`, and the new `tests/integration/` files.

### Final results

| File | Register | Passed | Skipped | Failed |
|---|---|---|---|---|
| `src/tests/integration/cross-tenant.test.ts` | ACA-004 | 13 | 0 | 0 |
| `src/tests/integration/learner-status.test.ts` | ACA-016 | 6 | 0 | 0 |
| `src/tests/integration/credential-lifecycle.test.ts` | ACA-017 | 10 | 0 | 0 |
| `src/tests/integration/contract.test.ts` | ACA-018 | 20 | 1 | 0 |
| `src/tests/integration/identity-linking.test.ts` | ACA-028 | 14 | 0 | 0 |
| **Total** | | **63** | **1** | **0** |

Vitest reported `Test Files 5 passed (5)`, `Tests 63 passed | 1 skipped (64)`, exit 0. After the run, the test database held zero `p42-` users, organisations and audit rows.

Existing repo checks, unchanged test code, run after the code fixes:
- `tests/pass22-inactive-identity.test.cjs`: PASS, 11 source-order checks.
- `scripts/verify-titan-integration.mjs`: 11 passed, 0 failed.
- `scripts/verify-tenant-identity.mjs`: 6 assertions passed.
- `scripts/verify-field-services-sync.mjs`: FAILS at `service-only sync`. It also failed before any change in this pass. See the ACA-018 section.

### Baseline run before code fixes

The first run of the 64 tests against the unchanged router and provisioning code gave 54 passed, 9 failed, 1 skipped. Two of the nine were defects in my own test fixtures (a soft-deleted fixture that was not soft-deleted, and an audit count that did not filter by service). The other seven were real gaps, fixed below:
- Four `DENIED_AUTHENTICATION` assertions, and the matching assertion in the rotation test: authentication denials wrote no audit row.
- Legacy identity link returned "already linked" and was audited as `CONFIRMED` although the row was changed.
- Legacy identity could not be unlinked, because unlink required an exact organisation match on a NULL column.

### Sensitivity check

To confirm the expiry tests really catch the defect class in ACA-017, I removed the `credential.expiresAt <= new Date()` check from `serviceAuthenticate` in a temporary copy, ran the expiry tests, and restored the file. Result: both expiry tests failed (`rejects an expired credential...`, `accepts a credential that expires in the future...`). The file was restored, and `cmp` confirmed it identical to the fixed version. The check was not kept in the repo.

## ACA-004 — Cross-tenant skills access (status: PARTIAL)

Done-when: "Foreign-tenant requests denied and audit events recorded".

What was tested (`cross-tenant.test.ts`, 13 passing):
- Org A credential requesting org B: 404 `Organisation not found`, `DENIED_SCOPE` audit row. The body is identical to an unknown organisation.
- Org A reference with an org B learner, and the reverse: 404 `Learner not found`, `NOT_FOUND_IDENTITY` audit row. No competency id from the other tenant appears in the body.
- A `field-services` link is not visible to an `ai-workforce` credential.
- Only the requesting tenant's competencies are returned.
- Organisation references are case-sensitive, and a `%2F..%2F` smuggled path does not reach another tenant.
- POST, PUT, PATCH and DELETE on the skills path return 404 or 405 and change no competency or identity rows.
- Denials from scope, identity and membership checks are audited.
- Authentication denials (missing bearer, unknown caller, unknown credential, service mismatch) are audited as `DENIED_AUTHENTICATION`.

Fix made: `apps/backend/src/modules/curriculum/integration.routes.ts`, in `serviceAuthenticate`. Authentication denials previously returned 401 with no audit row. Each denial now writes `AcademyIntegrationAudit` with `outcome: DENIED_AUTHENTICATION` and `service` set to the caller name when it is known, otherwise `unknown`. The response body is unchanged. If the audit write fails, the error is logged and the request is still denied with 401. This is a deliberate reversal of the PASS15 note that credential failures stay outside database audit.

Known limits:
- The register names "skills and lesson APIs". The integration router exposes only the skills GET. There is no lesson or assignment endpoint in the integration surface, so none is tested here. The user-JWT curriculum lesson routes (`curriculum.routes.ts`) were not reviewed for cross-tenant access. That is outside this brief and needs an owner decision.
- Audit volume: unauthenticated requests now write one audit row each. Gateway rate limiting is needed (open item).
- Malformed-identifier 400 responses are still not audited. They are validation rejections, not access decisions.

Status is PARTIAL because the lesson API wording is not covered by the integration surface and needs an owner decision.

## ACA-016 — Inactive and deleted learners (status: DONE)

Done-when: "Revoked learners yield no skills in integration tests".

What was tested (`learner-status.test.ts`, 6 passing):
- Active enrolled learner: 200, expired competencies excluded.
- Deactivated learner (`isActive: false`): 404 `Learner not found`, same body as an unknown learner, `INACTIVE_LEARNER` audit row, no skills in the body.
- Soft-deleted learner (`deletedAt` set): 404 and `INACTIVE_LEARNER` audit.
- A learner soft-deleted through `db.user.delete` (the application's delete path, which the soft-delete extension in `src/config/prisma.ts` turns into a soft delete): the test asserts that the normal lookup finds nothing, and the request gets 404 and `INACTIVE_LEARNER`.
- Learner removed from the organisation: 404 `Learner not found in organisation`, `NOT_FOUND_MEMBERSHIP` audit.
- The change takes effect on the next request, and reactivation restores access.

Code: no change needed. The PASS22 checks in the route were already correct.

## ACA-017 — Credential rotation, revocation and expiry (status: DONE)

Done-when: "Expired and revoked credentials denied after rotation".

What was tested (`credential-lifecycle.test.ts`, 10 passing):
- A created credential authenticates. The table stores only a 64-hex SHA-256 digest, equal to `sha256(token)`, and never the token.
- Rotation through the CLI: the old credential is revoked, the replacement inherits service and organisation, its lifetime is about 90 days, the old token gets 401 at once, and the new token gets 200.
- Revocation takes effect at once. A second revoke returns `{"revoked":0}`.
- An expired credential (row present, `expiresAt` in the past) gets 401. A credential expiring in the future gets 200. Expiry is enforced at the instant it passes.
- Rotating a revoked or an expired credential is refused with "missing, revoked or expired".
- Two simultaneous rotations of one credential: exactly one succeeds.
- `list` returns only the documented fields, with no `tokenHash` and no secret.
- Creation is refused for an unprovisioned organisation, for lifetimes of 0, 366 or 1.5 days, and for an unknown caller.

Expiry logic review: the three expiry checks (authentication `expiresAt <= now`, rotation `old.expiresAt <= now`, competency `expiresAt > now` or null) are correct. They were not changed. The mutation check above confirms the authentication check is enforced by tests.

Code: no change. The `manage-titan-credentials.ts` file is unchanged (confirmed by `cmp`).

## ACA-018 — Field Services and AI Workforce contract tests (status: PARTIAL)

Done-when: "Signed contract tests pass against both consumers".

What was tested (`contract.test.ts`, 20 passing, 1 skipped). Each consumer (`field-services`, `ai-workforce`) runs the same 9 tests against the existing API shape, using the in-process mock transport described above:
- Request: GET with `x-titan-service` and a Bearer token. Response 200 has `Cache-Control: no-store` and a JSON content type.
- 200 top-level keys are exactly `checkedAt`, `externalUserRef`, `organisationRef`, `verifiedSkills`. Each skill has exactly `id`, `lessonId`, `revisionId`, `verifiedAt`, `expiresAt`. Timestamps are ISO 8601 with milliseconds.
- The body discloses no internal learner, assessor or evidence identifiers and no email or name.
- Expired competencies are excluded.
- 401 for a missing or short token, with the generic message.
- 404 for an out-of-scope and a missing organisation, with identical bodies.
- 404 when an internal Academy user ID is passed as the external reference.
- 400 for an identifier over 200 characters.
- Drift checks: an unknown caller gets 401 `Unknown service`. The documented business-fields sync route is not mounted (404).
- One `it.skip` placeholder for the documented sync contract.

Not done, and why:
- No partner contract is written in this repository. The skills shape above is taken from the router source and PASS13/14/15/17/18 notes. I did not invent partner expectations.
- The sync contract (`docs/FIELD_SERVICES_CONTEXT_SYNC.md`, `POST .../business-fields/sync`) is described in docs, but the route is not in `integration.routes.ts` or anywhere else in `src/`. `scripts/verify-field-services-sync.mjs` checks for code that does not exist and fails. I did not implement the route, because that is new feature work outside this brief. The skipped test is the placeholder.
- No "signed" contract: the repo has no request-signing scheme. The register wording needs an owner decision.
- No Field Services or AI Workforce environment was connected. No external service was contacted.

Status is PARTIAL: the existing skills contract is pinned and tested against both callers, but the sync contract is missing and the partner environments are not connected.

## ACA-028 — External identity uniqueness and linking lifecycle (status: DONE)

Done-when: "Cross-org identity tests and migration policy documented".

What was tested (`identity-linking.test.ts`, 14 passing), calling the exported `provision()` from `prisma/provision-titan-integration.ts`:
- Linking a new identity to a member of the stated organisation creates one row and audits `PROVISION_IDENTITY_CREATED`.
- A repeat link for the same learner and organisation is idempotent and audits `PROVISION_IDENTITY_CONFIRMED`.
- A second link of the same external identity to another learner is refused ("manual reconciliation required"). The first link is left intact.
- Moving an identity to another organisation, even for the same learner, is refused.
- A learner who is not a member of the stated organisation is refused, and an unknown organisation is refused.
- Uniqueness is per `(service, externalUserRef)`: the same reference under the other service is allowed. The database itself rejects a duplicate pair.
- Two simultaneous link attempts for one reference: exactly one succeeds.
- Unlinking requires the matching learner and organisation. After an unlink, the skills API returns 404 `Learner not found`, and re-linking works.
- Legacy unscoped rows (`organisationId` NULL) fail closed in the API until re-provisioned.
- Unexpected fields in provisioning input are rejected (zod strict).

Fixes made in `apps/backend/prisma/provision-titan-integration.ts`:
1. Legacy unlink: unlinking a legacy unscoped row for the same learner was refused, so operators could not clear those rows. The organisation check now applies only when the row has an organisation. Learner match is still required.
2. Legacy upgrade audit: binding a legacy row to an organisation wrote `PROVISION_IDENTITY_CONFIRMED` and returned "already linked". It now writes `PROVISION_IDENTITY_SCOPED` and returns "Legacy identity scoped to organisation". Ordinary repeat links are unchanged.

Migration policy (as implemented, to be confirmed by owner):
- Migration `20261102190000_academy_identity_tenant_scope` adds `organisationId` as nullable with no backfill. Legacy rows stay NULL.
- The API denies every NULL-organisation row (`NOT_FOUND_IDENTITY`) until a trusted operator re-provisions it through `npm run integration:provision` (`link-identity`). That binds the row to the organisation.
- Operators may remove any legacy row for the matching learner with `unlink-identity`.
- No automated backfill is performed.

Not changed, and recorded as open decisions:
- Refused takeover and membership attempts are not audited. The provisioning transaction rolls back, so the audit row would roll back with it. An owner decision is needed on a separate refusal log.
- Provisioning does not refuse linking to a deactivated or deleted learner. The read path denies them, so there is no access, but the owner may want the link refused up front.

## Files changed

Modified (backups in `/home/claude/work/integration-pass42-backup/`):
- `apps/backend/src/modules/curriculum/integration.routes.ts`: authentication denial audit (ACA-004).
- `apps/backend/prisma/provision-titan-integration.ts`: legacy unlink and scoped-upgrade audit (ACA-028).

Created:
- `apps/backend/src/tests/integration/harness.ts`
- `apps/backend/src/tests/integration/cross-tenant.test.ts`
- `apps/backend/src/tests/integration/learner-status.test.ts`
- `apps/backend/src/tests/integration/credential-lifecycle.test.ts`
- `apps/backend/src/tests/integration/contract.test.ts`
- `apps/backend/src/tests/integration/identity-linking.test.ts`
- `PASS42/INTEGRATION-identity.md` (this file)

Unchanged, confirmed: `schema.prisma`, migrations, `manage-titan-credentials.ts`, `src/config/prisma.ts`, the template renderer, pathways, review and publication, assessment and competency code, curriculum data, and the quality and ops scripts.

Side effects outside the repo: the Prisma client in `node_modules` was regenerated. The local test cluster lives in `/home/claude/work/pg42`. Backend winston logs in `apps/backend/logs/` were appended to by test runs. They contain no fixture identifiers.

## Open items for the owner

### Questions for Field Services and AI Workforce teams

1. Field Services sync: confirm the documented `POST .../business-fields/sync` contract (payload, 56-field cap, `SKIPPED_EXISTING` response shape, error bodies). Confirm whether it is in scope, since the route is not implemented.
2. Response envelope: the integration API returns bare JSON and `{ "message" }` errors, while the rest of the app uses a `{ success, data }` envelope. Confirm the partners expect the bare shape.
3. Path parameter: PASS13 documented `:learnerId` as an Academy-local user ID. The current code uses `externalUserRef`. Confirm the partners use the external reference only.
4. Expired skills: they are currently omitted silently. Confirm whether partners expect them omitted or returned with `expiresAt`.
5. Suspended or deactivated workers: they currently get 404 `Learner not found`, and the same body is returned for an unknown learner. Confirm this is the contract wanted (PASS22 open item).
6. Request authentication: confirm whether bearer secrets are enough, or whether HMAC request signing or mTLS is required. "Signed contract tests" in ACA-018 assumes a scheme that does not exist.
7. Tenant references: confirm that the external organisation references provisioned by Academy admins match each partner's tenant identifiers.
8. Identity model: identities are unique per service. Confirm whether one person should map to one identity per service or should be shared across Field Services and AI Workforce.

### Decisions for the owner

9. Lesson APIs: ACA-004 names lesson APIs, but the integration surface has none. Confirm whether the user-JWT curriculum lesson routes are in scope for cross-tenant tests.
10. Field Services sync route: implement it (new feature), or drop the sync contract from the docs.
11. Auditing refusals: decide whether refused identity-link attempts need a separate audit trail.
12. Deactivated learners at link time: decide whether provisioning should refuse them up front.
13. Rate limiting: unauthenticated requests now write audit rows. Confirm gateway rate limits are in place before production.
14. Stale docs: PASS15 says credential failures stay outside database audit. That is now wrong. PASS13 describes env-based keys and `:learnerId`. Both need updating, and I did not edit them.
15. `scripts/verify-field-services-sync.mjs` fails on code that does not exist. Decide whether to keep it, fix it, or retire it.
16. Register: ACA-004, ACA-016, ACA-017, ACA-018 and ACA-028 should be updated in the register JSON and Markdown with the statuses above, which I did not change.

## Status summary

| Item | Status | Tests | Code changed |
|---|---|---|---|
| ACA-004 | PARTIAL | 13 passed | `integration.routes.ts` |
| ACA-016 | DONE | 6 passed | none |
| ACA-017 | DONE | 10 passed | none |
| ACA-018 | PARTIAL | 20 passed, 1 skipped | none |
| ACA-028 | DONE | 14 passed | `provision-titan-integration.ts` |
