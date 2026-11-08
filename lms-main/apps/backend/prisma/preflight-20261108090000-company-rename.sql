-- Preflight for 20261108090000_academy_tenant_company_rename. READ-ONLY. Static, unverified.
-- Run BEFORE the rename migration. Raises an error (and so stops the run) when the target names already exist.
-- The rename is guarded, so a target that already exists would make it skip silently and leave the old names in place.
-- Run order: this file, then the rename migration, then preflight-20261108100000, -100100 and -100200, then those migrations.

DO $$
DECLARE
  t text;
  offenders text := '';
BEGIN
  -- Tables that are renamed, and the new names that must be absent.
  IF to_regclass('"academy_companies"') IS NOT NULL THEN
    offenders := offenders || 'academy_companies ';
  END IF;
  IF to_regclass('"academy_company_members"') IS NOT NULL THEN
    offenders := offenders || 'academy_company_members ';
  END IF;

  -- Columns that are renamed: companyId must not exist yet on any table.
  FOREACH t IN ARRAY ARRAY[
    'academy_organisation_members',
    'academy_company_members',
    'academy_training_assignments',
    'academy_verified_competencies',
    'academy_practical_evidence',
    'academy_external_identities',
    'academy_business_lesson_fields',
    'academy_lesson_context_snapshots',
    'academy_course_lesson_selections',
    'academy_template_responses',
    'academy_pathway_enrolments'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = t AND column_name = 'companyId'
    ) THEN
      offenders := offenders || t || '.companyId ';
    END IF;
  END LOOP;

  -- Integration columns that are renamed: companyRef must not exist yet.
  FOREACH t IN ARRAY ARRAY['academy_integration_audit', 'academy_service_credentials']
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = t AND column_name = 'companyRef'
    ) THEN
      offenders := offenders || t || '.companyRef ';
    END IF;
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION 'PREFLIGHT FAILED: target names already exist: %. Stop and investigate before running 20261108090000_academy_tenant_company_rename.', offenders;
  END IF;
END $$;

-- Informational: which of the renamed columns still carry the old name. Expected before the migration: one row per table.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND column_name IN ('organisationId', 'organisationRef')
ORDER BY table_name, column_name;
