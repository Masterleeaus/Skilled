# WAH- coverage table (work at height)

Status: all 12 files DRAFT, NOT REVIEWED. Checked 2026-11-02.
Learner files: `shared/safety/WAH-01..11.json`, `shared/safety/WAH-TPL-01.json`.
Assessor files: `assessments/WAH-01..11.assessment.json`, `assessments/WAH-TPL-01.assessment.json`.
List: `integration/WAH-LIST.csv`.

## Sources

| # | Upload | What it is | Jurisdiction and use |
|---|---|---|---|
| 1 | Work at Height Checklist (Issue 1, Aug 2006) | Blank company permit form with supervisor and worker sign-off | Template only. Field wording rewritten. No legal references. |
| 2 | Working at Height FINAL (HSES training centre deck) | Training slides | No statute named in the text as read. Figures are imperial and read as US-style. Not used as Australian facts. |
| 3 | Working at Heights & Harness/Lanyard course (instructor deck) | Irish course deck | Cites Irish legislation and codes, and UK law. The legal references are **not applicable in Australia**. Practice content used; figures not used. |
| 4 | Working At Height Procedure (Rev A/B, 2021) | **Contractor project procedure** for an industrial construction project in Malaysia, with client and project identifiers. Cites DOSH Malaysia, UK HSE regulations and IRATA UK. | Not an official guide. Used for structure and control content. Client name, project codes and the document number are left out of the lessons. The cover says Rev A but the revision table lists Rev B, which is noted. Not used as an Australian source. |

Discrepancies found while reading:
- The brief describes source 2 as citing UK and Irish regulations and CSCS cards. As read, source 2 names no statute and does not mention CSCS; the CSCS and the stabiliser and tie-off heights are in source 3. The sources are recorded as read.
- Trigger heights disagree: source 2 uses 2 m, source 4 uses 1.8 m, and source 3 gives no single trigger. None is used as an Australian figure.

## Coverage

| Topic (brief) | Lesson | courseSlugs | Layer | Type | Existing overlap and action |
|---|---|---|---|---|---|
| Hazards and falls | WAH-01 | all 9 | high-risk | K | Cross-referenced F14-L04, RAS-05, high-access-window-cleaning-L02. Not duplicated. |
| Hierarchy of controls | WAH-02 | all 9 | group | K | Cross-referenced RAS-03. Victorian ranking used; national wording UNCONFIRMED. |
| Fall protection and arrest | WAH-03 | all 9 | high-risk | K | Cross-referenced high-access-window-cleaning-L08 (rope access). Rope access not taught. |
| Harness and lanyard inspection | WAH-04 | all 9 | high-risk | RH | No existing lesson. Cross-referenced RAS-16. |
| Ladder selection and use | WAH-05 | all 9 | high-risk | RH | Cross-referenced RAS-06, CL2-03 (interior ladders), handyman-work-L05. Exterior and set-up content only. |
| Scaffold and mobile tower checks | WAH-06 | all 9 | high-risk | K | No existing scaffold lesson. Cross-referenced RAS-06. NSW licensing position from the matrix. |
| MEWP pre-use checks | WAH-07 | all 9 | high-risk | RH | **Partial overlap** with high-access-window-cleaning-L09 (its pre-use and licence content). WAH-07 holds the walk-round; L09 keeps the licence matrix and pricing. Recommend merging at review. |
| Roof and fragile surfaces | WAH-08 | roof, solar, window, pressure, handyman, painting, deck, postcon | high-risk | K | **Partial overlap** with roof-cleaning-soft-washing-L03 (fragile surfaces) and L05 (electrical). Cross-referenced; WAH-08 keeps general roof work hazards only. Plastering excluded. |
| Edge protection and openings | WAH-09 | all 9 | high-risk | K | Cross-referenced window-L04 (falling objects) and roof-L03. |
| Suspension trauma and rescue | WAH-10 | all 9 | high-risk | RH | **Partial overlap** with high-access-window-cleaning-L10 (emergency and rescue). Cross-referenced; WAH-10 covers suspension trauma and the plan. Also S14-L04 and S14-L05 cross-referenced. |
| Work-at-height risk assessment | WAH-11 | all 9 | group | K | Cross-referenced RAS-01, RAS-02, RAS-03, RAS-16, RAS-17. |
| Permit template | WAH-TPL-01 | all 9 | group | K (template) | Four editable templates, 29 fields, one output document, rubric. Matches the sections of the source form. |

Duplicates skipped: no lesson was written where a RAS-, S12-, S14- or window lesson already covers the same content. Overlaps are cross-referenced and listed above.

Layer decision: high-risk for lessons on falls, fall protection, rescue, ladders, scaffolds, platforms and roofs; group for the hierarchy, risk assessment and the template.

## Decisions (for review)

