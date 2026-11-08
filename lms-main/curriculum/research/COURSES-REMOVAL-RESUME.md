# Courses: removal of unverified-claim wording, resume report (2026-11-03)

Scope: `curriculum/courses/**` lesson files (372 lessons that carry `knowledgeChecks`), and the matching `curriculum/assessments/<id>.assessment.json` keys. `sourceReferences` and `officialReferences` were not changed. Nothing was committed. Backend, frontend and `curriculum/licence/*` were not edited. No `UNCONFIRMED-REMOVAL-COURSES.md` notes file existed, so this pass started from a fresh scan.

## Files checked

- 372 lesson files under `curriculum/courses` (all parsed; none unparseable).
- 52 assessment key files for the lessons whose knowledge checks changed.
- Scan terms: `unconfirmed`, `not yet confirmed`, `not confirmed`, `not checked`, `not re-checked`, and their direct variants `not yet been confirmed`, `not been confirmed`, `not yet checked`, `not been checked`.
- At the start, 262 lesson files had one of the five listed phrases in learner text (598 hits). With the variants, 360 files had hits (about 1,500 phrase occurrences).

## Files finished

- All 372 course lessons are finished. Re-scan after editing finds 0 owner-listed phrases in learner text.
- Every knowledge check still has a key entry, every key still has a check, and every lesson keeps at least one check.
- Option counts are 3 or 4 throughout. Every `correctIndex` is in range.
- The JSON layout is unchanged in every edited file (indent 2, UTF-8, trailing newline).

## Files changed now

- 355 lesson files had learner text edited.
- 1,584 string edits and 52 list or dict elements deleted.
- 34 knowledge checks dropped. Each was a status question ("what is the status of the claim...") whose correct answer was itself the unverified status. The lesson keeps at least one other check.
- 21 knowledge checks rewritten. The question or option was reworded to a plain procedural answer, with the same correct index. The matching rationale in the assessment key was updated.
- Assessment key files were updated for the 52 lessons whose checks changed (dropped key entries removed, rationale text replaced).
- `check.py`: 932 scanned, 1 problem, the same as the baseline. The one problem is `NEW-DEK-01` at `/instruction[2]/body`, where the "R5" zone name is read as a citation marker. It was already there before this pass and was not added to.

## Decisions (made without asking)

1. Phrase family: "not yet been confirmed", "have not been confirmed", "not been checked" and "not yet checked" were treated as the same class as the listed phrases.
2. Status sentences were removed. Where a sentence also carried a safety step, the step was kept as a plain instruction with no marker (for example "Do not use water on a burning fryer").
3. Sourced facts in a mixed sentence were kept and only the status clause was cut (for example "Solar Accreditation Australia is the accreditor named on the NSW government page.").
4. Product-label pointers ("Product-specific dilution, dwell time and PPE come from the product label and SDS.") were kept as plain statements, with the "not sourced here" clause removed.
5. Learner record labels ("not checked" as a checklist status for parts the learner did not inspect) became "not inspected" in six lesson files. These are record templates, not course claims. Owner should confirm this reading.
6. Kept unchanged: "Recheck before use:" reference labels (not in the owner's list and read as a reading instruction), "unverified" and "not verified" used as learner handover or record wording, and "has not been verified by a competent authority" used as a rule. These can be changed if the owner wants them gone.
7. Knowledge checks whose correct answer was only a status were dropped rather than reworded, since a reworded status question would still test the unverified claim. Owner may want replacement questions on sourced facts.

## Left, not changed

- `curriculum/shared/**`: 343 files and 827 phrase hits remain. Outside the courses scope given for this task.
- Assessment files: 125 files still carry UNCONFIRMED wording in `practicalCriteria`, `stopWorkCriteria`, `evidenceRequired` or in rationales of checks that were not changed (160 occurrences). These are assessor-side. The learner route strips rationale and does not serve assessment files. Not edited.
- `NEW-DEK-01` "R5" false positive in `check.py` (see above). Not edited, since it is not an unverified claim.
- Owner decision still needed: whether the dropped knowledge checks should be replaced, and whether the "not inspected" change for record templates is right.

## Working files

Scan, rewrite and check scripts and reports are in `/home/claude/work/scratch-removal/` (outside the repo). `apply-report.json` lists every change with its old and new text.
