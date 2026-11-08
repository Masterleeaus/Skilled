# Stale lesson copies: rebuild applied

Date: 2026-11-03
Owner decision: `curriculum/research/OWNER-DECISIONS.md`, item 16 ("Rebuild them from source").
Plan followed: `curriculum/research/STALE-COPIES-REBUILD-PLAN.md`, except where item 16 overrides it (see "Differences from the plan").

Nothing was committed. The repo is not a git repository.

## Run

- Final rebuild run: 2026-11-03 11:04:14 UTC. Sources read: 932 (`curriculum/courses/**` and `curriculum/shared/**`).
- Source-set hash at that run (SHA-256 over the sorted path and content hash of every source lesson file): `f1ab8ef215ab6258e15dce0af7f50f7aa93251366361c319dace99a2c0a5df3f`.
- Other agents were editing sources during this work. Several earlier runs saw different hashes, and the rebuild was repeated until the rebuild and the verifier saw the same snapshot. The final run was the one checked by the verifier, and the verifier re-read sources and got the same hash (see Verification).
- An earlier run stopped partway through the write step, because 36 source lessons (high-risk, caregiving, team, app and validation shared lessons) have an empty `courseSlugs` list. The copy folders were restored from the backup (checked against its SHA256SUMS) before the script was fixed and rerun. The final output is from one complete run on a restored folder.

## Backup

- Path: `/home/claude/work/copies-backup-2026-11-03/`
  - `converted/` (511 files) and `ready/` (216 files), copied before any change.
  - `SHA256SUMS` for all 727 backup files. Verified after the restore.
  - `lesson-quality-check.before-run.json` and `lesson-quality-check.before-rebuild.json`: copies of the `check.py` output before the run.
- Restore: copy `converted/` and `ready/` back into `curriculum/lessons/`.

## Scripts (outside the repo)

- Rebuild: `/home/claude/work/rebuild-lesson-copies.py` (run with `python3 -I`). Reads sources, maps every existing copy to its source by `id`, refuses to write if any copy has no source, then writes each copy in place.
- Verify: `/home/claude/work/verify-lesson-copies.py` (run with `python3 -I`). Re-reads sources and compares every field of every copy. Read-only apart from its result file.
- Outputs: `/home/claude/work/copies-rebuild/` (`rebuild-result.json`, `verify-result.json`, `no-converted-copy-ids.txt`, read-only reader outputs).

## Counts rebuilt

| Folder | Copies rebuilt | Copies out of step with source before the rebuild |
|---|---|---|
| `curriculum/lessons/converted/` | 511 | 419 (title 3; knowledge-check count 194; check IDs missing 193; question text 145; option text 324; option order only 1) |
| `curriculum/lessons/ready/` | 216 | 216 (title 1; knowledge checks absent 119; option lists absent 97; question text 79; count 66; IDs missing 80) |

Measure: each copy compared with its source, knowledge checks matched by ID, exact text. A copy counts once per flag. The 419 and the `ready/` flag counts come from the final run's snapshot.

Difference from the audit: `STALE-COPIES-AUDIT.md` and the plan report 162 out-of-step converted copies. This exact-match count is 419. I did not reconcile the two methods. Source wording has changed since the copies were made (for example, C01-L01 K02 option text now reads "at the next stop" where the copy reads "to save time"), and source edits by other agents may explain part of the gap.

## Sources with no copy

- No converted copy: 421 of 932 sources. Not created (item 16 covers existing copies only). Full ID list: `/home/claude/work/copies-rebuild/no-converted-copy-ids.txt`.
- By course slug: residential 140; healthcare 78; pool 55; commercial 34; window 11; cardetail 12; handyman 21; pt 15; shortstay 9; pond 6; yoga 3; strata 2; aquarium 4; carpet 1; roof 1; shared lessons with no course slug 29.
- No ready copy: 716 of 932 sources. `ready/` is a subset of `converted/`.
- Copies with no source: 0.
- Template lessons among rebuilt converted copies: 0.

## Format decisions (applied; reviewer may change)

