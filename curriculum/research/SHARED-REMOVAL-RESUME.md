# Shared lessons: removal of unverified-claim wording (resume note)

Date: 2026-11-03. Scope: `curriculum/shared/**/*.json` (560 lesson files, `.assessment.json` excluded). `sourceReferences` and `officialReferences` were not edited. `curriculum/licence/*`, backend, frontend, and `PVB-02.json` were not touched. Nothing was committed.

## Method

- `research/UNCONFIRMED-REMOVAL-SHARED.md` did not exist, so the work started from a fresh scan of the literal phrases in the brief (unconfirmed, not yet confirmed, not confirmed, not checked, not re-checked, not re-verified), case-insensitive, skipping the two reference fields.
- Starting point: 745 hits in 354 files, 517 distinct sentences.
- Each distinct sentence was given one action: delete (status note or claim with an unconfirmed source), replace (plain step, or sourced claim with the marker removed), or keep (not a claim: a learner instruction or an operational state such as "the isolator is not confirmed").
- Edits were exact-string replacements in the raw file text, with a count check per string, so metadata formatting is unchanged. Backup before the live run: `/home/claude/work/shared-removal/backup-shared-20261103212702/`.

## Files checked

- 560 shared lesson files scanned for the literal phrases.
- 10 assessment keys linked to knowledge checks whose text changed.
- All 560 knowledge-check id sets compared with their assessment keys: 0 mismatches.
- `python3 -I /home/claude/work/check.py`: before 1 problem, after 1 problem, same item. It is `courses/deck-and-fence-maintenance/NEW-DEK-01.json` (`/instruction[2]/body`), outside this scope and a false positive on the `R5` zone name. No new problems.

## Finished

- 349 shared lesson files changed. About 690 sentence occurrences handled; 31 safety-point items removed where the whole point was a status note (all had `licenceNotice: false`); 1 summary item removed (`shared/validation/CPV-01.json`).
- Literal phrases left in learner text: 33 hits in 22 files. Each one is a KEEP case (learner instruction or operational state), listed below under decisions.
- Knowledge checks changed: 8 option or question texts in 8 lessons (`BPX-03`, `BPX-04`, `PBP-01`, `PBP-05`, `PTB-05`, `PTB-08`, `GCM-02`, `PCS-02`, `PCS-03`, `PSA-01`). Option counts and `correctIndex` values are unchanged.
- Assessment keys updated for those 10 lessons: rationale and practical/stop-work wording that quoted the removed marker.
- Half-applied edit check: no dangling punctuation, double spaces, duplicate list entries, or broken sentences introduced by the edits. One issue found and fixed: `shared/handyman/HBM-04.json` had "covered in the two lessons named above" after a rewrite; the two titles were restored from the backup.

## Changed now (this pass)

- `shared/**` (349 files, see above), 10 files in `curriculum/assessments/`, and `shared/handyman/HBM-04.json` (title restore).
- Working scripts (not deliverables): `/home/claude/work/shared-removal/map.txt` (sentence actions), `apply2.py`, `apply3.py`, `scan.py`, and reports `apply2-report-live.json`, `apply3-report.json`.

## Left

1. **Wider wording family, not in the brief's list.** About 844 learner-text hits in 344 files: "not yet been confirmed" (most), "has not been checked", "has not been confirmed", "unverified", "not verified". These carry the same status meaning, so they probably need the same treatment. The brief lists specific phrases only, so I did not expand scope. Decision needed from the owner before a second pass.
2. **Assessment keys with marker wording outside the 10 changed lessons.** About 125 assessment files still mention UNCONFIRMED or "not yet confirmed" in practical or stop-work criteria. Those keys point at a marker the lessons no longer carry. One lowercase line remains in `PCS-03.assessment.json` ("unconfirmed fields left blank"), which reads correctly.
3. **Pre-existing check item** `courses/deck-and-fence-maintenance/NEW-DEK-01.json` (outside scope).
4. **Courses** (`curriculum/courses/**`) still carry the markers; not part of this task.

## Decisions (for review)

1. Status-only sentences were deleted outright (for example "Not yet confirmed.", "Not checked in this pass.").
2. Unverified claims were removed, not reworded into softer claims. Example: "No licence has been confirmed for window, pressure, roof soft washing or solar panel cleaning" was deleted in about 78 places, so those lessons no longer state a licence position. Owner should check whether a licence-check step should replace it.
3. Safety steps left in place of claims were written as plain steps (for example "Follow the product label and safety data sheet for dilution, dwell time and PPE.").
4. Kept as non-claims (learner instructions or operational states): "do not admit fault you have not checked", "Giving an answer that you have not checked", "Do not run a pump while the water level is unconfirmed", "A pump is switched off at the wall but its isolator is not confirmed", "Overhead line checks are recorded, and the job stops where clearance is unconfirmed", "The disposal facility has not confirmed it will accept a particular stream", "Recognise when a lower-level control is being used because a higher level was not checked", and similar.
5. Kept a sourced date with the marker removed: "From 1 December 2026, the Workplace Exposure Standards list is due to be replaced..." (cites WorkSafe Victoria, date checked 2026-11-02). Flagged because the original text marked it "not yet confirmed".
6. Knowledge-check option text changed where an option quoted the removed marker. The `correctIndex` stayed the same; the rationale in each affected key was updated to match.
7. HBM-04: the sentence's titles were restored from the backup, not invented.
8. Two sentences were judged as plain claims left intact after parenthetical removal: "Figures apply under the state standard." (South Australia pool files, state-specific) and "The regulation sets the chlorine range at 30 to 50 mg/L." (PCS/PSA pool). Owner may want to confirm these two.

## Facts from memory

None used. Work was done from the repo files and the brief only.
