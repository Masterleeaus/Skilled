# Duplicate knowledge-check questions

Scope: every `knowledgeChecks` entry in the 912 lesson JSON files under `curriculum/courses` and `curriculum/shared` (2,831 checks). The four `SHARED-REFERENCES.json` files have no knowledge checks and were skipped.

## Method

- Question text only is compared. Options are not compared.
- Normalisation: lowercase; every character that is not a-z or 0-9 becomes a space; runs of whitespace collapse to one space.
- Similarity: `difflib.SequenceMatcher` ratio on the normalised text. Pairs at 0.90 or above are flagged.
- Groups are connected components (single-link), so a group can hold members that are not all directly similar. The lowest pairwise ratio in each group is shown.
- Pairs within the same lesson were excluded. None at 0.90 or above were found.

## Summary

- Groups: **33** (27 exact after normalisation, 6 near-identical at 0.90 to 0.99)
- Checks in groups: **175** of 2,831 (6.2%)
- Largest group: 14 checks

| Group | Size | Lessons | Min ratio | Question |
|---|---|---|---|---|
| G01 | 14 | 14 | 1.0000 | Explain the task-specific decision |
| G02 | 14 | 14 | 1.0000 | Identify the unsafe alternative |
| G03 | 14 | 14 | 1.0000 | Describe the record or escalation needed |
| G04 | 13 | 13 | 1.0000 | What do you do if the method, product or equipment is unsafe or uncertain? |
| G05 | 10 | 10 | 1.0000 | What should you do if the task is outside your authorisation or training? |
| G06 | 10 | 10 | 1.0000 | How should a hazard, defect or unresolved issue be handed over? |
| G07 | 8 | 8 | 1.0000 | What should happen when the work is outside scope or cannot be completed safely? |
| G08 | 8 | 8 | 1.0000 | What should you do if consent, access, safety or authority is unclear? |
| G09 | 7 | 7 | 1.0000 | What should you do if a required control or instruction is unavailable? |
| G10 | 6 | 6 | 1.0000 | What must be checked before starting this task? |
| G11 | 6 | 6 | 1.0000 | What is the safest response when the situation changes or is uncertain? |
| G12 | 6 | 6 | 1.0000 | What evidence shows this task was completed competently? |
| G13 | 5 | 5 | 1.0000 | What must be checked before applying this lesson in a real workplace? |
| G14 | 5 | 5 | 1.0000 | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? |
| G15 | 5 | 5 | 1.0000 | When can a worker resume after stopping work because a control failed? |
| G16 | 5 | 5 | 1.0000 | What should an incident record distinguish? |
| G17 | 4 | 4 | 1.0000 | Can you start restricted work on the strength of a training certificate alone? |
| G18 | 3 | 3 | 1.0000 | What should happen when the correct method or authorisation is uncertain? |
| G19 | 3 | 3 | 1.0000 | What evidence demonstrates completion of this task? |
| G20 | 3 | 3 | 1.0000 | How should an out-of-scope request be handled? |
| G21 | 2 | 2 | 0.9412 | Should you operate an unfamiliar appliance to prove it works? (variants: Should you operate an unfamiliar appliance to show it works?) |
| G22 | 2 | 2 | 0.9535 | Where should the mop bucket sit while you mop? (variants: Where should the bucket sit while you mop?) |
| G23 | 2 | 2 | 0.9535 | Why is the floor cleaned last in a bathroom? (variants: Why is the floor cleaned last in a washroom?) |
| G24 | 2 | 2 | 1.0000 | Which statement about this lesson is correct? |
| G25 | 2 | 2 | 1.0000 | How does the note describe the pool zone? |
| G26 | 2 | 2 | 1.0000 | What must be checked before classifying an inspection finding as a service defect? |
| G27 | 2 | 2 | 1.0000 | What should happen when a photograph would expose private client information? |
| G28 | 2 | 2 | 1.0000 | When can a corrective action be closed? |
| G29 | 2 | 2 | 1.0000 | Which statement about completing this lesson is correct? |
| G30 | 2 | 2 | 0.9286 | Why should biological filter media be rinsed in pond water rather than tap water? (variants: Why should biological filter media be rinsed in removed tank water rather than tap water?) |
| G31 | 2 | 2 | 0.9444 | A pond pump needs inspection and its power switch is nearby. What must happen before any hand goes near the pump? (variants: A pump needs inspection and the power switch is nearby. What must happen before any hands go near the pump?) |
| G32 | 2 | 2 | 1.0000 | A pit with standing water needs checking. What is the correct response? |
| G33 | 2 | 2 | 0.9148 | A client in New South Wales asks you to release unwanted goldfish into a local creek. What is the correct response? (variants: A client in New South Wales asks you to release a surplus fish into a local creek. What is the correct response?) |

