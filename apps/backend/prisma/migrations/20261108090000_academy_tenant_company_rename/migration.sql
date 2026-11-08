-- Tenant boundary rename: organisation -> company (delta names). Static, unverified.
--
-- Tables:     academy_organisations            -> academy_companies          (Prisma model Company)
--             academy_organisation_members     -> academy_company_members    (Prisma model CompanyMember)
-- Columns:    "organisationId" -> "companyId"  (10 tables, camelCase, no @map, as in schema.prisma)
--             "organisationRef" -> "companyRef" (academy_integration_audit, academy_service_credentials)
-- Indexes and foreign keys: names that carry the old word are renamed to the Prisma default names for the delta schema.
--
-- Not renamed here. These names have no "organisation" word, so they stay as they are in the live database, and
-- schema.prisma maps them explicitly: academy_business_lesson_fields_org_key, academy_business_lesson_fields_org_status_idx,
-- academy_lesson_context_snapshots_org_learner_idx.
-- The partial index academy_course_lesson_selections_course_default_key has no organisation word. Postgres
-- rewrites its predicate on column rename.
-- academy_training_assignments: the truncated live name is renamed below, and 20261108100200 renames it again to
-- academy_training_assignments_org_learner_course_key (the name schema.prisma maps).
--
-- Every statement is guarded: it runs only when the old name exists and the new name does not, so a re-run is a no-op.
-- A DB where a company column or table already exists is refused by preflight-20261108090000-company-rename.sql first.
--
-- ORDER: this migration sorts BEFORE 20261108100000, 20261108100100, 20261108100200, and before the tutor and chatbot
-- migrations (20261108120000, 20261108120100), which reference academy_companies and "companyId".
-- Do not move this folder after them.

-- 1. Tables

DO $$
BEGIN
  IF to_regclass('"academy_organisations"') IS NOT NULL AND to_regclass('"academy_companies"') IS NULL THEN
    ALTER TABLE "academy_organisations" RENAME TO "academy_companies";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_organisation_members"') IS NOT NULL AND to_regclass('"academy_company_members"') IS NULL THEN
    ALTER TABLE "academy_organisation_members" RENAME TO "academy_company_members";
  END IF;
END $$;

-- 2. Columns

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_company_members" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_training_assignments" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_verified_competencies" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_practical_evidence" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_external_identities" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_business_lesson_fields" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_lesson_context_snapshots" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_course_lesson_selections" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_template_responses" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'organisationId')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'companyId')
  THEN
    ALTER TABLE "academy_pathway_enrolments" RENAME COLUMN "organisationId" TO "companyId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_integration_audit' AND column_name = 'organisationRef')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_integration_audit' AND column_name = 'companyRef')
  THEN
    ALTER TABLE "academy_integration_audit" RENAME COLUMN "organisationRef" TO "companyRef";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_service_credentials' AND column_name = 'organisationRef')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_service_credentials' AND column_name = 'companyRef')
  THEN
    ALTER TABLE "academy_service_credentials" RENAME COLUMN "organisationRef" TO "companyRef";
  END IF;
END $$;

-- 3. Primary keys (tables renamed in step 1)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisations_pkey' AND conrelid = to_regclass('"academy_companies"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_companies_pkey' AND conrelid = to_regclass('"academy_companies"'))
  THEN
    ALTER TABLE "academy_companies" RENAME CONSTRAINT "academy_organisations_pkey" TO "academy_companies_pkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisation_members_pkey' AND conrelid = to_regclass('"academy_company_members"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_company_members_pkey' AND conrelid = to_regclass('"academy_company_members"'))
  THEN
    ALTER TABLE "academy_company_members" RENAME CONSTRAINT "academy_organisation_members_pkey" TO "academy_company_members_pkey";
  END IF;
END $$;

-- 4. Indexes (CREATE [UNIQUE] INDEX statements, not constraints)

DO $$
BEGIN
  IF to_regclass('"academy_organisations_externalRef_key"') IS NOT NULL AND to_regclass('"academy_companies_externalRef_key"') IS NULL THEN
    ALTER INDEX "academy_organisations_externalRef_key" RENAME TO "academy_companies_externalRef_key";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_organisation_members_organisationId_userId_key"') IS NOT NULL AND to_regclass('"academy_company_members_companyId_userId_key"') IS NULL THEN
    ALTER INDEX "academy_organisation_members_organisationId_userId_key" RENAME TO "academy_company_members_companyId_userId_key";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_organisation_members_userId_idx"') IS NOT NULL AND to_regclass('"academy_company_members_userId_idx"') IS NULL THEN
    ALTER INDEX "academy_organisation_members_userId_idx" RENAME TO "academy_company_members_userId_idx";
  END IF;
END $$;

