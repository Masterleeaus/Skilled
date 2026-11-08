# GRADING fix: server-side knowledge-check answer keys (PASS43)

Date: 2026-11-02. Database: `lms` only (role `lms`, 127.0.0.1:5432). `lms_trial` was not used. No commit. No memory tool used. Credentials were read into command environments only; none is written in this file, in any log, or in any script. Lesson content, level CSVs and the course map were not changed.

## Bug

Published revisions carry knowledge checks with no `correctIndex`. The attempt route graded only against `correctIndex` in the stored body, so no answer could be marked correct. Base levels could not finish, so group and specialised stayed locked.

## Design (decision recorded)

- Answer keys are never sent to learners. They are stored server-side in a new table `academy_knowledge_answer_keys`, one row per pinned revision and check ID (unique on `revisionId` + `checkId`).
- Keys are loaded from `curriculum/assessments/<lessonId>.assessment.json` (`knowledgeAnswers`: id, correctIndex, rationale), matched by lesson ID and check ID. A check with no key, a key outside the options, or a malformed or mismatched assessment file is refused. Nothing is guessed or matched by position.
- Grading reads the keys from the table. A check with no loaded key makes the attempt refused (409) and records nothing (fail closed).
- The 80% rule is unchanged: a lesson passes at `score / total >= 0.8`, so three checks need all three correct.
- Learner payloads: the outline, the attempt response and the stored revision body carry no key field or rationale.

## Schema and migration

- `apps/backend/prisma/schema.prisma`: new model `AcademyKnowledgeAnswerKey` (`academy_knowledge_answer_keys`); `AcademyLessonRevision` gets the back-relation.
- Migration `apps/backend/prisma/migrations/20261102270000_academy_knowledge_answer_keys/migration.sql`. Additive only: a new table, a unique index and a foreign key to revisions. Applied to `lms` with `prisma migrate deploy`. `migrate status` reported 21 migrations, all applied, and the schema up to date.

## Code changes

- `apps/backend/src/modules/curriculum/knowledge-answer-keys.ts` (new, pure): `readAssessmentKeys`, `planAnswerKeys`, `knowledgeCheckList`.
- `apps/backend/prisma/load-knowledge-answer-keys.ts` (new loader): upserts keys for every published revision with checks. Prints counts and check IDs only.
- `apps/backend/src/modules/curriculum/curriculum.routes.ts`: the attempt route reads the keys from the table. Lines 168 and 170 no longer use the body's `correctIndex`.
- Test support: `src/tests/support/fake-prisma.ts` (new model), `support/academy-fixtures.ts` (check IDs, server-side keys, no stored `correctIndex`), `academy-levels.test.ts`, `aca-012-013-assessment-evidence.test.ts`, `academy-snapshot-history.test.ts` (check IDs added to the expected shape).
- New tests: `src/tests/academy-knowledge-answer-keys.test.ts`.

## Key load on lms

Command: `npx tsx prisma/load-knowledge-answer-keys.ts`. Output saved at `/home/claude/work/lms-load/answer-keys-load.log`.

| Measure | Result |
|---|---|
| Published revisions | 615 |
| Revisions with knowledge checks | 595 |
| Checks | 1,693 |
| Keys loaded | 1,693 |
| Checks refused (no key, bad index, no id) | 0 |
| Assessment files refused as malformed | 0 |

Database check: `academy_knowledge_answer_keys` holds 1,693 rows after the run. The loader is idempotent.

## Tests

- Unit and route suites (`env -u DATABASE_URL npx vitest run`, no database URL, so nothing touches `lms`): 292 of 292 tests pass across 17 files. Seven files fail as before: `auth`, `health` and five integration suites. They need environment and test-database setup that this run does not provide. This is unchanged from the baseline (7 failed files before the change).
- New tests cover: the key is absent from the outline and the attempt response; the stored body holds no key; correct answers pass; wrong answers fail (including 1 of 2, below the 80% rule); a check with no key is refused with 409 and records nothing; the planner keys by ID, refuses missing, out-of-range, id-less and mismatched keys; duplicates and malformed files are rejected.
- Level test added (`academy-levels.test.ts`): a wrong answer leaves base unfinished; correct answers through the attempt route finish base and unlock group.

## Live test on lms

Backend rebuilt (`tsc`) and restarted on port 5000 against `lms`. A scratch learner was registered through `/auth/register`, its email flag set in the database, and enrolled in the `handyman` course. Script: `/home/claude/work/lms-load/pass43/e2e.mjs`. Result: `/home/claude/work/lms-load/pass43/e2e-results.json`. Log: `/home/claude/work/lms-load/pass43/e2e.log`.

| Step | Result |
|---|---|
| Base lessons acknowledged | 74 of 74 (HTTP 200/201) |
| Wrong attempt on `additional-specialist-services-L10` | HTTP 200, score 0 of 2, passed: false |
| Correct attempts on base lessons with checks | 63 of 63 passed |
| Base level | finished |
| Group level | unlocked; 12 lessons, none locked, bodies shown |
| Specialised level | locked, waiting on group |
| Group acknowledgement (`WAH-TPL-01`) | HTTP 200 (was 403 before the fix) |
| Payload scan (outline and attempts) | no `correctIndex`, no `rationale`; check fields are `id, options, question` only |

Note: the correct answers in the live test were chosen from the key table. That is a test oracle only. The learner-facing API never returns keys.

## Residual items

- Scratch learner and its enrolment, completions and attempts are left in `lms`. The earlier trial learner was not modified.
- `/home/claude/work/lms-load/gate2.mjs` takes correct answers from `correctIndex` in the stored body. It now fails by design and is superseded by `pass43/e2e.mjs`.
- Learner-facing lesson GET does not exist in the API (lesson routes are editor-only). The editor GET returns revision bodies, which hold no keys.
- The backend environment variables were inherited from the earlier run; the restarted process uses the same service variables.
