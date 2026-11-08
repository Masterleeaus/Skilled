-- Preflight for 20261108100200_academy_training_assignment_index_name. READ-ONLY. Static, unverified.
-- Shows which of the two names exists before the rename runs.
-- Run after 20261108090000_academy_tenant_company_rename, which renames the live index to the companyId form.
-- Expected: the companyId 58-character name exists and the new name is absent (the rename will run).
-- Expected after the migration: the new name exists and the companyId name is absent.
-- Expected if neither name appears: investigate. The index may have a different name, and the migration will do nothing.

SELECT c.relname AS index_name, length(c.relname) AS name_length, i.indisunique AS is_unique,
       pg_get_indexdef(c.oid) AS definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_index i ON i.indexrelid = c.oid
WHERE c.relkind = 'i'
  AND n.nspname = current_schema()
  AND c.relname IN (
    'academy_training_assignments_companyId_learnerId_courseId_',
    'academy_training_assignments_org_learner_course_key'
  );

-- Must return ZERO rows. Duplicate rows would also block the unique index, although the old index already enforces uniqueness.
SELECT "companyId", "learnerId", "courseId", COUNT(*) AS duplicates
FROM "academy_training_assignments"
GROUP BY "companyId", "learnerId", "courseId"
HAVING COUNT(*) > 1;
