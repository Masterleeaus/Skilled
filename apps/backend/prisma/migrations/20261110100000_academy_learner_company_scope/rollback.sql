-- Reverses migration.sql. Run manually only if this migration must be unapplied; Prisma does not run it.
-- Drops the tenant column with its FK and index. Pre-existing rows and columns are untouched.
ALTER TABLE "academy_knowledge_attempts" DROP CONSTRAINT IF EXISTS "academy_knowledge_attempts_companyId_fkey";
ALTER TABLE "academy_learner_completions" DROP CONSTRAINT IF EXISTS "academy_learner_completions_companyId_fkey";
DROP INDEX IF EXISTS "academy_knowledge_attempts_companyId_learnerId_idx";
DROP INDEX IF EXISTS "academy_learner_completions_companyId_learnerId_idx";
ALTER TABLE "academy_knowledge_attempts" DROP COLUMN IF EXISTS "companyId";
ALTER TABLE "academy_learner_completions" DROP COLUMN IF EXISTS "companyId";