## G01: Explain the task-specific decision

- Size 14 checks across 14 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F15-L01-K03 | F15-L01 | `curriculum/shared/induction/F15-L01.json` | Explain the task-specific decision |
| F15-L02-K03 | F15-L02 | `curriculum/shared/induction/F15-L02.json` | Explain the task-specific decision |
| F15-L03-K03 | F15-L03 | `curriculum/shared/safety/F15-L03.json` | Explain the task-specific decision |
| F15-L04-K03 | F15-L04 | `curriculum/shared/induction/F15-L04.json` | Explain the task-specific decision |
| F15-L05-K03 | F15-L05 | `curriculum/shared/customer/F15-L05.json` | Explain the task-specific decision |
| F15-L06-K03 | F15-L06 | `curriculum/shared/safety/F15-L06.json` | Explain the task-specific decision |
| F16-L01-K03 | F16-L01 | `curriculum/shared/chemicals/F16-L01.json` | Explain the task-specific decision |
| F16-L03-K03 | F16-L03 | `curriculum/shared/chemicals/F16-L03.json` | Explain the task-specific decision |
| F17-L01-K03 | F17-L01 | `curriculum/shared/equipment/F17-L01.json` | Explain the task-specific decision |
| F17-L04-K03 | F17-L04 | `curriculum/shared/safety/F17-L04.json` | Explain the task-specific decision |
| F17-L05-K03 | F17-L05 | `curriculum/shared/safety/F17-L05.json` | Explain the task-specific decision |
| F19-L01-K03 | F19-L01 | `curriculum/shared/job-management/F19-L01.json` | Explain the task-specific decision |
| F19-L05-K03 | F19-L05 | `curriculum/shared/job-management/F19-L05.json` | Explain the task-specific decision |
| F19-L06-K03 | F19-L06 | `curriculum/shared/quality/F19-L06.json` | Explain the task-specific decision |

## G02: Identify the unsafe alternative

- Size 14 checks across 14 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F15-L01-K04 | F15-L01 | `curriculum/shared/induction/F15-L01.json` | Identify the unsafe alternative |
| F15-L02-K04 | F15-L02 | `curriculum/shared/induction/F15-L02.json` | Identify the unsafe alternative |
| F15-L03-K04 | F15-L03 | `curriculum/shared/safety/F15-L03.json` | Identify the unsafe alternative |
| F15-L04-K04 | F15-L04 | `curriculum/shared/induction/F15-L04.json` | Identify the unsafe alternative |
| F15-L05-K04 | F15-L05 | `curriculum/shared/customer/F15-L05.json` | Identify the unsafe alternative |
| F15-L06-K04 | F15-L06 | `curriculum/shared/safety/F15-L06.json` | Identify the unsafe alternative |
| F16-L01-K04 | F16-L01 | `curriculum/shared/chemicals/F16-L01.json` | Identify the unsafe alternative |
| F16-L03-K04 | F16-L03 | `curriculum/shared/chemicals/F16-L03.json` | Identify the unsafe alternative |
| F17-L01-K04 | F17-L01 | `curriculum/shared/equipment/F17-L01.json` | Identify the unsafe alternative |
| F17-L04-K04 | F17-L04 | `curriculum/shared/safety/F17-L04.json` | Identify the unsafe alternative |
| F17-L05-K04 | F17-L05 | `curriculum/shared/safety/F17-L05.json` | Identify the unsafe alternative |
| F19-L01-K04 | F19-L01 | `curriculum/shared/job-management/F19-L01.json` | Identify the unsafe alternative |
| F19-L05-K04 | F19-L05 | `curriculum/shared/job-management/F19-L05.json` | Identify the unsafe alternative |
| F19-L06-K04 | F19-L06 | `curriculum/shared/quality/F19-L06.json` | Identify the unsafe alternative |

