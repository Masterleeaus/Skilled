# Boom-length claims for South Australia, Western Australia, the ACT and the Northern Territory

Checked 2026-11-03. Scope: lesson text in `courses/**` and `shared/**` that gave a boom-length, boom-type elevating work platform (WP) or elevating work platform licence rule for South Australia (SA), Western Australia (WA), the Australian Capital Territory (ACT) or the Northern Territory (NT). Licence status in `licence/lesson-licence.json` was not changed. No commit was made.

## Outcome per state

| State | Page used (official) | Page date shown | Outcome | Lessons changed |
|---|---|---|---|---|
| WA | WorkSafe WA, Boom-type elevating work platform high risk work licence class, https://worksafe.wa.gov.au/publications/boom-type-elevating-work-platform-high-risk-work-licence-class | Published 11 August 2026; last updated 13 August 2026 | CONFIRMED: a WP licence applies to "operating boom type elevating work platforms (EWPs) with a boom length of 11 metres or more". Figure kept, with the page as an officialReferences entry (R90) added where it was missing. | 87 lessons carry the WA figure; R90 added to 79, already present in 8 |
| NT | NT WorkSafe, Elevating work platform operation licence requirements (bulletin), https://worksafe.nt.gov.au/forms-and-resources/bulletins/elevating-work-platform-operation-licence-requirements | No date shown | CONFIRMED: the licence class covers "Boom-type elevating work platforms (boom length 11 metres or more)". Scissor lifts: "A high risk work licence is not required for the operation of scissor lifts", with a competence duty. The page does not mention measuring from original design; that point stays attributed to the national model code. Figure kept, R91 added where missing. | 87 lessons carry the NT figure; R91 added to 79, already present in 8 |
| SA | South Australian Government, High risk work licence, https://www.sa.gov.au/topics/business-and-trade/licensing/building-and-trades/high-risk-work-licence | Last updated 10 January 2024 | NOT CONFIRMED: the page lists five classes (forklift operation; rigging and dogging work; scaffolding work; crane and hoist operation; pressure equipment operation) and names no boom-type platform class or boom length. SA boom-length and SA scissor-lift statements removed; each place now carries the plain step. | 87 lessons (SA text removed in each) |
| ACT | Access Canberra, High risk work licences, https://www.accesscanberra.act.gov.au/business-and-work/high-risk-work-licences | Only a fee period is shown (1 July 2025 to 30 June 2026) | NOT CONFIRMED: the page could not be fetched in this session (the URL is not on the fetch allowlist; the linked application PDF also failed). The only ACT text read was an exemption instrument, NI2013-461 (legislation.act.gov.au, commenced 1 July 2013, certificate running to 30 June 2018), which is not current and was not used for learner text. ACT boom-length claims removed; ACT removed from the state lists in the licence sentences. | 85 lessons (ACT text removed) |

The plain step used where a claim was removed: "Check whether this work needs a high-risk work licence with the state regulator before you start."

## Lessons changed (87)

- `courses/pressure-cleaning-all-heights/`: pressure-cleaning-L01, pressure-cleaning-L11, pressure-cleaning-L12
- `courses/window-cleaning-all-heights/`: high-access-window-cleaning-L01, high-access-window-cleaning-L03, high-access-window-cleaning-L09, high-access-window-cleaning-L11, high-access-window-cleaning-L12
- `shared/chemicals/`: C05-L01, C05-L02, F03-L01, F03-L02, F03-L03, F03-L04, F05-L02, F08-L03, F16-L01, F16-L03
- `shared/customer/`: F01-L02, F14-L01, F14-L05, F15-L05
- `shared/equipment/`: C05-L03, F04-L01, F04-L02, F04-L03, F04-L04, F08-L04, F10-L04, F17-L01
- `shared/exterior/`: high-access-window-cleaning-L02, high-access-window-cleaning-L04, high-access-window-cleaning-L05, high-access-window-cleaning-L10, roof-cleaning-soft-washing-L09
- `shared/induction/`: C01-L01, C01-L02, C01-L03, F01-L01, F01-L03, F10-L01, F15-L01, F15-L02, F15-L04
- `shared/job-management/`: C02-L01, C02-L02, C02-L03, F01-L04, F05-L01, F05-L03, F19-L01, F19-L05
- `shared/operations/`: F10-L02
- `shared/quality/`: C09-L01, C09-L02, C09-L03, F09-L01, F09-L02, F09-L03, F09-L04, F09-L05, F10-L05, F19-L06, S12-L03, S12-L08
- `shared/safety/`: C10-L01, C10-L02, C10-L03, F02-L01, F02-L02, F02-L03, F02-L04, F08-L01, F08-L02, F08-L05, F14-L02, F14-L04, F15-L03, F15-L06, F17-L04, F17-L05, S14-L03, S14-L04, S14-L05, S14-L07, S14-L08, WAH-07

Lessons in `shared/` that carried only the shared licence paragraph and the research-matrix source lines were changed the same way: the boom-type licence sentence now names Victoria, New South Wales, Queensland, Tasmania, the Northern Territory and Western Australia (boom length stated for those where the threshold applies), the SA sentence became the plain step, the scissor-lift sentence keeps Victoria and the NT only, and the ACT-22 "CONFIRMED" source line was removed from `sourceReferences`.

## Decisions made without asking

1. ACT figure removed although the 2013 ACT exemption instrument shows an 11 metre WP class. The instrument is not current, and the current page could not be read today.
2. WA and NT entries added as R90 and R91 to the 79 lessons that did not already cite those pages. Both are recorded with the page date shown and checked 2026-11-03.
3. WAH-07 "Threshold lengths for Western Australia, the ACT and the Northern Territory have not yet been confirmed" replaced with the plain step, since WA and NT are now confirmed; ACT removed.
4. Source lines in `sourceReferences` that carried an unverified ACT or SA claim were removed (ACT-22 matrix row in 79 shared lessons and WAH-07; SA "UNCONFIRMED" items in the pressure lessons and window L03). Lines that only say the thresholds were not re-verified were left in place.

## Status and text that disagree (not changed, for the owner)

- `licence/lesson-licence.json` shows `not_checked` for the 78 shared lessons listed above, and for `high-access-window-cleaning-L01`, `-L03`, `-L11`, `-L12`, `pressure-cleaning-L11` and `-L12`. Their text now states a boom-length licence rule for WA and NT (and for NSW, QLD, TAS). Status and text disagree.
- `pressure-cleaning-L01` shows `threshold` with states NSW, QLD and VIC. Its text also states the WA, TAS and NT thresholds.
- `high-access-window-cleaning-L09` shows `threshold` with "National (Safe Work Australia guidance); Victoria not confirmed". Its text also states the NSW, QLD, WA, TAS and NT thresholds.
- `shared/safety/WAH-07.json` has no entry in `lesson-licence.json`.

## Left for the owner (outside this task)

- `curriculum/research/trades/LICENCE-MATRIX.csv` still has ACT-22 as CONFIRMED. The ACT page was not read today, so that row should be re-checked.
- `sourceReferences` notes that say boom thresholds "were not re-verified in the figures pass" remain in `shared/exterior/high-access-window-cleaning-L02`, `-L04`, `-L05`, `-L10` and in WAH-07. They are now partly out of date.
- `shared/safety/WAH-05.json` says general ladder or platform licence positions are not yet confirmed for WA, the ACT and the NT. This is not a boom-length claim, so it was not changed.
- Scissor-lift and window, pressure and roof licence statements in the lessons not in the list above were not reviewed.
- `check.py` gives one problem before and after these edits (NEW-DEK-01, internal code in learner text), so no new problems were added.
