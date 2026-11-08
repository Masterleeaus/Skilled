# Owner suggestions applied (B): PVB-06 and PVB-08, and flagged pool knowledge checks

Recorded 2026-11-03. Owner decision (OWNER-DECISIONS.md item 9, follow-up): go with the suggestions for PVB-06 and PVB-08.

Sources used:
- VBA Building Practice Note SP 02, Version 3, 26 September 2023. Read 2026-11-03 through a summary tool (WebFetch). The tool returned a paraphrase, not verbatim text. Re-read the same day for the points below.
- VBA Building Practice Note SP 01, Version 2.0, 27 April 2023 (supersedes Version 1.0, 28 June 2021). Read 2026-11-03 through a summary tool. The tool returned short quoted fragments. Those fragments are recorded below as the tool returned them; they were not checked against the full PDF. Regulations 53 and 54 were not read.

## 1. Quoted SP 01 time-limit text (as returned by the summary tool, 2026-11-03)

- "building work for a swimming pool and barrier must commence within 12 months of the issue date of the building permit"
- "be completed within six months of the building work commencement"
- "this work can be completed within the time limits of the other work as referred to in regulation 54(1)(c)" (not used in the lesson)
- Site fencing (regulation 116): "Consideration for site fencing under regulation 116 must include provisions to restrict access" / "during excavation, construction, and once the pool/spa can contain water to a depth of greater than 300mm"

The lesson restates these in its own words; it does not copy them.

## 2. Verification of SP 02 points (2026-11-03)

| Point | SP 02 says | Result for the lessons |
|---|---|---|
| Mesh height under 25 kg top load (non-boundary) | must not be reduced to less than 1200 mm | Supported |
| Base gap under 100 N lift | gap must not exceed 100 mm | Supported |
| Footings for posts and gates | "recommends" monolithic or one footing across the opening | Supported as a recommendation only |
| Gate self-closing and self-latching under AS 1926.1-2012 | No general gate requirement. The only such requirement is for a door forming part of an indoor pool barrier | NOT supported for gates (see section 5) |
| 330 N, 33 kg, spring scale, 1200 mm sideways test, 1/200 span | None appear | Removed |
| Time limits, inspection stages, sign-off, corrective orders, halt notices | Not in SP 02 | Removed from PVB-08 (time limits now from SP 01) |

## 3. Decisions made (for owner review)

1. PVB-06 retitled from "Victorian barrier strength and in-situ testing" to "Victorian mesh barrier load and base-gap checks", because the lesson now covers only the SP 02 mesh checks.
2. PVB-06 gate operation check removed from procedure, commonErrors, qualityStandard, documentationEvidence, summary and knowledge checks. The gate point is restated as "SP 02 does not set a general rule". A learner-facing block explains this.
3. PVB-06 footings kept as a recommendation and not as a pass or fail check.
4. PVB-06-K02 and PVB-06-K03 options were rewritten, and PVB-06-K03 changed from a post spring-scale decision to the base-gap limit. Correct index kept at 1 in both.
5. PVB-08 retitled to "Victorian pool permit drawings, build time limits and stop-and-report steps", because the inspection-stage and stop-work-power content is removed.
6. PVB-08 time limits re-sourced to SP 01 (new instruction block, new procedure step, new learning outcome, new commonError, new summary line, new officialReference R3). SP 01 is cited with its date (27 April 2023).
7. PVB-08-K01 rewritten to a permit-drawing fact (SP 02). The SP 01 time-limit question was not used because PVB-02-K03 already asks it.
8. PVB-08-K03 rewritten to a recirculation-design fact (SP 02).
9. PVB-08-K02 question and key unchanged. Only its rationale changed, because the surveyor corrective-notice claim is not in SP 02 or SP 01.
10. PVB-04-K03 rewritten to the SP 02 side-hung indoor pool door rule (replaces the removed powered-door fail-safe claim). Correct index kept at 1.
11. PVB-05-K03 rewritten to the SP 02 above-ground pool wall height (replaces the removed 300 mm clearance claim). Correct index kept at 1.
12. Outside the flagged list, and fixed because the source did not support them: PVB-04-K01 rationale (gate-latching claim replaced by the SP 02 mesh 25 kg point; key unchanged), PVB-05-K01 option and commonError wording ("marked" removed; key index unchanged).
13. Five mirror files that carry lesson titles (listed in section 4) were updated so the titles match the lesson files.

