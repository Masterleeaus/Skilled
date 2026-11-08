# Pass 41 — assessment question-to-answer reconciliation

The audit compares canonical `curriculum/assessments/*.assessment.json` answer keys to `curriculum/lessons/converted/<lessonId>.json` knowledge checks. It validates question IDs and answer index bounds **without guessing correctness**. Missing converted files are flagged even where a different source lesson exists. A missing converted source is not proof that a lesson is absent.

Run `node scripts/test-assessment-reconciliation.mjs` and `node scripts/reconcile-assessment-questions.mjs curriculum/assessment-question-reconciliation-pass41.json` to reproduce the audit. The existing publication gate now blocks question mapping findings as well as editorial approval failures.

## Follow-up

1. Resolve the 141 missing converted-lesson mappings using authoritative source material; do not create invented questions.
2. Investigate the 494 unmatched answer IDs and align them to real source questions only after editorial confirmation.
3. Verify the actual correct option and rationale for each aligned question; index-in-range alone does not prove correctness.
4. Audit the nine assessment JSON documents outside the canonical assessment directory separately, including whether they are actual assessment definitions.
5. Run Prisma/TypeScript and PostgreSQL integration tests in a dependency-enabled environment.

No assessments are auto-approved. This pass is an executable source-data audit, not live LMS validation.
