# Curriculum product-name audit — issue #86

This is a **read-only evidence inventory** of inherited `Titan Academy` strings in canonical Skilled curriculum. It is not an editorial decision and never changes a lesson, publication approval, course placement or content hash.

## Source boundaries

The audit recursively scans JSON within `curriculum/courses`, `curriculum/shared` and `curriculum/structure`. It records JSON pointer, text excerpt, occurrence offset, source line when defensible, and three conservative review classes:

- `learner-visible-review`: text under audience, instructions, objectives, examples, assessment question text and similar learner-facing fields.
- `retain-review-provenance`: historic attribution, source references, licences and editorial evidence which must not be silently rewritten.
- `unclassified-manual-review`: schema IDs, unknown keys and ambiguous text where a reviewer must determine whether an identifier has compatibility consequences.

Derived `curriculum/lesson-normalization-index.json` is checked separately and must **never** be hand-edited; future approved lesson edits need source-based index regeneration and valid editorial approval.

## Why legacy PR #94 was not merged wholesale

At the time of this integration, **37 of the 49 authored JSON files modified in the old PR also changed on `main` since that PR branched**. Blindly copying old versions risks dropping more recent content. A qualified editor must compare each original, proposed replacement and current canonical source, and decide whether the proposed wording remains accurate. The old branch's historical numbers (including 49 replacements) are not represented as current audit results.

## Executable verification

```sh
cd lms-main
node --test scripts/test-audit-curriculum-brand.mjs
node --test scripts/test-curriculum-brand-fixtures.mjs
node scripts/audit-curriculum-brand.mjs --report build/issue-86-brand-inventory.json
```

The **20 distinct negative/positive fixture records** cover learner text, provenance, unknown fields, JSON pointers, different casing, hyphenated names, multiple hits, nested values and non-matches. The GitHub workflow publishes the current report as an artifact. `--fail-on-learner` is reserved for the post-review remediation gate; enabling it before authorized editorial decisions could conflate an inventory with approval.

This report does not claim that the 16 unresolved course mappings or 1,267 assessment approvals are complete. Issue #86 stays open until reviewed content changes, derived hashes and publication checks have been reconciled.
