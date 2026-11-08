# Stale lesson copies audit

Date: 2026-11-03
Scope: read-only audit. No lesson, source, assessment or report file was changed and no generator was run. Scratch comparison scripts sit in `/tmp/audit/` outside the repo. The repo is not a git repository, so no git status was available.

## Method

- Canonical source: the lesson JSON in `curriculum/courses/**` and `curriculum/shared/**`, matched by its `id` field. Every copy ID matched exactly one source file (no duplicates, no unmatched copies).
- Compared per copy:
  - title;
  - knowledge checks (question text, option wording and option order, question count, IDs);
  - learning outcomes (`ready/` copies only, because `converted/` copies have none);
  - learner-facing text in `ready/` copies (every string under the learner block, exact after whitespace and case normalisation, checked against all strings in the source);
  - presence of licence wording (`safetyAndRegulatory[].licenceNotice`) and `officialReferences`.
- "Out of step" means at least one of title, knowledge checks, learning outcomes or learner text differs. Licence and reference absence is reported separately, because no copy carries those fields at all.

## Copy folders

| Folder | Number of copies | Number out of step | Generator command (if known) | Recommendation |
|---|---|---|---|---|
| `curriculum/lessons/converted/` | 511 | 162 (title 3; knowledge checks 160: question wording 42, option wording 60, question count 52, option order only 6) | None in the repo. Copies came in with the PASS38 zip merge (`/home/claude/p29m/lms-main/PASS38-MERGE-MANIFEST.json`). No script writes this folder. | Do not regenerate (no generator exists). Treat the 162 as stale and do not use them as learner content. Rebuild from source in a follow-up task, after the other agents finish editing `courses/` and `shared/`. |
| `curriculum/lessons/ready/` | 216 | 216 (title 1; knowledge checks 97; learning outcomes 113; learner text 176) | None in the repo. `scripts/reconcile-lesson-formats.mjs` reads this folder but writes only `curriculum/lesson-normalization-index.json`. | Mark the whole folder superseded. 222 source files cite `lessons/ready/` as provenance, so these drafts predate later source edits. Do not regenerate from it. |

Licence and reference fields, same two folders:

| Folder | Copies | Sources with licence notice | Copies carrying licence wording | Sources with `officialReferences` | Copies carrying `officialReferences` |
|---|---|---|---|---|---|
| `converted/` | 511 | 511 | 0 | 366 | 0 |
| `ready/` | 216 | 216 | 0 | 109 | 0 |

These copies have no licence or reference fields at all, so their licence and reference wording cannot be stale; it is missing. This is a schema gap, not a per-lesson difference.

## Generated reports

| Report | Generator | What it checks | Findings | Limit of the check |
|---|---|---|---|---|
| `curriculum/assessment-publication-report.json` | `scripts/validate-assessment-publication.mjs` (its `source` field) | Assessment publication gates | 357 records, 0 approved, 357 blocked. Reasons: missing or stale human approval 357; unconfigured pass rule 246; question mapping unmatched answer 178; question mapping missing converted lesson 141; missing practical criteria 16; missing answer keys 8 | Does not compare copies against source. |
| `curriculum/assessment-question-reconciliation-pass41.json` | `scripts/reconcile-assessment-questions.mjs` | Answer-key IDs and option bounds, against the `converted/` copies | 511 records, needsReview 0, no findings, automaticallyApproved 0 | A clean result only shows the answer keys match the converted copies. It says nothing about whether the copies match source, and the 162 stale copies pass it. |

## Commands checked

- No script or `package.json` entry generates `converted/` or `ready/`. The root `package.json` scripts are `curriculum:ci` (`scripts/ci-curriculum-audit.mjs`, which writes a baseline and report file) and `test:source`. No command was run.
- Closest scripts, not run:
  - `node scripts/reconcile-lesson-formats.mjs` (reads `ready/`, writes `curriculum/lesson-normalization-index.json`). Read-only with respect to lessons, but it does not regenerate any copy.
  - `node scripts/reconcile-assessment-questions.mjs [output]` (reads `converted/`, writes only the optional output file).
- Regenerating these copies is not possible from the repo. No script maps source to the copy format, and the `converted/` shape (`id`, `title`, `knowledgeChecks`) has no licence or reference field, so a new script would still drop them.

## Decisions made

1. Source files in `courses/` and `shared/` are canonical; copies are compared to them, not the reverse.
2. An option-order-only difference (6 converted copies) counts as out of step.
3. Missing licence and `officialReferences` fields are reported in their own table and are not added to the out-of-step counts.
4. Learner-text differences in `ready/` are exact-string checks, so a paraphrase counts as a difference. Knowledge checks in `ready/` were compared only where a `knowledgeChecks` key exists, so the knowledge-check count for `ready/` is a lower bound.

## Next steps

- Keep the source files as the only learner content.
- Before any rebuild, decide whether `converted/` should be recreated or retired. The 141 assessments with no converted copy need source-based mapping, not copying.
- Re-run `scripts/reconcile-assessment-questions.mjs` after any rebuild, and add a source-freshness check, since the current check does not detect stale copies.
