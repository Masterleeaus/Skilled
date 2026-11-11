# Skilled curriculum publication approval contract — Pass 5

Tracking: issue #26, ACA-020.

## Scope

This test executes **the actual publication validator** from the checked-out repository in a temporary copy of its existing script and reconciler. It creates one isolated synthetic source lesson, one assessment and (when appropriate) one synthetic approval. The same complete strict-mode validation path is exercised for each case.

The 28 fixture JSON files deliberately live in `tests/fixtures/publication-gate-contract/`, outside the canonical `curriculum/` directory. They are not real lessons or real approval records.

## Positive gate cases

Four explicitly approved synthetic inputs demonstrate that strict validation accepts an exact file SHA-256, a plausible named reviewer and a parseable past ISO date, including valid timezone offsets and fractional seconds.

## Negative gate cases

24 cases confirm rejection for missing or stale approval, placeholder/future/invalid review metadata, lesson identity mismatch, absent or duplicate answer keys, invalid/out-of-range indices, empty rationales, missing practical criteria, unset pass rule, malformed evidence fields, malformed JSON, missing source lesson and mismatched or incomplete source questions.

Every case must produce exactly one detailed report, and strict exit codes must agree with the recorded decision. No approvals are generated in the real curriculum.

## Execute

```bash
node lms-main/scripts/test-assessment-publication-contract.mjs
```

This regression runs independently through GitHub Actions on changes to the tests, validation scripts and workflow. The existing full `curriculum-ci` job is deliberately not weakened: it will continue to fail as long as actual assessment files lack qualifying human approvals.

## Known limitations

The validator accepts a syntactically plausible reviewer name, while the backend additionally verifies reviewer IDs where needed. The synthetic positive tests prove *mechanism*, not an actual subject-matter review or authorization to publish a real assessment. No browser, worker, database or staged environment is exercised by this offline test.

Do not close #26 solely on these tests. Full curriculum verification still needs both demonstrated failure and clean acceptance with all required workflows passing, and confirmation of configured branch protections.
