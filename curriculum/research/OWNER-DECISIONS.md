# Owner decisions (recorded 2026-11-03, not yet acted on)

1. F15-L02-K01 key: change to the option the lesson supports ("Stop and tell the supervisor before going further"). Answer: Yes, change the key.
   - Log: done. F15-L02-K01 correctIndex changed from 2 ("Rely on your footwear to make the task safe") to 0 ("Stop and tell the supervisor before going further"). Rationale rewritten to match. Edited curriculum/assessments/F15-L02.assessment.json only. Check run: no new problems; the one existing problem (NEW-DEK-01, citation marker) is unrelated.
2. property-maintenance-L03 leak-or-scorch check: owner typed a custom answer, "Remove from lesson". Recorded as: remove this knowledge check from the lesson (not picking either option). Not yet acted on.
   - Log: done. Removed property-maintenance-L03-K01 (scorch mark vs leak) from curriculum/courses/handyman/property-maintenance-L03.json and its answer entry from curriculum/assessments/property-maintenance-L03.assessment.json. K02 and K03 kept with their ids unchanged (gap at K01, no renumbering). Lesson now has 2 checks. Check run: no new problems; the one existing problem (NEW-DEK-01, citation marker) is unrelated. Not committed. Copies under curriculum/lessons/ready and curriculum/lessons/converted still contain the removed check and were not touched.
3. Shared "not yet confirmed"-style wording (780 hits): apply the 50 deletions and 580 rewrites now; hold the 150 for owner decision. Answer: Apply delete and rewrite, hold the 150.
   - Done (2026-11-03): 50 deleted (30 safety points replaced by a plain step from the same sentence, 20 removed) and 580 rewritten, in 281 shared lesson files. Held 150: 42 still need a decision, and 108 PV electrical-notice items were already rewritten by another agent before this edit (no longer in the proposal's form, so not applied). Held list: curriculum/research/SHARED-HELD-150.md (another agent's list, SHARED-HELD-150-DECISIONS.md, still shows the 108 PV items as open). Log: curriculum/research/SHARED-WORDING-APPLIED.md. Not committed.
4. Victorian PV wording proposal (54 shared lessons): apply the proposal as written. Answer: Apply the proposal.
   - Log: done. 54 lessons changed (108 replacements, both places per file). Log in curriculum/research/PV-WORDING-APPLIED.md. Check run: no new problems; the one existing problem (NEW-DEK-01) is unchanged. Not committed.
5. Licence register stale notes (79 boom entries): replace the stale status part of each note and keep the old topic summary. Answer: Replace notes and keep summaries.
   - Done (2026-11-03): 79 notes replaced in curriculum/licence/lesson-licence.json (note field only). Log: curriculum/licence/NOTE-CLEANUP-APPLIED.md.
   - Not applied (2026-11-03), additional-specialist-services-L04 boom wording: the "not yet confirmed in every state" sentence is not in the lesson files, so nothing was replaced. The register row holds NSW and QLD only (no Victoria or other state). Owner to decide: add a Victoria row with a source, or remove the Victoria sentence. Log: curriculum/research/OWNER-SUGGESTIONS-APPLIED-A.md.
6. Import manifest (209 canonical hashes out of date): refresh the hashes by regenerating the manifest. Answer: Refresh the hashes.
7. 186 new course placements in COURSES-MODULES.json: keep them. Answer: Keep them.
8. Lessons naming course slug "construction" (about 143, no folder): owner typed a custom answer, "It would be construction site cleaning". Recorded as: map these to the existing construction-site-cleaning course. Not yet acted on.
   - Log: done (mapping decision only, no file edits). No course with slug construction-site-cleaning exists in COURSES-MODULES.json; SLUG-MAP.json maps construction-site-cleaning to the canonical construction course, so the 143 lesson files keep courseSlugs "construction". 45 of the 143 have placements in the construction course; 98 have none. Details and module list in curriculum/research/CONSTRUCTION-SLUG-MAP.md. Check run: 0 problems across 932 lessons, unchanged.
