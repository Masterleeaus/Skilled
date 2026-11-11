# KEY-REVIEW-PART-1: answer-key review, lessons A to F

Owner decision 19 (OWNER-DECISIONS.md), part 1. Scope and results are below. Nothing was committed.

## Scope and method

- Scope: the lessons in the "Not yet reviewed" list of `research/KEY-AUDIT-UNCHANGED-TODAY.md` whose lessonId starts with A to F, case-insensitive (lowercase IDs such as `additional-specialist-services-L01` are included). That is 201 lessons.
- For each lesson, every key in `curriculum/assessments/<lessonId>.assessment.json` was checked against the question and options in the learner file (`curriculum/shared/**` or `curriculum/courses/**`), the lesson's decision text (instruction, procedure, worked examples, safety and regulatory points), and the key's rationale.
- Checks already listed in `KEY-FIX-*.md`, `KEY-RECHECK-TODAY.md` or `KEY-AUDIT-UNCHANGED-TODAY.md` were skipped (33 keys, listed below).
- Count note: the audit's per-lesson counts for these 201 lessons total 556 checks, but the assessment files hold 653 keys. After the 33 skipped, 620 keys were reviewed, so 64 keys that the audit count did not include were reviewed as well. The audit count differs from the key file for 80 of the 201 lessons. The key files were treated as the source.

## Counts

| Item | Count |
|---|---|
| Lessons in scope | 201 |
| Keys in those lessons (assessment files) | 653 |
| Skipped (already listed in the reports) | 33 |
| Reviewed | 620 |
| Confirmed correct, no edit | 615 |
| correctIndex changed | 0 |
| Option text rewritten (no option was correct before) | 2 |
| Rationale rewritten (key correct, rationale did not match the question) | 2 |
| Ambiguous (not changed, for owner decision) | 1 |

## Changes

| # | File | Check | Old key | New key | Change | Reason | Lesson text that decides it |
|---|---|---|---|---|---|---|---|
| 1 | `curriculum/courses/commercial-and-office-cleaning/C17-L04.json` (option text; assessment unchanged) | C17-L04-K03 | 2 | 2 | Option 2 text changed from "By skipping the work" to "By avoiding excess orders and using approved, labelled bulk refills". | None of the four options was supported. Options 0 and 1 are contrary to the lesson, and option 2 named a non-action. The rewritten option 2 is the one the lesson supports, so the key index stays at 2. | C17-L04, "Reducing waste within the rules" and procedure: "Reduce waste through reuse, avoiding excess orders and approved, labelled bulk refills only." |
| 2 | `curriculum/shared/cleaning/F06-L04.json` (option text; assessment unchanged) | F06-L04-K03 | 0 | 0 | Option 0 text changed from "That it passed the checks in the procedure, but not that it is sanitised" to "Nothing by itself: a clean that looks finished is not automatically verified, and it does not show that the surface is sanitised". | Old option 0 said a clean-looking surface proves the procedure's checks passed. The lesson says a finished-looking clean is not automatically verified. Options 1 and 2 are wrong, so no option was correct before. | F06-L04, "Finishing and checking": "A clean that looks finished is not automatically verified." |
| 3 | `curriculum/assessments/F15-L04.assessment.json` (rationale only) | F15-L04-K02 | 1 | 1 | Rationale rewritten. | The old rationale described handover of hazards and unresolved items, not soiled clothing. Key 1 ("Change and bag contaminated clothing safely, and avoid carrying soil to the next site") is correct. | `shared/induction/F15-L04.json`, "Check, record and escalate" and procedure: "Change contaminated clothing safely, and avoid carrying soil between sites." |
| 4 | `curriculum/assessments/F16-L01.assessment.json` (rationale only) | F16-L01-K04 | 3 | 3 | Rationale rewritten. | The old rationale described a descaler on grease. The stem asks which choice is unsafe when heavy visible soil is present. Key 3 (disinfectant in place of soil removal) is correct. | `shared/chemicals/F16-L01.json`, core procedure: "Do not use a disinfectant in place of removing heavy visible soil, unless an approved combined process allows it." |

