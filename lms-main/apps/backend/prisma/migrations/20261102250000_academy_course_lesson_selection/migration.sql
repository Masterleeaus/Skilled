-- PASS42 course lesson selection. Additive only: a course with no rows keeps its full level CSV.
-- The four pre-existing index renames Prisma reports are deliberately not included (see PASS42/SCHEMA-design.md).

-- CreateTable
CREATE TABLE "academy_course_lesson_selections" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "savedById" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_course_lesson_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academy_course_lesson_selections_savedById_idx" ON "academy_course_lesson_selections"("savedById");

-- CreateIndex
CREATE UNIQUE INDEX "academy_course_lesson_selections_courseId_sourceId_key" ON "academy_course_lesson_selections"("courseId", "sourceId");

-- AddForeignKey
ALTER TABLE "academy_course_lesson_selections" ADD CONSTRAINT "academy_course_lesson_selections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_course_lesson_selections" ADD CONSTRAINT "academy_course_lesson_selections_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
