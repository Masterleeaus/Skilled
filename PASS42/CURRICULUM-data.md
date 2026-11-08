# Pass 42 - Curriculum data evidence

Scope: `curriculum/` data files only. No file under `apps/`, no schema or migration, no register edit, no git commit, no memory tool. Lesson IDs and every `knowledgeChecks` block are unchanged (checked against backups for 67 lesson files: 0 problems).

Backups of every edited file: `/home/claude/work/curriculum-pass42-backup/` (68 files, mirrors `curriculum/` paths).

Concurrency note: other processes changed files in this repo during the pass (`apps/`, `scripts/ci-curriculum-audit.mjs`, `package.json`, `curriculum/ci/`, `build/`, and `curriculum/lesson-normalization-index.json`, rewritten at 19:58 with content identical to the generator output). None of those were edited by this pass.

Correction to the first survey: `curriculum/planning/REVIEW-SUMMARY.md` is present (original checkout timestamp). My first directory listing did not show it, and it was used as the ACA-011 source.

## Summary

| Item | Status | Metric | Before | After |
|---|---|---|---|---|
| ACA-005 | Partial. No canonical gap; human review still needed | Index: drafts with no usable instructional sections (generator output) | 15 | 15 (index not regenerated, see decision 6) |
| | | Canonical lesson files with no `instruction` | 0 | 0 |
| ACA-006 | Partial. Mapping exists; index IDs stale | Index: lessons with empty `courseIds` | 42 | 42 (legacy IDs, see decision 6) |
| | | Canonical lessons with no `courseSlugs` (216 scope) | 0 | 0 |
| | | Lessons present in COURSE-MODULE-LESSON-MAP.csv | 216 of 216 | 216 of 216 |
| | | Canonical files whose `courseSlugs` differ from structure | 78 | 74 (73 blocked, 1 held) |
| ACA-007 | Drafted, reviewer approval pending | Index: lessons with no explicit outcomes | 21 | 21 (index not regenerated) |
| | | Canonical outcome sets that are templated sentences | 14 | 0 |
| | | Canonical outcome sets marked DRAFTED | 0 | 21 |
| ACA-009 | Manifest done; database not written | Manifest entries / unique sourceIds / duplicates | none | 216 / 216 / 0 |
| ACA-010 | Reconciliation done; confirmation needed | MATCH / POSSIBLE / BRIEF_ONLY / DRAFT_ONLY | none | 0 / 3 / 218 / 213 |
| ACA-011 | Partial | Placements changed / blocked by content / held | none | 4 / 73 / 1 |

Coverage checks: 221 briefs = 0 + 3 + 218; 216 drafts = 0 + 3 + 213.

## ACA-005 - Drafts without usable instructional sections

- The index flags 15 lessons with `no usable instructional sections`: 8 kitchen-cleaning, 5 food-processing-sanitation and 2 custom-eco-cleaning-products. Re-running `scripts/reconcile-lesson-formats.mjs` in memory reproduces the index exactly (0 diffs), so the flag is real for the generator.
- Cause: the generator reads only `content.learner` or `content.courseLessons[0].lesson`. For these lessons the teaching text sits in `content.files.instruction` / `teaching_sections`, or in `lesson_text` as a list, and the generator reads neither.
- Canonical files (`shared/` and `courses/`) for all 15 hold 3 to 8 instruction sections each (41 to 136 words per section). The sections cover the same substance as the source (zones, stop rules, handover) but are new wording, not verbatim copies. Four of them (custom-eco-cleaning-products-L03 and -L10, food-processing-sanitation-L12, kitchen-cleaning-L08) carry `UNCONFIRMED` legal markers, which the schema requires.
- Nothing was filled because nothing was missing from the canonical files. Human review of the 15 sections is still required.
- Files changed: none.

## ACA-006 - Unmapped lessons

- Index: 42 lessons have empty `courseIds`. Their ready-envelope `course_slug` values are legacy IDs (for example `cleaner-05`, `service-19`, `premium-11`), not canonical slugs.
- Canonical files: all 216 already have canonical `courseSlugs` (0 empty, 0 non-canonical), and all 216 appear in `COURSE-MODULE-LESSON-MAP.csv`. The register's "unmapped" count is about the index only.
- Placements that disagreed with structure: 78 canonical files listed a single wrong course (`solar` 40, `window` 36, `pressure` 2) for lessons that COURSES-MODULES, the CSV and CATALOGUE-V2 place in 43 courses or in a group. Four were aligned (ACA-011). The other 74 remain mismatched on purpose (see ACA-011).
- Files changed: 4 lesson files (listed under ACA-011).

## ACA-007 - Lessons without explicit learning outcomes

- The 21 flagged lessons split into two groups:
  - 14 canonical files (F15-L01 to F15-L06, F16-L01, F16-L03, F17-L01, F17-L04, F17-L05, F19-L01, F19-L05, F19-L06) carried one templated sentence: "Apply the method for ... under supervision and state the stop-work conditions". Replaced with 2 or 3 outcomes written from each lesson's own instruction sections. Each starts with a verb.
  - 7 canonical files (F17-L02, F17-L03, food-processing-sanitation-L01, -L08, -L09, -L10, -L12) already had lesson-specific outcomes. Kept unchanged.