Validation after the edits: the four changed JSON files parse. `python3 -I /home/claude/work/check.py` reports `problemCount` 0 across 968 lessons. The single citation false positive that the audit recorded (NEW-DEK-01) is no longer reported, and no new problem appeared.

## Ambiguous (not changed)

| Check | File | Key | Note |
|---|---|---|---|
| CL2-04-K04 | `curriculum/assessments/CL2-04.assessment.json`; learner `shared/cleaning-guide/CL2-04.json` | 3 | Stem: "What does the lesson say about running the carpet unit?" Option 3 ("Never let the unit run without solution") is a literal match for the lesson sentence "Never let the unit run without solution, and never drive it over its own cord." Option 2 ("Drive it over its own cord to save time") is the other half of that same prohibition, so two options restate lesson rules. Key 3 is kept. Owner to choose: reword the stem, or reword option 2. |

## Observations (no key change)

- `curriculum/shared/marketing/CP-01.json`, check CP-01-K03, option 2 contains drafting text: "because the exact wording has not yet been confirmed". This is learner-visible. Key 2 is correct. Suggest rewording the option.
- Stale copies of the changed lessons, outside the check scope and not edited here (owner decision 16 covers rebuilding copies from source):
  - `curriculum/lessons/converted/F06-L04.json` and `curriculum/lessons/ready/F06-L04.json` still hold the old option 0 text.
  - `curriculum/lessons/converted/C17-L04.json` already shows the new option 2 text. There is no `lessons/ready/C17-L04.json`.
- Some stems are generic and do not name the answer, for example F15-L01-K05 ("Describe the record or escalation needed") and F15-L03-K03 ("Explain the task-specific decision"). Left as is.
- Worked-example `reasoning` fields in many of these lessons still read "Not yet written", as the RECHECK report also noted. Not a key issue, not changed.

## Skipped checks (already listed in the reports)

DIP-03-K01, F02-L04-K01, F02-L04-K02, F08-L02-K01, F14-L01-K02, F14-L04-K02, F15-L01-K01, F15-L01-K04, F15-L02-K01, F15-L02-K02, F15-L02-K04, F15-L03-K04, F15-L04-K01, F15-L04-K04, F15-L05-K01, F15-L05-K05, F15-L06-K01, F15-L06-K02, F15-L06-K04, F16-L01-K01, F16-L01-K02, F16-L01-K05, F16-L03-K03, F16-L03-K04, F16-L03-K05, F17-L01-K02, F17-L04-K01, F17-L05-K02, F17-L05-K03, F19-L01-K02, F19-L05-K01, F19-L05-K04, F19-L05-K05.

## Per-lesson record (reviewed keys; skipped keys in brackets where any)

