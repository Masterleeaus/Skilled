# Curriculum regression snapshot, 2026-11-03 (re-run with mechanical-fix pass)

Read-only snapshot of `curriculum/` after the boom-length text-vs-register check and the mechanical-defect sweep. No lesson, licence, assessment or register file was edited in this pass. Prior version of this file (same date, earlier pass) was replaced; its checker results match this run.

## Summary

| # | Check | Result |
|---|-------|--------|
| 1 | JSON files under `curriculum/` that fail to parse | 0 of 2,616 |
| 2 | `check.py` problemCount | 1 (lessons with any failure: 1 of 932), NEW-DEK-01 check 4 |
| 3 | `check_official_refs.py` errors | 0 |
| 3 | Entries missing fields (alias-aware) | 50 (null URLs; unchanged) |
| 3 | Unresolved bare citation tokens | 1 (`R5` in NEW-DEK-01, zone-name false positive) |
| 4 | Assessment inventory test (`test-assessment-inventory.mjs`) | PASS, 16 assertions |
| 5 | Curriculum CI audit (`ci-curriculum-audit.mjs`) | PASS, 216 drafts, self-tests passed |
| 6 | Assessment publication gate (`validate-assessment-publication.mjs`) | 0 approved, 932 blocked (review and approval gate, not a parse failure) |
| 7 | Mechanical fixes applied in this pass | 0 (see log) |

Headline: no file failed to parse, and no check found a clearly mechanical defect. The remaining failures are content or data gaps, which the owner's instruction excluded from edits.

## 1. JSON parse

- Files found under `curriculum/`: 2,616. Parsed successfully: 2,616. Failures: 0.

## 2. check.py (learner-text quality)

Run from a copy at `/tmp/regr-scripts/check.py` with `python3 -I`. Output went to `/tmp/regr-out/lesson-quality-check.json`.

- lessonsScanned: 932; lessonsWithAnyFailure: 1; problemCount: 1.

| Check | Checked | Failing lessons | Problems |
|-------|---------|-----------------|----------|
| 1_status_review | 932 | 0 | 0 |
| 2_no_correctIndex_in_learner_file | 932 | 0 | 0 |
| 3_approved_business_placeholders | 932 | 0 | 0 |
| 4_no_internal_codes_in_learner_text | 932 | 1 | 1 |
| 5_no_empty_required_sections | 912 (20 templates exempt) | 0 | 0 |

Problem: `courses/deck-and-fence-maintenance/NEW-DEK-01.json`, `/instruction[2]/body`, check 4. The token `R5` is a zone name ("listed rural and R5 zones"), not an internal citation code. Not changed: removing or rewording it alters learner text, which is outside this pass.

## 3. check_official_refs.py

Run from a copy at `/tmp/regr-scripts/check_official_refs.py`. Output went to `/tmp/regr-out/official-refs-check.json`.

- lessonsScanned 932; lessonsWithOfficialReferences 522; lessonsWithoutOfficialReferences 410.
- entriesTotal 1,591; entriesStrictSchemaFieldsPresent 1,591; entriesMissingFieldsAliasAware 50; entriesUsingNonSchemaFieldNames 0.
- citationsBracketed 0; citationsBareOnly 1; unresolvedCitations 0.
- referencesAtStartIdsNotInList 0; errors 0.
- lessonsCitingRegulationWithoutReferences 1 (`F11-L01`, `shared/starting-business/F11-L01.json`).

The 50 null `officialReferences` URLs (32 lessons) are a data gap, not a parse or schema defect. Filling them needs sourced URLs, so they are left as they are.

## 4. Assessment and CI checkers

