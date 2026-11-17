-- Reverses migration.sql. Run manually only if this migration must be unapplied; Prisma does not run it.
-- Renames the training assignment unique index back to the companyId name that 20261108090000 leaves in place.
-- Only the rename is reversed. The index definition is unchanged. It is a no-op when the old name is absent, or
-- when the companyId name already exists.
-- Run this before rollback.sql for 20261108090000_academy_tenant_company_rename, because that file expects the
-- companyId index name.

DO $$
DECLARE
  current_name CONSTANT text := 'academy_training_assignments_org_learner_course_key';
  restore_name CONSTANT text := 'academy_training_assignments_companyId_learnerId_courseId_';
BEGIN
  IF EXISTS (
       SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relkind = 'i' AND c.relname = current_name AND n.nspname = current_schema()
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relname = restore_name AND n.nspname = current_schema()
     )
  THEN
    EXECUTE format('ALTER INDEX %I RENAME TO %I', current_name, restore_name);
  END IF;
END $$;
