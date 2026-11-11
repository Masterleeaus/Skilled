# Titan Academy: assessment coverage audit

Status: audit of existing source material only. No assessment questions were written, no source files were edited, and nothing is approved for release.
Companion file: `/home/claude/work/team/assessment/ASSESSMENT-COVERAGE.csv` (487 rows, one per inventory lesson, same order as `/home/claude/work/out/WP-LESSON-INVENTORY.csv`).
Source root audited: `/home/claude/wp_src/titan-academy/titan-academy/`

## 1. Method and what the flags mean

- Lesson-level material: `{family}-lesson-NN-assessment-passN.json` and the assessment, formative and practical blocks inside lesson and instruction JSON.
- Course-level banks: `question_bank`, `practical_rubrics`, `remediation_paths` and `assessment_items` in `{family}-assessment(s)-passN.json`, linked to lessons by `lesson_id`.
- Cleaner curriculum (F/S/C): `knowledge_checks`, `practical_assessment`, and module-level `assessment` blocks in `foundation-content-*.json`, `course-specific-lessons-*.json`, `s12-*` and `s14-*`.
- Course packs: `cleaner-pack.json` (55 course modules, each with an MCQ `exam`, a one-question quiz and a `practical_rubric`). These are course-level, so they are not counted in the per-lesson counts.
- Duplicates were removed. Lesson-level files and course banks repeat the same item IDs, and instruction files repeat formative checks, so items are counted once per lesson.
- Flag definitions:
  - `has_knowledge_checks`: at least one knowledge or formative item attached to the lesson.
  - `count_questions`: unique items attached to the lesson (knowledge, scenario, practical observation, formative), including course-bank items linked by lesson. Module-level sets and cleaner-pack exams are not counted, so a lesson covered only at module or pack level shows FALSE in the lesson flags, and its gap_summary says so.
  - `has_answer_key`: at least one item carries an assessor-only field (answer, correct, model_answer, expected_response, expected_answer, expected_evidence, marking_criteria, marking_evidence, rationale).
  - `has_practical_rubric`: a criteria list, observation criteria, rating scale, or scoring rule for a practical task. This records presence only and does not judge quality.
  - `has_pass_criteria`: an explicit threshold or rule (pass_rule, decision_rule, pass_percent, passing or minimum points, knowledge_target_percent, pass_standard, scoring rule). A critical-failure list alone does not count.
  - `has_evidence_requirements`: an explicit evidence list (evidence_required, required_evidence, evidence). Research-file evidence lists were not counted.
- Method limits: the extraction is rule-based. I spot-checked about a dozen lessons against the source JSON, including pool-cleaning-L01, F01-L01, S12-L01, C01-L01, garden-cleanups-L01, car-detailing-L01, additional-specialist-services-L01, high-access-window-cleaning-L02, medical-dental-clinic-L04, plus the construction-site, pressure-cleaning and kitchen-exhaust banks and the F06 and F11 modules. Other rows are not hand-checked.
- An earlier pass missed course-bank items that use `lesson: N` or ids such as `AC75-L01-K`. That was fixed before the counts in this audit were taken, and the family-by-family source check was rerun afterwards.
- I tried a lexical test for "answer restated in lesson text" and dropped it. Shared vocabulary made the results too noisy to flag reliably, so the CSV contains no such flag.

## 2. Counts

| Group | Lessons | Knowledge checks | Items (count_questions) | Answer key | Practical rubric | Pass criteria | Evidence list |
|---|---|---|---|---|---|---|---|
| Cleaner curriculum, placed (F/S/C) | 121 | 121 | 276 | 121 | 121 | 52 | 28 |
| Foundation, not placed in any course | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| Specialty families, in scope, with material | 240 | 240 | 1,356 | 240 | 240 | 216 | 180 |
| Solar panel cleaning (research file only) | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| Excluded high-hazard families (see section 5) | 84 | 84 | 492 | 84 | 72 | 12 | 24 |
| **Total** | **487** | **445** | **2,124** | **445** | **433** | **280** | **232** |

Lessons with zero items: 42 (30 unplaced, 12 solar).

Where the specialty material comes from (in-scope, 240 lessons with material): 192 lessons sit in 16 families that have per-lesson assessment files. 228 are covered by a course bank. Four families (construction-site-cleaning, garden-cleanups, handyman-work, pressure-cleaning; 48 lessons) have course-bank coverage only. Laboratory-cleaning has per-lesson files and a course-level index file that points to them, with no bank items of its own. Each lesson's instruction JSON also carries formative checks, which are counted once per lesson.

Approval state: no `release_approved` flag is true in any assessment or lesson file (1,078 false values, none true). One file is publication-blocked: `food-processing-sanitation-assessments-pass84.json`.

## 3. Answer-key separation

Three publication paths hold keys, and each separates them differently.

1. **Cleaner curriculum (F/S/C), via `lesson-lms-sync.php`.** The sync renders only the question text of each knowledge check. Answer and rationale fields are excluded (lines 56 to 59, with a code comment saying so). A check of every rendered section for all 151 F/S/C lessons found no answer-type keys. Separation holds in code, but see the section 09 leak in section 4 (item R1).
2. **Specialty lesson and bank JSON.** The key sits in the same object as the prompt, and no learner-facing renderer for these files was found in the source. Separation is therefore not implemented. It must be built before any of these lessons are published. A separate batch importer (`assessment-batch-importer.php`, with preflight in `assessment-import-readiness.php`) can copy keyed items into a draft quiz; that path needs its own review.
3. **Course packs (`cleaner-pack.json`).** The MCQ `answer` index is not rendered. `assessments.php` and `cleaner-training.php` show options only.

