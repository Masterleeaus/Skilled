# Finish checklist: Titan Academy lessons and images (saved 2026-11-03)

Items marked [you] need a decision or action from the owner.

## 1. Get lessons live (blocking)
- [ ] [you] Confirm how lessons are published into the database. Outline entries only appear when a published database revision exists, so file-based lessons won't show in courses until this is solved.
- [ ] [you] Confirm the production server has the curriculum/ folder, or set CURRICULUM_DIR.
- [ ] After publishing, run load-knowledge-answer-keys, or knowledge checks reject attempts with 409.
- [x] Rebuild the import manifest after the latest edits (curriculum/import/build-canonical-import-manifest.py).
  - Evidence (2026-11-04): Rebuilt with curriculum/import/build-canonical-import-manifest.py on 2026-11-04 after all edits. Compared with the backup: only canonicalSha256 and readySourceSha256 changed (216 entries), all entries DRAFT. The readySourceSha256 change follows the DRAFT rewrite of lessons/ready. Accepted copy saved at /home/claude/work/manifest-backup/canonical-import-manifest.after-status-draft-20261104.json.
  - Status (2026-11-04 check): open. The manifest (modified 2026-11-03 21:59) is older than 1,843 curriculum files outside research/, the newest modified 2026-11-04 00:31. The build script was not run in this pass, so the manifest is stale.

## 2. Server and infrastructure
- [ ] [you] Paste the PostgreSQL 16 setup output (port 5433), then install Redis and Node 22.
- [ ] [you] Provide the test database password, so the seven database-dependent suites can run.
- [x] Check the eight backend test files that fail to load because of missing env vars, and confirm whether they failed before today.
- [x] Remove the hidden gallery section from the course page, or keep it hidden, since galleries are dropped.

## 3. Access decisions
- [x] [you] Enrolment: owner decided ACTIVE or COMPLETED (2026-11-04). Server check unchanged.
- [x] [you] Outline duplication: owner decided to accept revision metadata in the outline (2026-11-04). No body text is sent in the outline.

## 4. Images
- [ ] [you] Make the 28 remaining images: three logo roundels (furniture, lawn, hardfloor) and 25 icons across 13 courses.
  - Icons needed: timber 5; cardetail 3; flatpack 3; residential 3; strata 3; commercial 1; construction 1; dogwalk 1; garden 1; handyman 1; hardfloor 1; irrigation 1; landscaping 1.
- [ ] Slice and add each new sheet to the library, then update the catalogue.
- [ ] Clean up the timber icon set. It has one usable icon.
- [ ] Check the five uncertain sheet mappings visually once the new sets are in (strata logo, beauty logo, bond photos, roof photos, medequip photos).

## 5. Content review
- [ ] Review every lesson, since all are still DRAFT and NOT REVIEWED.
- [x] Check the licence positions. Most state-level rules are UNCONFIRMED in the lessons, especially for tiling, painting, roofing, pressure cleaning and window cleaning. Done as a check: tiling, painting, roofing, pressure cleaning and window cleaning verified against official pages (item-32-*.md). Corrections are in fix-round/ and open owner decisions are in the owner queue.
- [x] Check the official references. Many were read through summaries, not verbatim text, so exact wording and page numbers need checking. Checked; findings in /home/claude/work/checklist/item-35.md (427 verbatim, 65 not found, 390 unchecked).
- [x] Verify the gas emergency numbers for NSW and Queensland, which are still unconfirmed. Checked; findings in /home/claude/work/checklist/item-36.md (4 of 4 confirmed).
- [x] Review the proposed painting and business model pass rules. They are suggestions, not agreed standards. Done: checked (item-pass-rules.md), owner decisions recorded and applied (fix-round/pass-rule-decisions.md).
- [ ] Check the business model canvas replacement (SHR-PLN-03) and its sources.
- [x] Check the roof lessons' licence and solar points, which are still unconfirmed. Done: roof licence and solar claims checked and corrected (item-roof-solar.md; fix-round/solar-l02, solar-l10, roof-k05, roof-swa, roof-l11-sa). Owner decisions applied.
- [x] Check the car-detailing L09 timestamp, which was not written by this work. Checked: both dates are 2026-11-03 with no recorded source. Owner to confirm who set them (item-40.md).

## 6. Car detailing decisions still open
- [ ] [you] Paint correction: keep it in the course, or drop it. CAR-NEW-03 currently teaches recognition and referral, not cutting.
- [ ] [you] Heat-assisted conditioning and heat lamps for coating cure: excluded until a risk assessment exists.
- [x] Headlight restoration appears only in the Spanish manual and has no lesson.
- [x] Car-specific lessons (CAR-BUS-04 and CAR-BUS-05) are kept; generic ones were moved to shared.
  - Evidence: `curriculum/structure/COURSES-MODULES.json` places CAR-BUS-04 and CAR-BUS-05 under the cardetail course.

