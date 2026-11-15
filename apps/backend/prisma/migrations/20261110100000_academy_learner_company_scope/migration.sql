-- Learner-facing completion and knowledge-check rows gain a tenant company column.
-- Additive only: nullable column, FK, two indexes. Reversed by rollback.sql in this folder.
--
-- Backfill rule (conservative): a row gets a company only when exactly one organisation satisfies all of:
--   * the learner holds an ASSIGNED academy_training_assignments row in that organisation,
--   * that assignment's course places the row's lesson revision in a PUBLISHED curriculum track,
--   * the learner is a member (academy_company_members) of that organisation.
-- Rows with zero or several candidate organisations stay NULL. NULL rows are never returned to learners.

ALTER TABLE "academy_learner_completions" ADD COLUMN "companyId" TEXT;
ALTER TABLE "academy_knowledge_attempts" ADD COLUMN "companyId" TEXT;

CREATE INDEX "academy_learner_completions_companyId_learnerId_idx" ON "academy_learner_completions"("companyId", "learnerId");
CREATE INDEX "academy_knowledge_attempts_companyId_learnerId_idx" ON "academy_knowledge_attempts"("companyId", "learnerId");

ALTER TABLE "academy_learner_completions" ADD CONSTRAINT "academy_learner_completions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_knowledge_attempts" ADD CONSTRAINT "academy_knowledge_attempts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Completions
WITH pairs AS (
  SELECT DISTINCT c."id" AS "rowId", ta."companyId" AS "companyId"
  FROM "academy_learner_completions" c
  JOIN "academy_training_assignments" ta ON ta."learnerId" = c."learnerId" AND ta."status" = 'ASSIGNED'
  JOIN "academy_course_tracks" ct ON ct."courseId" = ta."courseId"
  JOIN "academy_curriculum_tracks" t ON t."id" = ct."trackId" AND t."status" = 'PUBLISHED'
  JOIN "academy_lesson_placements" lp ON lp."trackId" = ct."trackId" AND lp."lessonId" = c."lessonId" AND lp."revisionId" = c."revisionId"
  JOIN "academy_company_members" cm ON cm."companyId" = ta."companyId" AND cm."userId" = c."learnerId"
  WHERE c."companyId" IS NULL
),
single AS (
  SELECT "rowId", MIN("companyId") AS "companyId" FROM pairs GROUP BY "rowId" HAVING COUNT(DISTINCT "companyId") = 1
)
UPDATE "academy_learner_completions" c SET "companyId" = s."companyId" FROM single s WHERE c."id" = s."rowId";

-- Knowledge attempts (same rule, matched on the attempt's lesson revision)
WITH pairs AS (
  SELECT DISTINCT k."id" AS "rowId", ta."companyId" AS "companyId"
  FROM "academy_knowledge_attempts" k
  JOIN "academy_training_assignments" ta ON ta."learnerId" = k."learnerId" AND ta."status" = 'ASSIGNED'
  JOIN "academy_course_tracks" ct ON ct."courseId" = ta."courseId"
  JOIN "academy_curriculum_tracks" t ON t."id" = ct."trackId" AND t."status" = 'PUBLISHED'
  JOIN "academy_lesson_placements" lp ON lp."trackId" = ct."trackId" AND lp."lessonId" = k."lessonId" AND lp."revisionId" = k."revisionId"
  JOIN "academy_company_members" cm ON cm."companyId" = ta."companyId" AND cm."userId" = k."learnerId"
  WHERE k."companyId" IS NULL
),
single AS (
  SELECT "rowId", MIN("companyId") AS "companyId" FROM pairs GROUP BY "rowId" HAVING COUNT(DISTINCT "companyId") = 1
)
UPDATE "academy_knowledge_attempts" k SET "companyId" = s."companyId" FROM single s WHERE k."id" = s."rowId";
