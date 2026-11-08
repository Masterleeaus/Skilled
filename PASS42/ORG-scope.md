# PASS42 course lesson selection: organisation scope

Date: 2026-11-02. Scope: `apps/backend` (schema, one new migration, course-selection module, outline and progress reads, tests). No git commits, no memory tools, no secrets in files, no lesson, course-map, level-file, trial, reviewer, gate-service or frontend edits.

Decision applied: each organisation keeps its own lesson selection for a course. An organisation owner changes only their own organisation's selection. The course-wide selection is no longer shared between organisations.

Backups before edits: `/home/claude/work/org-scope-backup/` (`prisma/` and `course-selection/`, as they were before this work).

## Migration

- Name: `20261102260000_academy_course_lesson_organisation_scope` (latest existing folder was `20261102250000_academy_course_lesson_selection`).
- Status: WRITTEN, NOT APPLIED. See "Database" below.
- Additive for existing data: one nullable column `organisationId`, no default. Every existing row keeps NULL, so it stays the course-wide default. No row is deleted or re-scoped, and no backfill to any organisation is made (nothing is invented).
- Replaces the unique key `(courseId, sourceId)` with:
  - `academy_course_lesson_selections_courseId_sourceId_idx` (plain index, keeps the gate loader's `courseId` lookups indexed);
  - `academy_course_lesson_selections_organisationId_courseId_so_key` on `(organisationId, courseId, sourceId)` (Prisma name, truncated to 63 characters);
  - `academy_course_lesson_selections_course_default_key` on `(courseId, sourceId) WHERE organisationId IS NULL`. A plain unique key treats NULLs as distinct, so this partial index keeps course-wide rows unique. Prisma 6.19 cannot express partial indexes, so this exists in the SQL only.
- Foreign key `organisationId` to `academy_organisations`, ON DELETE RESTRICT (same as the other organisation relations).
- Excluded on purpose: the four pre-existing index renames Prisma reports (see `PASS42/SCHEMA-design.md`).

## Schema

- `AcademyCourseLessonSelection`: added `organisationId String?` and relation `organisation`; unique key now `[organisationId, courseId, sourceId]`; added `@@index([courseId, sourceId])`.
- `AcademyOrganisation`: back-relation `courseLessonSelections`.
- `prisma validate`: valid. `prisma format --check`: formatted. `prisma format` touched only the changed model and the organisation back-relation.
- `prisma migrate diff --from-schema-datamodel <backup> --to-schema-datamodel <new> --script`: produced the same operations as the migration file.
- `prisma generate`: run.

## Service and routes

- Scope is either one organisation or the course-wide default (NULL).
- `resolveManageScope`:
  - A platform ADMIN or the course's teacher manages the course-wide default (no `organisationId`), or any assigned organisation's selection (`organisationId` named).
  - An OWNER of an organisation manages only that organisation, and must name it. Owner membership is checked before assignment, so an owner learns nothing about another organisation's assignments.
  - The course must be assigned to the named organisation, otherwise 403.
  - Everyone else, including learners: 403.
- Reads: `GET .../lesson-pool?organisationId=` and `GET .../lesson-selection?organisationId=`.
- Save: `PUT .../lesson-selection` with `organisationId` in the body. It replaces only that scope's rows, in one transaction.
- Response: `organisationId`, `source` (`ORGANISATION`, `COURSE_DEFAULT`, `FULL_LEVEL`), `usesFullLevel`, `sourceIds` (the lessons that apply), `ownSelection`, `savedAt`, `countsByLevel`.
- `namedOrganisation`: a non-string or empty `organisationId` is refused with 422 (it does not fall back to course-wide).
- `loadSavedSelection(courseId, learnerId)` (outline and progress): the learner's organisation selection, else the course-wide default, else undefined (full level). A learner's organisation is the one on their earliest training assignment for the course.
- Callers updated: `curriculum.routes.ts` (outline) and `completion-report.service.ts` (`buildCourseLessonProgress`) now pass `learnerId`.

## Tests

- `src/tests/academy-course-selection.test.ts`: org-owner save rewritten for the named organisation; new describe "organisation scope" (7 tests):
  - organisation A's change does not affect organisation B;
  - the course-wide default applies to an organisation with no selection of its own;
  - a learner gets their organisation's selection, or the full level when none applies;
  - an organisation owner is refused the course-wide default and another organisation's selection, on read and write;
  - the course teacher manages a named organisation without touching the default;
  - a refused save keeps the previous organisation selection;
  - a non-string `organisationId` is refused.
- `src/tests/academy-course-selection-http.test.ts`: owner save now names the organisation; new test that an owner saving without naming their organisation gets 403; new outline test that an organisation's selection overrides the course-wide default for its learners.
- `src/tests/support/fake-prisma.ts`: unique key for the model is now `[organisationId, courseId, sourceId]`. The double treats NULL as equal, matching the partial index.

Results:
- Affected suites (selection service, selection HTTP, levels, course progress, completion report, enrolment progress): 6 files, 108 passed, 0 failed.
- Full backend `npx vitest run`: 16 files passed, 275 tests passed. 7 files fail to load, all as recorded before: `auth.test.ts` and `health.test.ts` (required environment variables missing), and five `integration/*.test.ts` suites (need a live PostgreSQL database, see "Database").
- Mutation check: removing the organisation filter from the read made 4 tests fail. File restored, checksum verified.
- `npm run build` (backend): exit 0. `npm run typecheck:tests`: exit 0.
- Logs: `/home/claude/work/org-scope-build.txt`, `/home/claude/work/org-scope-typecheck.txt`, `/home/claude/work/org-scope-vitest.txt`.

## Database

- Not done: the migration has not been applied to any database, and no scratch database was created.
- The `lms_test` role's password is not available to this session. The project notes (`PASS42/BACKEND-tests-fix.md`) record that the test role password is rejected. Local socket access is not available to this session. I did not look for other credentials, and did not create roles or start a new cluster.
- Still to run by someone with the test role password, against a database whose name contains "test" (not `lms_trial`):
  1. `DATABASE_URL=<scratch test url> npx prisma migrate deploy` (applies all 20 migration folders in order);
  2. confirm the three new indexes exist and the old key `academy_course_lesson_selections_courseId_sourceId_key` is gone;
  3. `npx prisma migrate status`.
- Do not use `prisma migrate dev` to check drift: it will propose dropping the partial index `academy_course_lesson_selections_course_default_key`, because Prisma cannot model it. Use `migrate deploy` only.

## Blocker: gate loader (not edited)

- `apps/backend/src/modules/levels/level.service.ts`, `loadCourseSelections` (lines 57-70), reads `academyCourseLessonSelection` by `courseId` only and merges every row into one set per course.
- After this migration, organisation rows are merged into the course selection for every learner, including learners in other organisations and learners with no organisation. The gate would apply one organisation's selection to everyone.
- The gate owner must change it to resolve each learner's selection with the same rule as `loadSavedSelection` (learner's organisation rows, then course-wide rows, then the full level), and add a test for it.
- Until then, do not release this migration to an environment where any organisation has saved a selection.

