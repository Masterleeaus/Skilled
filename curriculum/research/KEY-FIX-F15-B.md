# Knowledge-check key fixes: F15-L04, F15-L05, F15-L06 (batch B)

Keys are 0-based `correctIndex` values in `curriculum/assessments/<lessonId>.assessment.json`. Learner files (`curriculum/shared/...`) were checked to contain no `correctIndex`.

| Check | Old key | New key | Reason |
|---|---|---|---|
| F15-L04-K01 | 0 | 1 | No option said stop and escalate. Option 1 (index 1, "Follow workplace instructions for illness or exposure reporting rather than diagnosing yourself") was replaced with "Stop, and escalate to the supervisor". This matches the stop-work rule for a task outside training or authority. The rationale still fits and was not changed. |
| F15-L04-K04 | 3 | 0 | Audit proposal verified. The lesson says to keep eating and drinking away from chemicals and contaminated areas, so "Eating a snack near the chemical store and contaminated area" is the unsafe option. Covering a minor cut under site policy is a safe practice, so index 3 was wrong. The rationale was rewritten to match. |
| F15-L05-K01 | 1 | 3 | "Pressure the customer" was wrong. "Stay outside restricted areas and contact your supervisor" matches the lesson's escalation and no-pressure instructions. The rationale was rewritten to cover work outside authorisation or training. |
| F15-L05-K05 | 1 | 0 | "Post the customer's name in a personal chat" breaches privacy. "Give the approved verification and contact the supervisor about the challenge" matches the lesson's escalation rule. The existing rationale still fits and was not changed. |
| F15-L06-K01 | 2 | 1 | Taking contaminated clothing home is not the answer. "Stop using the damaged item and request a replacement before the next hazardous task" matches the lesson. The rationale was rewritten to match. |
| F15-L06-K02 | 3 | 0 | "Keep the defect to yourself" is wrong. "Document the defect and the issued PPE, and pass it to the supervisor" matches the lesson's documentation rule. The rationale now says the defect is reported to the supervisor. |
| F15-L06-K04 | 1 | 0 | The question asks for the unsafe alternative. Wearing footwear with worn grip for a hazardous task is unsafe. The old rationale described taking clothing home, which was not one of the options, so it was rewritten. |

## Files changed

- `curriculum/shared/induction/F15-L04.json` (K01 option index 1 text only)
- `curriculum/assessments/F15-L04.assessment.json` (K01, K04 keys and rationales)
- `curriculum/assessments/F15-L05.assessment.json` (K01 key and rationale; K05 key)
- `curriculum/assessments/F15-L06.assessment.json` (K01, K02, K04 keys and rationales)

## Verification

- All six changed JSON files parse.
- Each fixed key points to an option that the lesson supports.
- `python3 -I /home/claude/work/check.py`: problemCount 1 before and after the edits. The one problem is `NEW-DEK-01` (check 4, internal codes), which is outside this batch and was already present.
