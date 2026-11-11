# Titan Academy — cleaning lessons extracted from the WordPress plugin (Pass 6)

## What was added

Source: `Titan-Academy-Pass98-Cleaning-Cumulative.zip` (WordPress plugin, Pass 98). The source of truth for which lessons form the cleaning curriculum is its `cleaner-curriculum-inventory.json` (build 64).

Files added under `apps/backend/prisma/curriculum/cleaning/`:

| File | Contents | Audience |
| --- | --- | --- |
| `cleaning-lessons.learner.json` | 10 courses, 121 distinct lessons, 155 course placements, instruction sections, worked examples, guided practice, knowledge-check questions | Learner-visible after review |
| `cleaning-lessons.assessor.json` | Knowledge-check answers and rationales, model responses, practical assessment criteria, trainer feedback, evidence requirements, review flags | Assessors only, never learner-facing |
| `validate-cleaning-lessons.mjs` | Structural validator | CI and developers |

Run the validator from `apps/backend`:

```bash
npm run curriculum:validate-cleaning
```

Last run: PASSED, 121 lessons, 155 placements, 276 knowledge questions, each with an assessor answer. It also reports 24 warnings (see below).

## What was preserved

- Every source text value from the 121 lessons is present in the output (4,436 of 4,436 checked).
- Lesson IDs keep their WordPress identifiers (`F01-L01`, `C05-L03`, `S12-L02`) so they stay traceable to the source.
- Knowledge-check answers and rationales were moved out of the learner file into the assessor file.
- Nothing in the existing TypeScript importer, migrations or brief inventory (`titan-three-layer-lessons.json`) was changed.

## What was not done

- **Not imported into PostgreSQL.** No database was available for this build. The existing importer still loads only the 221 brief rows.
- **No layer assignment.** Each lesson carries a `suggestedLayer` only. Agent 1 (Curriculum Architect) must decide between Layer 1, Layer 2 and Layer 3.
- **No reconciliation with the 221 briefs.** The brief IDs (`U01-01` and so on) and the WordPress IDs have not been mapped to each other.
- **Not reviewed.** Every lesson is `DRAFT`. Most source lessons are marked as pending technical review. Nothing here implies completion, certification or permission to undertake regulated work.
- **Not tested in WordPress or the TypeScript app.** The validator checks the JSON only.

## Source gaps to resolve

- 24 lessons in F15, F16, F17 and F19 have no learning outcomes in the source. The validator reports these as warnings. Outcomes should be written by a subject-matter expert and not generated here.
- 31 lessons have no editorial status in the source.

## Decisions needed

30 lessons in the WordPress source are not part of any cleaning course and were left out:

- **F11 (6 lessons):** service offer, customer discovery, pricing. Looks like business content.
- **F12 (6 lessons):** employment awareness, pay and recordkeeping, WHS duties. Looks like business and workforce content.
- **F13 (6 lessons):** environmental impact, product selection, dosing and dilution. Dosing and dilution looks like cleaning content.
- **F18 (6 lessons):** kit classes, task-to-item mapping, segregation and colour coding.
- **F20 (6 lessons):** routine cleaning, inspection and defect isolation, preventive maintenance. Looks like cleaning content.

Confirm whether F13 and F20 should join the cleaning courses, and whether F11 and F12 belong in the shared business foundations.
