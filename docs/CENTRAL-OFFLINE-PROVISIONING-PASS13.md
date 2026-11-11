# Central offline identity provisioning — Pass 13

This pass extends the existing trusted `prisma/provision-titan-integration.ts` operator-only CLI with a **fail-closed Titan Central identity link and unlink**. It is NOT an HTTP route and is NOT an OIDC/PKCE or Central authentication implementation.

## Invariants implemented

- `titan-central` identity references are exactly `HTTPS issuer|subject`. HTTP, credentials, query strings, fragments, embedded separators and whitespace identities are rejected before any DB transaction.
- Link operations require an existing company, a company-scoped learner membership and an exact, non-conflicting identity. The existing global external-user uniqueness is preserved; cross-company or cross-user takeover is rejected.
- Unlike retained `field-services` and `ai-workforce` compatibility paths, Central **never automatically scopes a legacy identity with `companyId = NULL`**. Manual reconciliation is mandatory. Legacy external services retain their existing behavior.
- Unlink requires an existing correctly bound identity. In the same transaction, it removes the link and revokes the targeted learner's Central-labelled LMS refresh tokens and tenant-scoped `SkilledCentralSession` records. Existing non-Central password sessions, other learners and other companies are left untouched.
- Each successful link or unlink emits an existing `AcademyIntegrationAudit` outcome; failed transactions have no new audit record and retain the original identity.
- No new Prisma models/migrations, no live auth endpoints, no automatic email-based linking, no raw secrets or tokens in audit records.

## Verification

20 independent source-controlled fixtures exercise new/idempotent links, conflicting users/companies, missing membership/company, malformed identities, privilege-injection rejection, trusted revoke, unsuccessful revoke, unscoped ambiguity and retained legacy service compatibility. The dedicated GitHub Actions job runs all 20 against the existing transaction-aware Prisma in-memory double, generates the Prisma client and typechecks the backend and isolated test.

The in-memory double is **not** a replacement for a real PostgreSQL transaction and rollback rehearsal, production operator authorization or a Central-issued identity/entitlement decision. The user-scoped refresh session issuer is not mounted, and Central SSO remains disabled.

## Outstanding before production

Require a privileged, auditable operator authentication layer and procedure, protected release and credentials, a database-backed transaction test, a decision on Central's issuer and company identity registry, real revocation propagation, session behavior across concurrent requests, the Central callback/linking protocol, and a rollback drill. Do not close issues #71/#68 or turn on Central until those checks are completed.