## 4. Changes by file

Each entry: file, old text, new text, source and date.

### curriculum/shared/pool/PVB-06.json

- title. Old: "Victorian barrier strength and in-situ testing". New: "Victorian mesh barrier load and base-gap checks". Source: SP 02 v3, 2026-11-03.
- learningOutcomes[2]. Old: "Decide whether a mesh panel and its gate pass the SP 02 checks." New: "Decide whether a mesh panel passes the SP 02 height and base-gap checks."
- instruction "Footings for posts and gates". Heading old: "Footings for posts and gates" new: "Footings for posts and gates (recommended)". Body old: "SP 02 says footings for posts and gates should be poured monolithically or as one footing across the opening. That prevents posts spreading, which can stop a gate from latching." New: "SP 02 recommends pouring footings for posts and gates monolithically or as one footing across the opening. It notes that spreading posts can stop a gate from latching properly. This is a recommendation, so it is not a pass or fail check in this lesson." Source: SP 02 v3, section on footings, 2026-11-03.
- instruction "Gate operation". Heading old: "Gate operation" new: "Gates: what SP 02 does and does not require". Body old: "SP 02 says gates must be self-closing and self-latching under AS 1926.1-2012. A gate that does not close and latch itself is not compliant, however sound it looks." New: "SP 02 does not set out a general self-closing and self-latching requirement for gates under AS 1926.1-2012. For a door that forms part of an indoor pool barrier, it does require self-closing and self-latching under AS 1926.1-2012. Gate operation is not one of the checks in this lesson." Source: SP 02 v3, section on gates, 2026-11-03.
- procedure[3]. Old: "Check that each gate closes and latches itself, and record the result before any sign-off." New: "Record each panel height and base-gap reading against the SP 02 figure before deciding whether the panel passes."
- workedExamples[0].reasoning. Old: "...Do not sign off the barrier. Record the reading and report the defect to the builder and the building surveyor for repair and retest." New: "...Do not accept the panel as meeting SP 02, and record the reading." Reason: reporting recipients are practice guidance, not SP 02.
- commonErrors[1]. Old error: "Signing off without the gate operation check." prevention: "Strength and operation are both needed before sign-off." New error: "Measuring the base gap without applying the full 100 N lift." prevention: "Apply the 100 N lift to the base first, then measure the gap against 100 mm."
- safetyAndRegulatory[1]. Old: "A barrier panel or footing that fails the check is an injury and drowning risk. Do not sign off the barrier." New: "A barrier panel that fails the height or base-gap check is an injury and drowning risk. Do not accept the panel."
- qualityStandard[1]. Old: "Footing, panel, base gap and gate results are recorded against the SP 02 figure." New: "Footing layout, panel height and base-gap results are recorded against the SP 02 figure."
- qualityStandard[2]. Old: "The barrier is not signed off until every check passes." New: "The panel is not accepted until both load checks pass."
- documentationEvidence[1]. Old: "Mesh base-gap and gate operation test record with results" New: "Mesh base-gap test record with the lift force, gap reading and result"
- summary[2]. Old: "Gates must be self-closing and self-latching before sign-off." New: "SP 02 recommends monolithic or single footings for posts and gates; that recommendation is not a pass or fail check here."
- knowledgeChecks PVB-06-K01 question. Old: "At what height does the note apply the sideways test force to a barrier post?" New: "To what height must a non-boundary mesh barrier stay under the 25 kg top load?" Options unchanged (600 mm, 1200 mm, 1800 mm, 300 mm); key index 1 unchanged.
- knowledgeChecks PVB-06-K02 question and options. Old question: "The note describes 330 N as roughly what load for the field check?" Old options: "3.3 kg", "33 kg", "330 kg", "1.3 kg". New question: "What vertical lift force does the base-gap check apply to a mesh or perforated panel?" New options: "25 kg", "100 N", "10 N", "1000 N". Key index 1 unchanged.
- knowledgeChecks PVB-06-K03 question and options. Old question: "A barrier post moves when the spring scale reaches 25 kg. What is the correct decision?" Old options: "Accept it, because 25 kg is close to 33 kg", "Do not sign off, and report the defect for repair and retest", "Accept it if the footing is not visibly cracked", "Move the balance and try again until it passes". New question: "What is the maximum gap at the base of a mesh or perforated barrier under the 100 N lift?" New options: "50 mm", "100 mm", "200 mm", "1200 mm". Key index 1 unchanged.
- sourceReferences[0]. Appended: "Gate self-closing and self-latching is not a general SP 02 requirement (SP 02 sets it for indoor pool doors only), and the footing point is a recommendation."
- sourceReferences[2]. Old: "UNCONFIRMED: named standard clauses (not read); testing rules in other states and territories. Knowledge checks 1 and 2 (330 N post test, 1200 mm sideways height, 33 kg equivalent) and knowledge check 3 (spring-scale post test) rest on points SP 02 does not state. A reading or quiz pass is not verified practical competence." New: "UNCONFIRMED: named standard clauses (AS 1926.1-2012, not read); testing rules in other states and territories. The SP 02 figures were read through a summary tool, not from the full PDF. A reading or quiz pass is not verified practical competence."
- officialReferences R1 covers. Replaced with text stating the 2026-11-03 re-check: covers the 25 kg top load (1200 mm or more), the 100 N base gap (100 mm), footings as a recommendation; does not set a general gate rule; does not state 330 N, spring-scale, 33 kg, 1200 mm sideways test or 1/200 span limit. Source: SP 02 v3, 2026-11-03.

