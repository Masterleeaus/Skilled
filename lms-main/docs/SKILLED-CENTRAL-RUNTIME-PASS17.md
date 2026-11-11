# Skilled Pass 17 — verified Central runtime and session revalidation

## Integrated production modules
The new `createCentralRuntimeDependencies` factory connects the *existing* authenticated Central decision transport to company-scoped provisioned Central identities, the existing Prisma-backed Skilled account readers, the existing verified local session handoff and the existing revocable session store. Every new session and every subsequent access is checked against current local company mapping, user account, company membership and a fresh Central decision.

`createScopedCentralSubjectLookup` reads only operator-provisioned `AcademyExternalIdentity` rows with `service=titan-central`, the exact user/company IDs and expected issuer|subject. Email is never used. Missing, ambiguous, legacy company-null and mismatched identities deny access. Current Central decisions are checked for exact organisation, local user, local account and application; issuance additionally requires unchanged membership, entitlement and link revisions. The tenant is resolved from Skilled's own verified company link, not a browser-provided company reference.

`createCentralRuntimeRouter` composes the previously built OIDC login/callback HTTP handler with the local session/logout handler, and rejects mismatched issuer/subject decision envelopes. The factory itself does not mount routes in `app.ts`. `centralRuntimeEnabled` requires operator-verified migration, OIDC registration, trusted Central transport, proxy controls, tenant isolation and logout rehearsal in addition to the explicit feature flag.

## Security / operational boundaries
- This remains **disabled and unmounted** in the production application, not a live SSO announcement.
- The Central decision HTTP endpoint is an existing *client-side* contract and still requires an actual compatible Central server handler, credential provisioning and live two-way verification. No anonymous HTTP / browser-supplied identity is accepted.
- The current `academyExternalIdentity` global unique legacy constraint remains in force; this pass makes no unverified schema migration or production data changes. Multi-tenant migration must reconcile it safely.
- Revocation checks are performed on each access, and Central outage denies the session rather than using cached approval.
- A full two-organisation live deployment and global logout propagation remain to be tested. Password login remains the rollback path.
- No course editorial approval or publication gate was altered.

## Verification
The new runtime suites exercise initial account resolution, fresh revision checks, Central-side revocation after session issuance, local mapping revocation, membership loss, company token isolation, decision envelope replacement, and off-by-default router protection. CI runs the new suites with existing OIDC/session/decision contracts and backend type checks. This is source integration verification, not evidence of live Central connectivity. Do not close issue #71 or #68 yet.
