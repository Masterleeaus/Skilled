# Owner suggestions applied (set A), 2026-11-03

Scope: the three fixes in the owner's instruction. Not committed. Only the files listed below were edited.

## 1. CL2-04-K04 (stem reworded)

File: `curriculum/shared/cleaning-guide/CL2-04.json` (knowledgeChecks, CL2-04-K04)

- Old stem: "What does the lesson say about running the carpet unit?"
- New stem: "Halfway through a hand-wand job the solution runs out. Which instruction from the lesson applies?"

Options unchanged. Option 2 ("Drive it over its own cord to save time") is kept as it was.
Key unchanged: `curriculum/assessments/CL2-04.assessment.json`, CL2-04-K04 `correctIndex` 3 ("Never let the unit run without solution").

Note for review: option 0 ("Run it dry to clear the hoses") is also a prohibited action in the lesson's stop-work list. It is a distractor that the stem's scenario does not ask about, but a reviewer could argue it also fits the scenario.

## 2. CP-01-K03 (option 2 reworded)

File: `curriculum/shared/marketing/CP-01.json` (knowledgeChecks, CP-01-K03, options[2])

- Old option 2: "Confirm the Spam Act requirements in current ACMA guidance, because the exact wording has not yet been confirmed"
- New option 2: "Confirm the Spam Act 2003 requirements in current ACMA guidance before sending"

Key unchanged: `curriculum/assessments/CP-01.assessment.json`, CP-01-K03 `correctIndex` 2.

Conflict with the instruction: the owner asked for option 2 to be "still wrong", but the key keeps index 2 and the assessment rationale says option 2 is the correct answer ("the lesson says the learner must check current ACMA guidance"). `KEY-REVIEW-PART-1.md` also says "Key 2 is correct". The option was therefore reworded as a plain correct statement, so the key stays consistent. If the owner wants option 2 to be wrong, the key must move to a different index, which the instruction ruled out.

## 3. additional-specialist-services-L04 (no change made)

Files checked: `curriculum/shared/starting-business/additional-specialist-services-L04.json`, `curriculum/lessons/ready/additional-specialist-services-L04.json`, `curriculum/lessons/converted/additional-specialist-services-L04.json`, and the register entry in `curriculum/licence/lesson-licence.json`.

- The sentence "has not yet been confirmed in every state" does not occur in any of the three lesson files. Nothing was replaced.
- The current licence notice (body in the shared file) says the boom-length threshold applies at 11 metres or more in New South Wales and Queensland, and that "Victoria's WP class has no boom-length threshold". The licence-does-not-grant sentence is present and unchanged.
- The register entry (status `threshold`) holds only NSW and QLD, both "boom 11 m or more". It holds no Victoria entry and no entry for any other state.

So the NSW and QLD figures match the register. The Victoria sentence is not backed by this lesson's register row, even though the owner listed Victoria as a register figure. Other states are not in the row either. Changing the text to remove Victoria, or adding a Victoria row to the register with a source, is an owner decision and was not made here.

## Check

- All three edited files parse as JSON.
- `python3 -I /home/claude/work/check.py`: `problemCount` 0 before and after the edits. No new problems.
- The key files were re-read after the edits: CL2-04-K04 `correctIndex` 3, CP-01-K03 `correctIndex` 2.
- The strings being replaced do not occur in `lessons/ready` or `lessons/converted`. Those copies were not rebuilt. Rebuilding them from source is a separate step.
