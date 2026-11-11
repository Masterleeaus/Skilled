# Pass 22 — Deactivated account protection in service skills API

## Defect corrected
A linked external identity could retrieve current verified competencies even when its corresponding Academy account had been deactivated or soft-deleted. The integration now checks `User.isActive` and `User.deletedAt` before organisation membership and competency retrieval, returning a non-enumerating 404 and recording `INACTIVE_LEARNER` in the integration audit.

## Validation
Run `node apps/backend/tests/pass22-inactive-identity.test.cjs` for source-order regression assertions. These are **not** a substitute for integration tests against PostgreSQL. Prisma and TypeScript compilation remain unverified without installed dependencies.

## Remaining production work
Confirm external app contract semantics for suspended workers, run Prisma validation, compile both apps, and execute database-backed tests with active, inactive and soft-deleted learners.