### curriculum/assessments/PVB-06.assessment.json

- knowledgeAnswers PVB-06-K01 rationale. Old: "VBA note (2018), post-strength section: the sideways load acts at a height of 1200 mm measured up from the settled surface." New: "SP 02 (Version 3, 26 September 2023), mesh section: a non-boundary mesh barrier must stay at 1200 mm or more under a 25 kg weight applied at any point on its top."
- knowledgeAnswers PVB-06-K02 rationale. Old: "VBA note (2018): 330 N is approximately 33 kg, the reading used on the spring scale." New: "SP 02 (Version 3, 26 September 2023), mesh section: the base-gap check applies a 100 N vertical lift force to the base of the mesh or perforated barrier."
- knowledgeAnswers PVB-06-K03 rationale. Old: "VBA note (2018), post-strength section: the post and footing must hold the 330 N equivalent without loosening, so a failure stops sign-off." New: "SP 02 (Version 3, 26 September 2023), mesh section: the gap at the base of a mesh or perforated barrier must stay within 100 mm under the 100 N lift."
- practicalCriteria[0]. Old: "On a supplied post, attaches a calibrated spring scale at 1200 mm and notes the value at which the post shifts, or confirms the 33 kg mark is reached." New: "Applies the 25 kg weight at any point on the top of a supplied mesh panel, and records the height against 1200 mm."
- practicalCriteria[1]. Old: "Inspects the supplied footing, records any looseness or damage, and makes the sign-off decision in writing." New: "Checks the supplied footing layout against the SP 02 recommendation, and records the result and the decision in writing."
- practicalCriteria[2]. Old: "Carries out the supplied gate operation check and records pass or fail." New: "Applies a 100 N vertical lift to the base of a supplied mesh panel, and records the gap against 100 mm."
- evidenceRequired[0]. Old: "Strength test record with calibration date" New: "Load test record with equipment and height reading"
- evidenceRequired[1]. Old: "Gate operation test record" New: "Base-gap test record with the 100 N lift and gap reading"
- evidenceRequired[2]. Old: "Assessor observation of the pull and the sign-off decision" New: "Assessor observation of the 25 kg load and the accept or reject decision"
- stopWorkCriteria[0]. Old: "Post or footing fails the strength check: do not sign off; report." New: "Mesh panel below 1200 mm under the 25 kg load: do not accept it; record the reading."
- stopWorkCriteria[1]. Old: "Spring balance uncalibrated or out of date: do not test." New: "Test weight or 100 N equipment not recorded before use: do not test."
- stopWorkCriteria[2]. Old: "Gate fails to latch under the 25 kg check: do not sign off the barrier." New: "Base gap above 100 mm under the 100 N lift: do not accept the panel."

### curriculum/shared/pool/PVB-08.json