## Decisions for review

1. Existing rows: kept as the course-wide default (organisationId NULL). Nothing is assigned to an organisation.
2. Organisation owners must name their organisation. They can no longer change the course-wide default, which closes the cross-organisation write noted in `PASS42/CUSTOMISE-fix.md`.
3. Course teacher and platform admin keep the course-wide default and may manage any assigned organisation's selection.
4. A learner's organisation is the organisation on their earliest training assignment for the course. A learner assigned to the same course through two organisations gets the earlier one's selection.
5. Organisation foreign key is ON DELETE RESTRICT, consistent with the other organisation relations.
6. There is no endpoint to remove an organisation's own selection and return it to the course-wide default. Add one if that is needed.
7. The organisation completion roll-up (`buildLearnerCompletionReport`) still uses all course slots, as recorded in `PASS42/CUSTOMISE-fix.md`. Unchanged here.
8. The partial unique index exists in SQL only, so Prisma's drift check will report it (see "Database").

## Files changed

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20261102260000_academy_course_lesson_organisation_scope/migration.sql` (new)
- `apps/backend/src/modules/course-selection/course-selection.service.ts`
- `apps/backend/src/modules/course-selection/course-selection.routes.ts`
- `apps/backend/src/modules/curriculum/curriculum.routes.ts` (one line: `loadSavedSelection(course.id, learnerId)`)
- `apps/backend/src/modules/curriculum/completion-report.service.ts` (one line: `loadSavedSelection(courseId, learnerId)`)
- `apps/backend/src/tests/academy-course-selection.test.ts`
- `apps/backend/src/tests/academy-course-selection-http.test.ts`
- `apps/backend/src/tests/support/fake-prisma.ts`
- `PASS42/ORG-scope.md` (this file)
