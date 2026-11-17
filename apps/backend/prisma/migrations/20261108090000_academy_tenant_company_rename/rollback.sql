-- Reverses migration.sql. Run manually only if this migration must be unapplied; Prisma does not run it.
-- Run rollback.sql for 20261108100200_academy_training_assignment_index_name first, so the training assignment index
-- has its companyId name before this file renames it back.
-- Renames every table, column, primary key, index and foreign key back to its organisation name, in the reverse of
-- migration.sql order. Data is not changed. Every statement is guarded: it runs only when the current name exists and
-- the original name does not, so a re-run is a no-op.
-- Preflight: this reverses names only. The companyId columns and the academy_companies tables keep their rows.

-- 1. Foreign key constraints

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_company_members_companyId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisation_members_organisationId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
  THEN
    ALTER TABLE "academy_company_members" RENAME CONSTRAINT "academy_company_members_companyId_fkey" TO "academy_organisation_members_organisationId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_company_members_userId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisation_members_userId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
  THEN
    ALTER TABLE "academy_company_members" RENAME CONSTRAINT "academy_company_members_userId_fkey" TO "academy_organisation_members_userId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_training_assignments_companyId_fkey' AND conrelid = to_regclass('"academy_training_assignments"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_training_assignments_organisationId_fkey' AND conrelid = to_regclass('"academy_training_assignments"'))
  THEN
    ALTER TABLE "academy_training_assignments" RENAME CONSTRAINT "academy_training_assignments_companyId_fkey" TO "academy_training_assignments_organisationId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_verified_competencies_companyId_fkey' AND conrelid = to_regclass('"academy_verified_competencies"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_verified_competencies_organisationId_fkey' AND conrelid = to_regclass('"academy_verified_competencies"'))
  THEN
    ALTER TABLE "academy_verified_competencies" RENAME CONSTRAINT "academy_verified_competencies_companyId_fkey" TO "academy_verified_competencies_organisationId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_practical_evidence_companyId_fkey' AND conrelid = to_regclass('"academy_practical_evidence"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_practical_evidence_organisationId_fkey' AND conrelid = to_regclass('"academy_practical_evidence"'))
  THEN
    ALTER TABLE "academy_practical_evidence" RENAME CONSTRAINT "academy_practical_evidence_companyId_fkey" TO "academy_practical_evidence_organisationId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_template_responses_companyId_fkey' AND conrelid = to_regclass('"academy_template_responses"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_template_responses_organisationId_fkey' AND conrelid = to_regclass('"academy_template_responses"'))
  THEN
    ALTER TABLE "academy_template_responses" RENAME CONSTRAINT "academy_template_responses_companyId_fkey" TO "academy_template_responses_organisationId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_pathway_enrolments_companyId_fkey' AND conrelid = to_regclass('"academy_pathway_enrolments"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_pathway_enrolments_organisationId_fkey' AND conrelid = to_regclass('"academy_pathway_enrolments"'))
  THEN
    ALTER TABLE "academy_pathway_enrolments" RENAME CONSTRAINT "academy_pathway_enrolments_companyId_fkey" TO "academy_pathway_enrolments_organisationId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_course_lesson_selections_companyId_fkey' AND conrelid = to_regclass('"academy_course_lesson_selections"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_course_lesson_selections_organisationId_fkey' AND conrelid = to_regclass('"academy_course_lesson_selections"'))
  THEN
    ALTER TABLE "academy_course_lesson_selections" RENAME CONSTRAINT "academy_course_lesson_selections_companyId_fkey" TO "academy_course_lesson_selections_organisationId_fkey";
  END IF;
END $$;

-- 2. Indexes

DO $$
BEGIN
  IF to_regclass('"academy_companies_externalRef_key"') IS NOT NULL AND to_regclass('"academy_organisations_externalRef_key"') IS NULL THEN
    ALTER INDEX "academy_companies_externalRef_key" RENAME TO "academy_organisations_externalRef_key";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_company_members_companyId_userId_key"') IS NOT NULL AND to_regclass('"academy_organisation_members_organisationId_userId_key"') IS NULL THEN
    ALTER INDEX "academy_company_members_companyId_userId_key" RENAME TO "academy_organisation_members_organisationId_userId_key";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_company_members_userId_idx"') IS NOT NULL AND to_regclass('"academy_organisation_members_userId_idx"') IS NULL THEN
    ALTER INDEX "academy_company_members_userId_idx" RENAME TO "academy_organisation_members_userId_idx";
  END IF;
END $$;

