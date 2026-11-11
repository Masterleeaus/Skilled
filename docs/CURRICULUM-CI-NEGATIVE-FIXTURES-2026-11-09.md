# Skilled curriculum CI: negative publication fixtures (2026-11-09)

Tracks issue #26 (ACA-020); does not claim closure of editorial approvals in #34.

## What this pass adds
20 isolated malformed assessment JSON fixtures under `tests/fixtures/assessment-publication/`, plus a dependency-free regression runner. Every scenario is intentionally blocked: invalid JSON, mismatched lesson identity, missing/duplicate question keys, invalid indices, absent rationales, empty practical criteria, unconfigured pass rule, and malformed evidence or stop-work requirements.

The validator now accepts an explicit `--curriculum-root=PATH` for *CLI testing only*. Omitting it continues to scan the canonical curriculum. The test materializes fixtures in a temporary directory, leaves approvals empty, verifies the precise refusal code for every fixture, demands zero approved records, and confirms that `--fail-on-blocked` exits non-zero.

CI has two independently reported jobs:
1. The existing full curriculum quality gate, deliberately kept fail-closed, including index drift, review queue reproducibility and assessment approvals.
2. `Assessment publication negative fixtures`, validating security regressions without waiting for human content sign-off.

The fixture job does **not** certify curriculum release readiness or replace the full quality gate.

## Existing CI debt observed on 2026-11-09
GitHub Actions run 42544441883 failed on current main-aligned content:
- the committed normalization index differs from a fresh build;
- the curriculum review queue self-test fails;
- 1,267/1,267 assessments remain blocked, with zero approved.

These are legitimate reasons for the full gate to stay red. No approval hashes, sign-offs, or learner-facing curriculum content were modified here. A clean editorial review is required before blocked assessments can publish.

## Verification and next steps
Run `node lms-main/scripts/test-assessment-publication-negative-fixtures.mjs` from the repository root. Run `pnpm curriculum:ci` from `lms-main/` to reproduce the full gate, which is expected to fail until drift and editorial approvals are reconciled. Verify branch GitHub Actions job result before merge.

Follow-up: regenerate the normalization index and review queue from the unchanged canonical sources in a dedicated controlled commit; review source hashes. Do not mark content approved merely to make CI green.