9. Pool lessons citing Victorian "Practice Note 05-2018" (not found): replace the citation with the current SP 02, checking the wording. Answer: Replace with SP 02.
   - done. All eight PVB lessons (PVB-01 to PVB-08) now cite VBA Building Practice Note SP 02, Version 3, 26 September 2023. Unsupported claims removed; knowledge-check keys kept and flagged. Owner decisions still needed on flagged keys and on PVB-06 and PVB-08. Details in curriculum/research/POOL-SP02-CITATIONS.md.
   - Done (2026-11-03): PVB-06 and PVB-08 suggestions applied (PVB-06 retitled and restated to SP 02 points; PVB-08 time limits re-sourced to SP 01 27 April 2023; flagged knowledge checks PVB-04-K03, PVB-05-K03, PVB-06-K01 to K03, PVB-08-K01 and K03 rewritten to SP 02 facts, keys index unchanged). Checker: 0 problems. Log: curriculum/research/OWNER-SUGGESTIONS-APPLIED-B.md. Not committed.
10. ACT boom-length figure (about 85 lessons, removed): restore it after the owner sends the verbatim ACT sentence and its date. Answer: Restore after I send the text. Waiting for that text.
11. Publish gate and DRAFT status: owner answered, verbatim, "I dont want the lessons as draft. I told u this already". Recorded as: lessons should not stay DRAFT. Meaning of the publish gate still to be clarified. Not yet acted on.
   - Done (2026-11-03): status set to READY in 932 lesson files; schema and check rule updated. Log: curriculum/research/READY-STATUS-APPLIED.md.
12. Clarification of 11: move lessons out of DRAFT to a ready-for-publishing status now; keep the publisher's current review bypass. Answer: Yes, mark them ready.
   - Done (2026-11-03): READY value used; publisher review bypass unchanged. Log: curriculum/research/READY-STATUS-APPLIED.md.
13. Checklist: tick the three items (gallery removal, headlight restoration, image library check). Answer: Tick the three.
   - Log: done.
14. Duplicate knowledge-check questions (33 groups, 175 checks): rewrite the duplicates so each lesson's check is distinct. Answer: Rewrite the duplicates.
   - Log: done. 33 groups; 33 checks kept; 142 questions reworded; 1 distractor option changed (F16-L01-K03); no answer keys changed. Log: curriculum/research/DUPLICATE-REWRITE-APPLIED.md.
15. High-risk structure entries with no lesson files (84 lessons, seven topics): write the lesson files. Answer: Write the lesson files.
   - part 2 done: 24 lesson files (fire-smoke-restoration L01 to L12 and flood-water-restoration L01 to L12) and 24 assessment files written. Log: curriculum/research/HIGH-RISK-WRITTEN-PART-2.md.
   - Log: part 3 done, 24 lesson files and 24 assessment files written (topics 6 and 7; 72 knowledge checks). Log: research/HIGH-RISK-WRITTEN-PART-3.md. HR04 and HR07 were not changed.
   - part 1 done (2026-11-03): 36 lesson files and 36 assessment files written for topics 1 to 3 (biohazard-trauma-cleaning, crime-scene-cleaning, drug-contamination-remediation), 72 knowledge checks. Status DRAFT as instructed. Log: curriculum/research/HIGH-RISK-WRITTEN-PART-1.md.
   - done (2026-11-03): status set to READY on all 84 DRAFT high-risk lessons (seven topics, 12 each); reviewStatus unchanged. None has a copy, so no copy edits. Log: curriculum/research/OWNER-SUGGESTIONS-APPLIED-C.md.
