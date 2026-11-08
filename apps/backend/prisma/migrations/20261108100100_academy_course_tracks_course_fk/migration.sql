-- Foreign key academy_course_tracks.courseId -> courses.id. Static, unverified.
--
-- Added as NOT VALID: new and updated rows are checked straight away, but existing rows are not scanned,
-- so pre-existing orphan rows do not block this migration. VALIDATE CONSTRAINT is NOT run here.
-- Run apps/backend/prisma/preflight-20261108100100-course-tracks-fk.sql first. When it returns zero rows,
-- a human enables apps/backend/prisma/disabled-migrations/20261108100400_DISABLED_academy_course_tracks_fk_validate.sql.
-- ON DELETE CASCADE mirrors academy_course_lesson_selections_courseId_fkey. Deleting a course removes its track links.
-- The unique index on (courseId, trackId) already leads with courseId, so no extra index is needed.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academy_course_tracks_courseId_fkey'
      AND conrelid = '"academy_course_tracks"'::regclass
  ) THEN
    ALTER TABLE "academy_course_tracks"
      ADD CONSTRAINT "academy_course_tracks_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
  END IF;
END $$;
