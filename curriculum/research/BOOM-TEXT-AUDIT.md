# Boom text audit: learner-visible fields

Checked 2026-11-03. Report only: no lesson file was edited, nothing was committed. Scope: the learner-visible fields (instruction, procedure, workedExamples, commonErrors, safetyAndRegulatory, summary, knowledgeChecks text and options) of every JSON lesson under `curriculum/courses/` and `curriculum/shared/` (936 files, 45,402 learner strings). Reference record for states: `curriculum/research/BOOM-OTHER-STATES.md` and `curriculum/research/trades/LICENCE-MATRIX.csv`.

Method: every string was searched for an 11 m / 11 metre / 11-metre figure and for boom, elevating work platform, scissor and WP wording. Figures were then grouped by sentence and by state name. Sentence-level grouping shows that most hits are one identical shared paragraph repeated across lessons.

## Counts by type

| Check | Type | Points | Files | Status |
|---|---|---|---|---|
| 1 | Boom figure stated more than once in one point (all) | 96 | 93 | Hit; most are a per-state repeat in one shared paragraph |
|   | of which: 74 identical "Licence and height notice" points, each stating the 11 m figure 7 times | 74 | 74 | Hit |
|   | of which: a sentence in the point contains two figure mentions (e.g. "the boom length is 11 metres: a boom-type platform of 11 metres or more") | 85 | 84 | Hit (sentence-level double) |
| 2 | Doubled full stop in boom text | 0 | 0 | No hit (none in the whole learner corpus) |
| 2 | Sentence ending mid-thought or broken, boom text | 2 | 2 | Hit |
| 2 | Broken sentence, non-boom text, in a boom-edited point | 1 | 1 | Hit (noted, not a boom figure) |
| 3 | Figure attributed to NSW; research matrix NSW-16 records no length | 105 | 98 | Conflict: one specific attribution to the NSW page is a hit (see 3.1) |
| 3 | Figure attributed to Tasmania; no Tasmania record in research files | 88 | 87 | Unverified against repo research |
| 3 | Figure attached to scissor lifts (knowledge-check distractor) | 1 | 1 | Hit (low) |
| 4 | 11 m in a sentence about SA or the ACT | 2 | 2 | Hit (ACT only; no SA hit) |

The checks overlap: one point can appear under more than one check (for example, the L09 and pressure-cleaning L11 and L12 points). The 74 identical boilerplate points are one paragraph repeated, so the distinct problems are far fewer than the point counts.

## Decisions made in this audit

1. Check 1 counts every point with two or more figure mentions. Repeats across states are not automatically errors. They are listed so the owner can decide.
2. NSW is judged against `LICENCE-MATRIX.csv` row NSW-16 (page dated 15 June 2026, "Licence required to operate", no length stated). Not checked online. The 11 m NSW statement is therefore a conflict with the repo record, not a confirmed error.
3. Tasmania has no row in the matrix and no entry in BOOM-OTHER-STATES.md. Its 11 m statements are reported as unverified, not as wrong.
4. Check 4 counts only SA and the ACT, because BOOM-OTHER-STATES.md records them as not confirmed. Victoria, NSW and Tasmania are not counted there.
5. Knowledge-check options are learner-visible. A wrong option that carries a figure is still reported, marked as a distractor.
6. Options and list items with no final full stop are not counted as truncated, since that is the house style for options. Only prose sentences were tested for mid-thought endings.

## Hits: check 1, figure repeated in one point

### 1.1 Identical "Licence and height notice" point (74 files)

Path in every file: `safetyAndRegulatory[0].point`. The 11 m figure appears 7 times in this one point. Exact text, same in every file:

> Licence and height notice: This lesson does not grant the right to work at height, on roofs, from elevated work platforms, or on solar systems. Completing it is not a licence, certificate or authority for regulated work. Boom-type elevating work platforms need a high risk work licence in Victoria, and in New South Wales, Queensland, Tasmania, the Northern Territory and Western Australia where the boom is 11 metres or more. The WorkSafe WA page (last updated 13 August 2026) and the NT WorkSafe bulletin (no date shown) both state the 11-metre threshold. Check whether this work needs a high-risk work licence with the state regulator before you start. Queensland's definition does not cover platforms under 11 metres (WorkSafe Queensland page, no date shown). Tasmania's WP licence applies where the boom length is 11 metres or more, and no licence is needed for a boom under 11 metres (WorkSafe Tasmania page, last updated 1 December 2023). In New South Wales and Queensland the boom length is 11 metres: a boom-type platform of 11 metres or more needs the licence, and a shorter boom may not need it in those states. Victoria's WP class has no boom-length threshold, so the licence is not limited by length there. This lesson does not grant a licence. Scissor lifts need no high risk work licence in Victoria or the Northern Territory. No licence has been confirmed for window, pressure, roof soft washing or solar panel cleaning as such: not yet confirmed in every state and territory checked. Check the licence rules for your state or territory and obtain your employer's written authorisation before any work above ground level.