1. **courseSlugs:** all nine canonical slugs (window, pressure, roof, solar, handyman, painting, plastering, deck, postcon) are used for every lesson except WAH-08 (plastering removed). Roofs and fragile surfaces do not apply to plastering.
2. **moduleTitle:** "Shared: Workplace safety and risk" is used for all lessons. It exists in all nine courses. The "Group (Exterior, height & access)" module exists only in window, pressure, roof and solar, so using it would leave handyman, painting, plastering, deck and postcon without the lessons. Flagged for review.
3. **Knowledge-check pass rule:** the brief sets "80% on knowledge checks". With three checks, 80% means all three must be correct (two of three is 67%). Kept as briefed; worth reviewing.
4. **Template:** four editable templates map to the form's sections. Permit title renamed so the form's title is not copied.
5. **Source 4:** not an official guide and not Australian. Used for control content only, with figures removed.

## Figures removed under the coordinator's instruction

US, imperial and foreign figures are removed from the lessons. Each control is kept and stated as a principle, marked UNCONFIRMED for Australia where a source gives the number. Examples: 1.8 m, 2 m, six feet, 39–45 inches, 100 kg, 70 kg, 300 mm, 30 feet, 5000 lb, 22.5 kN, 40-degree swing, 5 and 15 minutes for suspension, lightning distances, the 4:1 ladder ratio, the one-metre landing extension, the thirty-minute ladder limit, the stabiliser and tie-off heights, the seven-day and six-month intervals, five- and ten-year equipment lives. Source 2 and 3 figures for trigger heights and tower heights are removed too.

Australian figures are kept only where they come from a checked source: the NSW 2 m SWMS rule, the NSW 4 m scaffold licence rule (NSW-17), and the boom-type platform 11 m licence thresholds (NSW-16, QLD-11, WA-18, TAS-20, ACT-22, NT-20). Scenario distances in worked examples are illustrative only.

## Australian points: confirmed and unconfirmed

**Confirmed (project licence matrix, checked 2026-11-02, with URLs in each lesson's sourceReferences):**
- Boom-type platform high risk work licence: VIC-21; NSW-16 (11 m or more); QLD-11 (under 11 m excluded); WA-18, TAS-20, ACT-22, NT-20 (11 m or more).
- Scissor lifts: no licence in Victoria (VIC-22) or the NT (NT-21).
- NSW-17: SWMS for construction work where a fall could exceed 2 m; only licensed scaffolders where the fall risk exceeds 4 m.
- South Australia SA-24: partial.

**Read from the Safe Work Australia and WorkSafe Victoria pages (checked 2026-11-02):**
- The model falls code: title and model status only. Its hierarchy and height threshold were not read in full (PDF blocked to the checker).
- WorkSafe Victoria hierarchy page: eliminate, then substitute, isolate or engineer, then administrative, then PPE.
- WorkSafe Victoria scaffolding page: practical advice, not stated as mandatory.

**UNCONFIRMED:**
- National and state wording of the hierarchy of control; the national falls code's hierarchy and height threshold.
- All fall, guardrail, edge, net, opening, ladder, scaffold, tower, MEWP and harness figures in the sources (now removed from the lessons, see above).
- Inspection intervals (daily, weekly, periodic, six-monthly) for ladders, scaffolds, MEWPs and harnesses.
- Harness and lanyard life; anchor loads; swing limits; lifeline limits.
- Suspension trauma time figures and rescue training requirements.
- Scaffold erection licences outside NSW; scissor-lift licence status in WA, TAS and ACT (WA-19, TAS-21, ACT-23 UNCONFIRMED); general ladder and platform licences (VIC-23, WA-20, TAS-22, ACT-24, NT-22).
- Chemical soft washing at height licence (TAS-11).
- AS 1892 series (ladders), AS 4576 and AS/NZS 1576 (scaffolding), AS/NZS 1891.4 (fall arrest; rope access requirement). Listings seen, text not read.
- NSW roof code (May 2026): part read only; application to service work UNCONFIRMED.
- Overhead line clearances and line-contact procedure for platforms.
- Lightning thresholds.

## Copy check

The overlap script was copied to `/home/claude/work/wah/overlap.py`. It was run against each of the four sources in turn, with its glob set to `shared/safety/WAH-*.json` and `assessments/WAH-*.assessment.json`. Each run was repeated until it returned zero 4-word overlaps:
- Source 1 (checklist): 0
- Source 2 (training deck): 0
- Source 3 (Irish course deck): 0
- Source 4 (project procedure): 0

Rewording was applied by `/home/claude/work/wah/postfix.py`, which also writes `WAH-LIST.csv`. Build scripts are in `/home/claude/work/wah/`.

All 24 WAH JSON files validate with `python3 -I`. No `correctIndex` appears in any learner file. The template has no answer key.

## Open items

- Confirm the national falls code text (blocked to the checker), and the Australian standards named above.
- Decide whether handyman, painting, plastering, deck and postcon should get a group module for height work.
- Decide whether WAH-07 and WAH-10 should merge with the window lessons L09 and L10.
- Check the NSW roof code before WAH-08 is relied on for service work.
- Source 4 is a Malaysian project procedure; confirm the business is comfortable using its control content as a base.
