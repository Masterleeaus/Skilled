# Skilled Pass 9 — Central account resolution boundary

Tracked issue: Skilled #71; dependent on Central #27, #28 and #29 and Skilled #68.

## Implemented

`resolveSkilledCentralAccount` is a pure, asynchronous, fail-closed Skilled-side identity and authorization decision. It receives a decision from an **already OIDC-verified and independently authorized Central caller** and trusted read adapters. It then requires:

1. The exact currently implemented Central app ID `academy` (legacy wire identifier for LMS), explicit allowed decision, bounded canonical identities and nonnegative integer revisions.
2. A fresh Central revocation/entitlement/membership/link check using `isCentralAccessCurrent`.
3. Exactly one trusted local mapping matching the Central organisation, local account and user. Ambiguous or revoked mappings are refused. The mapping is internal, **not** email lookup, not `companyRef` from a browser, not a JWT-supplied tenant.
4. The user's own current Skilled role, active and verified account flags, and lack of soft deletion.
5. A fresh membership in the internally resolved Skilled company.

The result returns only Skilled's canonical user ID, company ID and current role. Central-provided role claims never grant Skilled permissions. Loss of Central connectivity fails authentication rather than allowing a cached or anonymous session.

## Tests and evidence

Thirty fixture cases cover legitimate users in each Skilled role, account/organisation/link mismatch, revocation, ambiguity, invalid revisions, inactive/unverified/deleted users, changed local role and nonmatching tenant records. Backend Vitest also checks Central failures and identical duplicate links. Existing scoped-identity and provisioning-route tests run in the same workflow.

## Deferred deliberately

This module is **not mounted on any route**. It does not verify an ID token itself or mint a local session. A configured Central OIDC client, cryptographic issuer/audience verification, organisation registry mapping and revocable app session lifecycle remain prerequisites. Central's current app ID is `academy`; do not silently switch to `lms` without a coordinated migration of registration, callback URLs and existing records. Existing Skilled password login and service-to-service credentials are unchanged.

The table that will persist Central organisation-to-Skilled account mapping is not part of the current Prisma schema; this pass does not invent it or run a shared database migration. Do not mark #71, #68 or Central #27/#28/#29 complete based on this policy alone.

## Future integration contract

Wire only trusted dependencies, using an explicit source for `centralOrganisationId -> companyId` and Central's versioned access-decision API. Check live membership and link revocation on every new session and on session refresh. Issue Skilled-local revocable sessions, not Central's tokens copied into Skilled JWTs. Preserve current database authorisation, assessment role checks, tenant boundaries and service-token isolation.
