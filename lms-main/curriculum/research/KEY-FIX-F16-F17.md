# Knowledge-check answer key fixes: F16-L01, F16-L03, F17-L01, F17-L04, F17-L05

Scope: correctIndex values in `curriculum/assessments/<lessonId>.assessment.json`. Learner lesson files were not changed. Each key was checked against the lesson's own procedure and worked scenario, then against the option text. Each of the ten checks has exactly one supported option, so no options were rewritten and all option sets stay at 4.

| Check | Lesson file | Old key | New key | Reason |
|---|---|---|---|---|
| F16-L01-K01 | shared/chemicals/F16-L01.json | 0 | 1 | Lesson says to identify soil and substrate and to distinguish products by intended task, not marketing language. Option 1 matches. |
| F16-L01-K02 | shared/chemicals/F16-L01.json | 1 | 3 | When unsure, pause, protect the area and seek supervisor guidance. Mixing categories is not approved. Option 3 matches. |
| F16-L01-K05 | shared/chemicals/F16-L01.json | 0 | 2 | Lesson requires coaching and reassessment to be recorded. The product choice and surface are recorded too. Option 2 matches. |
| F16-L03-K03 | shared/chemicals/F16-L03.json | 0 | 2 | Worked scenario rejects the acidic bathroom cleaner for marble and selects a stone-compatible approved alternative. Option 2 matches. |
| F16-L03-K04 | shared/chemicals/F16-L03.json | 1 | 3 | Unsafe alternative is applying an acidic cleaner to marble, since acidic products damage acid-sensitive stone. Option 1 (stone-compatible alternative) is the safe choice. Rationale rewritten to say so; it previously called the safe options "checks". |
| F16-L03-K05 | shared/chemicals/F16-L03.json | 2 | 0 | Existing damage and the no-use decision are recorded for supervisor review. Option 0 matches. |
| F17-L01-K02 | shared/equipment/F17-L01.json | 0 | 2 | Contaminated or wrong tool is removed and replaced with the site-assigned clean tool. Option 2 matches. |
| F17-L04-K01 | shared/safety/F17-L04.json | 2 | 1 | Pre-start inspects plugs, cables, chargers, switches and equipment condition before energising, with residual-current protection observed. Option 1 matches. |
| F17-L05-K02 | shared/safety/F17-L05.json | 0 | 3 | Stop when beyond safe capability, use a cart or assistance, and report tasks beyond capacity. Option 3 matches. |
| F17-L05-K03 | shared/safety/F17-L05.json | 1 | 3 | Worked scenario: assess the load, route and safer transport before going up. Option 3 matches. |

## Verification

- All five changed assessment files parse as JSON.
- `python3 -I /home/claude/work/check.py`: problem count is 1 before and after. The one problem (check 4, citation marker in NEW-DEK-01 `/instruction[2]/body`) predates this work and is outside these lessons.
- Learner files (`shared/...`) were not edited.
