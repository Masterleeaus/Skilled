# Checklist tick proposal (2026-11-03)

Read-only pass. Nothing was ticked, edited, committed or run except reads, greps, and JSON parses. `curriculum/research/FINISH-CHECKLIST.md` was not changed (last written 18:40). The repo is not a git repository.

Baseline: `curriculum/research/CHECKLIST-STATUS-2026-11-03.md` (last written 21:08:04). Its last-written time is after the latest work in the list (BOOM-OTHER-STATES.md 21:07:31, PV-WORDING-COURSES-PROPOSAL.md 21:06:05, PVB-02-REMOVAL.md 21:03:43), so that report already reflects the day's work. Current state was checked against each item's wording.

## Summary

| Proposed status | Count |
|---|---:|
| tick | 3 |
| partly | 12 |
| keep open | 22 |
| **Total unticked** | **37** |

No unticked item became fully done since the report. The three ticks are the report's own "done" items, now confirmed. Two items move from open to partly (licence positions; official references).

## Day's work against the checklist

| Work named in the request | What the files show | Checklist item it touches | Effect |
|---|---|---|---|
| Legacy lists | Audit and plan only (`STALE-COPIES-AUDIT.md`, `STALE-COPIES-REBUILD-PLAN.md`). Both say "no lesson, source, assessment or script was changed". `lessons/converted/` still has 511 files and `lessons/ready/` 216. No superseded marker exists. | "Remove the stale converted/ and ready/ drafts, or mark them as superseded" | Not done. Keep open. |
| Saved track and switch endpoint | Code and tests exist: `apps/backend/src/modules/enrollment/enrollment.routes.ts` line 102 (PATCH own saved track), `enrollment.validators.ts`, `curriculum/licence-track.ts`, and `apps/backend/src/tests/academy-licence-track-saved.test.ts` (PATCH cases). Tests were not run here. | None. No unticked row covers the saved track or the switch. The enrolment ACTIVE/COMPLETED row is a separate owner decision. | Not counted. |
| PVB-02 | Learner text is clean. Current R-codes in `curriculum/shared/pool/PVB-02.json` sit only in `sourceReferences` and in `officialReferences` ids (R1 to R5), which the checker excludes. | Section 8, item E | Helps E, which stays partly because of NEW-DEK-01 (see E). |
| Boom corrections | `curriculum/research/BOOM-OTHER-STATES.md` records WA and NT thresholds confirmed from the official pages, and SA and ACT boom claims removed from learner text. Spot checks: `courses/window-cleaning-all-heights/high-access-window-cleaning-L03.json` and `courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` have no ACT text in learner fields. Every lesson stating a WA 11 m figure (83 found) has a worksafe.wa.gov.au entry. Register and lesson text still disagree for the changed lessons (noted in the boom file). | Section 5, "Check the licence positions" | Moves to partly. |
| Asbestos corrections | No correction record exists in `curriculum/research/`. Asbestos appears in 42 lesson files' learner text. `curriculum/courses/real-estate-portfolio-management/NEW-REP-02.json` (`safetyAndRegulatory[1]/point`) still says asbestos licence positions for NSW and Victoria are not confirmed. | None directly. Falls under the licence row, which is already partly. | Not counted. |
| Null URL work | `curriculum/research/NULL-URL-PROPOSAL.md` is a proposal for five unconfirmed claims and says "No lesson file was changed". `"url": null` still appears 50 times in 32 lesson files. | Section 5, "Check the official references" and section 8, item D | Not done. Nothing moves to done. |
| Reference fixes | WA and NT boom entries were added to the lessons (`R90`/`R91` in 79 shared lessons). The course lessons cite the WA and NT pages under other ids. F11-L01 still has no officialReferences entry. | Section 5, "Check the official references" | Moves to partly. |

## Item table

Status key: tick = done and supported by today's check; partly = some of the wording is met; keep open = not met. "Carried" means the file was not re-read today; the status comes from the report.

