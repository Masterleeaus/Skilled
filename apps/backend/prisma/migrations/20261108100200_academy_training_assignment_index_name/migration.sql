-- Index name truncation fix. Static, unverified.
--
-- Migration 20261102080000 created "academy_training_assignments_organisationId_learnerId_courseId_key"
-- (66 characters). PostgreSQL truncates identifiers to 63 bytes, so the live index was named
-- "academy_training_assignments_organisationId_learnerId_courseId_". Prisma expects the 66-character name,
-- which causes permanent drift. This migration renames the live index to a name under 63 characters,
-- and schema.prisma uses the same name through map: on @@unique([companyId, learnerId, courseId]).
-- 20261108090000_academy_tenant_company_rename runs first and renames that live index to
-- "academy_training_assignments_companyId_learnerId_courseId_", so old_name below is the companyId form.
--
-- Only the rename runs. The index is not dropped or rebuilt, and its definition is unchanged.
-- It is a no-op when the old name is absent, or when the new name already exists.
-- Run apps/backend/prisma/preflight-20261108100200-training-assignment-index-name.sql first.

DO $$
DECLARE
  old_name CONSTANT text := 'academy_training_assignments_companyId_learnerId_courseId_';
  new_name CONSTANT text := 'academy_training_assignments_org_learner_course_key';
BEGIN
  IF EXISTS (
       SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relkind = 'i' AND c.relname = old_name AND n.nspname = current_schema()
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relname = new_name AND n.nspname = current_schema()
     )
  THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', old_name, new_name);
  END IF;
END $$;
