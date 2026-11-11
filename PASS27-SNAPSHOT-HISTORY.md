# Pass 27 — Learner snapshot history

Adds `GET /companies/:companyId/lesson-context-snapshots` for authenticated learners. It checks organisation membership, restricts all rows to the requesting learner, supports `limit` (1–100, default 25), optional `revisionId` and an ownership-validated `cursor`. Responses contain snapshot identifiers, lesson revision identifiers, timestamps and content hashes; never resolved business fields. The existing scoped detail endpoint retrieves and verifies historical lesson content.

Security: tenant and learner predicates apply to cursor validation and list queries. Historical records remain immutable. The API does not currently implement snapshot deletion, admin access, or a learner UI.

Verification: `node apps/backend/scripts/verify-lesson-snapshot-list.mjs`. This is a source-contract test, **not** an HTTP/Prisma integration test. Database migrations, full TypeScript compilation and live integration remain unverified.