-- Truncated live name, as created by 20261102080000 (63 characters after Postgres truncation).
DO $$
BEGIN
  IF to_regclass('"academy_training_assignments_companyId_learnerId_courseId_"') IS NOT NULL
     AND to_regclass('"academy_training_assignments_organisationId_learnerId_courseId_"') IS NULL
  THEN
    ALTER INDEX "academy_training_assignments_companyId_learnerId_courseId_" RENAME TO "academy_training_assignments_organisationId_learnerId_courseId_";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_verified_competencies_companyId_learnerId_idx"') IS NOT NULL AND to_regclass('"academy_verified_competencies_organisationId_learnerId_idx"') IS NULL THEN
    ALTER INDEX "academy_verified_competencies_companyId_learnerId_idx" RENAME TO "academy_verified_competencies_organisationId_learnerId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_practical_evidence_companyId_status_createdAt_idx"') IS NOT NULL AND to_regclass('"academy_practical_evidence_organisationId_status_createdAt_idx"') IS NULL THEN
    ALTER INDEX "academy_practical_evidence_companyId_status_createdAt_idx" RENAME TO "academy_practical_evidence_organisationId_status_createdAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_external_identities_companyId_userId_idx"') IS NOT NULL AND to_regclass('"academy_external_identities_organisationId_userId_idx"') IS NULL THEN
    ALTER INDEX "academy_external_identities_companyId_userId_idx" RENAME TO "academy_external_identities_organisationId_userId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_template_responses_companyId_status_idx"') IS NOT NULL AND to_regclass('"academy_template_responses_organisationId_status_idx"') IS NULL THEN
    ALTER INDEX "academy_template_responses_companyId_status_idx" RENAME TO "academy_template_responses_organisationId_status_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_pathway_enrolments_companyId_status_idx"') IS NOT NULL AND to_regclass('"academy_pathway_enrolments_organisationId_status_idx"') IS NULL THEN
    ALTER INDEX "academy_pathway_enrolments_companyId_status_idx" RENAME TO "academy_pathway_enrolments_organisationId_status_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_course_lesson_selections_companyId_courseId_so_key"') IS NOT NULL AND to_regclass('"academy_course_lesson_selections_organisationId_courseId_so_key"') IS NULL THEN
    ALTER INDEX "academy_course_lesson_selections_companyId_courseId_so_key" RENAME TO "academy_course_lesson_selections_organisationId_courseId_so_key";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_integration_audit_companyRef_createdAt_idx"') IS NOT NULL AND to_regclass('"academy_integration_audit_organisationRef_createdAt_idx"') IS NULL THEN
    ALTER INDEX "academy_integration_audit_companyRef_createdAt_idx" RENAME TO "academy_integration_audit_organisationRef_createdAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_service_credentials_service_companyRef_idx"') IS NOT NULL AND to_regclass('"academy_service_credentials_service_organisationRef_idx"') IS NULL THEN
    ALTER INDEX "academy_service_credentials_service_companyRef_idx" RENAME TO "academy_service_credentials_service_organisationRef_idx";
  END IF;
END $$;

-- 3. Primary keys (tables are renamed back in step 5)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_company_members_pkey' AND conrelid = to_regclass('"academy_company_members"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisation_members_pkey' AND conrelid = to_regclass('"academy_company_members"'))
  THEN
    ALTER TABLE "academy_company_members" RENAME CONSTRAINT "academy_company_members_pkey" TO "academy_organisation_members_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_companies_pkey' AND conrelid = to_regclass('"academy_companies"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisations_pkey' AND conrelid = to_regclass('"academy_companies"'))
  THEN
    ALTER TABLE "academy_companies" RENAME CONSTRAINT "academy_companies_pkey" TO "academy_organisations_pkey";
  END IF;
END $$;

-- 4. Columns

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_company_members" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_training_assignments" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_verified_competencies" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_practical_evidence" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_external_identities" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_business_lesson_fields" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_lesson_context_snapshots" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_course_lesson_selections" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_template_responses" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'companyId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'organisationId')
  THEN
    ALTER TABLE "academy_pathway_enrolments" RENAME COLUMN "companyId" TO "organisationId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_integration_audit' AND column_name = 'companyRef')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_integration_audit' AND column_name = 'organisationRef')
  THEN
    ALTER TABLE "academy_integration_audit" RENAME COLUMN "companyRef" TO "organisationRef";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_service_credentials' AND column_name = 'companyRef')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_service_credentials' AND column_name = 'organisationRef')
  THEN
    ALTER TABLE "academy_service_credentials" RENAME COLUMN "companyRef" TO "organisationRef";
  END IF;
END $$;

-- 5. Tables

DO $$
BEGIN
  IF to_regclass('"academy_company_members"') IS NOT NULL AND to_regclass('"academy_organisation_members"') IS NULL THEN
    ALTER TABLE "academy_company_members" RENAME TO "academy_organisation_members";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_companies"') IS NOT NULL AND to_regclass('"academy_organisations"') IS NULL THEN
    ALTER TABLE "academy_companies" RENAME TO "academy_organisations";
  END IF;
END $$;
