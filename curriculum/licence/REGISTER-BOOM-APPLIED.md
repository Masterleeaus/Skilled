# Boom-length register apply (2026-11-03)

Source: `curriculum/licence/REGISTER-SYNC-PROPOSAL.md`, section A (boom-length group, 87 rows). Register: `curriculum/licence/lesson-licence.json`. Learner text read from the 87 lesson files under `curriculum/courses/` and `curriculum/shared/`. Lesson files, other register entries and git state were not changed, and nothing was committed.

## Counts

| item | count |
|---|---|
| Entries changed: not_checked to threshold | 80 |
| Entries changed: already threshold, states, limit and URLs updated | 6 |
| Entries added (WAH-07, no prior entry) | 1 |
| Rows skipped entirely | 0 |
| Lessons whose text states TAS but TAS is not set (see decision 2) | 83 |
| Register entries before and after | 445 and 446 |

## Decisions (for review)

1. **Status.** Owner decision applied: every boom row now reads threshold. Each of the 87 lesson texts states an 11 m rule for at least one state (NSW, QLD, WA or NT).
2. **Tasmania not set.** Tasmania is stated in the text of 83 lessons, but it has no confirmed page in this pass (the proposal says the TAS page was not re-checked). Under the rule for ACT, SA and TAS, no TAS threshold is added. The TAS rule should be added once the WorkSafe Tasmania page is checked.
3. **States per lesson.** Five states (VIC, NSW, QLD, WA, NT) for 83 lessons. Three states (VIC, NSW, QLD) for `pressure-cleaning-L11`, `pressure-cleaning-L12`, `high-access-window-cleaning-L01` and `high-access-window-cleaning-L09`, because their text names only NSW and QLD for the 11 m rule. Each text was checked for this.
4. **Victoria.** Listed as a state with "no boom-length threshold" (proposal D2). It is not given a length value.
5. **Queensland in high-access-window-cleaning-L03, L11, L12.** Their text says the QLD definition places platforms under 11 m outside its scope. That is read as a QLD 11 m threshold.
6. **Pages.** WA and NT use the pages in the proposal (D3, R90 and R91). NSW, QLD and VIC use the pages already on existing register entries or cited in the lesson text. The proposal gives no URL for these states, so this is my choice. For new QLD entries I used the boom-type page the lessons cite (`.../cranes-and-hoists/boom-type-elevating-work-platform`). `pressure-cleaning-L01` keeps its existing QLD page. No state needed "not confirmed", because every state in a states list has a page.
7. **Limits rewritten.** `limit` now holds one fragment per state in the same order as `officialUrl`. The old limit on `high-access-window-cleaning-L02`, `-L04`, `-L05`, `-L10` included a scaffolding note ("Scaffolding classes apply to scaffold work ... more than 4 m"). That note is not in the boom rule and was removed from the limit. Restore it if the owner wants it kept.
8. **`high-access-window-cleaning-L09`.** The "Victoria not confirmed" state text is replaced by the VIC, NSW and QLD entries. The national Safe Work Australia page is kept as an extra URL with no state pair.
9. **Quotes.** Existing quotes are kept and aligned to their URLs. WA and NT quotes come from `curriculum/research/BOOM-OTHER-STATES.md`. The QLD boom-page quote is a WebFetch summary, not verbatim, as it was in the register.
10. **WAH-07.** Added with `scanFile: null` and `note: null`, because there is no scan file for it.
11. **Notes not edited.** 79 of the 87 entries still carry a REVIEW note from the scope pass that says the default was not_checked or gives the previous status. Those notes are now out of date. Changing them was not in the task.

## Table

| lessonId | old status | new status | states set | TAS (stated in text) |
|---|---|---|---|---|
| C01-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C01-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C01-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C02-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C02-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C02-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C05-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C05-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C05-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C09-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C09-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C09-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C10-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C10-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| C10-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F01-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F01-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F01-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F01-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F02-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F02-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F02-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F02-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F03-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F03-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F03-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F03-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F04-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F04-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F04-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F04-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F05-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F05-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F05-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F08-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F08-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F08-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F08-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F08-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F09-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F09-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F09-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F09-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F09-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F10-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F10-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F10-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F10-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F14-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F14-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F14-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F14-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F15-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F15-L02 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F15-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F15-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F15-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F15-L06 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F16-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F16-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F17-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F17-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F17-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F19-L01 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F19-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| F19-L06 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S12-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S12-L08 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S14-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S14-L04 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S14-L05 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S14-L07 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| S14-L08 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| WAH-07 | none (no entry) | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L01 | not_checked | threshold | VIC, NSW, QLD | not stated in text |
| high-access-window-cleaning-L02 | threshold | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L03 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L04 | threshold | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L05 | threshold | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L09 | threshold | threshold | VIC, NSW, QLD | not stated in text |
| high-access-window-cleaning-L10 | threshold | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L11 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| high-access-window-cleaning-L12 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| pressure-cleaning-L01 | threshold | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |
| pressure-cleaning-L11 | not_checked | threshold | VIC, NSW, QLD | not stated in text |
| pressure-cleaning-L12 | not_checked | threshold | VIC, NSW, QLD | not stated in text |
| roof-cleaning-soft-washing-L09 | not_checked | threshold | VIC, NSW, QLD, WA, NT | stated in text, not set |

## Rows not applied (outside this task's section)

- Victorian asbestos rows (proposal section B, 10 rows): not applied, per instruction.
- PV-only rows (proposal section C, 13 rows, including roof-cleaning L03 and L05 and handyman-work L06): not applied, per instruction. `roof-cleaning-soft-washing-L09` is in both groups; only its boom row was applied.
- Proposal U3, 11 boom-rule lessons outside the 87: not compared in the proposal and not applied. C15-L01, C15-L05, F11-L01, WAH-05, additional-specialist-services-L04, construction-site-cleaning-L02, handyman-work-L05, property-maintenance-L03, property-maintenance-L04, property-maintenance-L06, property-maintenance-L09.
- Proposal U1, U2 and U4 (PV testing wording, TAS boom rule check, stale notes): not applied. U2 is the TAS point in decision 2.
- ACT and SA: no boom-length sentence appears in these 87 lessons, so nothing was removed or added for them.