Problem: the figure is repeated for each state in one paragraph, and the sentence "In New South Wales and Queensland the boom length is 11 metres: a boom-type platform of 11 metres or more needs the licence, ..." repeats it inside one sentence. Also the NSW and TAS parts are unverified (see check 3).

Files:

- `shared/chemicals/C05-L01.json`
- `shared/chemicals/C05-L02.json`
- `shared/chemicals/F03-L01.json`
- `shared/chemicals/F03-L02.json`
- `shared/chemicals/F03-L03.json`
- `shared/chemicals/F03-L04.json`
- `shared/chemicals/F05-L02.json`
- `shared/chemicals/F08-L03.json`
- `shared/chemicals/F16-L01.json`
- `shared/chemicals/F16-L03.json`
- `shared/customer/F01-L02.json`
- `shared/customer/F14-L01.json`
- `shared/customer/F14-L05.json`
- `shared/customer/F15-L05.json`
- `shared/equipment/C05-L03.json`
- `shared/equipment/F04-L01.json`
- `shared/equipment/F04-L02.json`
- `shared/equipment/F04-L03.json`
- `shared/equipment/F04-L04.json`
- `shared/equipment/F08-L04.json`
- `shared/equipment/F10-L04.json`
- `shared/equipment/F17-L01.json`
- `shared/exterior/roof-cleaning-soft-washing-L09.json`
- `shared/induction/C01-L01.json`
- `shared/induction/C01-L02.json`
- `shared/induction/C01-L03.json`
- `shared/induction/F01-L01.json`
- `shared/induction/F01-L03.json`
- `shared/induction/F10-L01.json`
- `shared/induction/F15-L01.json`
- `shared/induction/F15-L02.json`
- `shared/induction/F15-L04.json`
- `shared/job-management/C02-L01.json`
- `shared/job-management/C02-L02.json`
- `shared/job-management/C02-L03.json`
- `shared/job-management/F01-L04.json`
- `shared/job-management/F05-L01.json`
- `shared/job-management/F05-L03.json`
- `shared/job-management/F19-L01.json`
- `shared/job-management/F19-L05.json`
- `shared/operations/F10-L02.json`
- `shared/quality/C09-L01.json`
- `shared/quality/C09-L02.json`
- `shared/quality/C09-L03.json`
- `shared/quality/F09-L01.json`
- `shared/quality/F09-L02.json`
- `shared/quality/F09-L03.json`
- `shared/quality/F09-L04.json`
- `shared/quality/F09-L05.json`
- `shared/quality/F10-L05.json`
- `shared/quality/F19-L06.json`
- `shared/quality/S12-L03.json`
- `shared/quality/S12-L08.json`
- `shared/safety/C10-L01.json`
- `shared/safety/C10-L02.json`
- `shared/safety/C10-L03.json`
- `shared/safety/F02-L01.json`
- `shared/safety/F02-L02.json`
- `shared/safety/F02-L03.json`
- `shared/safety/F02-L04.json`
- `shared/safety/F08-L01.json`
- `shared/safety/F08-L02.json`
- `shared/safety/F08-L05.json`
- `shared/safety/F14-L02.json`
- `shared/safety/F14-L04.json`
- `shared/safety/F15-L03.json`
- `shared/safety/F15-L06.json`
- `shared/safety/F17-L04.json`
- `shared/safety/F17-L05.json`
- `shared/safety/S14-L03.json`
- `shared/safety/S14-L04.json`
- `shared/safety/S14-L05.json`
- `shared/safety/S14-L07.json`
- `shared/safety/S14-L08.json`

### 1.2 Other points with two or more figures