- All 21 carry `learningOutcomesStatus`: "DRAFTED - written from lesson content in Pass 42; reviewer approval pending" (14) or "DRAFTED - existing source-derived outcomes retained; reviewer approval pending" (7).
- No lesson in the 216 scope has an empty `learningOutcomes` list.
- Files changed: 21 lesson files (paths in `PASS42-CHANGE-LOG.csv`).

## ACA-009 - Idempotent import manifest

- Written: `curriculum/import/canonical-import-manifest.json`, generated by `curriculum/import/build-canonical-import-manifest.py` (stdlib only; run as `python3 -I`).
- 216 entries, 216 unique `sourceId` values, 0 duplicates. Each entry has `importAction: UPSERT` on `sourceId`, `contentStatusOnInsert: BRIEF`, and the sha256 of the canonical file and the ready source.
- Two consecutive runs produce a byte-identical manifest (sha256 `d5516d69...c7cd`).
- Not imported. No database was written. `apps/backend/prisma/import-titan-curriculum.ts` reads only the 221 brief JSON, so this manifest needs a separate importer (decision 8).
- Lesson IDs (for example `C01-L01`) are a different ID space from briefs (for example `U01-01`). No ID collision, and no identity is assumed between them.

## ACA-010 - Briefs against drafts

- Briefs: `apps/backend/prisma/curriculum/titan-three-layer-lessons.json` (221, read only). Drafts: `curriculum/lesson-normalization-index.json` (216).
- Method: normalised exact title. Zero exact matches. Three fuzzy candidates (similarity 0.83 to 0.96) are listed as POSSIBLE and are not counted as matches.
- Output: `curriculum/planning/BRIEF-DRAFT-RECONCILIATION.csv`. Brief-only: 218 (Universal 75, Service group 53, Vertical 90). Draft-only: 213.
- The two inventories are treated as separate datasets, as the register requires. The register's "437 unique lessons" claim is not supported by any identity mapping.

## ACA-011 - Transfer classifications and cross-service reuse

Sources: `planning/DECISIONS.md` (source of truth), `planning/CATALOGUE-V2.csv` (newest target per lesson), `planning/REVIEW.csv` and `planning/REVIEW-SUMMARY.md` (231 of 487 rows reviewed; 256 unsampled), `planning/LESSON-REUSE-CLASSIFICATION.csv`.

Checks run:
- Catalogue target vs structure placement for 216 lessons: agrees for all lessons (the six apparent misses were a false positive in my own parser).
- File placement vs structure: 78 disagreements, all single-course files (`solar` 40, `window` 36, `pressure` 2).

Findings and actions:
1. Cross-service context in base lessons. 73 base lessons (structure: all 43 courses) carry exterior-track text in their instruction sections: 40 "solar panel cleaning" and 33 "window cleaning (all heights)". Their file placement was a single exterior course. Widening them to 43 courses now would expose that text everywhere, so the placement was NOT changed (status: blocked). An SME must remove or neutralise the track text first. Full list in the review CSV.
2. Four exterior-group lessons changed to the structure set (`high-access-window-cleaning-L02`, `-L04`, `-L05`, `-L10`). Their track text fits the group. Changed: `window` to `window, roof, solar` (L02, L05, L10); `pressure` to `window, pressure, roof, solar` (L04).
3. Held: `roof-cleaning-soft-washing-L09`. Catalogue includes car detailing; the SME note agrees only to garden and pool. Not changed.
4. Not changed, needs decision: eight lessons classified Specific in the older first-pass file but Base in CATALOGUE-V2 and placed in all 43 courses (C01-L01, C01-L03, C02-L03, F04-L03, F05-L01, F09-L01, F15-L06, custom-eco-cleaning-products-L03). `additional-specialist-services-L10` is UNASSIGNED and sits under "Shared: Growing and managing a team" in all 43 courses, a module that PATH-SOLO and PATH-TEAM-MEMBER exclude.
5. Not changed, consistent with DECISIONS.md: food-processing sanitation, laboratory, warehouse and industrial degreasing in commercial cleaning; medical-equipment lessons in medequip only.
6. Not changed, decision needed: `kitchen-exhaust-L02` (not in the confirmed 39 courses; placed in commercial only).

Files changed: 4 lesson files (`courses/*` and `shared/exterior/high-access-window-cleaning-L02, -L04, -L05, -L10`).

Review file: `curriculum/planning/PLACEMENT-REVIEW-PASS42.csv` (89 rows: 73 blocked, 4 changed, 1 held, 11 decisions).

## Role pathways (`structure/PATHWAYS.json`)