## G03: Describe the record or escalation needed

- Size 14 checks across 14 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F15-L01-K05 | F15-L01 | `curriculum/shared/induction/F15-L01.json` | Describe the record or escalation needed |
| F15-L02-K05 | F15-L02 | `curriculum/shared/induction/F15-L02.json` | Describe the record or escalation needed |
| F15-L03-K05 | F15-L03 | `curriculum/shared/safety/F15-L03.json` | Describe the record or escalation needed |
| F15-L04-K05 | F15-L04 | `curriculum/shared/induction/F15-L04.json` | Describe the record or escalation needed |
| F15-L05-K05 | F15-L05 | `curriculum/shared/customer/F15-L05.json` | Describe the record or escalation needed |
| F15-L06-K05 | F15-L06 | `curriculum/shared/safety/F15-L06.json` | Describe the record or escalation needed |
| F16-L01-K05 | F16-L01 | `curriculum/shared/chemicals/F16-L01.json` | Describe the record or escalation needed |
| F16-L03-K05 | F16-L03 | `curriculum/shared/chemicals/F16-L03.json` | Describe the record or escalation needed |
| F17-L01-K05 | F17-L01 | `curriculum/shared/equipment/F17-L01.json` | Describe the record or escalation needed |
| F17-L04-K05 | F17-L04 | `curriculum/shared/safety/F17-L04.json` | Describe the record or escalation needed |
| F17-L05-K05 | F17-L05 | `curriculum/shared/safety/F17-L05.json` | Describe the record or escalation needed |
| F19-L01-K05 | F19-L01 | `curriculum/shared/job-management/F19-L01.json` | Describe the record or escalation needed |
| F19-L05-K05 | F19-L05 | `curriculum/shared/job-management/F19-L05.json` | Describe the record or escalation needed |
| F19-L06-K05 | F19-L06 | `curriculum/shared/quality/F19-L06.json` | Describe the record or escalation needed |

## G04: What do you do if the method, product or equipment is unsafe or uncertain?