| File | Path | Figures | Figure sentences (exact) |
|---|---|---|---|
| `courses/handyman/handyman-work-L05.json` | `instruction[2].body` | 3 | In New South Wales, the WP licence applies at a boom length of at least 11 metres, measured by the longer of two distances (SafeWork NSW licence page). / In Queensland, the WP licence covers boom-type platforms of 11 metres or more, and platforms under 11 metres fall outside that definition, so a shorter boom may not need the licence there (WorkSafe Queensland page, no date shown). |
| `courses/handyman/handyman-work-L05.json` | `safetyAndRegulatory[2].point` | 2 | Queensland: the WP licence covers boom-type platforms of 11 metres or more, and platforms under 11 metres fall outside that definition, so a shorter boom may not need the licence there (WorkSafe Queensland page, no date shown). |
| `courses/handyman/property-maintenance-L03.json` | `safetyAndRegulatory[1].point` | 2 | Do not operate a boom-type elevating work platform without the WP licence where it applies: in Victoria (WorkSafe Victoria page, reviewed 30 June 2026, which lists the WP class with no length threshold); at a boom length of at least 11 metres in New South Wales (SafeWork NSW licence page), so a shorter boom may not need that licence there; and for Queensland platforms that are not under 11 metres (WorkSafe Queensland page, no date shown). |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` | `instruction[3].body` | 2 | In New South Wales, Queensland, Western Australia, Tasmania and the Northern Territory, a boom-type elevating work platform needs a WP high risk work licence where the boom is 11 metres or more. / Queensland's definition leaves out platforms below that length (WorkSafe Queensland page, no date shown), and Tasmania does not require a licence for a boom under 11 metres (WorkSafe Tasmania page, last updated 1 December 2023). |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L11.json` | `safetyAndRegulatory[0].point` | 2 | In New South Wales and Queensland, a boom-type elevating work platform needs a WP high risk work licence where its boom is 11 metres or more, so a shorter boom may not need it in those states. / The Queensland page states that platforms under 11 metres in length are not included in its definition. |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L12.json` | `safetyAndRegulatory[0].point` | 2 | In New South Wales and Queensland, a boom-type elevating work platform needs a WP high risk work licence where its boom is 11 metres or more, so a shorter boom may not need it in those states. / The Queensland page states that platforms under 11 metres are not included in its definition. |
| `courses/window-cleaning-all-heights/C15-L01.json` | `safetyAndRegulatory[2].point` | 2 | Where a boom-type platform is used, a WP licence applies at a boom length of 11 metres or more in New South Wales, and a shorter boom may not need it there. / In Queensland, platforms under 11 metres are not included in the WP licence definition. |
| `courses/window-cleaning-all-heights/C15-L05.json` | `safetyAndRegulatory[2].point` | 2 | A boom-type platform needs a WP licence at a boom length of 11 metres or more in New South Wales, and a shorter boom may not need it there. / In Queensland, platforms under 11 metres are not included in the WP licence definition. |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L01.json` | `safetyAndRegulatory[2].point` | 3 | In New South Wales and Queensland, a boom-type elevating work platform needs a WP high risk work licence where its boom is 11 metres or more, so a shorter boom may not need it in those states. / The Queensland page places platforms shorter than 11 metres outside its definition (no date shown). / The national model code uses the same 11-metre threshold, measured from the original design, and requires no licence for shorter booms, although the operator must still be trained (model code, December 2025). |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L03.json` | `instruction[7].body` | 3 | For a boom-type elevating work platform, the WP licence applies to a boom of 11 metres or more in New South Wales, Western Australia, Tasmania and the Northern Territory. / The Queensland definition places platforms shorter than 11 metres outside its scope. / The national model code uses the same 11-metre threshold, measured from the original design, and expects operators of shorter booms to be trained. |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L09.json` | `instruction[1].body` | 2 | In New South Wales and Queensland, a boom-type elevating work platform needs a WP high risk work licence where the boom is 11 metres or more, and a shorter boom may not need it in those states. / Queensland excludes platforms shorter than 11 metres (no date shown). |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L09.json` | `safetyAndRegulatory[0].point` | 2 | Boom-type elevating work platform: a WP licence applies where the boom is 11 metres or more in New South Wales, and a shorter boom may not need it there. / Queensland's page excludes platforms shorter than 11 metres (no date shown), and Victoria's WP class page gives no boom length (reviewed 30 June 2026). |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L09.json` | `summary[1]` | 2 | Official pages checked put boom-type platform licences at 11 metres or more in New South Wales, place platforms shorter than 11 metres outside the Queensland definition, and give the WP class without a boom length in Victoria. |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L11.json` | `instruction[8].body` | 3 | A boom-type elevating work platform needs a WP high risk work licence where its boom is 11 metres or more in New South Wales, Western Australia, Tasmania and the Northern Territory. / In Queensland, a shorter boom may not need it, because the Queensland definition does not cover platforms shorter than 11 metres. / The national model code uses the 11-metre threshold, measured from the original design. |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L12.json` | `instruction[8].body` | 3 | A boom-type elevating work platform needs a WP high risk work licence where its boom is 11 metres or more in New South Wales, Western Australia, Tasmania and the Northern Territory. / In Queensland, a shorter boom may not need it, because the Queensland definition does not cover platforms shorter than 11 metres. / The national model code uses the 11-metre threshold, measured from the original design. |
| `shared/cleaning/construction-site-cleaning-L02.json` | `safetyAndRegulatory[0].point` | 2 | Boom-type platform threshold: in New South Wales and Queensland, a boom-type elevating work platform needs a high risk work licence where the boom is 11 metres or more; platforms under 11 metres are not covered in those states. |
| `shared/exterior/high-access-window-cleaning-L02.json` | `safetyAndRegulatory[0].point` | 5 | Boom-type elevating work platforms need a high risk work licence in Victoria, and in New South Wales, Queensland, Tasmania, the Northern Territory and Western Australia where the boom is 11 metres or more. / The WorkSafe WA page (last updated 13 August 2026) and the NT WorkSafe bulletin (no date shown) both state the 11-metre threshold. / In New South Wales and Queensland the boom length is 11 metres: a boom-type platform of 11 metres or more needs the licence, and a shorter boom may not need it in those states. / Tasmania's WP licence applies where the boom length is 11 metres or more, and no licence is needed below that (WorkSafe Tasmania page, last updated 1 December 2023). |
| `shared/exterior/high-access-window-cleaning-L04.json` | `safetyAndRegulatory[0].point` | 5 | Boom-type elevating work platforms need a high risk work licence in Victoria, and in New South Wales, Queensland, Tasmania, the Northern Territory and Western Australia where the boom is 11 metres or more. / The WorkSafe WA page (last updated 13 August 2026) and the NT WorkSafe bulletin (no date shown) both state the 11-metre threshold. / In New South Wales and Queensland the boom length is 11 metres: a boom-type platform of 11 metres or more needs the licence, and a shorter boom may not need it in those states. / Tasmania's WP licence applies where the boom length is 11 metres or more, and no licence is needed below that (WorkSafe Tasmania page, last updated 1 December 2023). |
| `shared/exterior/high-access-window-cleaning-L05.json` | `safetyAndRegulatory[0].point` | 5 | Boom-type elevating work platforms need a high risk work licence in Victoria, and in New South Wales, Queensland, Tasmania, the Northern Territory and Western Australia where the boom is 11 metres or more. / The WorkSafe WA page (last updated 13 August 2026) and the NT WorkSafe bulletin (no date shown) both state the 11-metre threshold. / In New South Wales and Queensland the boom length is 11 metres: a boom-type platform of 11 metres or more needs the licence, and a shorter boom may not need it in those states. / Tasmania's WP licence applies where the boom length is 11 metres or more, and no licence is needed below that (WorkSafe Tasmania page, last updated 1 December 2023). |
| `shared/exterior/high-access-window-cleaning-L10.json` | `safetyAndRegulatory[0].point` | 5 | Boom-type elevating work platforms need a high risk work licence in Victoria, and in New South Wales, Queensland, Tasmania, the Northern Territory and Western Australia where the boom is 11 metres or more. / The WorkSafe WA page (last updated 13 August 2026) and the NT WorkSafe bulletin (no date shown) both state the 11-metre threshold. / In New South Wales and Queensland the boom length is 11 metres: a boom-type platform of 11 metres or more needs the licence, and a shorter boom may not need it in those states. / Tasmania's WP licence applies where the boom length is 11 metres or more, and no licence is needed below that (WorkSafe Tasmania page, last updated 1 December 2023). |
| `shared/safety/WAH-05.json` | `safetyAndRegulatory[4].point` | 2 | In New South Wales and Queensland the boom length is 11 metres: a boom of 11 metres or more needs the licence, and a shorter boom may not need it in those states. |
| `shared/safety/WAH-07.json` | `safetyAndRegulatory[2].point` | 4 | Licence notice: a high risk work licence is required to operate boom-type platforms in Victoria, where the WP class has no boom-length threshold; in New South Wales where the boom is 11 metres or more; in Queensland, where platforms under 11 metres are excluded, so a shorter boom may not need it; in Tasmania where the boom is 11 metres or more (WorkSafe Tasmania page, last updated 1 December 2023); and in Western Australia and the Northern Territory where the boom is 11 metres or more. |