- The three pathways (PATH-SOLO, PATH-TEAM-MEMBER, PATH-TEAM-OWNER) were already in the file. Added `sharedModuleTitles` and `excludesModuleTitles` with the exact `Shared:` titles, plus a validation block.
- Every shared and excluded module title resolves to a `Shared:` module in COURSES-MODULES.json (0 missing).
- No pathway names a course slug (`serviceCourses` is learner-chosen), so there were no slug failures.
- Backup: `/home/claude/work/curriculum-pass42-backup/structure/PATHWAYS.json`.

## Module titles (library-wide, 894 lesson files)

- Lessons whose `moduleTitle` is not a module of their own courses: 133 before, 91 after.
- 42 fixed (the 4 in scope plus 38 more). Rules, applied in order and only where obvious:
  1. The CSV gives one module for the lesson and it is valid for every course.
  2. "Shared: " plus the title exists in every course.
  3. "Starting a home-services business" to "Shared: Starting a business" (3 SOL lessons, flagged for confirmation).
- Left unresolved (91, decision 9): 16 SFS lessons (module "App: Field service operations", not in structure); 7 HR lessons ("High-risk cleaning", no course); 5 CGC lessons (no course); 40 lessons with "Group (Cleaning & Hygiene): ..." titles that their courses do not contain; and 23 more with other group-specific titles.
- Mismatches where both the file and CSV name a valid module but differ (12 lessons in scope, for example `aged-care-infection-control-L02`) were reported, not changed.

## courseSlugs (library-wide)

- Non-canonical slugs: 0 in all 894 lesson files. In-scope lessons with none: 0.
- Lessons with no `courseSlugs`: 36 (HR01-HR07, CGC-01 to CGC-05, CPV-02 to CPV-08 except CPV-07, TLD-10 and TLD-11, SFS-01 to SFS-16). Reported only. High-risk is a layer, not a course (SLUG-MAP.json), so no course was invented.

## Files changed

- 67 lesson files under `curriculum/courses/` and `curriculum/shared/` (21 for ACA-007, 4 for ACA-011 placement, 42 for module titles; no file is in more than one group). Per-field log: `curriculum/planning/PASS42-CHANGE-LOG.csv` (81 rows).
- `curriculum/structure/PATHWAYS.json` (validation fields added).

Files created:
- `curriculum/import/build-canonical-import-manifest.py`
- `curriculum/import/canonical-import-manifest.json`
- `curriculum/planning/BRIEF-DRAFT-RECONCILIATION.csv`
- `curriculum/planning/PLACEMENT-REVIEW-PASS42.csv`
- `curriculum/planning/PASS42-CHANGE-LOG.csv`
- `PASS42/CURRICULUM-data.md` (this file)

Not changed: `lesson-normalization-index.json` (generator output; see decision 6), `lessons/ready/`, `lessons/converted/`, any `apps/` file, any schema or migration, the register, any `correctIndex`.

## Decisions needed from a human

1. SME: remove or neutralise the exterior-track text in 73 base lessons (33 window, 40 solar), then widen placement to 43 courses. Until then they show only in a single exterior course.
2. `roof-cleaning-soft-washing-L09`: keep the car detailing transfer (catalogue) or limit to garden and pool (SME note).
3. Confirm Base or Specific for eight lessons placed in all 43 courses (listed in ACA-011 item 4). Assign `additional-specialist-services-L10`.
4. `kitchen-exhaust-L02`: confirm whether kitchen exhaust is a business, a lesson set under commercial cleaning, or excluded.
5. Module choices I made that need confirmation: `aged-care-infection-control-L05` set to "Shared: Chemicals and materials" (CSV says "Equipment and materials"); `aged-care-infection-control-L12`, `medical-equipment-cleaning-L11` and `-L12` set from the CSV ("Workload and cost", "Safety and hazards"); three SOL lessons set to "Shared: Starting a business".
6. Index regeneration: the 15 / 42 / 21 index blockers all come from `scripts/reconcile-lesson-formats.mjs`. It reads only `content.learner` or `courseLessons[0].lesson`, ignores `content.files.*` and list-valued `lesson_text`, and keeps legacy course IDs. Fixing the generator (outside this pass's scope) and re-running would clear them.
7. Review the 14 rewritten outcome sets (ACA-007) and the 7 source-derived ones; reviewer approval is pending on all 21.
8. Import: decide whether the manifest is consumed by a new importer for `academy_content_lessons` (the current importer reads briefs only).
9. Module titles (91 unresolved): decide whether to add the SFS "App" module and the High-risk module to COURSES-MODULES, or re-map the group-titled lessons; decide how to represent lessons whose group module differs by course (`handyman-work-L04` sits in five courses under two group modules).
10. 36 lessons with no `courseSlugs`: assign courses, or confirm they are layer-only.
11. ACA-005: human review of the 15 instruction sets; the `UNCONFIRMED` markers in four of them need an SME decision.
12. ACA-010: confirm the three POSSIBLE pairs (`U02-01` with `F02-L01`, `G0402-06` with `property-maintenance-L10`, `U02-02` with `S14-L03`); decide whether the 216 drafts supplement or replace the 221 briefs.
13. ACA-011: the reuse review covers 231 of 487 rows (REVIEW-SUMMARY.md); the register's "all 487 decisions reviewed" stays open.
