-- Explicit minimum pass mark for certification. Existing assignments remain unconfigured.
ALTER TABLE "assignments" ADD COLUMN "passingMarks" INTEGER;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_passing_marks_valid" CHECK ("passingMarks" IS NULL OR ("passingMarks" >= 1 AND "passingMarks" <= "totalMarks"));