## Hits: check 2, broken or mid-thought text

Doubled full stops: none in boom text and none in any learner string.

| File | Path | Exact text | Problem |
|---|---|---|---|
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` | `instruction[3].body` | "Licences for window, pressure, roof soft washing and solar panel cleaning were not confirmed, so they have not yet been confirmed and check with the relevant regulator before relying on this point." | Mid-thought: "have not yet been confirmed and check" joins a passive and an imperative with no link. Should read "so check with the relevant regulator". |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L03.json` | `instruction[7].body` | "That does not prove that no such licence exists, so the position has not yet been confirmed and check with the relevant regulator before relying on this point." | Same broken join: "has not yet been confirmed and check". |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` | `safetyAndRegulatory[2].point` | "The New South Wales definition is set out in, and the Victorian PV rules have not yet been confirmed, so check with the relevant regulator before relying on this point." | Not a boom figure. "set out in," has no object, so the sentence is cut off. |

Other observation (not counted): the phrase "has not yet been confirmed and check" appears in 93 strings across 72 files corpus-wide. Only the two boom lines above are in boom text.

## Hits: check 3, state attached to a figure

### 3.1 NSW page attributed with an 11 m threshold

Record: `LICENCE-MATRIX.csv` row NSW-16 says the NSW WP licence is "Licence required to operate", with trigger "Not stated on page". BOOM-OTHER-STATES.md does not cover NSW.

| File | Path | Exact text | Problem |
|---|---|---|---|
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L09.json` | `workedExamples[0].reasoning` | "The NSW page (dated 15 June 2026) says a WP licence is needed where the boom is 11 metres or more." | Attributes an 11 m threshold to a named page that the matrix records as stating no length. |
| `courses/window-cleaning-all-heights/high-access-window-cleaning-L09.json` | `summary[1]` | "Official pages checked put boom-type platform licences at 11 metres or more in New South Wales, ..." | Same conflict, in the summary. |

