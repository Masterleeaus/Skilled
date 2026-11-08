# Titan Academy — Pass 48: Multi-select quiz support

## Source changes

- `Question.type=MULTIPLE_CHOICE` now accepts **multiple selected option IDs** per `Answer` in the new optional JSONB `selected_option_ids` column. Existing `selectedOptionId` single-choice answers are retained without conversion.
- Submission validation rejects repeated option IDs, cross-question options, conflicting answer modalities, incomplete responses, and incorrect modalities (single vs multi vs text).
- Multi-select grading uses deterministic **exact-set** scoring: all correct choices and no incorrect choices earn full marks; any missing or additional choice earns zero. Choices may be submitted in any order. TEXT stays pending manual marking.
- Teacher UI can create multi-choice questions and mark multiple correct choices; learner UI renders checkboxes and submits option ID arrays.
- API input validation now requires at least two correct options for MULTIPLE_CHOICE, exactly one for SINGLE_CHOICE, and no options for TEXT. Publication checks mirror these constraints.

## Migration order and precautions

1. Install dependencies and generate the Prisma client against the Pass 48 schema before starting updated services.
2. Verify the Academy database target is **titan_academy** and not `ai_fsm` or `titan_desk`. Do not use `prisma migrate reset` or destructive `db push`.
3. Review `20261102230000_academy_multiple_choice_answers/migration.sql` and apply with the official Prisma migration workflow **only to the Academy database** after backing it up. It adds a nullable JSONB column and does not rewrite existing answers.
4. If PostgreSQL compatibility remains unverified, first execute migrations on an **isolated, empty Academy test database** using the intended server version; do not alter the existing production database server.
5. Run end-to-end tests for selecting/deselecting checkboxes; exact-set grading; persisted selections after restart; quiz attempts containing manual TEXT answers; and race-safe duplicate submissions.
6. Historical multi-choice answers stored as a single `selectedOptionId` remain intact but **are not automatically backfilled**, as their original intended selected set cannot be reconstructed.

## Verification scope

The included `scripts/test-multiselect-quiz.mjs` executes the actual TypeScript `submitAttempt` service against a deterministic Prisma mock and checks the source contract. This does **not** prove the migration works on a live database, that Prisma client generation succeeds, or that the frontend builds. Full dependency-installed builds and browser tests are pending.

## Outstanding design work

- Consider configurable partial-credit schemes only after subject-matter review; exact-set scoring is the current clear contract.
- Add PostgreSQL integration tests for the JSONB column, Prisma JSON serialization, and concurrent submissions.
- Run real student/teacher browser flows and a clean pnpm/Next.js/TypeScript build prior to deployment.