Verify: the JSON files sit in the plugin root and this source tree has no `.htaccess` or web-deny rule. Whether the live host serves them directly was not checked. If it does, every key in section 2 is public.

## 4. Assessments that could be read as proof of competence from reading alone

These are the flags the brief asked for. R1 is the most serious.

- **R1. Expected answer in learner-visible text (121 placed F/S/C lessons).** `cleaner-training.php` seeds each pack module's `body` and `course_sections` into learner-visible training lessons. In `cleaner-01` to `cleaner-10`, section "09 Knowledge and scenario review" contains "Learner must explain: ..." followed by an answer-type statement (for example, the cleaner-01 text tells the learner what to confirm before approaching the property). Readers can take that as the expected answer.
- **R2. One-question quiz with unlimited retries (361 lessons: 121 placed F/S/C, 240 in-scope specialty).** Each pack module carries one three-option question with an `answer` index. `cleaner-training.php` marks the lesson "Knowledge check passed" on any correct click, with no attempt limit and no record of the correct answer. This can be passed by trial.
- **R3. Course MCQ exam shows "knowledge passed" (same 361 lessons).** `assessments.php` labels a module "knowledge passed" once a 13- or 17-item MCQ exam reaches the module's 85% threshold. The page says passing a written assessment does not grant practical competency, which is a helpful mitigation, but the label still reads as a pass.
- **R4. Distributed course checkpoints.** `distributed-assessments.php` shows "Knowledge checkpoint passed" for checkpoint stages. `PASS8-DISTRIBUTED-ASSESSMENTS.md` states that the pass does not link checkpoint completion to practical sign-off. Video practical and supervisor stages are displayed but not enforced, and video upload is not implemented.
- **R5. Practical criteria with no pass rule (93 in-scope lessons).** These are 69 placed F/S/C lessons and 24 specialty lessons (aged-care-infection-control and food-processing-sanitation). A knowledge-only pass could be applied to them.
- **R6. Module pass thresholds do not require practical sign-off (F01 to F10 and F15 to F20, 16 modules).** These modules set an 80% pass and flag `assessor_signoff_required: true`, but no field states that sign-off must pass for the module to pass.
- **R7. Knowledge checks are not scored.** The LMS sync prints knowledge-check questions with no answer capture and no score, under a heading reading "Knowledge checks — trainer review" that learners see. Nothing is recorded, so these cannot show competence.

Passing a knowledge check does not confer a credential in the code paths checked. `assessment-competencies.php` requires a matching competent practical review before a practical verification is recorded, and `certificate_eligible` is false in every foundation module.

## 5. Excluded families (84 lessons, 492 items)

The seven excluded families are biohazard-trauma-cleaning, crime-scene-cleaning, drug-contamination-remediation, fire-smoke-restoration, flood-water-restoration, hoarding-squalor and mould-remediation. `DECISIONS.md` excludes them from the build (84 source lessons). Their assessment files still sit in the source tree, and 60 of these lessons have rubrics without a pass rule. The CSV marks each row as excluded. These files should be quarantined so that they cannot be imported.

## 6. Main gaps, in priority order

1. **Answer leak in section 09 (R1).** Remove the "Learner must explain" answer text from learner-visible content for cleaner-01 to cleaner-10, and confirm that cleaner-training lessons only show the question and options.
2. **No learner-side separation for specialty keys.** Build a renderer that strips assessor fields, and verify that the JSON is not web-readable.
3. **No lesson pass rule.** 93 in-scope lessons have a rubric but no pass rule, including all of aged-care-infection-control (12) and food-processing-sanitation (12, which has a critical-failure rule only). Set the rule for each.
4. **No explicit evidence list.** 213 lessons with items have none: 93 placed F/S/C lessons, 60 in-scope specialty lessons (aged-care-infection-control, food-processing-sanitation, garden-cleanups, handyman-work and kitchen-cleaning), and 60 excluded-family lessons. Research files list assessment evidence for some of these (aged-care, food-processing, and two excluded families), but that evidence does not appear in the assessment items.
5. **Module pass rules not tied to practical sign-off (R6).** Make the practical sign-off a pass condition, or state that the knowledge pass is not competence.
6. **Unplaced foundation modules.** F11 to F13, F18 and F20 have 30 lessons with no lesson-level assessment, and their module sets (6 questions each) are not in any course. Decide whether they are placed before building checks for them.
7. **Checkpoint and practical linkage (R4).** Link checkpoint completion to practical sign-off, or relabel "Knowledge checkpoint passed" so it is not read as a competence pass.
8. **Excluded material in the source (section 5).** Quarantine.

## 7. Out of scope and unresolved

- `specialist-content-c11-c20.json` holds 10 course assessment blocks with 60 scenario questions and 30 practicals. These courses do not map to any of the 487 inventory lessons, so I left them out of the CSV. Their status should be decided with the course map.
- The published or seeded state of `tza_training_lesson` posts and of the course exams was not checked. The audit covers the code paths and the source JSON only.
- Nothing in the assessment material is approved. Every item marked `human_marking_required` or `assessor_review_required` still needs a qualified reviewer.

## 8. Memory

No memory facts were used in this audit.
