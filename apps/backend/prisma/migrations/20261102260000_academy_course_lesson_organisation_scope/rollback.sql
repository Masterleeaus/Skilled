-- Reverses migration.sql. Run manually only if this migration must be unapplied; Prisma does not run it.
-- Run rollback.sql for 20261108090000_academy_tenant_company_rename first, so the column and foreign key have their
-- organisationId names here.
-- Restores the (courseId, sourceId) unique key that migration.sql dropped, and removes the organisation column,
-- its foreign key and the two new unique keys.
--
-- Refuses to run while any organisation-scoped row exists (organisationId IS NOT NULL). Such rows would be deleted
-- or merged to restore the old key, and that is a data decision for an operator, not for this script. Move or delete
-- those rows first, then run this file again.

DO $$
DECLARE
  scoped_rows bigint;
BEGIN
  IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'companyId'
     )
  THEN
    RAISE EXCEPTION 'rollback refused: run rollback.sql for 20261108090000_academy_tenant_company_rename first (column is still companyId)';
  END IF;

  IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'organisationId'
     )
  THEN
    EXECUTE 'SELECT count(*) FROM "academy_course_lesson_selections" WHERE "organisationId" IS NOT NULL' INTO scoped_rows;
    IF scoped_rows > 0 THEN
      RAISE EXCEPTION 'rollback refused: % organisation-scoped row(s) in academy_course_lesson_selections; resolve them first', scoped_rows;
    END IF;
  END IF;
END $$;

DROP INDEX IF EXISTS "academy_course_lesson_selections_course_default_key";
DROP INDEX IF EXISTS "academy_course_lesson_selections_organisationId_courseId_so_key";
DROP INDEX IF EXISTS "academy_course_lesson_selections_courseId_sourceId_idx";

ALTER TABLE "academy_course_lesson_selections" DROP CONSTRAINT IF EXISTS "academy_course_lesson_selections_organisationId_fkey";

-- Recreates the key that migration.sql dropped. Safe after the refusal check above: with no organisation-scoped
-- rows, every row is a course-wide default, and those are already unique on (courseId, sourceId).
CREATE UNIQUE INDEX IF NOT EXISTS "academy_course_lesson_selections_courseId_sourceId_key" ON "academy_course_lesson_selections"("courseId", "sourceId");

ALTER TABLE "academy_course_lesson_selections" DROP COLUMN IF EXISTS "organisationId";
