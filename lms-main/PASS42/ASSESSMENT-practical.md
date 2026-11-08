# PASS42: practical evidence mapping and competency sign-off (ACA-012, ACA-013)

Scope: assessment and competency backend code, the assessor frontend page, and their tests. No changes to `schema.prisma`, migrations, the template renderer, pathways, review and publication, field-service integration, curriculum data files, or the quality and ops tests.

## Files changed

| File | Change |
|---|---|
| `apps/backend/src/modules/curriculum/curriculum.routes.ts` | Review route (APPROVED branch) now re-reads the evidence row inside the transaction and calls `assertCompetencyAwardable` before creating `AcademyVerifiedCompetency`. The competency references the re-read row's id. Import added. |
| `apps/backend/src/modules/curriculum/assessment-evidence.ts` | New. Pure functions: `mapLessonEvidence`, `courseEvidenceStatus`, `buildEvidenceReport`, `assertCompetencyAwardable`. |
| `apps/backend/scripts/assessment-evidence-report.ts` | New. Read-only report over `curriculum/assessments/*.assessment.json` and lesson files (course membership from `courseSlugs`). Prints JSON. |
| `apps/backend/src/tests/aca-012-013-assessment-evidence.test.ts` | New. 18 tests (see below). |
| `apps/frontend/src/lib/assessor.api.ts` | New. Pending list and review calls. |
| `apps/frontend/src/app/academy/assessor/page.tsx` | New. Assessor page at `/academy/assessor`. |

Backup of the one pre-existing file edited: `/home/claude/work/assess-pass42-backup/apps/backend/src/modules/curriculum/curriculum.routes.ts`.

## Mapping report (ACA-012)

Command: `cd apps/backend && npx tsx scripts/assessment-evidence-report.ts`

| Measure | Count |
|---|---|
| Assessment files | 894 |
| Lessons with a course membership (`courseSlugs`) | 894 |
| Course-linked lessons with no assessment file | 0 |
| Courses | 43 |
| Courses complete (no required lesson lacks an evidence type) | 34 |
| Courses with a gap | 9 |
| Lessons requiring practical evidence (practical criteria or evidence list present) | 852 |
| Lessons with at least one evidence type | 783 |
| Lessons requiring evidence with no evidence type (gap) | 69 |
| Knowledge-only lessons (no criteria, no evidence) | 6 |
| Lessons with no knowledge checks (the 80% rule cannot be met) | 20 |
| Knowledge-check count mismatch, lesson file vs assessment file | 0 |

Courses with gaps (gap lessons per course; lessons shared across courses are counted in each):
- window (all heights): 31
- solar: 20
- pressure: 8
- handyman: 6
- roof: 4
- garden, lawn, landscaping, irrigation: 1 each (all `handyman-work-L04`)

Lessons with no knowledge checks: `PBP-TPL-01`, `RAS-17`, `WAH-TPL-01`, and `TPL-01` to `TPL-17`.

Evidence types are the `evidenceRequired` lines, keyed by a slug of each line. The schema has no evidence-type column and must not change, so the mapping lives in code and in this report, not in the database.

## Competency rule as implemented (ACA-013)

- The only path that creates `AcademyVerifiedCompetency` is the review route, `POST /api/academy/curriculum/organisations/:organisationId/practical-evidence/:id/review`. There is no direct create endpoint.
- The route requires an ORG `OWNER`, `MANAGER` or `ASSESSOR` membership, and the evidence must be `PENDING`, in the same organisation, and not owned by the reviewer.
- A competency is created only for `APPROVED`, in the same transaction. `assertCompetencyAwardable` checks that the row is `APPROVED`, that `assessorId` is the acting assessor, and that the learner is not that assessor.
- Rejection creates no competency. A second decision on the same evidence is refused.

## Knowledge pass rule (80%)

Finding: the existing scoring in `POST /knowledge-checks/attempts` (`score / total >= 0.8`) already matches "80% on knowledge checks". For three checks it passes only at 3 of 3. For five checks it passes at 4 of 5. Left unchanged. The test suite confirms both cases.

Not covered: `quiz.service.ts` stores `passingMarks` but `submitAttempt` never compares it with the score, so course quizzes record marks without a pass decision. This is a separate rule from the lesson knowledge checks and was not changed.

## Tests run

- `npx vitest run src/tests/aca-012-013-assessment-evidence.test.ts`: 18 passed, 0 failed.
  - Mapping with evidence, without evidence, and knowledge-only; course gap and missing-file handling; report counts.
  - Guard: pending, rejected, other assessor, self-assessor, valid.
  - Route: award refused for a rejected decision, refused after rejection, refused on a second approval; one competency only; award references the evidence id; learner cannot approve own evidence; assessor cannot approve own evidence; pending list is role-gated and excludes the caller's own evidence.
  - 80% rule: three checks (2 of 3 fails, 3 of 3 passes), five checks (4 of 5 passes, 3 of 5 fails), knowledge pass creates no competency.
- Full backend suite: 174 tests passed, 0 failed. 8 files fail at load and were already failing before this work:
  - 5 integration files need `DATABASE_URL` (a disposable test database).
  - `auth.test.ts` and `health.test.ts` exit on environment config.
  - `tests/pass22-inactive-identity.test.cjs` contains no vitest suite.
- Backend type check: the repo's `npm run build` fails before reaching code, because the installed TypeScript 7.0.2 rejects `tsconfig.json` (TS5108, TS5102, TS5090) and `rootDir` (TS6059). Using TypeScript 5.9.3 from the frontend's dependencies against a temporary config in `/home/claude/work/tscheck`: 140 errors, all in existing modules (Express 5 `req.params` typing, JWT signing, missing types). None in the files changed here.
- Frontend: `tsc --noEmit` reports 0 errors. `next build` succeeded and compiled `/academy/assessor`. The build wrote `apps/frontend/.next`.
- Lint: neither project has an ESLint config, so lint was not run.

## Open

1. Evidence types are not recorded on approval, and the award does not check the lesson's mapping at runtime. The backend has no access to curriculum files. Adding this needs a generated mapping module, and the schema would need an evidence-type column to store the choice.
2. Course-level practical sign-off is not shown by any endpoint. It needs course-to-lesson data at runtime (`AcademyCourseTrack`) and the mapping from item 1.
3. The curriculum files carry no `required` flag. The report treats every course-linked lesson as required. The database flags `AcademyCourseTrack.required` and `AcademyLessonPlacement.required` are not consulted.
4. 69 lessons require evidence but list none, across 9 courses (see above). Content owners must add evidence lines.
5. 20 lessons have no knowledge checks, so the server refuses every attempt and the 80% rule cannot be met. Content owners must add checks or change the pass rule.
6. The pending list returns `learnerId` only, so the assessor page shows a learner reference, not a name.
7. Tests use the in-memory Prisma double, not PostgreSQL. Transaction and isolation behaviour is not proven on a real database (ACA-003).
8. The assessor page has no automated UI tests and has not been checked with a screen reader or keyboard-only run.