additional-specialist-services-L01 3, additional-specialist-services-L04 3, additional-specialist-services-L10 3, aged-care-infection-control-L01 4, aged-care-infection-control-L02 3, aged-care-infection-control-L03 3, aged-care-infection-control-L04 3, aged-care-infection-control-L05 3, aged-care-infection-control-L06 3, aged-care-infection-control-L07 3, aged-care-infection-control-L08 3, aged-care-infection-control-L09 3, aged-care-infection-control-L10 3, aged-care-infection-control-L12 3, aquarium-cleaning-L03 3, aquarium-cleaning-L04 3, aquarium-cleaning-L07 3, aquarium-cleaning-L10 3, aquarium-cleaning-L11 3, C07-L01 3, C07-L03 3, C08-L01 3, C08-L02 3, C08-L03 3, C10-L01 3, C10-L02 3, C10-L03 3, C11-L01 3, C11-L04 4, C11-L06 3, C12-L04 3, C12-L05 3, C13-L01 4, C13-L02 4, C13-L03 4, C13-L04 4, C13-L05 3, C13-L06 4, C14-L01 3, C14-L02 3, C14-L03 3, C14-L04 3, C14-L05 3, C14-L06 3, C15-L01 5, C15-L05 5, C16-L01 4, C17-L04 3, C18-L01 3, C18-L02 4, C18-L06 3, C19-L01 3, C19-L02 3, C19-L03 3, C19-L05 3, C19-L06 3, CAR-BUS-04 3, CAR-BUS-05 3, car-detailing-L01 3, car-detailing-L02 3, car-detailing-L03 3, car-detailing-L04 3, car-detailing-L06 3, car-detailing-L07 3, car-detailing-L08 3, car-detailing-L09 3, car-detailing-L10 4, car-detailing-L12 3, CAR-NEW-01 3, CAR-NEW-02 3, CAR-NEW-03 4, CAR-NEW-04 3, CAR-NEW-05 3, CAR-NEW-06 3, CAR-NEW-07 3, CAR-NEW-08 4, CAR-NEW-09 3, CAR-NEW-10 4, CGC-01 3, CGC-02 3, CGC-03 3, CGC-04 3, CGC-05 3, CL2-01 3, CL2-02 3, CL2-03 3, CL2-04 4, CL2-05 3, CL2-06 3, construction-site-cleaning-L01 3, construction-site-cleaning-L02 3, construction-site-cleaning-L03 3, construction-site-cleaning-L04 3, construction-site-cleaning-L05 3, construction-site-cleaning-L06 3, construction-site-cleaning-L07 3, construction-site-cleaning-L08 3, construction-site-cleaning-L10 3, construction-site-cleaning-L11 3, CP-01 3, CP-02 3, CP-03 3, CP-04 4, CPV-01 3, CPV-02 3, CPV-03 3, CPV-04 3, CPV-05 3, CPV-06 3, CPV-07 4, CPV-08 3, custom-eco-cleaning-products-L03 2, custom-eco-cleaning-products-L10 2, DIP-01 3, DIP-02 3, DIP-03 2 [1 skipped], ECO-01 3, ECO-02 3, ECO-03 3, ECO-04 4, ECO-05 3, ECO-06 3, F01-L01 3, F01-L02 3, F01-L03 3, F01-L04 3, F02-L01 3, F02-L04 1 [2 skipped], F03-L03 3, F04-L01 3, F04-L02 3, F04-L03 3, F04-L04 3, F05-L01 3, F05-L02 3, F05-L03 3, F06-L01 3, F06-L02 3, F06-L03 4, F06-L04 3, F06-L05 4, F07-L01 3, F07-L03 3, F07-L05 3, F08-L02 2 [1 skipped], F08-L03 3, F08-L04 3, F08-L05 3, F10-L01 3, F10-L02 3, F10-L03 3, F10-L04 3, F11-L01 3, F11-L05 3, F12-L01 3, F12-L02 3, F12-L03 3, F12-L04 3, F12-L05 3, F12-L06 3, F13-L01 3, F13-L02 3, F13-L04 3, F13-L05 3, F14-L01 2 [1 skipped], F14-L02 3, F14-L04 2 [1 skipped], F14-L05 3, F15-L01 3 [2 skipped], F15-L02 2 [3 skipped], F15-L03 4 [1 skipped], F15-L04 3 [2 skipped], F15-L05 3 [2 skipped], F15-L06 2 [3 skipped], F16-L01 2 [3 skipped], F16-L03 2 [3 skipped], F17-L01 4 [1 skipped], F17-L02 3, F17-L03 3, F17-L04 4 [1 skipped], F17-L05 3 [2 skipped], F18-L01 3, F18-L05 3, F18-L06 3, F19-L01 4 [1 skipped], F19-L05 2 [3 skipped], F20-L05 3, F20-L06 3, food-processing-sanitation-L01 4, food-processing-sanitation-L08 3, food-processing-sanitation-L09 3, food-processing-sanitation-L10 3, food-processing-sanitation-L12 3, FPS-01 3, FPS-02 4, FPS-03 4, FPS-04 3, FPS-05 3, FPS-06 3, FPS-07 3, FPS-08 3.
