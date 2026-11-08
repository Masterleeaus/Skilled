# Stale source notes applied

Applied 2026-11-03. Source of the replacement text: `curriculum/research/STALE-SOURCE-NOTES.md`, STALE rows 274, 567, 574, 581, 588 and 1076. Scope: `sourceReferences` only. No learner-visible text, `officialReferences`, licence file or matrix CSV was edited. Nothing was committed.

## Counts

- STALE rows applied: 6
- Files edited: 6 (one field each)
- Learner-visible text changed: none

## Changes

| # | File | Field | Old text (short) | New text (short) |
|---|---|---|---|---|
| 1 | curriculum/shared/exterior/high-access-window-cleaning-L02.json | sourceReferences[22] | "PARTIAL: boom-type platform thresholds ... were not re-verified in the figures pass; numeric thresholds are removed from the licence text." | Thresholds by state now recorded: VIC-21 no boom-length threshold; NSW-16, WA-18, TAS-20, NT-20 at 11 metres or more; QLD-11 excludes platforms under 11 metres; ACT-22 not confirmed, no ACT threshold stated. Matrix rows read 2026-11-02 and 2026-11-03. |
| 2 | curriculum/shared/exterior/high-access-window-cleaning-L04.json | sourceReferences[22] | Same as row 1. | Same as row 1. |
| 3 | curriculum/shared/exterior/high-access-window-cleaning-L05.json | sourceReferences[22] | Same as row 1. | Same as row 1. |
| 4 | curriculum/shared/exterior/high-access-window-cleaning-L10.json | sourceReferences[22] | Same as row 1. | Same as row 1. |
| 5 | curriculum/shared/safety/WAH-07.json | sourceReferences[13] | "PARTIAL: state boom-type platform thresholds ... were not re-verified ...; numeric thresholds removed from the licence text." | Same thresholds text as row 1, without the "Check each state regulator" sentence, which this field did not carry. |
| 6 | curriculum/courses/roof-soft-washing/roof-cleaning-soft-washing-L03.json | sourceReferences[7] | "Earlier draft licence rows ... not re-checked in this session and removed from this lesson; licence status UNCONFIRMED." | Thresholds removed from this lesson; NSW, QLD, WA, TAS and NT matrix rows read 2026-11-02 and 2026-11-03; ACT row not confirmed, so no ACT threshold stated; licence status UNCONFIRMED where the matrix says so. |

Full new text for rows 1 to 5 (the exterior and WAH-07 field), with the "Check each state regulator" sentence present only in rows 1 to 4:

"PARTIAL: boom-type platform thresholds by state. VIC-21 confirmed (no boom-length threshold). NSW-16, WA-18, TAS-20 and NT-20 confirmed from the official pages: boom length 11 metres or more. QLD-11 confirmed: platforms under 11 metres are excluded. ACT-22 not confirmed: the Access Canberra page could not be read, so no ACT threshold is stated. Check each state regulator. Source: figures register; matrix rows read 2026-11-02 and 2026-11-03."

## Checks

- Each threshold stated in the new text appears in the current learner text of that lesson: the exterior lessons' `safetyAndRegulatory[0].point` and WAH-07's `safetyAndRegulatory[2].point` (11 metres for NSW, QLD, TAS, WA, NT; no threshold for VIC; no ACT figure).
- The roof soft-washing lesson's learner text has no boom threshold, so the new note gives no figure.
- All six edited files parse as JSON.
- `python3 -I /home/claude/work/check.py` ran with exit code 0. Result: 932 lessons scanned, 1 problem, all in check 4 (`4_no_internal_codes_in_learner_text`): `courses/deck-and-fence-maintenance/NEW-DEK-01.json`, path `/instruction[2]/body`, a citation marker in learner-visible text. This problem was already in the earlier run (`/home/claude/work/before-check.json`). It is outside the six rows and is learner-visible text, so it was not touched. None of the six edits added a problem.

## Decisions (decided without asking)

1. The replacement text was taken from the STALE table in `STALE-SOURCE-NOTES.md`. The table's cell was cut off at "Check each sta…", so the ending "Check each state regulator" was taken from the existing field text.
2. For WAH-07 the same threshold text was used, minus the "Check each state regulator" sentence. The field did not carry that sentence before.
3. The ACT statement follows the report: ACT not confirmed, no ACT figure stated.

## Items for the owner (not changed here)

- `curriculum/research/trades/LICENCE-MATRIX-TAS-ACT-NT.csv` row ACT-22 still reads CONFIRMED (checked 2026-11-02). `curriculum/research/BOOM-OTHER-STATES.md` says the Access Canberra page was not read. The row needs a source or a status change. It was outside this task's scope.
