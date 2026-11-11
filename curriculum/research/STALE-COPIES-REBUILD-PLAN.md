# Stale lesson copies: rebuild plan

Date: 2026-11-03
Status: plan only. No lesson, source, assessment or script was changed, no generator was run, and nothing was committed. The repo is not a git repository.
Scope: `curriculum/lessons/converted/` (511 files) and `curriculum/lessons/ready/` (216 files), compared with the canonical sources in `curriculum/courses/**` and `curriculum/shared/**`.

## 1. Are the copies learner-facing?

No. The copies are not read by the learner-facing app.

- The backend loads lessons only from `curriculum/courses/<course>/*.json` and `curriculum/shared/**/*.json`. See `apps/backend/src/modules/curriculum/file-lesson-loader.ts` (`listLessonFiles`, `buildFileLessonIndex`). The file says that curriculum/assessments, research, planning and report files are never indexed.
- `apps/backend/src/modules/curriculum/curriculum-publisher.ts` takes placement from `structure/COURSES-MODULES.json`, content from the file-lesson index, and answer keys from `curriculum/assessments/<id>.assessment.json`. It does not read `lessons/`.
- No file under `apps/` (backend or frontend, excluding `node_modules` and `dist`) mentions `lessons/converted`, `lessons/ready`, or `curriculum/lessons`. The only backend hit is a path comment in `file-lesson-loader.ts`.

The copies are read only by build and CI tooling:

| Folder | Read by | Effect if removed |
|---|---|---|
| `converted/` | `scripts/validate-assessment-publication.mjs` (question mapping gate, writes `curriculum/assessment-publication-report.json`); `scripts/reconcile-assessment-questions.mjs` (writes `curriculum/assessment-question-reconciliation-pass41.json`) | The publication report changes: every assessment with no converted copy gets a `missing_converted_lesson` finding. No learner impact. |
| `ready/` | `scripts/ci-curriculum-audit.mjs` (`readyDir`, plus the committed-index drift check and the lesson-count coverage check); `scripts/audit-curriculum.mjs`; `scripts/reconcile-lesson-formats.mjs` (writes `curriculum/lesson-normalization-index.json`); `scripts/build-curriculum-review-queue.mjs` (writes `curriculum/lesson-review-queue.*`) | `npm run curriculum:ci` fails with `normalisation could not read the drafts` and/or `normalised N of M drafts`. No learner impact. |

Other facts from the check:

- Every `ready/` ID also exists in `converted/` (216 of 216). `ready/` is a subset of `converted/`.
- 421 of 932 source lessons have no converted copy at all. Their answer keys still load.
- Answer keys in `curriculum/assessments/` are consistent with source. All 932 assessments map to a source lesson. All 2,865 `knowledgeAnswers` IDs exist in the matching source `knowledgeChecks`. All `correctIndex` values are in range. Answer counts equal source knowledge-check counts for all 932. This is the part that does reach learners, and it is not stale.

## 2. Fresh comparison (confirms the audit's totals)

Method: a scratch script at `/tmp/stale-plan/` (outside the repo). Source index uses the same rules as `file-lesson-loader.ts`. Knowledge checks are matched by ID, not by position.

| Folder | Copies | Out of step (any field) | Audit said | Match |
|---|---|---|---|---|
| `converted/` | 511 | 162 | 162 | Yes |
| `ready/` | 216 | 216 | 216 | Yes |

Per field:

| Field | Folder | Fresh count (copies) | Audit count | Note |
|---|---|---|---|---|
| Title | converted | 3 | 3 | Yes |
| Title | ready | 1 | 1 | Yes |
| Knowledge-check count | converted | 52 | 52 | Yes |
| Knowledge-check question text | converted | 65 | 42 | Not reconciled. Totals match, sub-counts differ. |
| Knowledge-check option text | converted | 137 | 60 | Not reconciled. Likely per-question versus per-copy counting. |
| Option order only | converted | 5 (13 with any order difference) | 6 | Close. Not reconciled. |
| Learning outcomes | ready, learner-shaped (97 copies) | 38 | 113 across all 216 | Not reconciled. |
| Learning outcomes | ready, bundle-shaped (119 copies) | 52 differ, 51 have no key, 68 have the key | (included above) | Bundle copies store outcomes as `learning_outcomes` inside `courseLessons[].lesson`. |
| Knowledge checks | ready, learner-shaped (97) | 45 differ by ID, count or question; all 97 lack option text | 97 | Audit's 97 matches "all copies lack options". |
| Learner text | ready | Every copy has strings not in source (1,325 of 3,414 learner-block strings in the learner-shaped copies) | 176 | Not reconciled. Exact-string text matching cannot pass for this format, because the drafts restate fields. |
| Licence wording (`licenceNotice`) | both | 0 copies carry it; 932 of 932 sources do | 0 / 511 and 0 / 216 | Yes. Missing field, not stale text. |
| `officialReferences` | both | 0 copies carry it; 465 of 932 sources do | 366 (converted) and 109 (ready) | Yes in direction. The audit counts are per copy set; they are consistent (ready IDs are a subset of converted). |