- title. Old: "Victorian pool permits, inspections and stop-work escalation" New: "Victorian pool permit drawings, build time limits and stop-and-report steps". Reason: inspection-stage and stop-work-power content not in SP 02 or SP 01.
- learningOutcomes. Added: "State the SP 01 start and finish time limits for swimming pool and barrier building work." Source: SP 01 v2.0, 27 April 2023.
- instruction. Added block. Heading: "Time limits for pool and barrier work". Body: "Victorian rule (VBA Building Practice Note SP 01, Version 2.0, 27 April 2023). The building work has 12 months from the permit's issue date to begin, and six months from the start to finish. The note links these limits to regulations 53 and 54, which were not read for this lesson." Source: SP 01 v2.0, 2026-11-03 (tool fragments in section 1).
- procedure. Added step after step 0: "Note the permit's issue date and the planned start and finish dates, and check them against the SP 01 time limits."
- commonErrors. Added: error "Starting pool work without checking the permit's issue date against the time limits." prevention "Note the issue date and the planned start and finish dates before work begins."
- safetyAndRegulatory[2]. Old: "Figures are Victorian (VBA Building Practice Note SP 02, 2023). This lesson does not cover permit stages, inspections or time limits." New: "Figures are Victorian. Permit drawing points come from SP 02 (26 September 2023); the time limits come from SP 01 (27 April 2023). This lesson does not cover permit stages or inspections."
- summary. Added: "Pool and barrier building work has 12 months from the permit's issue date to begin and six months from the start to finish (SP 01, 27 April 2023)."
- knowledgeChecks PVB-08-K01 question and options. Old question: "When does the note require a building permit?" Old options: "Only for indoor pools", "To construct a fresh pool or spa, plus altering either one or its fence", "Only when the pool is in a Class 10a building", "For fence repairs only, since pool work is otherwise exempt". New question: "For an indoor pool, what must the building permit drawings show?" New options: "Only the pool depth and the pump size", "The barrier, child-resistant doorsets and the direction the door swings", "Only the builder's registration number", "The filter model and the water test results". Key index 1 unchanged. Source: SP 02 v3, 2026-11-03.
- knowledgeChecks PVB-08-K02. Unchanged.
- knowledgeChecks PVB-08-K03 question and options. Old question: "Under the note, what can a building surveyor do if a builder keeps working without a permit?" Old options: "Nothing, the builder decides", "Issue a halt notice", "Grant retrospective approval on site", "Waive the barrier requirement". New question: "Under SP 02, to whom must recirculation and filtration designs be given with the building permit application?" New options: "The pool owner only", "The relevant building surveyor", "The local water retailer", "No one, they are kept on site". Key index 1 unchanged. Source: SP 02 v3, 2026-11-03.
- sourceReferences. Added entry for SP 01 (Version 2.0, 27 April 2023, time-limit point only, read through a summary tool; regulations not read). Replaced the UNCONFIRMED line. Old: "UNCONFIRMED: current Building Regulations text (the note cites the 2018 regulations); builder and owner-builder registration rules in other states. Knowledge checks 1 and 3 rest on permit and surveyor powers that SP 02 does not state; the owner decides whether to keep them." New: "UNCONFIRMED: current Building Regulations text (regulations 53 and 54 cited by SP 01, not read); builder and owner-builder registration rules in other states. Stop-work and reporting steps are practice guidance and are not stated in SP 02 or SP 01."
- officialReferences R1 covers. Old: "...It does not confirm the permit, inspection-stage, time-limit or sign-off points in the lesson." New: "...It does not confirm the permit or inspection-stage points in the lesson."
- officialReferences R3 added: SP 01 Version 2.0, URL https://www.vba.vic.gov.au/__data/assets/pdf_file/0007/135727/Building_SP_01_-Swimming-pool-standards-and-safety-requirements.pdf, pageDate "Published 27 April 2023 (Version 2.0)", checked 2026-11-03, covers the time limits (12 months to commence, six months to complete; regulations 53 and 54 not read).

### curriculum/assessments/PVB-08.assessment.json

- PVB-08-K01 rationale. Old: "VBA note (2018), permit-requirement section: constructing a fresh pool or spa, plus altering either one or its barrier, needs a permit." New: "SP 02 (Version 3, 26 September 2023), indoor-pool permit drawings: the drawings must show the barrier, the child-resistant doorsets and the direction the door swings."
- PVB-08-K02 rationale. Old: "VBA note (2018), precaution-maintenance section: when a safeguard has been displaced, the surveyor serves a corrective notice, and site staff raise it instead of adjusting it." New: "Practice rule in this lesson, not an SP 02 or SP 01 statement: stop work in the affected area, record the position, and report to the builder and building surveyor. Do not adjust the precaution yourself."
- PVB-08-K03 rationale. Old: "VBA note (2018), incomplete-work section: a halt order is appropriate if the builder carries on working without a permit." New: "SP 02 (Version 3, 26 September 2023), recirculation and filtration designs: they must be given to the relevant building surveyor with the building permit application."
- practicalCriteria[0]. Old: "From a supplied permit, identifies the inspection stages and time limits, and books each stage in a supplied log." New: "From a supplied permit, identifies the SP 01 start and finish time limits for the pool and barrier work, and records the issue date and planned dates in a supplied log."
- evidenceRequired[0]. Old: "Permit and inspection log for the assessed project" New: "Permit and time-limit log for the assessed project"