- `node scripts/ci-curriculum-audit.mjs --report build/curriculum-ci-report.json`: exit 0. "Curriculum CI: PASS - 216 drafts". Audit codes: MISSING_OUTCOMES 16, MISSING_LEARNER 119, LEARNER_ID_MISMATCH 119, LEARNER_TITLE_MISMATCH 119. Assessment gate: 0 approved of 932. Self-tests passed (audit-curriculum, reconcile-lesson-formats, curriculum-review-queue, assessment-reconciliation). The script's default report path was written (`build/curriculum-ci-report.json`).
- `node scripts/test-assessment-inventory.mjs`: exit 0, "PASS: 16 current inventory and historical continuity assertions; 932 assessments, 453 review findings".
- `node scripts/validate-assessment-publication.mjs <tmp file>`: exit 0. Blocked reasons across 932 files: `missing_or_stale_human_approval` 932, `question_mapping_unmatched_answer` 452, `question_mapping_missing_converted_lesson` 421, `unconfigured_pass_rule` 182, `question_mapping_question_without_answer` 34, `missing_answer_keys` 20, `missing_practical_criteria` 12, `question_mapping_answer_out_of_range` 2.

## 5. Mechanical-defect sweep and decisions

Candidates checked against the owner's rule (broken JSON, unparseable knowledge check, missing assessment key):

| Candidate | Count | Decision |
|-----------|-------|----------|
| Unparseable JSON under `curriculum/` | 0 | None found, nothing to fix |
| Learner check id with no assessment key (check 5 of `check.py`) | 0 of 2,831 | None found |
| `missing_answer_keys` (empty `knowledgeAnswers`) | 20 | Not fixed. Adding keys needs a correct answer and rationale, which is content. The validator also forbids inferring correct answers. |
| `missing_practical_criteria` | 12 (C09-L01..L03, C10-L01..L03, NEW-POND-04..09) | Not fixed. Criteria are authored content. |
| `answer_out_of_range` | 2 (car-detailing-L03, car-detailing-L07) | Not fixed. Choosing the correct option is a content decision. |
| `NEW-DEK-01` `R5` token | 1 | Not fixed. Learner text; a false positive. |
| Null officialReferences URLs | 50 | Not fixed. Needs sourced URLs. |
| `LEARNER_ID_MISMATCH` / `LEARNER_TITLE_MISMATCH` (119 each) | 119 | Not fixed. Changing learner ids or titles alters content and needs owner review. |

## 6. Mechanical fix log

No mechanical fixes were applied in this pass. Every candidate was either absent or required a content decision. Repository files changed: none, apart from the script-default report `build/curriculum-ci-report.json` and this file.

## 7. Learner-visible UNCONFIRMED and "not yet confirmed"

Scope: lesson JSON fields except `officialReferences` and `sourceReferences`.

- "UNCONFIRMED" (case-sensitive): 0 learner-visible occurrences.
- "not yet confirmed" (case-insensitive): 0 learner-visible occurrences.

Outside learner scope: `UNCONFIRMED` 1,749 in source and official reference fields; `not yet confirmed` 45 in the same fields; 106 `UNCONFIRMED` in assessment files (assessor-only).

## Decisions made

1. Checkers were run as copies from `/tmp/regr-scripts/` with `python3 -I`, so their default output paths (`/home/claude/work/`) were not overwritten.
2. The CI audit and assessment checks were run with their own default or `/tmp` output paths.
3. Learner-visible scope and the lesson set follow `check.py`'s header definitions (unchanged from the prior pass).
4. Prior version of this file is kept at `/tmp/regr-out/prior-REGRESSION-SNAPSHOT-2026-11-03.md` (scratch, outside the repo).

## Sources

- Checkers: `/tmp/regr-scripts/check.py`, `/tmp/regr-scripts/check_official_refs.py` (copies of `/home/claude/work/` versions); `scripts/ci-curriculum-audit.mjs`, `scripts/test-assessment-inventory.mjs`, `scripts/validate-assessment-publication.mjs`.
- Data: `curriculum/**/*.json`, `curriculum/assessments/`, `curriculum/licence/lesson-licence.json`.
- Scratch outputs (not in repo): `/tmp/regr-out/`.