The `ready/` learner-text and learning-outcome sub-counts do not reproduce exactly. The conclusion does not change: every `ready/` copy is out of step, and `ready/` uses a different schema, so exact text matching overstates the problem for that folder. The `converted/` total (162) reproduces exactly.

Two shapes exist inside `ready/` (the audit did not split them):
- Learner-shaped (97 files, `content.learner` + `content.assessor`), for example `C01-L01.json`.
- Bundle-shaped (119 files, `content.courseLessons` + `content.files` + `content.sourceFiles`), for example `additional-specialist-services-L01.json`. These point at pass-numbered draft files (for example `...-instruction-pass50.json`) that are not in the repo's source folders.

## 3. Plan

### 3a. Decision per folder

- `ready/` (216): archive the whole folder. Do not delete. Do not regenerate.
  - Reason: no runtime reader; it is a superseded draft format; the CI audit is its only consumer; it has no licence fields.
- `converted/` (511): archive the whole folder after the assessment gate is repointed to source. Do not regenerate now.
  - Reason: no generator exists; the 162 out-of-step copies are stale; the 349 clean copies are still redundant with source. The only consumer is the publication gate, which should read source directly.
- Do not regenerate either folder in this round. Regeneration is an option only if an export is needed later (see 3b).

Archive target: `curriculum/archive/superseded-lesson-copies-2026-11-03/` (new folder), with `converted/`, `ready/`, and a `SHA256SUMS` file listing every archived file, so the content can be restored and checked. Do not delete outright. The repo is not under git, so the archive and a tarball backup taken before the move are the only restore path.

### 3b. Generator specification (only if an export is wanted later)

Not recommended for now. If one is needed, the spec is:

- Input: one source lesson file under `curriculum/courses/**` or `curriculum/shared/**`, matched by `id`. Read-only.
- Output: one file per lesson at a new path (not `lessons/converted/` or `lessons/ready/`), so the old folders cannot silently come back. Schema: `id`, `title`, `courseSlugs`, `licenceNotice` (copied from `safetyAndRegulatory[].licenceNotice`), `officialReferences` (copied when present), `knowledgeChecks` (`id`, `question`, `options`, in source order).
- Must carry over exactly: `id`, `title`, every knowledge-check `id`, `question` text, `options` text, and option order. Option order matters because answer keys use `correctIndex`.
- Must not change: any file under `curriculum/courses/` or `curriculum/shared/`; `curriculum/assessments/`; answer keys; `correctIndex`; licence wording; approval or review status. The generator must not add approvals or set `status`.
- Must fail loudly if a source has no `licenceNotice`, has duplicate IDs, or has a knowledge check without options.

### 3c. Verification checker (for the comparison step)

If the copies are kept or exported later, a checker should run on every copy and exit non-zero on any difference. Proposed path: `scripts/check-lesson-copies.mjs` (not created in this round). It should:

1. Build the source index with the same rules as `file-lesson-loader.ts` (courses one level, shared recursive, duplicate IDs refused).
2. For each copy, compare by ID: title; knowledge-check IDs, count, question text, option text, option order; learning outcomes where the copy has them (handle both `learningOutcomes` and `learning_outcomes`); `licenceNotice` and `officialReferences` presence.
3. Treat option order and `correctIndex` as critical. Any mismatch fails the run.
4. Do not compare free-text learner strings for `ready/`-style copies, because that format restates fields by design.
5. Report per field counts in the same shape as the table in section 2, so the numbers can be compared with this plan and the audit.
6. Also run a check that every assessment `correctIndex` is in range and maps to the source option (the probe in section 1 already passes at 2,865 of 2,865).