16. Stale converted (511) and ready (216) lesson copies: rebuild them from source. Answer: Rebuild them from source.
   - done (2026-11-03): rebuilt 511 converted and 216 ready copies from 932 source lessons; verify 0 problems, check.py no new problems. 421 sources have no converted copy (not created). Backup: /home/claude/work/copies-backup-2026-11-03/. Log: curriculum/research/COPIES-REBUILD-APPLIED.md.
   - done (2026-11-03): re-run against the current sources (1016 lessons now). 90 copies changed bytes (75 converted, 15 ready), including F06-L04. verify-lesson-copies.py 0 problems; check.py 0 problems across 1016 lessons. Log: curriculum/research/OWNER-SUGGESTIONS-APPLIED-C.md.
17. Checker citation rule: narrow it so zone names like R5 are not flagged (the proposal in check-proposed.py). Answer: Yes, narrow the rule.
   - Done (2026-11-03): applied to /home/claude/work/check.py (backup check.py.bak). Problems before 1 (NEW-DEK-01, R5 zone), after 0 of 932 lessons; PVB-02 has no citation markers now.
18. Null official reference URLs (14 shared, 35 course): stop looking; leave them null. Answer: Stop looking.
19. Remaining unreviewed answer keys (about 2,460 checks): review them all and fix clear errors. Answer: Yes, review them all.
   - part 1 done: lessons A to F (201 lessons, 653 keys; 33 skipped as already in the reports; 620 reviewed). correctIndex changed 0; option text rewritten 2 (C17-L04-K03, F06-L04-K03); rationale rewritten 2 (F15-L04-K02, F16-L01-K04); ambiguous 1 (CL2-04-K04, not changed). Log: curriculum/research/KEY-REVIEW-PART-1.md. Checker: 0 problems, no new problems. Not committed.
   - Done (2026-11-03): CL2-04-K04 stem reworded, key 3 kept; CP-01-K03 option 2 reworded as a plain correct statement, key 2 kept (the owner's "still wrong" conflicts with the key, see note). Log: curriculum/research/OWNER-SUGGESTIONS-APPLIED-A.md. Checker: 0 problems. Not committed.
   - part 2 done: lessons G to Z (593 lessons, 2,009 checks reviewed; 2 keys changed; 0 options or rationales rewritten; 7 ambiguous, not changed, all PVB Victorian pool barrier checks). Log: curriculum/research/KEY-REVIEW-PART-2.md. Checker: 0 problems across 1,016 lessons. Not committed.
20. The 150 held shared wording hits: list them for the owner to decide one by one. Answer: Yes, list them for me.
   - List written: `curriculum/research/SHARED-HELD-150-DECISIONS.md`, count 150 (A 108, B 14, C 13, D 15). Not yet answered by the owner.
21. Construction course placement: the 98 lessons that name the construction course but are not placed in it should be placed there now, using their own module titles. Answer: Yes, place them. (Owner's item 8 answer refers to the existing construction course; no renaming.)
   - 21. (applied) done. Placed 92 of 98 construction lessons in the construction course (status DRAFT, exact moduleTitle match); 6 unmatched and not placed. meta.placements 5350 -> 5442. Log: curriculum/research/CONSTRUCTION-PLACEMENT-APPLIED.md.
22. Status: keep every lesson DRAFT until the owner reviews and approves it, course by course. This replaces items 11 and 12. Done 2026-11-04: all 1,016 lesson files, plus the converted and ready copies, set back to DRAFT. SCHEMA.md updated. Owner review is the next step.

- Decision 2026-11-04: learner input captured for the knowledge base is anonymised and opt-in only. No name or account ID is stored with it.
- Decision 2026-11-04: lessons get interactive elements. All three types are used (checklist and form blocks, scenario branching, worked calculators), each placed in the lesson where it fits best, and the types are varied across the lessons. Calculators need verified formulas before release.
- Decision 2026-11-04: terminology. Lessons are called Skills. Each Skill focuses on a skill or set of skills the user gains, and must do one of: produce an artefact, use another SkilledAt.Work app capability, or teach a practical skill. Top-level tiers are Business Skills, Vertical Skills and Specialised Skills. Code and UI renaming not yet done; pending owner choice of scope.
- Decision 2026-11-04: rename scope is everything now: code, API routes, database labels, UI and curriculum files. No migrations have been run, so model and table renames are safe to make before the first install.
- Decision 2026-11-04: the three tiers (Business Skills, Vertical Skills, Specialised Skills) replace the existing levels system. Level rules, level locks and level service are re-mapped to tiers.
- Decision 2026-11-04: NSW residential cleaning above the $5,000 per-job threshold is shown as threshold with a brief note of the requirement. It is not treated as a blocker.

- 2026-11-04: Licence cost rule. A course is accepted if the total cost to the worker of all licences and checks it needs is under $1,500. This replaces any per-licence limit. Costs are checked against official state sources before a course is accepted. Licences are shown in the lesson with the requirement and cost.

- 2026-11-04: Lesson removal limit set to $2,000. A lesson whose total licence and check cost is $2,000 or more is removed; a course stays if it still functions. Replaces the $1,500 lesson limit. The $1,500 course-total rule for acceptance is unchanged in principle, pending re-run.

- 2026-11-04: Governance rules. (1) Source changes, scheduled reviews and identified errors can trigger revision or withdrawal. (2) A passed affordability or licence-filter verdict does not mark a Skill educationally approved or publishable. (3) The 31 unclear courses stay explicitly flagged and blocked from publication where regulatory claims or safety-critical procedures remain unverified. (4) AI Workforce supervised roles, proposed: Course Quality Supervisor (learning objectives, missing materials, structural consistency) and Licensing Research Supervisor (official sources, conflicting or outdated requirements). Supervised, not autonomous.

- 2026-11-04: Where SkilledAt.Work V3.0 conflicts with earlier rules, V3.0 applies. (a) The $1,500 course figure is an internal affordability filter for course selection only, not a legal or publication gate. (b) The $2,000 individual-Skill removal rule is dropped. Licensed specialist content is split into general knowledge, permitted activities and regulated specialist Skills; essential safety or mandatory prerequisite content is never removed to meet a budget. (c) Licence status uses five values: no identified licence requirement, licence required, other conditions apply, unclear or under review, source expired or rule changed. A licensing agent never turns "no source found" into "no licence required". (d) Publication stages: content draft, technical review, safety review, jurisdiction review, assessment review, approved and published, monitored. (e) An affordability or licence-filter pass never marks a Skill approved or publishable. (f) Credentials are kept separate: completion records, internal assessments, training certificates, externally verified qualifications.

## 2026-11-04 Decision: item N licence conflicts (advised, owner said "use your best advice")
- Item N said "list them, do not edit lessons". The conflict agent edited 20 files to resolve seven conflicts (log: /home/claude/work/checklist/fix-item-89.md).
- Decision: keep those 20 edits. They follow the V3.0 rule that the official regulator page is superior, status fields are unchanged (DRAFT, NOT REVIEWED), and every file validates as JSON.
- Still open, not changed: the Victoria boom-length sentence in 231 other files; the handyman $3,300 QBCC quote in handyman-work-L09 (two copies); the WorkSafe Victoria asbestos page, not yet fetched.

## 2026-11-04 Decision: procurement module (best advice, option B)
- Source: /home/claude/work/checklist/item-54-procurement.md. Owner said "use your best advice".
- Kept: PROC-01 to PROC-04 stay in the 42 passed courses that already include them.
- Removed: the "construction" slug from the shared procurement module. It has no course folder and is not in passed.json. Changed in shared/business/PROC-01.json to PROC-04.json (courseSlugs) and in structure/COURSES-MODULES.json (construction course, "Shared: Business operations and finance"; the module keeps SHR-FIN-01 to 05 and SOL-07).
- Excluded on purpose: high-risk does not get PROC-01 to PROC-04. A moduleNote recording this, dated 2026-11-04, is added to each of the four PROC files.
- Not changed: status fields (DRAFT, NOT REVIEWED), the CPR 2025 vs 2020 version conflict, and the four not_checked licence entries. These still need closing before publication.
- Not changed: the SHR-FIN-01 to 05 files, which also list "construction". They are not procurement lessons and are outside this decision.

## 2026-11-04 Owner answer: NEW-TIL-05 register note
- Owner chose: reinstate "cumulative across all employees" (Victoria asbestos page wording). Recorded by the coordinator after the tiling fix round.

## 2026-11-04 Owner answer: painting licence term
- Owner chose: keep "not confirmed by an official source" wording. No term taught until a source confirms 1-year or 3-year.

## 2026-11-04 Owner answer: painting register NSW threshold
- Owner chose: restore the NSW threshold on NEW-PNT-01, 02, 03 and 05. Queensland stays not_checked. Agent task launched; log at fix-round/pnt-nsw-restore.md.

## 2026-11-04 Owner answer: solar L02 (Queensland licence)
- Owner chose: L02 should focus on solar panel cleaning, which needs no licence. Agent launched to reword L02; "no licence" stated only if an official page supports it, otherwise marked not confirmed. Log at fix-round/solar-l02.md.

## 2026-11-04 Owner answer: solar L10 driveway example
- Owner chose: replace the Victorian EPA driveway example. Agent launched to replace it with a source-backed example, or mark the point not confirmed. Log at fix-round/solar-l10.md.

## 2026-11-04 Owner answer: roof L01 knowledge check K05
- Owner chose: remove the option that states as fact the NSW code does not mention gutter cleaning or soft washing. Agent launched; it must check the answer key so the correct answer still matches. Log at fix-round/roof-k05.md.

## 2026-11-04 Owner answer: roof L03 and L07 asbestos citation
- Owner chose: cite the state pages instead of the unfetched Safe Work Australia asbestos guide. Agent launched to swap citations only where a state page supports the same claim. Log at fix-round/roof-swa.md.

## 2026-11-04 Owner answer: roof L01 K05 correct option
- Owner chose: replace the option with a sourced one. The option is the correct answer (index 3), so the replacement keeps index 3 as correct and must be backed by an official page, or marked not confirmed. Agent launched; log at fix-round/roof-k05.md.

## 2026-11-04 Result: solar L02
- L02 no longer says cleaning needs no licence. It states that electrical work is outside the cleaning taught, and that a licence for cleaning alone is not confirmed by an official source. Log: fix-round/solar-l02.md.

## 2026-11-04 Owner answer: roof L11 hold
- Owner chose: hold L11 from publication until the Queensland and Victorian asbestos pages can be fetched and checked. Hold note added to L11 JSON (publicationHold). Status fields unchanged. The publisher does not read this field yet; the lesson review gate already keeps unreviewed lessons out.

## 2026-11-04 Owner answer: tiling NEW-TIL-06 splitting-invoices rule
- Owner chose: label the rule as guidance, not an official requirement. Agent launched; log at fix-round/tiling-til06.md.

## 2026-11-04 Result: roof L01 K05
- New option text is sourced to the SafeWork NSW code of practice (Scope and application, cover dated May 2026). Index 3 is still the correct answer. Log: fix-round/roof-k05.md.
- Process note: two agents ran read-only git commands, which the owner's rules forbid. Neither changed anything.

## 2026-11-04 Owner answer: QBCC tiling page dates
- Owner chose: treat the QBCC tiling class text as current. Basis: the latest date on the page (fee text referring to 1 July 2026) is taken as its update date, per the official-page rule. No edit needed.

## 2026-11-04 Owner answer: window cleaning licence wording
- Owner rule: where official state sites were checked and do not mention a window-cleaning licence, mark "no licence". Where a site was not checked or was unreachable, keep "not confirmed by an official source". Agent launched per state; log at fix-round/window-states.md.

## 2026-11-04 Owner answer: window cleaning, Tasmania 11 m wording
- Owner chose: "11 m or more". Agent for window cleaning state rules to apply this in window-cleaning lessons that mention the Tasmania threshold. Log at fix-round/window-states.md.

## 2026-11-04 Owner answer: window L04 pressure-cleaning text
- Owner chose: keep the pressure-cleaning text in shared/exterior/high-access-window-cleaning-L04.json. No edit.

## 2026-11-04 Owner answer: pressure cleaning, Victorian boom-length claim
- Owner chose: mark the Victorian boom-length claim "not confirmed by an official source" in pressure-cleaning L01, L11, L12 and the register. Agent launched; log at fix-round/pressure-vic.md.

## 2026-11-04 Owner answer: window cleaning "no licence required" basis
- Owner chose: keep "no licence required" for all eight states, based on the high-risk-work licence pages checked on 2026-11-04. Caveat recorded: these pages are about elevating work platforms, not window cleaning, so the statement rests on silence on those pages. Log: fix-round/window-states.md.

## 2026-11-04 Owner answer: pressure cleaning, Queensland 11 m claim
- Owner chose: try the page again, and if still unavailable mark not confirmed. Retry: the WorkSafe QLD page is still not on the allowlist. A search snippet quotes it, but that is not a read, so the 11 m claim is marked "not confirmed by an official source" in the pressure-cleaning lessons and register notes. Agent informed; log at fix-round/pressure-vic.md.

## 2026-11-04 Owner answers: pressure cleaning state rules
- Owner chose: state each state's licence rule separately in the pressure-cleaning lessons. Queensland's 11 m rule uses the WorkSafe QLD search snippet, cited as "date not shown" and not as a full page read. Victoria's boom-length claim stays not confirmed. SA's "pressure equipment operation" class is mentioned as a class name only.
- Process note: the earlier pressure-cleaning fix changed register limit and officialWording fields, not only notes. A follow-up agent is reverting those and rewriting the statements. Log: fix-round/pressure-state.md.

## 2026-11-04 Owner answer: roof L08 soft-wash product licence
- Owner chose: check a chemical regulator page for the state licence for applying soft-wash products. Agent to check, then update or keep not confirmed. Log: fix-round/roof-l08-chem.md.

## 2026-11-04 Owner answer: roof L09 high-risk licence references
- Owner chose: put the high-risk work and platform licence material in its own add-on course, which can be taken alongside the main courses. Draft as a new DRAFT course; original lessons left unchanged until the owner approves removal. Log: fix-round/highrisk-addon.md.
- Question from owner: how much knowledge base this course system provides for the agents. Answered in chat.

## 2026-11-04 Owner answer: NEW-PNT-02 stated allowance
- Owner chose: leave the allowance value for the owner to set. The pass rule keeps its reference and stays open. No edit.

## 2026-11-04 Owner answer: NEW-PNT-03 raking-light test and consent
- Owner chose: keep raking-light inspection as the test method. Mark the photograph consent rule "not confirmed by an official source". Agent to apply.

## 2026-11-04 Owner answer: pressure-cleaning register, Victoria
- Owner chose: the register says Victoria's boom-length threshold is "not confirmed by an official source". The restored "no boom-length threshold" text is replaced. Queensland's 11 m text uses the search-snippet wording, dated "not shown". Agent launched; log at fix-round/pressure-reg.md.

## 2026-11-04 Owner answer: roof L11 South Australia asbestos wording
- Owner approved: the correction that SA Class A also covers non-friable asbestos. Agent to apply it in roof L11. Log: fix-round/roof-l11-sa.md.

## 2026-11-04 Owner answer: $2,000-removed lessons
- Owner chose: return portfolio lessons C19-L01, C19-L02, C19-L03, NEW-REP-04 and deck lesson NEW-DEK-03 to their courses under V3.0. Agent to restore them to course structure as DRAFT, with the cost basis noted. Log: fix-round/restore-removed.md.

## 2026-11-04 Owner answer: NEW-DEK-03 cost basis
- Owner chose: keep NEW-DEK-03 with its $1,942.29 total, calculated on the lowest fees. Within the $2,000 affordability limit. No change to the figure.

## 2026-11-04 Owner answer: portfolio (C19) licence cost states
- Owner chose: count all states for the C19 licence costs.

## 2026-11-04 Owner answer: C19-L01 and C19-L03 licence status
- Owner chose: keep "required" for C19-L01 and C19-L03.

## 2026-11-04 Owner answer: licence status set
- Owner chose: add a fifth licence status, "under review", to the four in the register (required, threshold, not_required, not_checked). Register and code changes to use it are not yet made; to be scoped with the V3.0 rework.

## 2026-11-04 Owner answer: seven publication stages
- Owner chose: use the seven stage names in V3.0 as written, in their order, without new definitions. Definitions to be added later by the owner if needed.

## 2026-11-04 Owner answer: NEW-PNT-04 stop-work points
- Owner chose: keep stopping before scraping and heat stripping as stop-work advice, not a pass condition.

## 2026-11-04 Result: $2,000-removed lessons
- Check found all five lessons (C19-L01, C19-L02, C19-L03, NEW-REP-04, NEW-DEK-03) already in their courses with DRAFT and NOT REVIEWED status. Nothing restored, nothing duplicated. Log: fix-round/restore-removed.md.

## 2026-11-04 Result: high-risk add-on course
- Drafted curriculum/courses/high-risk-licence-addon/ with 7 DRAFT lessons, no answer keys, and not yet in the course registry. Shared roof L09 still carries the Victoria boom-length sentence, which is unconfirmed. Log: fix-round/highrisk-addon.md.

## 2026-11-04 Owner answer: NEW-PNT-05 licence check states
- Owner chose: the licence check covers all states. States not yet checked are to be checked by a later agent task; until then their status is not confirmed.

## 2026-11-04 Owner answer: SHR-PLN-03 break-even formula
- Owner chose: teach the break-even formula and "contribution per job" as a method. business.gov.au does not state the formula, so the lesson should say the method is the course's own, not an official definition. Wording to be applied by a later agent task.

## 2026-11-04 Owner answer: pass-rule judgement items
- Owner chose: keep the judgement items as agreed standards: knowledge check alone is not a pass, signed or approved documents, referral in writing, and stop-work rules. Note: this overrides the earlier "suggestions, not agreed standards" label for these items only.

## 2026-11-04 Owner answer: lesson minutes for 504 lessons
- Owner chose: estimate minutes from word count for the 504 lessons that have no value, marked as estimated. Agent to apply the same rule the minutes fix used (log: fix-round/minutes.md).

## 2026-11-04 Owner answer: tiling NEW-TIL-08 QBCC URL
- Owner confirmed: the replacement QBCC URL for NEW-TIL-08 is the citation.

## 2026-11-04 Result: painting licence check, all states
- Checked all eight states and territories. NSW and WA: licence required (NSW above $5,000, WA $1,000 or more). VIC: painting-only jobs need no registration. Not confirmed by an official source: QLD (painting-only), SA, TAS, ACT, NT. Log: fix-round/painting-all-states.md.

## 2026-11-04 Result: lesson minutes
- The 504 converted copies lack estimatedMinutes, but each lesson already has a value under the same id in its course or shared file. Nothing filled, nothing overwritten. Log: fix-round/minutes-all.md.

## 2026-11-04 Owner answer: apply painting all-states results
- Owner chose: apply. NSW and WA: licence required. VIC: painting-only needs no registration. QLD, SA, TAS, ACT, NT: not confirmed by an official source.

## 2026-11-04 Owner answer: procurement CPR version
- Owner chose: the latest official CPR version, per the official-page rule (latest update date). Agent to apply to the procurement lessons that cite CPR, with the page and date.

## 2026-11-04 Owner answer: 63 reference entries still without an official URL
- Owner chose: mark each of the 63 claims "not confirmed by an official source". Agent to apply, leaving URLs empty. Log: fix-round/empty-urls-round2.md.
- Flag: the DIP-01 R2 URL fill (AS/NZS 3816) cites a page that lists AS 3816:2018 without the NZS prefix. Needs owner check.

## 2026-11-04 Owner answer: DIP-01 R2 citation
- Owner chose: keep the AS/NZS 3816 citation and note that the page lists AS 3816:2018 without the NZS prefix. Agent is adding that note.

## 2026-11-04 Owner answer: product names
- Owner chose: SkilledAt.Work is the learning system (LMS). SuperchargedAt.Work is the AI workforce. Use each name for its own product.

## 2026-11-04 Result: painting all-states wording
- 20 lesson statements changed across eight NEW-PNT-01/02/03/05 files, and four register rows updated (limit, wording, URLs, note). No status changes. Log: fix-round/painting-apply.md. Open: the register states arrays still list only NSW and QLD.

## 2026-11-04 Owner answer: painting register states arrays
- Owner chose: list all eight states and territories in the states arrays of NEW-PNT-01, 02, 03 and 05. Agent launched; log at fix-round/pnt-states.md.

## 2026-11-04 Result: Commonwealth Procurement Rules
- Updated PROC-01 to PROC-04 to the 2025 instrument (commenced 17 November 2025). The finance.gov.au landing page still shows 2020, which is flagged not confirmed. Log: fix-round/cpr-procurement.md.

## 2026-11-04 Result: 63 unresolved reference claims
- All 63 marked "not confirmed by an official source", URLs left empty, across 33 files. DIP-01 R2 kept with an owner-check note. Log: fix-round/unresolved-marked.md.

## 2026-11-04 Owner answer: bond photo mapping
- Owner chose: repoint the bond photo to the sheet that has the photo (02_banner_and_photo_row.png, not 03_photo_sheet.png). Agent to apply in the catalogue or mapping. Log: fix-round/bond-img.md.

## 2026-11-04 Owner answer: bond photo
- Owner chose: re-slice the bond photo from the banner sheet, not a simple repoint. Pending agent task; the mapping lives in slice.py. Log: fix-round/bond-img.md.

## 2026-11-06 Owner answer: scheduled source review
- Owner chose: monthly scheduled review of licence and regulator pages. Created as a report-only task (trig_01BVCfmDxfj77KYPvwJg7b5N), first run 2026-11-30. It does not edit lessons.

## 2026-11-06 Owner request: slice all image sheets into individual images
- Scope (best advice): a file counts as a sheet only if it holds several separate images. Single images are left alone. Pieces are written to a new sibling folder ("<folder>_individual"), not over the originals. Originals are not deleted. Log: work/slice-all/.

## 2026-11-06 Owner request: full zip without sheet originals, smallest size
- Build the full package excluding the original sheet files that have been sliced, using the individual pieces in their place. Originals are NOT deleted from the working folders; only left out of the package. Compress at maximum level.

## 2026-11-06 Owner answer: edge-fragment photos
- Owner chose: crop the three photos with neighbour fragments (deck-photo-0c443ed3-13, aquarium-photo-55148f31-12, pool-photo-8fb546df-02) to their main photo. New files named -main, originals kept. Log: work/slice-all/edge-crops.md.

## 2026-11-06 Owner answer: 18 thin-strip photos in cleaning folders
- Owner chose: crop each of the 18 photos (listed in work/slice-all/part1-photos.md) to its main photo, saving -main copies and keeping originals.

## 2026-11-08 Owner instruction: leave sheets and catalogue as they are
- Owner said: "Leave them". Stopped the plan to add pieces to the library, repoint the catalogue, and drop sheets from the zip. No sheets removed, no catalogue entries changed, no zip built.
- Slicing outputs remain in their *_individual folders under /home/claude/work (about 1,516 files, 744 of them duplicates in course-images-2). Logs in work/slice-all/.
