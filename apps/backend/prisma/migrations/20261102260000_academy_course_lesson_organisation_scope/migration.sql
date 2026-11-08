-- PASS42 organisation scope for course lesson selections.
-- Additive for existing data: the new column is nullable with no default, and every existing row keeps
-- organisationId NULL, so it stays the course-wide default. No row is deleted or re-scoped.
-- The old unique key (courseId, sourceId) is replaced by a non-unique index plus two unique keys:
--   * (organisationId, courseId, sourceId) for organisation rows (Prisma key);
--   * (courseId, sourceId) WHERE organisationId IS NULL for course-wide rows. A plain unique key would
--     treat NULLs as distinct, so this partial index keeps course-wide rows unique. Prisma cannot express it.
-- Prisma reports the four pre-existing index renames as drift (see PASS42/SCHEMA-design.md). They are excluded here.

-- AlterTable
ALTER TABLE "academy_course_lesson_selections" ADD COLUMN "organisationId" TEXT;

-- DropIndex
DROP INDEX "academy_course_lesson_selections_courseId_sourceId_key";

-- CreateIndex
CREATE INDEX "academy_course_lesson_selections_courseId_sourceId_idx" ON "academy_course_lesson_selections"("courseId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_course_lesson_selections_organisationId_courseId_so_key" ON "academy_course_lesson_selections"("organisationId", "courseId", "sourceId");

-- CreateIndex (course-wide default rows; keeps the uniqueness the old key gave them)
CREATE UNIQUE INDEX "academy_course_lesson_selections_course_default_key" ON "academy_course_lesson_selections"("courseId", "sourceId") WHERE "organisationId" IS NULL;

-- AddForeignKey
ALTER TABLE "academy_course_lesson_selections" ADD CONSTRAINT "academy_course_lesson_selections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "academy_organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
