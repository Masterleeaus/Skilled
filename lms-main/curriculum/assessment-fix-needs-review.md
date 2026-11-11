# Assessment fix: items that need curriculum review

Scope: `unmatched_lesson_source` findings from `curriculum/assessment-inventory-pass39.json` (141 rows) and a fresh run of `scripts/audit-assessment-inventory.mjs`.

## Root cause

The audit matched assessments only against `curriculum/lessons`, `converted-lessons`, `specialist-courses` and `lesson-drafts`. Lesson sources now live in `curriculum/courses/<course>/` and `curriculum/shared/<area>/` (see `curriculum/SCHEMA.md` and `scripts/ci-curriculum-audit.mjs`). The matcher now also scans those two directories. No assessment file was edited, and no approval record was written.

Result on the current tree: every active assessment in `curriculum/assessments/` (1267 of 1267) resolves to a canonical lesson source by lesson id and file stem.

## Items left for curriculum review

| Assessment id | File | Reason |
|---|---|---|
| NEW-TIL-07 | `curriculum/assessments/NEW-TIL-07.assessment.json` (absent) | The pass39 inventory, `assessment-publication-report.json` and `PASS38-MERGE-MANIFEST.json` reference this assessment and `curriculum/courses/tiling/NEW-TIL-07.json`. Neither file exists on this branch or in any git ref reachable from this repo. Restoring or retiring it needs a curriculum decision. Nothing was recreated. |

## Historical entries with no active assessment file (no change made)

These pass39 rows point at files that have moved out of `curriculum/assessments/`. They are not active findings in the current audit.

| Assessment id | Current location | Note |
|---|---|---|
| HR01-biohazard-trauma-cleaning | `curriculum/retired/high-risk/assessments/` | Retired. Active high-risk assessments are the `biohazard-trauma-cleaning-L01..L12` files. |
| HR02-crime-scene-cleaning | `curriculum/retired/high-risk/assessments/` | Retired (as above). |
| HR03-drug-contamination-remediation | `curriculum/retired/high-risk/assessments/` | Retired (as above). |
| HR04-mould-remediation | `curriculum/retired/high-risk/assessments/` | Retired (as above). |
| HR05-fire-smoke-restoration | `curriculum/retired/high-risk/assessments/` | Retired (as above). |
| HR06-flood-water-restoration | `curriculum/retired/high-risk/assessments/` | Retired (as above). |
| HR07-hoarding-squalor | `curriculum/retired/high-risk/assessments/` | Retired (as above). |

Whether the pass39 record should keep these rows is a curriculum and audit-history decision. The pass39 snapshot itself was not regenerated.

## Not in this review

- No approvals were created or changed. `curriculum/assessment-publication-approvals.json` does not exist on this branch and was not created.
- No answer keys or lesson content were changed.
