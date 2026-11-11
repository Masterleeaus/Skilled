# Assessment publication fail-closed hardening — Pass 6

Scope: scripts/validate-assessment-publication.mjs and scripts/reconcile-assessment-questions.mjs, supporting issue #26.

## Corrected runtime behavior

The publication validator previously assumed a parsed JSON document was an object with strings and non-null answer records. Valid JSON primitives such as `null`, `true`, arrays, a numeric `passRule`, malformed `rationale` and null answer entries could throw at runtime. Instead of producing a stable blocked status and a report, a strict check could fail from an unhandled TypeError.

Now the validator explicitly checks the root document shape and its lesson ID, guards every answer entry and its ID, requires rationales and pass rules to be non-empty strings, and refuses malformed sources without treating them as approved. The question reconciliation helper also guards null and non-object records on either side of the question-answer join. It records `invalid_question_entry` and `invalid_answer_entry` as review findings rather than throwing.

The production approval requirements are unchanged: exact file SHA-256, approved status, a non-placeholder reviewer, and a parseable past ISO review date.

## Verification

Twenty isolated malformed JSON fixture cases live in `tests/fixtures/assessment-malformed/`. The new `scripts/test-assessment-malformed.mjs` executes the real validator and its question reconciliation helper in a temporary curriculum sandbox. Each test requires process exit status 1, an inspectable JSON report, exactly one blocked assessment and the specific refusal code. It does not write to canonical course source files, approval records or learner content.

The test is added to the full curriculum CI self-test suite, and the workflow triggers on the new fixtures. The existing strict gate stays red until all real assessments have verified human approval.

## Limitations

This is a dependency-free source-level regression, not an assessor sign-off or a live API/database smoke test. Production readiness and issue #26 closure require additional verification.