- Size 13 checks across 13 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F03-L01-K02 | F03-L01 | `curriculum/shared/chemicals/F03-L01.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F03-L02-K02 | F03-L02 | `curriculum/shared/chemicals/F03-L02.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F03-L03-K02 | F03-L03 | `curriculum/shared/chemicals/F03-L03.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F03-L04-K02 | F03-L04 | `curriculum/shared/chemicals/F03-L04.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F04-L01-K02 | F04-L01 | `curriculum/shared/equipment/F04-L01.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F04-L02-K02 | F04-L02 | `curriculum/shared/equipment/F04-L02.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F04-L03-K02 | F04-L03 | `curriculum/shared/equipment/F04-L03.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F04-L04-K02 | F04-L04 | `curriculum/shared/equipment/F04-L04.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F16-L01-K02 | F16-L01 | `curriculum/shared/chemicals/F16-L01.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F16-L03-K02 | F16-L03 | `curriculum/shared/chemicals/F16-L03.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F17-L01-K02 | F17-L01 | `curriculum/shared/equipment/F17-L01.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F17-L04-K02 | F17-L04 | `curriculum/shared/safety/F17-L04.json` | What do you do if the method, product or equipment is unsafe or uncertain? |
| F17-L05-K02 | F17-L05 | `curriculum/shared/safety/F17-L05.json` | What do you do if the method, product or equipment is unsafe or uncertain? |

## G05: What should you do if the task is outside your authorisation or training?

- Size 10 checks across 10 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F01-L01-K01 | F01-L01 | `curriculum/shared/induction/F01-L01.json` | What should you do if the task is outside your authorisation or training? |
| F01-L02-K01 | F01-L02 | `curriculum/shared/customer/F01-L02.json` | What should you do if the task is outside your authorisation or training? |
| F01-L03-K01 | F01-L03 | `curriculum/shared/induction/F01-L03.json` | What should you do if the task is outside your authorisation or training? |
| F01-L04-K01 | F01-L04 | `curriculum/shared/job-management/F01-L04.json` | What should you do if the task is outside your authorisation or training? |
| F15-L01-K01 | F15-L01 | `curriculum/shared/induction/F15-L01.json` | What should you do if the task is outside your authorisation or training? |
| F15-L02-K01 | F15-L02 | `curriculum/shared/induction/F15-L02.json` | What should you do if the task is outside your authorisation or training? |
| F15-L03-K01 | F15-L03 | `curriculum/shared/safety/F15-L03.json` | What should you do if the task is outside your authorisation or training? |
| F15-L04-K01 | F15-L04 | `curriculum/shared/induction/F15-L04.json` | What should you do if the task is outside your authorisation or training? |
| F15-L05-K01 | F15-L05 | `curriculum/shared/customer/F15-L05.json` | What should you do if the task is outside your authorisation or training? |
| F15-L06-K01 | F15-L06 | `curriculum/shared/safety/F15-L06.json` | What should you do if the task is outside your authorisation or training? |

## G06: How should a hazard, defect or unresolved issue be handed over?

- Size 10 checks across 10 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F01-L01-K02 | F01-L01 | `curriculum/shared/induction/F01-L01.json` | How should a hazard, defect or unresolved issue be handed over? |
| F01-L02-K02 | F01-L02 | `curriculum/shared/customer/F01-L02.json` | How should a hazard, defect or unresolved issue be handed over? |
| F01-L03-K02 | F01-L03 | `curriculum/shared/induction/F01-L03.json` | How should a hazard, defect or unresolved issue be handed over? |
| F01-L04-K02 | F01-L04 | `curriculum/shared/job-management/F01-L04.json` | How should a hazard, defect or unresolved issue be handed over? |
| F15-L01-K02 | F15-L01 | `curriculum/shared/induction/F15-L01.json` | How should a hazard, defect or unresolved issue be handed over? |
| F15-L02-K02 | F15-L02 | `curriculum/shared/induction/F15-L02.json` | How should a hazard, defect or unresolved issue be handed over? |
| F15-L03-K02 | F15-L03 | `curriculum/shared/safety/F15-L03.json` | How should a hazard, defect or unresolved issue be handed over? |
| F15-L04-K02 | F15-L04 | `curriculum/shared/induction/F15-L04.json` | How should a hazard, defect or unresolved issue be handed over? |
| F15-L05-K02 | F15-L05 | `curriculum/shared/customer/F15-L05.json` | How should a hazard, defect or unresolved issue be handed over? |
| F15-L06-K02 | F15-L06 | `curriculum/shared/safety/F15-L06.json` | How should a hazard, defect or unresolved issue be handed over? |

## G07: What should happen when the work is outside scope or cannot be completed safely?

- Size 8 checks across 8 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F09-L01-K02 | F09-L01 | `curriculum/shared/quality/F09-L01.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F09-L02-K02 | F09-L02 | `curriculum/shared/quality/F09-L02.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F09-L03-K02 | F09-L03 | `curriculum/shared/quality/F09-L03.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F09-L04-K02 | F09-L04 | `curriculum/shared/quality/F09-L04.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F09-L05-K02 | F09-L05 | `curriculum/shared/quality/F09-L05.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F19-L01-K02 | F19-L01 | `curriculum/shared/job-management/F19-L01.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F19-L05-K02 | F19-L05 | `curriculum/shared/job-management/F19-L05.json` | What should happen when the work is outside scope or cannot be completed safely? |
| F19-L06-K02 | F19-L06 | `curriculum/shared/quality/F19-L06.json` | What should happen when the work is outside scope or cannot be completed safely? |

## G08: What should you do if consent, access, safety or authority is unclear?

- Size 8 checks across 8 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F10-L01-K02 | F10-L01 | `curriculum/shared/induction/F10-L01.json` | What should you do if consent, access, safety or authority is unclear? |
| F10-L02-K02 | F10-L02 | `curriculum/shared/operations/F10-L02.json` | What should you do if consent, access, safety or authority is unclear? |
| F10-L04-K02 | F10-L04 | `curriculum/shared/equipment/F10-L04.json` | What should you do if consent, access, safety or authority is unclear? |
| F10-L05-K02 | F10-L05 | `curriculum/shared/quality/F10-L05.json` | What should you do if consent, access, safety or authority is unclear? |
| F14-L01-K02 | F14-L01 | `curriculum/shared/customer/F14-L01.json` | What should you do if consent, access, safety or authority is unclear? |
| F14-L02-K02 | F14-L02 | `curriculum/shared/safety/F14-L02.json` | What should you do if consent, access, safety or authority is unclear? |
| F14-L04-K02 | F14-L04 | `curriculum/shared/safety/F14-L04.json` | What should you do if consent, access, safety or authority is unclear? |
| F14-L05-K02 | F14-L05 | `curriculum/shared/customer/F14-L05.json` | What should you do if consent, access, safety or authority is unclear? |

## G09: What should you do if a required control or instruction is unavailable?

- Size 7 checks across 7 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F02-L01-K02 | F02-L01 | `curriculum/shared/safety/F02-L01.json` | What should you do if a required control or instruction is unavailable? |
| F02-L02-K02 | F02-L02 | `curriculum/shared/safety/F02-L02.json` | What should you do if a required control or instruction is unavailable? |
| F02-L03-K02 | F02-L03 | `curriculum/shared/safety/F02-L03.json` | What should you do if a required control or instruction is unavailable? |
| F02-L04-K02 | F02-L04 | `curriculum/shared/safety/F02-L04.json` | What should you do if a required control or instruction is unavailable? |
| F05-L01-K02 | F05-L01 | `curriculum/shared/job-management/F05-L01.json` | What should you do if a required control or instruction is unavailable? |
| F05-L02-K02 | F05-L02 | `curriculum/shared/chemicals/F05-L02.json` | What should you do if a required control or instruction is unavailable? |
| F05-L03-K02 | F05-L03 | `curriculum/shared/job-management/F05-L03.json` | What should you do if a required control or instruction is unavailable? |

## G10: What must be checked before starting this task?

- Size 6 checks across 6 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C01-L01-K01 | C01-L01 | `curriculum/shared/induction/C01-L01.json` | What must be checked before starting this task? |
| C01-L02-K01 | C01-L02 | `curriculum/shared/induction/C01-L02.json` | What must be checked before starting this task? |
| C01-L03-K01 | C01-L03 | `curriculum/shared/induction/C01-L03.json` | What must be checked before starting this task? |
| C02-L01-K01 | C02-L01 | `curriculum/shared/job-management/C02-L01.json` | What must be checked before starting this task? |
| C02-L02-K01 | C02-L02 | `curriculum/shared/job-management/C02-L02.json` | What must be checked before starting this task? |
| C02-L03-K01 | C02-L03 | `curriculum/shared/job-management/C02-L03.json` | What must be checked before starting this task? |

## G11: What is the safest response when the situation changes or is uncertain?

- Size 6 checks across 6 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C01-L01-K02 | C01-L01 | `curriculum/shared/induction/C01-L01.json` | What is the safest response when the situation changes or is uncertain? |
| C01-L02-K02 | C01-L02 | `curriculum/shared/induction/C01-L02.json` | What is the safest response when the situation changes or is uncertain? |
| C01-L03-K02 | C01-L03 | `curriculum/shared/induction/C01-L03.json` | What is the safest response when the situation changes or is uncertain? |
| C02-L01-K02 | C02-L01 | `curriculum/shared/job-management/C02-L01.json` | What is the safest response when the situation changes or is uncertain? |
| C02-L02-K02 | C02-L02 | `curriculum/shared/job-management/C02-L02.json` | What is the safest response when the situation changes or is uncertain? |
| C02-L03-K02 | C02-L03 | `curriculum/shared/job-management/C02-L03.json` | What is the safest response when the situation changes or is uncertain? |

## G12: What evidence shows this task was completed competently?

- Size 6 checks across 6 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C01-L01-K03 | C01-L01 | `curriculum/shared/induction/C01-L01.json` | What evidence shows this task was completed competently? |
| C01-L02-K03 | C01-L02 | `curriculum/shared/induction/C01-L02.json` | What evidence shows this task was completed competently? |
| C01-L03-K03 | C01-L03 | `curriculum/shared/induction/C01-L03.json` | What evidence shows this task was completed competently? |
| C02-L01-K03 | C02-L01 | `curriculum/shared/job-management/C02-L01.json` | What evidence shows this task was completed competently? |
| C02-L02-K03 | C02-L02 | `curriculum/shared/job-management/C02-L02.json` | What evidence shows this task was completed competently? |
| C02-L03-K03 | C02-L03 | `curriculum/shared/job-management/C02-L03.json` | What evidence shows this task was completed competently? |

## G13: What must be checked before applying this lesson in a real workplace?

- Size 5 checks across 5 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F08-L01-K01 | F08-L01 | `curriculum/shared/safety/F08-L01.json` | What must be checked before applying this lesson in a real workplace? |
| F08-L02-K01 | F08-L02 | `curriculum/shared/safety/F08-L02.json` | What must be checked before applying this lesson in a real workplace? |
| F08-L03-K01 | F08-L03 | `curriculum/shared/chemicals/F08-L03.json` | What must be checked before applying this lesson in a real workplace? |
| F08-L04-K01 | F08-L04 | `curriculum/shared/equipment/F08-L04.json` | What must be checked before applying this lesson in a real workplace? |
| F08-L05-K01 | F08-L05 | `curriculum/shared/safety/F08-L05.json` | What must be checked before applying this lesson in a real workplace? |

## G14: What should the worker do if an uncontrolled hazard or unauthorised task is encountered?

- Size 5 checks across 5 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F08-L01-K02 | F08-L01 | `curriculum/shared/safety/F08-L01.json` | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? |
| F08-L02-K02 | F08-L02 | `curriculum/shared/safety/F08-L02.json` | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? |
| F08-L03-K02 | F08-L03 | `curriculum/shared/chemicals/F08-L03.json` | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? |
| F08-L04-K02 | F08-L04 | `curriculum/shared/equipment/F08-L04.json` | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? |
| F08-L05-K02 | F08-L05 | `curriculum/shared/safety/F08-L05.json` | What should the worker do if an uncontrolled hazard or unauthorised task is encountered? |

## G15: When can a worker resume after stopping work because a control failed?

- Size 5 checks across 5 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| S14-L03-K02 | S14-L03 | `curriculum/shared/safety/S14-L03.json` | When can a worker resume after stopping work because a control failed? |
| S14-L04-K02 | S14-L04 | `curriculum/shared/safety/S14-L04.json` | When can a worker resume after stopping work because a control failed? |
| S14-L05-K02 | S14-L05 | `curriculum/shared/safety/S14-L05.json` | When can a worker resume after stopping work because a control failed? |
| S14-L07-K02 | S14-L07 | `curriculum/shared/safety/S14-L07.json` | When can a worker resume after stopping work because a control failed? |
| S14-L08-K02 | S14-L08 | `curriculum/shared/safety/S14-L08.json` | When can a worker resume after stopping work because a control failed? |

## G16: What should an incident record distinguish?

- Size 5 checks across 5 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| S14-L03-K03 | S14-L03 | `curriculum/shared/safety/S14-L03.json` | What should an incident record distinguish? |
| S14-L04-K03 | S14-L04 | `curriculum/shared/safety/S14-L04.json` | What should an incident record distinguish? |
| S14-L05-K03 | S14-L05 | `curriculum/shared/safety/S14-L05.json` | What should an incident record distinguish? |
| S14-L07-K03 | S14-L07 | `curriculum/shared/safety/S14-L07.json` | What should an incident record distinguish? |
| S14-L08-K03 | S14-L08 | `curriculum/shared/safety/S14-L08.json` | What should an incident record distinguish? |

## G17: Can you start restricted work on the strength of a training certificate alone?

- Size 4 checks across 4 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| additional-specialist-services-L01-K02 | additional-specialist-services-L01 | `curriculum/shared/operations/additional-specialist-services-L01.json` | Can you start restricted work on the strength of a training certificate alone? |
| additional-specialist-services-L04-K02 | additional-specialist-services-L04 | `curriculum/shared/starting-business/additional-specialist-services-L04.json` | Can you start restricted work on the strength of a training certificate alone? |
| additional-specialist-services-L10-K02 | additional-specialist-services-L10 | `curriculum/shared/team/additional-specialist-services-L10.json` | Can you start restricted work on the strength of a training certificate alone? |
| additional-specialist-services-L12-K02 | additional-specialist-services-L12 | `curriculum/shared/quality/additional-specialist-services-L12.json` | Can you start restricted work on the strength of a training certificate alone? |

## G18: What should happen when the correct method or authorisation is uncertain?

- Size 3 checks across 3 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C05-L01-K01 | C05-L01 | `curriculum/shared/chemicals/C05-L01.json` | What should happen when the correct method or authorisation is uncertain? |
| C05-L02-K01 | C05-L02 | `curriculum/shared/chemicals/C05-L02.json` | What should happen when the correct method or authorisation is uncertain? |
| C05-L03-K01 | C05-L03 | `curriculum/shared/equipment/C05-L03.json` | What should happen when the correct method or authorisation is uncertain? |

## G19: What evidence demonstrates completion of this task?

- Size 3 checks across 3 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C05-L01-K02 | C05-L01 | `curriculum/shared/chemicals/C05-L01.json` | What evidence demonstrates completion of this task? |
| C05-L02-K02 | C05-L02 | `curriculum/shared/chemicals/C05-L02.json` | What evidence demonstrates completion of this task? |
| C05-L03-K02 | C05-L03 | `curriculum/shared/equipment/C05-L03.json` | What evidence demonstrates completion of this task? |

## G20: How should an out-of-scope request be handled?

- Size 3 checks across 3 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C05-L01-K03 | C05-L01 | `curriculum/shared/chemicals/C05-L01.json` | How should an out-of-scope request be handled? |
| C05-L02-K03 | C05-L02 | `curriculum/shared/chemicals/C05-L02.json` | How should an out-of-scope request be handled? |
| C05-L03-K03 | C05-L03 | `curriculum/shared/equipment/C05-L03.json` | How should an out-of-scope request be handled? |

## G21: Should you operate an unfamiliar appliance to prove it works?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 0.9412 (C07-L03-K02 vs C12-L05-K03).
- Wording variants:
  - `Should you operate an unfamiliar appliance to prove it works?` (1 checks)
  - `Should you operate an unfamiliar appliance to show it works?` (1 checks)
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| C07-L03-K02 | C07-L03 | `curriculum/courses/short-stay-turnover/C07-L03.json` | Should you operate an unfamiliar appliance to prove it works? |
| C12-L05-K03 | C12-L05 | `curriculum/courses/short-stay-turnover/C12-L05.json` | Should you operate an unfamiliar appliance to show it works? |

## G22: Where should the mop bucket sit while you mop?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 0.9535 (ECO-04-K02 vs SOP-05-K02).
- Wording variants:
  - `Where should the mop bucket sit while you mop?` (1 checks)
  - `Where should the bucket sit while you mop?` (1 checks)
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| ECO-04-K02 | ECO-04 | `curriculum/shared/cleaning/ECO-04.json` | Where should the mop bucket sit while you mop? |
| SOP-05-K02 | SOP-05 | `curriculum/shared/cleaning/SOP-05.json` | Where should the bucket sit while you mop? |

## G23: Why is the floor cleaned last in a bathroom?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 0.9535 (F06-L04-K01 vs TJS-20-K01).
- Wording variants:
  - `Why is the floor cleaned last in a bathroom?` (1 checks)
  - `Why is the floor cleaned last in a washroom?` (1 checks)
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| F06-L04-K01 | F06-L04 | `curriculum/shared/cleaning/F06-L04.json` | Why is the floor cleaned last in a bathroom? |
| TJS-20-K01 | TJS-20 | `curriculum/shared/cleaning/TJS-20.json` | Why is the floor cleaned last in a washroom? |

## G24: Which statement about this lesson is correct?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| CL2-03-K03 | CL2-03 | `curriculum/shared/cleaning-guide/CL2-03.json` | Which statement about this lesson is correct? |
| NEW-POND-03-K03 | NEW-POND-03 | `curriculum/courses/pond/NEW-POND-03.json` | Which statement about this lesson is correct? |

## G25: How does the note describe the pool zone?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| PVB-01-K03 | PVB-01 | `curriculum/shared/pool/PVB-01.json` | How does the note describe the pool zone? |
| PVB-05-K01 | PVB-05 | `curriculum/shared/pool/PVB-05.json` | How does the note describe the pool zone? |

## G26: What must be checked before classifying an inspection finding as a service defect?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| S12-L03-K01 | S12-L03 | `curriculum/shared/quality/S12-L03.json` | What must be checked before classifying an inspection finding as a service defect? |
| S12-L08-K01 | S12-L08 | `curriculum/shared/quality/S12-L08.json` | What must be checked before classifying an inspection finding as a service defect? |

## G27: What should happen when a photograph would expose private client information?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| S12-L03-K02 | S12-L03 | `curriculum/shared/quality/S12-L03.json` | What should happen when a photograph would expose private client information? |
| S12-L08-K02 | S12-L08 | `curriculum/shared/quality/S12-L08.json` | What should happen when a photograph would expose private client information? |

## G28: When can a corrective action be closed?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| S12-L03-K03 | S12-L03 | `curriculum/shared/quality/S12-L03.json` | When can a corrective action be closed? |
| S12-L08-K03 | S12-L08 | `curriculum/shared/quality/S12-L08.json` | When can a corrective action be closed? |

## G29: Which statement about completing this lesson is correct?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| NEW-MAS-01-K01 | NEW-MAS-01 | `curriculum/courses/massage/NEW-MAS-01.json` | Which statement about completing this lesson is correct? |
| handyman-work-L01-K02 | handyman-work-L01 | `curriculum/courses/handyman/handyman-work-L01.json` | Which statement about completing this lesson is correct? |

## G30: Why should biological filter media be rinsed in pond water rather than tap water?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 0.9286 (pond-cleaning-L07-K02 vs aquarium-cleaning-L07-K02).
- Wording variants:
  - `Why should biological filter media be rinsed in pond water rather than tap water?` (1 checks)
  - `Why should biological filter media be rinsed in removed tank water rather than tap water?` (1 checks)
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| aquarium-cleaning-L07-K02 | aquarium-cleaning-L07 | `curriculum/courses/aquarium/aquarium-cleaning-L07.json` | Why should biological filter media be rinsed in removed tank water rather than tap water? |
| pond-cleaning-L07-K02 | pond-cleaning-L07 | `curriculum/courses/pond/pond-cleaning-L07.json` | Why should biological filter media be rinsed in pond water rather than tap water? |

## G31: A pond pump needs inspection and its power switch is nearby. What must happen before any hand goes near the pump?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 0.9444 (pond-cleaning-L10-K01 vs pool-cleaning-L10-K01).
- Wording variants:
  - `A pond pump needs inspection and its power switch is nearby. What must happen before any hand goes near the pump?` (1 checks)
  - `A pump needs inspection and the power switch is nearby. What must happen before any hands go near the pump?` (1 checks)
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| pond-cleaning-L10-K01 | pond-cleaning-L10 | `curriculum/courses/pond/pond-cleaning-L10.json` | A pond pump needs inspection and its power switch is nearby. What must happen before any hand goes near the pump? |
| pool-cleaning-L10-K01 | pool-cleaning-L10 | `curriculum/courses/pool/pool-cleaning-L10.json` | A pump needs inspection and the power switch is nearby. What must happen before any hands go near the pump? |

## G32: A pit with standing water needs checking. What is the correct response?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 1.0000.
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| pond-cleaning-L10-K02 | pond-cleaning-L10 | `curriculum/courses/pond/pond-cleaning-L10.json` | A pit with standing water needs checking. What is the correct response? |
| pool-cleaning-L10-K02 | pool-cleaning-L10 | `curriculum/courses/pool/pool-cleaning-L10.json` | A pit with standing water needs checking. What is the correct response? |

## G33: A client in New South Wales asks you to release unwanted goldfish into a local creek. What is the correct response?

- Size 2 checks across 2 lessons. Lowest pairwise ratio 0.9148 (pond-cleaning-L11-K03 vs aquarium-cleaning-L11-K02).
- Wording variants:
  - `A client in New South Wales asks you to release unwanted goldfish into a local creek. What is the correct response?` (1 checks)
  - `A client in New South Wales asks you to release a surplus fish into a local creek. What is the correct response?` (1 checks)
- Option sets differ between members.

| Check id | Lesson id | File | Question |
|---|---|---|---|
| aquarium-cleaning-L11-K02 | aquarium-cleaning-L11 | `curriculum/courses/aquarium/aquarium-cleaning-L11.json` | A client in New South Wales asks you to release a surplus fish into a local creek. What is the correct response? |
| pond-cleaning-L11-K03 | pond-cleaning-L11 | `curriculum/courses/pond/pond-cleaning-L11.json` | A client in New South Wales asks you to release unwanted goldfish into a local creek. What is the correct response? |