1. `converted/` keeps its flat layout (`id`, `title`, `knowledgeChecks`) and adds the owner's fields: `courseSlugs`, `status`, `reviewStatus`, `instruction`, `procedure`, `workedExamples`, `commonErrors`, `safetyAndRegulatory`, `summary`, and `officialReferences` only where the source has that key (538 of 932 sources).
2. `ready/` keeps its envelope (`id`, `title`, `business_or_group`, `lesson_type`, `status`, `content.source`, `content.learner`). All 216 copies now use the learner-only form. The 119 bundle-shaped copies (`courseLessons`, `files`, `sourceFiles`) were converted to that form. Their `files` and `courseLessons` content is not in source and is kept only in the backup.
3. In the `ready/` learner block, `instruction` is written as `instructionSections` (the name the existing learner form uses). `courseSlugs` is written as `courseIds` (the name the CI reader uses). The learner block also has `learningOutcomes`, `knowledgeChecks`, and the other owner-listed fields.
4. Status: each copy carries its source's `status`, which is `READY` for all 932 sources (owner decisions 11 and 12). The `ready/` copies previously said "READY FOR REVIEW - source draft, not verified"; that wording is gone. `reviewStatus` is also copied, and every source still reads `NOT REVIEWED`, so the review state is kept.
5. Knowledge checks: `id`, `question`, `options` only, in source order. No `correctIndex` appears in any copy (checked by a recursive walk).
6. Licence notices: `safetyAndRegulatory` is copied whole, so each `licenceNotice` is carried exactly as in source. 545 sources have a non-empty `licenceNotice`. The other 387 have the key with an empty or null value, and the copies keep that too.
7. Dropped from `ready/`: the 97 learner-shaped copies' `assessor` blocks (model answers and rationales). Model answers are not in source and cannot be rebuilt from it. They are preserved only in the backup. Also dropped from the old learner block: `classification`, `topic`, `guidedPractice` and `moduleId` (none of these is in source). Also dropped: the bundle-shape `files`/`courseLessons`/`sourceFiles` (also backup only).
8. JSON style: indent 1, UTF-8, trailing newline, same as the existing files.

## Verification

- `verify-lesson-copies.py` at source hash `f1ab8ef2…`: 511 converted and 216 ready copies checked, 0 with problems. It checks: exact key set; each field equal to source; knowledge checks equal to source (ID, question, options, order); no `correctIndex`; licence notices and `officialReferences` equal to source; `status` and `lesson_type` equal to source.
- `check.py` (`/home/claude/work/check.py`), before and after on the same sources: 932 lessons scanned, 0 problems before, 0 after, identical problem list. Note: `check.py` changed during this work (its status rule now accepts `READY`), so the before run used the version on disk at that time.
- `node scripts/audit-curriculum.mjs --json` (read-only, stdout only): 216 of 216 parsed, 0 issues. An earlier version of the rebuild produced 216 `MISSING_COURSE` issues; fixed by writing `courseIds`.
- `node scripts/reconcile-assessment-questions.mjs /home/claude/work/copies-rebuild/recon-final.json` (output redirected away from the repo): the 511 copy-backed assessments have 0 findings. The 421 assessments with no copy are reported as `missing_converted_lesson` (421) and `unmatched_answer` (1,248), as they were before. The committed `curriculum/assessment-question-reconciliation-pass41.json` covers only 511 records, so it does not match the current 932-assessment set.
- Not run: `scripts/ci-curriculum-audit.mjs`, `scripts/reconcile-lesson-formats.mjs` and `scripts/validate-assessment-publication.mjs`. Each writes to repo report or index files, and this task did not ask for those writes. Their result after this change is unverified.

## Differences from the plan

- The plan (D2) recommended archiving the two folders and not regenerating. Item 16 says rebuild. The owner decision was followed.
- The plan's 162 out-of-step count is not used (see Counts).
- Copies have their own `status`. The plan did not cover this.

## Files changed in the repo

- `curriculum/lessons/converted/*.json` (511 files rewritten)
- `curriculum/lessons/ready/*.json` (216 files rewritten)
- `curriculum/research/COPIES-REBUILD-APPLIED.md` (this log, new)
- `curriculum/research/OWNER-DECISIONS.md` (one line under item 16)

No source lesson, assessment, report, or `check.py` file in the repo was changed by this work.
