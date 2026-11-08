-- Preflight for 20261108100100_academy_course_tracks_course_fk. READ-ONLY. Static, unverified.
-- Must return ZERO rows before the VALIDATE step in disabled-migrations/20261108100400_DISABLED_academy_course_tracks_fk_validate.sql is enabled.
-- The NOT VALID constraint in the migration does not need this to be zero, but VALIDATE fails while orphans exist.

-- Orphan academy_course_tracks rows: courseId has no matching courses.id.
SELECT ct."id", ct."courseId", ct."trackId", ct."position", ct."createdAt"
FROM "academy_course_tracks" ct
LEFT JOIN "courses" c ON c."id" = ct."courseId"
WHERE c."id" IS NULL
ORDER BY ct."createdAt";

-- Informational: confirm the constraint state after the migration. convalidated = false means NOT VALID, not yet checked.
SELECT conname, convalidated
FROM pg_constraint
WHERE conname = 'academy_course_tracks_courseId_fkey'
  AND conrelid = '"academy_course_tracks"'::regclass;
