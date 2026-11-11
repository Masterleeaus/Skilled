# Skilled Pass 11 — durable local Central company registry and provisioning

Related issues: Skilled #71 and #68; Central #27, #28, #29 and #37.

## What changed
The prior Central-to-Skilled account resolver only received hypothetical mapping callbacks. This pass supplies real, typed Prisma-backed mapping reads and an offline audited operator command.

**Database**: one-to-one `CentralCompanyLink` maps a Central organisation opaque ID and its Skilled-local account ID to exactly one Skilled `Company.id`. Unique constraints on all three identifiers prevent implicit many-company account sharing. The `state` can be `verified` or `revoked`; the second append-only `CentralCompanyLinkAudit` table records the operator and change outcome. An additive SQL migration and matching Prisma schema are committed, with no migration executed in a live environment.

**Server-side reads**: `createPrismaCentralAccountReaders` implements the Pass 9 `SkilledCentralReaders` contract. It consults the local binding and checks current company membership before returning a candidate; the existing resolver then checks current user role, activity, deletion and fresh Central access. `createPrismaSkilledLinkAuthority` supplies the Pass 10 signer with exactly scoped local account/organisation/member checks. This removes placeholder lookup logic from the new integration path.

**Operator writes**: `applyCentralLinkCommand` requires a precisely validated offline `link` or `revoke` command. Every write happens inside one Prisma transaction with audit. It refuses an organisation/account/company conflict, refuses unknown companies and revokes or reconfirms only exact existing bindings. Revoked links can only be reverified by explicit operator action; they are not silently revived by login.

Run an operator-only command via stdin (example values MUST be replaced with real verified IDs):
```bash
cd lms-main/apps/backend
echo '{"action":"link","centralOrganisationId":"central-org-0001","localAccountId":"skilled-acct-0001","companyId":"skilled-company-0001","actorRef":"operator-01"}' | pnpm exec tsx scripts/provision-central-company-link.ts
```
This CLI is **not exposed through Express**. Confirm operator credentials, company IDs and Central identity/membership authority before using it. Require an audited manual reconciliation for conflicts.

## CI and boundaries
22 distinct lifecycle/denial fixtures test creation, confirmation, revocation, restoration, uniqueness conflicts, malformed inputs, missing organisations and audit behavior. Real Prisma adapter tests use the repository's schema-derived in-memory Prisma fake to show account resolution working and immediately stopping after revocation. A dedicated workflow runs Prisma validation/generation, four Vitest suites and backend TypeScript.

Central's `titan.local_account_links` remains authoritative for Central identity-to-account links; this local table stores only product account routing, not a second Central user identity directory. It must never be populated from a self-asserted browser request. Its local account ID must match the account ID Central verifies. No existing authentication route is changed.

## Still blocked
The signed assertion signer and local resolver remain unmounted until a trusted Central callback and signed decision transport, stable product registry, application session rotation, global logout and revocation propagation are verified. The migration has not been rehearsed on actual PostgreSQL, and no live account was linked. Do not mark full SSO or #68/#71 as completed.
