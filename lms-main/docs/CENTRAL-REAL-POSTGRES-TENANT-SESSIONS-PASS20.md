# Central opaque sessions — real PostgreSQL tenant-isolation pass 20

This pass uses **actual PostgreSQL 16**, two distinct tenant companies/users/links/memberships, and the production `createSkilledCentralSessionStore` implementation without replacing it with a mock. Each test creates isolated database records with unique IDs and cleans up only its own data. The workflow provisions a disposable database from the repository's actual Prisma schema. It does not operate against production or shared staging databases.

## Independently tested contracts

Eighteen dedicated scenarios prove: both companies can establish distinct sessions; raw tokens never appear in stored session rows; revoked company links, removed memberships, disabled/unverified/soft-deleted users and denied Central entitlement fail closed; session token revocation, user revocation and company revocation do not affect the other tenant; normal refresh rotation invalidates the predecessor; replay/cross-company rotation fails atomically; competing Prisma connections cannot successfully rotate the same predecessor twice; and expired/substituted tokens cannot authenticate.

## Execution

The dedicated `Skilled Central multi-tenant PostgreSQL sessions` workflow starts PostgreSQL 16, validates and generates Prisma schema, applies `prisma db push` to its **empty disposable CI database only**, runs the 18 Vitest scenarios and typechecks the backend and scoped test suite. Never run `prisma db push` against a production database as a deployment shortcut. Production migration deployment requires review, backup and the migration engine.

## Security boundaries

These tests exercise actual SQL transactions and tenant foreign keys, but the injected `verifyCentral` function is a test-controlled decision. They **do not prove** that Central's future live signed/credentialed authorization endpoint exists, that revocation propagates from Central, or that the OIDC browser router is production-ready. No Central sign-in routes or feature flags are activated. Existing password sessions, curriculum publication gates, the 1,267 blocked assessments and 16 missing course mappings are untouched.

Issues #68 and #71 remain open until real Central transport, live provider, tenant membership/revision decisions and end-to-end browser/staging deployment are verified.
