# MERGE-C: apps/backend/prisma/schema.prisma

Owner: merge team member C. Only this file was edited. No migrations, curriculum, level CSVs or hash-fix files were touched. Nothing was committed.

Backup: /home/claude/work/merge-C-backup/schema.prisma (pre-merge OURS, 1018 lines).
Result file: /home/claude/p29m/lms-main/apps/backend/prisma/schema.prisma (1022 lines after `prisma format`).

## Method

- Whitespace-normalised comparison of every `model` and `enum` block, OURS vs THEIRS (`/home/claude/work/merge-C-tools/parse.py`).
- Only differences in content (not alignment) were treated as real changes. Prisma column alignment differs across the two trees and is not a change.
- Enums: no differences.

## Pass 56 changes carried into OURS (THEIRS-only content)

| Model | Line (OURS, after) | Change | Migration that creates it |
|---|---|---|---|
| Answer | 355 | `selectedOptionIds Json? @map("selected_option_ids")` | 20261102230000_academy_multiple_choice_answers |
| Answer | 360 | `@@unique([attemptId, questionId])` | 20261102220000_academy_quiz_answer_uniqueness |
| Assignment | 378 | `passingMarks Int? // Null on legacy records until explicitly configured by teacher` | 20261102240000_assignment_passing_marks |
| Certificate | 464 | `@@unique([studentId, courseId])` | 20261102210000_academy_certificate_idempotency |

Note on the manifest: PASS56-CHANGE-MANIFEST.json records the schema as +1 line. The semantic delta between OURS and THEIRS is four items. The other three (Answer, Answer unique, Certificate unique) are required by Pass 56 migrations 210000, 220000 and 230000, so they were carried in as well.

## Our content kept (no removals)

- Models only in OURS (kept whole): AcademyLessonReview 895-909, AcademyTemplateResponse 912-935, AcademyTemplateSignOff 938-955, AcademyGeneratedDocument 958-972, AcademyCurriculumPathway 975-987, AcademyPathwayCourse 990-1003, AcademyPathwayEnrolment 1006-1022.
- Relation fields added to existing models only in OURS: User (academyLessonReviews, academyTemplateResponses, academyTemplateSignOffs, academyPathwayEnrolments); AcademyContentLesson (templateResponses); AcademyLessonRevision (lessonReviews, templateResponses); AcademyPracticalEvidence (templateSignOffs); AcademyOrganisation (pathwayEnrolments, templateResponses).
- Shared Academy models (AcademyContentLesson 594-615 through AcademyLessonContextSnapshot 881-892, plus AcademyKnowledgeAttempt 704-718) match THEIRS field for field.
- Net diff OURS vs backup: additions only (4 items above). Verified: 0 items removed, 61 models before and after.

## Checks

- `prisma validate`: plain run fails with `Environment variable not found: DATABASE_URL` (env-only, not a schema error). Re-run with a placeholder `DATABASE_URL` for validation: "The schema at prisma/schema.prisma is valid".
- `prisma format`: ran, reformatted alignment only (no content change).
- `prisma generate`: Generated Prisma Client (v6.19.3) successfully.

## Migration cross-check (static, `/home/claude/work/merge-C-tools/migcheck.py`)

Migrations were replayed in order (18 folders). No database was created (shared Postgres on the host was not touched). Results after the merge:

- No schema field or index missing from migrations. No migration column or index missing from the schema.
- Items the schema cannot represent (in migrations only, by design):
  - `quiz_attempts_one_active_per_student_quiz_key`: partial unique index on `quiz_attempts(studentId, quizId) WHERE status = 'IN_PROGRESS'` (migration 20261102220000).
  - `assignments_passing_marks_valid`: CHECK constraint on `passingMarks` (migration 20261102240000).
- Control: the pre-merge backup flags exactly the four Pass 56 items against our migrations, so the checker detects drift.

## Migration folder notes (for member A and the lead)

- OURS and THEIRS have the four Pass 56 folders (210000, 220000, 230000, 240000), and they are byte-identical between trees.
- THEIRS has `20261102060000_academy_knowledge_attempts`, which OURS lacks. OURS has `20261102200000_academy_template_pathway_review`, which THEIRS lacks. Both are needed. The schema has the models for both (AcademyKnowledgeAttempt, and the template/pathway models).

## Preflight warnings (from migration comments)

- Certificate unique index: review duplicate (studentId, courseId) rows before applying to any populated Academy database. Never run against Field or Desk.
- Answer unique index: preflight for duplicate (attemptId, questionId) rows.