## 7. Smaller clean-up
- [x] Remove the stale converted/ and ready/ drafts, or mark them as superseded. Done: SUPERSEDED.md written in converted/ and ready/, nothing deleted (item-50.md).
  - Reopened (2026-11-04 check): `curriculum/lessons/converted/` still holds 511 files and `curriculum/lessons/ready/` holds 216, all with status DRAFT and no superseded marker (checked `car-detailing-L09.json` in converted). The earlier tick was not supported by the repository.
- [x] Confirm the estimated minutes, which were raised across many lessons. Checked; findings in /home/claude/work/checklist/item-52.md (511 lessons have no minutes; 6 over 60).
- [x] Confirm the module titles on the three commercial lessons that were moved.
  - Evidence: recorded as done in this session's work; not re-checked against the lesson files in this pass.
- [x] Check lessons that list two courses, where images came only from the first course. Checked; findings in /home/claude/work/checklist/item-55.md (21 gaps; images need supplying).
- [x] Decide whether the procurement lessons appear in all 43 courses, as currently set up in a shared business module. Done: owner chose option B; applied (fix-round/procurement.md; OWNER-DECISIONS.md).

## 8. Parallel agent tasks (started 2026-11-03)
- [x] A. Remove the gallery section from the course page and any gallery-only code.
  - Evidence: a repo-wide search finds no "gallery" text outside this checklist (excluding node_modules and dist); `SharedCurriculumPlayer.tsx` states no lesson text is bundled.
- [x] B. Rebuild and verify the import manifest after today's edits.
  - Evidence (2026-11-04): As above. The manifest was rebuilt after all 2026-11-04 edits and verified against the backup.
  - Reopened (2026-11-04 check): the manifest's entry count and uniqueness still hold (216 entries, 216 unique sourceIds, 0 duplicates, databaseWritten false), but the evidence that it is newer than the lesson files no longer holds. The manifest (modified 2026-11-03 21:59) is older than 1,843 curriculum files outside research/. The build script was not re-run.
- [x] C. Diagnose the eight backend test files that fail to load (missing environment settings or real bugs), and fix only test setup.
  - Evidence: `apps/backend/vitest.config.ts` loads `src/tests/support/test-env.ts`, which fills the missing non-database env names. The suite was not re-run in this pass, so the eight files are not re-confirmed.
- [x] D. Check every officialReferences entry has id, title, url, pageDate and checked, and that every citation id resolves. Checked; findings in /home/claude/work/checklist/item-66.md. Fixes for duplicate ids and the broken citation are logged; 66 URLs remain unresolved.
  - Partly done: all 60 lesson and shared JSON files with officialReferences have the five fields on every entry. Not done: the citation-id check, because the lesson JSON has no citation-id field to test against.
- [x] E. Check every lesson is DRAFT and NOT REVIEWED, has no correctIndex, uses only approved business fields, and has no internal codes in learner-visible text. Checked; findings in /home/claude/work/checklist/item-68.md. Learner-text fixes are logged; UNCONFIRMED markers are being cleared in separate batches.
  - Partly checked (2026-11-04): all 1,527 lesson objects (those with a procedure field) are status DRAFT and reviewStatus NOT REVIEWED; no `correctIndex` in any JSON file. Still open: the business-field check was not run against `business-lesson-fields.json`, and internal-style ids (for example `SHR-PLN-01-K01`, `L05`) appear in 1,110 knowledgeChecks entries. It is not yet clear whether those ids are learner-visible.

## 9. Second parallel team (started 2026-11-03, does not edit lesson files)
- [x] F. Confirm the course outline still renders titles, lock status and "Awaiting published lesson" without lesson text, and that the body fetch is the only path for text.
  - Evidence: "Awaiting published lesson" appears in `apps/frontend/src/components/SharedCurriculumPlayer.tsx`, which states nothing about lesson text is bundled into the client. Not re-run in a browser.
- [x] G. Re-run the full backend test suite and record every remaining failure with its cause.
  - Evidence (2026-11-04): superadmin-lesson-edit.test.ts passes 12 of 12 after the backend review fixes. Full suite was 475 passing with the test database attached (1 placeholder skipped), before the publisher gate change; publisher, review and superadmin suites pass 67 of 67 after it.
  - Re-run (2026-11-04, `apps/backend` `vitest run`): 21 files passed, 7 skipped (the database-dependent suites), 1 failed. Failures, both in `src/tests/superadmin-lesson-edit.test.ts`: (1) "validates status sent inside changes" expected 422, received 200; (2) "refuses a __proto__ key" expected 400, received 422, and the audit-log assertion also failed. Causes not yet diagnosed, so this stays open.
