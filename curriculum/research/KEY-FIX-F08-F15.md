# Knowledge-check key fixes: F08, F14, F15

Scope: eight checks named in the audit. Keys live in `curriculum/assessments/<lessonId>.assessment.json`. Each proposed key was checked against the lesson text and options. All eight audit keys named the supported option, so no option was rewritten.

| Check | Old key | New key | Reason |
|---|---|---|---|
| F08-L01-K01 | 2 | 1 | Lesson requires the method to match authorised site scope and current product labels with no uncontrolled hazard; option 2 (stain confirmed infectious) is contrary to the lesson. |
| F08-L02-K01 | 3 | 1 | Lesson selects PPE from risk assessment, product label and site requirements; option 3 (habit) is the error the lesson warns against. |
| F14-L01-K02 | 0 | 3 | Unclear consent, access, safety or authority means pausing and contacting the designated coordinator; option 0 assumes consent from silence. |
| F15-L01-K01 | 1 | 2 | Work outside training or authority is stopped and escalated to the supervisor; option 1 substitutes a branded shirt for PPE. |
| F15-L01-K04 | 0 | 1 | Unsafe alternative is relying on a branded shirt as splash protection; option 0 is the correct PPE practice. |
| F15-L02-K02 | 3 | 0 | Conflicting site footwear rule is reported to the supervisor with the risk stated; option 3 keeps quiet about it. |
| F15-L02-K04 | 1 | 3 | Relying on footwear alone on a wet walkway with no barrier or drying is unsafe; option 1 (cleaning and drying footwear) is a safe practice. |
| F15-L03-K04 | 2 | 1 | Wearing gloves that are not the chemical-resistant type the label requires is unsafe; option 2 (cleaning reusable gloves) is a safe practice. |

Rationales were rewritten where the old text described a different option. F14-L01-K02 kept its existing rationale because it already matched option 3.

Checks not in scope and not changed:
- F15-L02-K01 has key 2 ("Rely on your footwear to make the task safe"), which is the unsafe option. Option 0 ("Stop and tell the supervisor before going further") is the supported answer. Needs a decision from the owner, since it was not in the audit list.
- F08-L01-K02: the audit did not list it. Key 2 is correct and was left as is.

Validator: `python3 -I /home/claude/work/check.py` gives the same output before and after. The one remaining problem (check 4) is in `courses/deck-and-fence-maintenance/NEW-DEK-01.json`, which was already present and is outside this change.