### curriculum/shared/pool/PVB-04.json

- knowledgeChecks PVB-04-K03 question and options. Old question: "What must a powered door to an indoor pool enclosure do when power and battery both fail?" Old options: "Stay open for airflow", "Shut and latch on its own", "Unlock fully for the rescue team to enter", "Sound an alarm and stay open". New question: "Under SP 02, what must a side-hung door used as part of an indoor pool barrier do?" New options: "Stay open for airflow", "Swing away from the pool and be self-closing and self-latching", "Open into the pool area for rescue access", "Have no non-climbable zone on its outside". Key index 1 unchanged. Source: SP 02 v3, indoor pool section, 2026-11-03.

### curriculum/assessments/PVB-04.assessment.json

- PVB-04-K01 rationale. Old: "VBA note (2018), gate-latching section: a 25 kg load sits on the top rail, 100 mm short of the latch-side edge." New: "SP 02 (Version 3, 26 September 2023), mesh section: a 25 kg weight is applied at any point on the top of a non-boundary mesh panel."
- PVB-04-K03 rationale. Old: "VBA note (2018), indoor pool section: such doors need to shut and catch by themselves if mains supply and backup batteries both fail." New: "SP 02 (Version 3, 26 September 2023), indoor pool section: a side-hung door used as part of an indoor pool barrier must swing away from the pool, be self-closing and self-latching, and have a non-climbable zone on its outside."
- practicalCriteria[2]. Old: "Confirms the fail-safe action of a supplied powered door in the indoor scenario, and records the unlock height." New: "Checks a supplied side-hung indoor pool door for swing direction, self-closing, self-latching and the non-climbable zone on its outside, and records the result."
- stopWorkCriteria[2]. Old: "Powered door does not close on power loss: report to the owner and an electrician." New: "Indoor pool side-hung door does not swing away, self-close or self-latch: report and do not accept the barrier."

### curriculum/shared/pool/PVB-05.json

- knowledgeChecks PVB-05-K01 option[1]. Old: "A marked, enclosed zone around the pool" New: "A separate area enclosed by a barrier around the pool". Key index 1 unchanged. Source: SP 02 v3, 2026-11-03 (swimming pool area is a separate area enclosed by a barrier).
- commonErrors prevention. Old: "The pool zone is a marked, enclosed area around the water." New: "The pool zone is a separate, enclosed area around the water."
- knowledgeChecks PVB-05-K03 question and options. Old question: "For a pool with raised walls, how far must the fence sit from the access steps, pump and filter?" Old options: "Up to 100 mm only", "At least 300 mm", "1.2 m is the minimum", "At least 900 mm". New question: "For an above-ground pool, how high must the pool wall be above finished ground level?" New options: "Up to 100 mm only", "At least 1.2 m", "At least 900 mm", "At least 300 mm". Key index 1 unchanged. Source: SP 02 v3, above-ground pool section, 2026-11-03.
- sourceReferences[2]. Old: "UNCONFIRMED: layout rules in other states and territories. Knowledge check 3 (300 mm clearance around access steps, pump and filter) is not stated in SP 02 and remains UNCONFIRMED; the owner decides whether it stays." New: "UNCONFIRMED: layout rules in other states and territories. Knowledge check 3 was rewritten on 2026-11-03 to ask about the SP 02 above-ground pool wall height (1.2 m above finished ground level), in place of the 300 mm access-step clearance that SP 02 does not state."

### curriculum/assessments/PVB-05.assessment.json