Systemic: NSW is named next to the 11 m figure in 105 points across 98 files, mostly in the shared "Licence and height notice" paragraph ("In New South Wales and Queensland the boom length is 11 metres: ..."). These are reported as one conflict with the repo record, not as individual errors.

### 3.2 Tasmania with an 11 m threshold, no record

88 points across 87 files. Example text (shared paragraph): "Tasmania's WP licence applies where the boom length is 11 metres or more, and no licence is needed for a boom under 11 metres (WorkSafe Tasmania page, last updated 1 December 2023)." Neither BOOM-OTHER-STATES.md nor LICENCE-MATRIX.csv records a Tasmanian threshold, so this cannot be checked from the repo.

### 3.3 Scissor lift attached to 11 m (knowledge-check distractor)

| File | Path | Exact text | Problem |
|---|---|---|---|
| `courses/handyman/handyman-work-L05.json` | `knowledgeChecks[1].options[1]` | "Scissor lifts need the licence only over 11 metres" | Wrong option (a distractor for the Victoria question). It attaches an 11 m figure to scissor lifts, which the lesson elsewhere says need no WP licence in Victoria. Check that this is intentionally wrong. |

## Hits: check 4, 11 m in a sentence about SA or the ACT

| File | Path | Exact text | Problem |
|---|---|---|---|
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L11.json` | `safetyAndRegulatory[0].point` | "The NSW page, the WA page, the Tasmanian page, the ACT page and the NT bulletin each state that threshold." (the threshold is the 11 m figure in the sentence before) | The ACT page is said to state the 11 m threshold. BOOM-OTHER-STATES.md records the ACT threshold as not confirmed and removed. |
| `courses/pressure-cleaning-all-heights/pressure-cleaning-L12.json` | `safetyAndRegulatory[0].point` | Same sentence as above. | Same problem. |

SA: no sentence attaches an 11 m figure to South Australia. One point (`courses/pressure-cleaning-all-heights/pressure-cleaning-L01.json` `instruction[3].body`) contains both an SA mention and an 11 m figure, but in separate sentences; the SA sentence is about a 3 m to 2 m fall height.

## Other observations (not counted)

- `courses/handyman/handyman-work-L05.json` `instruction[2].body` says the NSW threshold is "measured by the longer of two distances". No repo record supports that detail.
- SA fall-height text (3 m to 2 m from 1 July 2026) appears in several boom-edited lessons. It is not a boom figure and was not checked for accuracy.
- LICENCE-MATRIX.csv row ACT-22 is still CONFIRMED (flagged in BOOM-OTHER-STATES.md); not changed here.