Run the checker before and after the archive move, and add it to `curriculum:ci` only after the archive is complete.

### 3d. Order of work

0. Freeze and back up. Confirm no one is editing `curriculum/courses/` or `curriculum/shared/` during the move (the audit notes other agents are active). Take a tarball of `curriculum/lessons/`, `scripts/`, and `curriculum/ci/`, and write a `SHA256SUMS` for `lessons/`.
1. Repoint the assessment gate to source. Change `scripts/validate-assessment-publication.mjs` and `scripts/reconcile-assessment-questions.mjs` to read the source index (not `converted/`). Re-run both and write the new reports. Expect the publication report to change (the 141 "missing converted lesson" reasons go away, and the source-based mapping will be used). Record the before and after counts in the change note.
2. Write and run the checker (3c) against the current state. It should reproduce 162 and 216, and exit 1.
3. Repoint the CI audit off `ready/`. Change `scripts/ci-curriculum-audit.mjs`, `scripts/audit-curriculum.mjs`, `scripts/reconcile-lesson-formats.mjs`, and `scripts/build-curriculum-review-queue.mjs` so they either point at the archive or are retired. Decide which (see decision D3). Regenerate `curriculum/lesson-normalization-index.json` and `curriculum/lesson-review-queue.*` if their inputs change.
4. Move `converted/` and `ready/` into the archive folder, and write its `SHA256SUMS`. Update or archive `curriculum/lessons/MANIFEST.csv` and `curriculum/lessons/TITLES-ONLY.csv` (they inventory the copies).
5. Verify:
   - `npm run curriculum:ci` (note: `--write-baseline` needs reviewer sign-off; do not use it to hide a rise).
   - Backend tests that build a temporary curriculum root: `apps/backend/src/tests/curriculum-publisher.test.ts`, `academy-lesson-body.test.ts`, `academy-licence-track.test.ts`, `academy-licence-track-saved.test.ts`.
   - `npm run test:source`.
   - Checker (3c) against the archive copy, to confirm the archive still reproduces the audit's counts.
6. Record the outcome in `curriculum/research/STALE-COPIES-AUDIT.md` (a short follow-up section, not a rewrite).

### 3e. Risks

- Option-order drift breaks answer keys. `correctIndex` points at a position. Any rebuild that re-sorts options will silently mark learners wrong. The checker must treat option order as critical.
- Removing `ready/` without updating the CI audit fails `curriculum:ci` on coverage and index drift.
- Removing `converted/` before the gate is repointed makes the publication report worse (every assessment with no converted copy fails), while learners see no change.
- The copies have no `licenceNotice`. If a copy is ever exported or shared outside the repo, licence wording is missing. This is a compliance gap only if copies are used.
- No git history. The tarball and `SHA256SUMS` are the only restore path.
- Concurrent edits: another agent may change `courses/` or `shared/` while the move runs. Freeze first.
- The `ready/` drafts say `READY FOR REVIEW - source draft, not verified`. Do not promote any of their text into source without review.
- Not reconciled: the audit's sub-field counts (section 2). Totals match, so the decision does not depend on them, but the sub-counts should be re-derived before they are quoted elsewhere.

## 4. Decisions made (for review)

- D1. Copies are not learner-facing. Based on the loader and publisher code, and the absence of any `apps/` reference.
- D2. Archive, do not delete, and do not regenerate in this round. Based on there being no generator, no runtime reader, and missing licence fields.
- D3. For the CI audit (`ready/` consumers): default is to archive `ready/` and retire the four ready-reading scripts' dependency on it, since the normalisation index is a draft-stage artefact. Reviewer may prefer to keep a reduced check instead. Not decided by the plan alone.
- D4. The assessment gate repoint (step 1) is in scope, because it is the only remaining reader of `converted/` and it should check against source, not a copy.
- D5. The fresh comparison totals (162 and 216) are accepted as confirming the audit. The sub-field counts are flagged as not reconciled, not corrected.
- D6. Answer keys and source lessons are treated as current. The probe found no mismatch.

## 5. Items to confirm before execution

- Whether other agents are still editing `curriculum/courses/` and `curriculum/shared/`.
- Whether the normalisation index and review queue are used outside the repo (CI dashboards, reviewers). If so, step 3 needs a reviewer decision.
- Whether any external export ever read `converted/` (the PASS38 merge manifest is the only recorded source).
