# Skilled Pass 12 — Central-derived local session store

Tracked: Skilled #71 and #68; Central #27, #28, #29.

## Implementation
An additive `SkilledCentralSession` Prisma model and migration store **only** SHA-256 hashes of independently generated random session tokens. Sessions are bound to a local Skilled user, company, trusted Central organisation and local account. Tokens never enter the existing `RefreshToken` model or get copied from Logto/OIDC; legacy password login and regular JWT access/refresh flow remain untouched.

`createSkilledCentralSessionStore` provides `create`, `authenticate`, `revoke`, `revokeUser` and `revokeCompany`. Create requires a current verified local company/account mapping, enabled/verified/nondeleted Skilled user, company membership and a fresh trusted Central authorization callback. Authenticate rechecks **all four** at each request, then conditionally records last activity if the session is still unrevoked and unexpired. Any lost link, membership, current account eligibility or Central authority denies the session. Session rotation revokes the old credential and inserts the new one in one transaction, so a failure rolls back consumption. The default duration is one hour, maximum 24 hours.

The session store is a backend capability **not yet mounted on HTTP routes**. OIDC state/nonce, callback verification, same-site secure cookie issuance and global logout are separate responsibilities that must be completed and reviewed before enabling Central login. Critically, token-derived identity is not passed to current JWT-only `authenticate` middleware: a dedicated guarded middleware still needs to be integrated.

## Regression tests
22 distinct scenario fixtures cover normal access, cross-tenant links, revoked account links and memberships, inactive/soft-deleted users, Central revocation, role changes, expiry, single-session/logout-all revocation, company-scoped revocation and tampered tokens. Additional tests exercise atomic rotation, invalid input, rejected TTL and unavailable Central. Schema-driven fake Prisma covers real model semantics in CI. Independent GitHub Actions runs Prisma validate/generate, test suites and backend TypeScript.

## Deployment / rollback
Do **not** apply this migration in production before checking backup, migration ordering, connection rights and rollback/recovery. Existing login is unchanged; disabling Central integration requires leaving the new tables unused. Expiry/revocation records can be pruned after a retention policy is approved. No live Central sessions have been created.

## Remaining integration
The trusted Central verifier must independently check identity issuer/audience, real-time membership, organisation entitlement and account link status (with verified transport). Route mounting, CSRF/origin-checked logout, cookies and production two-tenant tests remain outstanding. Do not close #71 based on this groundwork.