- PVB-05-K01 rationale. Old: "VBA note (2018), layout section: the whole lot cannot be the pool zone; the pool zone is a defined area enclosed by the barrier." New: "SP 02 (Version 3, 26 September 2023), layout section: the swimming pool area is a separate area enclosed by a barrier; enclosing the whole property does not comply."
- PVB-05-K02 rationale. Old: "VBA note (2018), siting section: fencing should not be put up beside trees, grills or anything else a child could scale." New: "SP 02 (Version 3, 26 September 2023): plants that could help a child climb are not permitted within the non-climbable zones; SP 02 places barbecues outside the pool area. The lesson also keeps trees and other climbable objects clear of the barrier."
- PVB-05-K03 rationale. Old: "VBA note (2018), above-ground pool section: the fence keeps at least 300 mm between itself and the access steps, the pump housing, the filter housing and any other scalable item." New: "SP 02 (Version 3, 26 September 2023), above-ground pool section: the pool wall must be at least 1.2 m above finished ground level and non-climbable."
- practicalCriteria[1]. Old: "Measures a supplied above-ground pool's clearance from the ladder, pump and filter, and states whether it complies." New: "Measures a supplied above-ground pool wall's height above finished ground level, and states whether it reaches 1.2 m and is non-climbable."
- evidenceRequired[1]. Old: "Clearance measurement record" New: "Wall height measurement record"
- stopWorkCriteria[2]. Old: "Above-ground pool ladder or pump inside the 300 mm clearance zone: report before use." New: "Above-ground pool wall below 1.2 m above finished ground level, or climbable: report before use."

### Title mirror files (same title change in each)

- curriculum/integration/PSA-PVB-LIST.csv: PVB-06 and PVB-08 rows.
- curriculum/levels/pool.csv: PVB-06 and PVB-08 rows.
- curriculum/levels/ALL-LESSON-LEVELS.csv: PVB-06 and PVB-08 rows.
- curriculum/structure/COURSE-MODULE-LESSON-MAP.csv: PVB-06 and PVB-08 rows.
- curriculum/structure/COURSES-MODULES.json: PVB-06 and PVB-08 "title" fields.
Titles changed from the old lesson titles to the new titles in section 4 (the PVB-08 title is quoted in CSV because it has commas). Source: lesson files above, 2026-11-03.

### curriculum/research/OWNER-DECISIONS.md

- Item 9: appended a "Done" line pointing to this log.

## 5. Remaining unsupported claims (not changed in this pass)

These were found during the check and sit outside this pass's scope or need an owner decision.

1. PVB-04 gate content. The 2026-11-03 SP 02 read found no general SP 02 rule for gate self-closing and self-latching under AS 1926.1-2012. The following still state it: PVB-04 instruction "Gates must shut and latch unaided"; summary[0]; learningOutcomes[0]; officialReferences R2 covers ("New pools and spas must have self-latching and self-closing pool gates"). Also PVB-04 assessment practicalCriteria[0] and evidenceRequired[2] still use a 25 kg gate test, which the lesson no longer states. Owner decision: restate or remove.
2. PVB-06 and PVB-08 practice guidance is not from SP 02 or SP 01: "Do not accept/sign off", "report to the builder and building surveyor", "report any shortfall rather than adjusting it on site", "Stop, record and report" steps, and documentationEvidence "Record of any direction to fix and its written confirmation" (PVB-08). Kept as practice guidance; flagged here and in PVB-08 sourceReferences.
3. PVB-08 safetyAndRegulatory[1] (builder registration and owner-builder status as licence-type requirements) is not in SP 02 or SP 01 in the reads made. It is a licence notice, kept unchanged.
4. PVB-05-K02 question ("What does the note say about barriers placed near trees or barbecues?") and its correct option. SP 02 places barbecues outside the pool area; it does not say a barrier must not sit near them. Kept unchanged; the owner may want the stem reworded.
5. PVB-06 audience and summary use sign-off language (sign-off as practice, not an SP 02 rule). Kept.
6. SP 01 time limits rest on fragments returned by a summary tool, not on the full PDF or the regulations. The lesson says the regulations were not read.

## 6. Checks run

- Parsed all changed JSON files and CSV files with python3 -I: all parse.
- python3 -I /home/claude/work/check.py before the edits: 0 problems. After the edits: 0 problems (output in /home/claude/work/pvb-b-before.txt and pvb-b-after.txt).
- Grep of changed PVB-06 and PVB-08 files for 330, spring, 33 kg, sideways, 1/200, in-situ, corrective, halt, inspection stage: no remaining hits in lesson or assessment text except the generic "practical sign-off" passRule and audience wording, and the negative source notes.
- Not committed. No memory tools used.