-- Truncated live name (66-character name from 20261102080000, cut to 63 by Postgres). 20261108100200 renames it again.
DO $$
BEGIN
  IF to_regclass('"academy_training_assignments_organisationId_learnerId_courseId_"') IS NOT NULL
     AND to_regclass('"academy_training_assignments_companyId_learnerId_courseId_"') IS NULL
  THEN
    ALTER INDEX "academy_training_assignments_organisationId_learnerId_courseId_" RENAME TO "academy_training_assignments_companyId_learnerId_courseId_";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_verified_competencies_organisationId_learnerId_idx"') IS NOT NULL AND to_regclass('"academy_verified_competencies_companyId_learnerId_idx"') IS NULL THEN
    ALTER INDEX "academy_verified_competencies_organisationId_learnerId_idx" RENAME TO "academy_verified_competencies_companyId_learnerId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_practical_evidence_organisationId_status_createdAt_idx"') IS NOT NULL AND to_regclass('"academy_practical_evidence_companyId_status_createdAt_idx"') IS NULL THEN
    ALTER INDEX "academy_practical_evidence_organisationId_status_createdAt_idx" RENAME TO "academy_practical_evidence_companyId_status_createdAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_external_identities_organisationId_userId_idx"') IS NOT NULL AND to_regclass('"academy_external_identities_companyId_userId_idx"') IS NULL THEN
    ALTER INDEX "academy_external_identities_organisationId_userId_idx" RENAME TO "academy_external_identities_companyId_userId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_template_responses_organisationId_status_idx"') IS NOT NULL AND to_regclass('"academy_template_responses_companyId_status_idx"') IS NULL THEN
    ALTER INDEX "academy_template_responses_organisationId_status_idx" RENAME TO "academy_template_responses_companyId_status_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_pathway_enrolments_organisationId_status_idx"') IS NOT NULL AND to_regclass('"academy_pathway_enrolments_companyId_status_idx"') IS NULL THEN
    ALTER INDEX "academy_pathway_enrolments_organisationId_status_idx" RENAME TO "academy_pathway_enrolments_companyId_status_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_course_lesson_selections_organisationId_courseId_so_key"') IS NOT NULL AND to_regclass('"academy_course_lesson_selections_companyId_courseId_so_key"') IS NULL THEN
    ALTER INDEX "academy_course_lesson_selections_organisationId_courseId_so_key" RENAME TO "academy_course_lesson_selections_companyId_courseId_so_key";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_integration_audit_organisationRef_createdAt_idx"') IS NOT NULL AND to_regclass('"academy_integration_audit_companyRef_createdAt_idx"') IS NULL THEN
    ALTER INDEX "academy_integration_audit_organisationRef_createdAt_idx" RENAME TO "academy_integration_audit_companyRef_createdAt_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('"academy_service_credentials_service_organisationRef_idx"') IS NOT NULL AND to_regclass('"academy_service_credentials_service_companyRef_idx"') IS NULL THEN
    ALTER INDEX "academy_service_credentials_service_organisationRef_idx" RENAME TO "academy_service_credentials_service_companyRef_idx";
  END IF;
END $$;

-- 5. Foreign key constraints (ALTER TABLE ... RENAME CONSTRAINT, on the renamed tables)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisation_members_organisationId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_company_members_companyId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
  THEN
    ALTER TABLE "academy_company_members" RENAME CONSTRAINT "academy_organisation_members_organisationId_fkey" TO "academy_company_members_companyId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_organisation_members_userId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_company_members_userId_fkey' AND conrelid = to_regclass('"academy_company_members"'))
  THEN
    ALTER TABLE "academy_company_members" RENAME CONSTRAINT "academy_organisation_members_userId_fkey" TO "academy_company_members_userId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_training_assignments_organisationId_fkey' AND conrelid = to_regclass('"academy_training_assignments"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_training_assignments_companyId_fkey' AND conrelid = to_regclass('"academy_training_assignments"'))
  THEN
    ALTER TABLE "academy_training_assignments" RENAME CONSTRAINT "academy_training_assignments_organisationId_fkey" TO "academy_training_assignments_companyId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_verified_competencies_organisationId_fkey' AND conrelid = to_regclass('"academy_verified_competencies"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_verified_competencies_companyId_fkey' AND conrelid = to_regclass('"academy_verified_competencies"'))
  THEN
    ALTER TABLE "academy_verified_competencies" RENAME CONSTRAINT "academy_verified_competencies_organisationId_fkey" TO "academy_verified_competencies_companyId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_practical_evidence_organisationId_fkey' AND conrelid = to_regclass('"academy_practical_evidence"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_practical_evidence_companyId_fkey' AND conrelid = to_regclass('"academy_practical_evidence"'))
  THEN
    ALTER TABLE "academy_practical_evidence" RENAME CONSTRAINT "academy_practical_evidence_organisationId_fkey" TO "academy_practical_evidence_companyId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_template_responses_organisationId_fkey' AND conrelid = to_regclass('"academy_template_responses"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_template_responses_companyId_fkey' AND conrelid = to_regclass('"academy_template_responses"'))
  THEN
    ALTER TABLE "academy_template_responses" RENAME CONSTRAINT "academy_template_responses_organisationId_fkey" TO "academy_template_responses_companyId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_pathway_enrolments_organisationId_fkey' AND conrelid = to_regclass('"academy_pathway_enrolments"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_pathway_enrolments_companyId_fkey' AND conrelid = to_regclass('"academy_pathway_enrolments"'))
  THEN
    ALTER TABLE "academy_pathway_enrolments" RENAME CONSTRAINT "academy_pathway_enrolments_organisationId_fkey" TO "academy_pathway_enrolments_companyId_fkey";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_course_lesson_selections_organisationId_fkey' AND conrelid = to_regclass('"academy_course_lesson_selections"'))
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_course_lesson_selections_companyId_fkey' AND conrelid = to_regclass('"academy_course_lesson_selections"'))
  THEN
    ALTER TABLE "academy_course_lesson_selections" RENAME CONSTRAINT "academy_course_lesson_selections_organisationId_fkey" TO "academy_course_lesson_selections_companyId_fkey";
  END IF;
END $$;