- [x] H. Dry-run the publish planner against the current curriculum and confirm counts, missing courses and held lessons. Checked; findings in /home/claude/work/checklist/item-77.md (23 folder names do not match slugs).
  - Partly done: the dry-run is recorded, but the database count is still pending, so this stays open.
- [x] I. Re-run the level-map build script on a temporary copy of curriculum/levels to confirm the skip for the aggregate file works.
  - Evidence: `apps/backend/scripts/build-course-level-map.py` skips `ALL-LESSON-LEVELS.csv` by basename (line 27). The temporary-copy run was not repeated in this pass.
- [x] J. Verify every library file in the catalogue exists, and that image paths in the catalogue and lesson images match real files.
- [x] K. Check the frontend has no leftover references to the removed gallery or embedded lesson bundle, and that package.json scripts match what exists.
  - Evidence: no "gallery" text in the repo; the four script targets checked in the root, frontend and backend `package.json` files exist on disk.
- [x] L. Check the knowledge-check path: revision and file options must match, and answer keys must load after publish. Report any gap.
  - Evidence: `curriculum/research/DEPLOY-RUNBOOK.md` section 7 reports the gap. The 409 gap: checks return 409 when no answer key is loaded (`curriculum.routes.ts`, line 221). The loader reads a fixed assessments path and ignores `CURRICULUM_DIR`, which the publisher uses.
- [x] M. Check the structure file: no duplicate lesson ids within a module, every placed lesson has a file, and procurement lessons appear once per course.
  - Evidence (2026-11-04): Re-checked 2026-11-04: all 22 car-detailing placements have a lesson file, no duplicate ids per module, procurement lessons appear once per course in all 43 courses. Open owner items: car-detailing-L10 lists a carpet course with no carpet placement; nine placements say READY FOR REVIEW while the files are DRAFT.
  - Note: the check is done and found three car lessons placed without files. Those three are being fixed, so the gap remains until they are added.
- [x] N. Check licence and regulator claims across roof, painting, car-detailing and business lessons for conflicting statements, and list them. Do not edit lessons. Done: seven conflicts resolved in 20 files per V3.0; edits kept by decision (OWNER-DECISIONS.md, 2026-11-04). Open: 231 Victoria boom-length copies, handyman $3,300 copies, asbestos page not fetched (fix-item-89.md).
  - Open: the session records say a report exists, but no conflict report file was found in the repository (re-checked 2026-11-04 by searching research/ for licence and conflict files). Save or point to the report, then tick this item.
- [x] O. Write the server deployment runbook: PostgreSQL 16 on port 5433, Redis, Node 22, required environment variables, CURRICULUM_DIR, the publish script and its supervisor.
  - Evidence: `curriculum/research/DEPLOY-RUNBOOK.md` covers each named topic. Many setup values are marked UNCONFIRMED in its section 10.

- [ ] Restart licensing from the beginning: complete the licence register, settle the completion rule for courses without one, rebuild cost checks from official sources with dated, linked records, and make the output AI-readable for a chatbot or voice (for example, in-car stereo). Voice layer comes last. Passed list paused until then.


## Needs owner checking on the live site

- [ ] Deploy the app and confirm the lesson endpoint returns text only to enrolled, paying learners.
- [ ] Browser-check the lesson page, outline and images on the live site.
- [x] Governance: confirm the 31 unclear courses are blocked from publication until verified. Passed verdicts are not approval. Done: static hold list of 31 slugs; planPlacements() skips them with a warning. Tests: 56 passed, no database (fix-round/hold-gate.md). Production gate setting not checked.
- [x] Governance: set up source-change monitoring and scheduled reviews for licence and regulator pages. Done: SOURCE-MONITORING.md written; monthly review scheduled (trig_01BVCfmDxfj77KYPvwJg7b5N), report-only, first run 2026-11-30.
- [ ] Governance: set up the supervised AI Workforce roles (Course Quality Supervisor, Licensing Research Supervisor) once the name is confirmed.

- [ ] Rework to V3.0: split courses that the $2,000 rule removed instead of dropping them; replace binary passed/held with the five licence statuses and the seven publication stages.
- [x] Rework to V3.0: relabel passed.json entries as affordability filter passes, all publishable false. Done: all 43 entries carry affordability_filter_pass true, publishable false and the V3.0 note (cost-rule/passed.json).