| # | Section | Item | Proposed status | Evidence |
|---|---|---|---|---|
| 1 | 1. Get lessons live | Confirm how lessons are published into the database [you] | partly | Carried. The publish script exists and bypasses the review gate (`curriculum-publisher.ts`, per the report). Owner decision still needed. |
| 2 | 1. Get lessons live | Confirm production server has `curriculum/` or set `CURRICULUM_DIR` [you] | partly | Carried. `DEPLOY-RUNBOOK.md` section 8 still says the server layout is UNCONFIRMED. |
| 3 | 1. Get lessons live | After publishing, run load-knowledge-answer-keys (409 risk) | keep open | Carried. No publish run recorded. `apps/backend/prisma/load-knowledge-answer-keys.ts` still reads a fixed path. |
| 4 | 1. Get lessons live | Rebuild the import manifest after the latest edits | keep open | `curriculum/import/canonical-import-manifest.json` written 18:37. 650 JSON files under `curriculum/` are newer than it. The report found 180 of 216 hashes differ. |
| 5 | 2. Server and infrastructure | Paste PostgreSQL 16 setup output, then install Redis and Node 22 [you] | keep open | Carried. No setup output in the repo. |
| 6 | 2. Server and infrastructure | Deploy and confirm lesson endpoint returns text only to enrolled, paying learners | keep open | No deployment recorded. Payment is not part of the access check in `curriculum.routes.ts` (carried from report). |
| 7 | 2. Server and infrastructure | Provide the test database password [you] | keep open | `apps/backend/src/tests/support/test-env.ts` still uses placeholder URLs (carried). |
| 8 | 2. Server and infrastructure | Check the eight backend test files that fail to load | partly | `vitest.config.ts` loads `test-env.ts` (carried). No before-and-after record. Suite not run today. |
| 9 | 2. Server and infrastructure | Browser-check the lesson page, outline and images on the live site | keep open | No live site reachable from the repo. |
| 10 | 2. Server and infrastructure | Remove the hidden gallery section, or keep it hidden | tick | Case-insensitive grep for "gallery" across `apps`, `packages`, `docs` and `curriculum` finds only `curriculum/research/CHECKLIST-STATUS-2026-11-03.md`, `FINISH-CHECKLIST.md` and `STATUS-REPORT-2026-11-03.md`. No gallery code remains. |
| 11 | 3. Access decisions | Enrolment: "ACTIVE only" or also "COMPLETED" [you] | keep open | Owner decision. Code still accepts both (`curriculum.routes.ts` lines 97 and 141, carried). |
| 12 | 3. Access decisions | Outline still sends each lesson's database copy [you] | keep open | Owner decision (carried). |
| 13 | 4. Images | Make the 28 remaining images [you] | partly | Carried. Icon and logo folders exist, but the counts do not match the checklist's shortfall. |
| 14 | 4. Images | Slice and add each new sheet, then update the catalogue | keep open | `apps/frontend/src/lib/academy-library.json` still has 1004 assets. No new sheets. |
| 15 | 4. Images | Clean up the timber icon set | keep open | `apps/frontend/public/academy/library/icons/cleaning-residential/` still holds `timber-icon-01` to `06`. Not viewed. |
| 16 | 4. Images | Check the five uncertain sheet mappings visually | keep open | No visual check recorded (`curriculum/research/IMAGE-GAPS.md`). |
| 17 | 5. Content review | Review every lesson (all DRAFT and NOT REVIEWED) | keep open | Report count 932 of 932 DRAFT and NOT REVIEWED. Not re-counted today. |
| 18 | 5. Content review | Check the licence positions. Most state-level rules are UNCONFIRMED | partly | `curriculum/research/BOOM-OTHER-STATES.md`: WA and NT boom thresholds confirmed from the WorkSafe WA and NT WorkSafe pages; SA and ACT boom claims removed from learner text. Still open: `curriculum/licence/lesson-licence.json` has 354 `not_checked`; ACT-22 in `curriculum/research/trades/LICENCE-MATRIX.csv` is still CONFIRMED. |
| 19 | 5. Content review | Check the official references. Many were read through summaries | partly | Boom work checked WA and NT wording against the pages and added page entries. 50 `"url": null` entries remain in 32 lesson files. No verbatim check for the rest. |
| 20 | 5. Content review | Verify the gas emergency numbers for NSW and Queensland | partly | NSW: `courses/handyman/handyman-work-L07.json` now says the Jemena page does not say which areas 131 909 covers. Coverage is still not confirmed. QLD: `courses/short-stay-turnover/C07-L03.json` still gives 000; wording not checked against the official page. |
| 21 | 5. Content review | Review the proposed painting pass rules | keep open | No pass-rule text found (carried). |
| 22 | 5. Content review | Check the business model canvas replacement (SHR-PLN-03) and its sources | partly | `curriculum/shared/starting-business/SHR-PLN-03.json` (modified 18:51) is DRAFT with 4 officialReferences. Cited wording not checked against the business.gov.au pages. |
| 23 | 5. Content review | Check the roof lessons' licence and solar points | keep open | `courses/roof-soft-washing/roof-cleaning-soft-washing-L05.json` still has 5 UNCONFIRMED strings. `PV-WORDING-PROPOSAL.md` and `PV-WORDING-COURSES-PROPOSAL.md` are proposals only. |
| 24 | 5. Content review | Check the car-detailing L09 timestamp | keep open | No provenance record in the repo (carried). |
| 25 | 6. Car detailing decisions | Paint correction: keep it in the course, or drop it [you] | keep open | Owner decision. `CAR-NEW-03.json` teaches compounding, so the checklist description is stale. |
| 26 | 6. Car detailing decisions | Heat-assisted conditioning and heat lamps [you] | keep open | Owner decision. `CAR-NEW-04.json` excludes heat lamps. |
| 27 | 6. Car detailing decisions | Headlight restoration appears only in the Spanish manual and has no lesson | tick | `curriculum/courses/car-detailing/CAR-NEW-10.json` exists and is placed in `curriculum/structure/COURSES-MODULES.json` (line 9514). The lesson is DRAFT, so the item's wording is stale and should be read as done. |
| 28 | 7. Smaller clean-up | Remove or mark the stale converted/ and ready/ drafts | keep open | `curriculum/lessons/converted/` 511 files, `curriculum/lessons/ready/` 216 files, no superseded marker. Audit and plan only (see Day's work). |
| 29 | 7. Smaller clean-up | Confirm the estimated minutes, which were raised across many lessons | keep open | No confirmation record. |
| 30 | 7. Smaller clean-up | Check lessons that list two courses, where images came only from the first | keep open | Report: 359 lessons list two or more courses; 338 have no `images` field (carried). |
| 31 | 7. Smaller clean-up | Decide whether procurement lessons appear in all 43 courses | keep open | Owner decision. |
| 32 | 8. Parallel agent tasks | D. officialReferences fields and citation ids | partly | All 1433 entries have the five fields (report, check_official_refs). 50 null URLs remain (today's grep). Citation-id field not defined in lesson JSON. |
| 33 | 8. Parallel agent tasks | E. DRAFT and NOT REVIEWED, no correctIndex, approved business fields, no internal codes in learner text | partly | PVB-02 learner text now clean (see Day's work). `curriculum/courses/deck-and-fence-maintenance/NEW-DEK-01.json` (`/instruction[2]/body`) still has "R5 zones". Judged a planning code in the report, not a marker. Business-field check not re-run. |
| 34 | 9. Second parallel team | G. Re-run full backend test suite and record failures | keep open | Not run today. |
| 35 | 9. Second parallel team | H. Dry-run the publish planner and confirm counts | partly | `curriculum-publisher.ts` has a pure `planPlacements` (line 99). No dry-run output recorded. Database count pending. |
| 36 | 9. Second parallel team | J. Verify library files in the catalogue exist, and image paths match | tick | Checked today: `apps/frontend/src/lib/academy-library.json` has 1004 assets, all 1004 exist under `apps/frontend/public/academy/library/`, and disk has 1004 files. 278 distinct `/academy/library/` paths in `curriculum/**/*.json` all resolve. |
| 37 | 9. Second parallel team | N. Licence and regulator conflicts listed (saved report) | partly | `/home/claude/work/licence-conflicts-report.json` lists 8 conflicts (outside the repo). The checklist asks for the report to be saved or pointed to. Not in the repo. |

## Ticked items that the evidence does not support

These are already ticked in the checklist, so they are not in the table above. Owner should review them.

| Checklist line | Ticked item | Concern |
|---|---|---|
| Section 8, B | Rebuild and verify the import manifest | The manifest is older than 650 JSON files under `curriculum/`, and the report found 180 of 216 hashes differ. The tick does not match. |
| Section 9, M | Check the structure file | The item's own note says the gap remains. Today, 84 placed ids in `curriculum/structure/COURSES-MODULES.json` have no matching lesson `id` in `courses/` or `shared/`. They are the 12 lessons each for seven high-risk topics (biohazard-trauma-cleaning, crime-scene-cleaning, drug-contamination-remediation, fire-smoke-restoration, flood-water-restoration, hoarding-squalor, mould-remediation). The high-risk files are named HR01 to HR07. The tick does not match. |

## Decisions made without asking

1. Baseline is the status report. Its last write (21:08:04) is after the day's work, so the listed work is treated as already in its evidence. Current state was checked item by item.
2. "Done since the report" was read as an item whose status moved to done after 21:08. None did. The three ticks are the report's own done items, confirmed today.
3. Legacy lists: counted as not done. The audit and plan record no change, and both folders are still full.
4. Saved track and switch endpoint: no unticked row maps to them, so they are not counted.
5. Null URL work: a proposal only. Not counted as done. The 50 null URLs remain.
6. Asbestos: no correction record and no checklist row. Not counted.
7. Partly is used only where some of the item's stated wording is met. Two items moved from open to partly: licence positions (boom work) and official references (boom reference entries).
8. Items not re-read today keep the report's status and are marked "carried".
9. The two ticked items (B, M) are listed separately; their ticks were not changed.
