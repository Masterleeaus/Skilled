-- Reverses migration.sql. Run manually only if this migration must be unapplied; Prisma does not run it.
-- Drops the tenant column with its FK and index. Parent responses and all other columns are untouched.
ALTER TABLE "academy_generated_documents" DROP CONSTRAINT IF EXISTS "academy_generated_documents_companyId_fkey";
ALTER TABLE "academy_template_sign_offs" DROP CONSTRAINT IF EXISTS "academy_template_sign_offs_companyId_fkey";
DROP INDEX IF EXISTS "academy_generated_documents_companyId_templateResponseId_idx";
DROP INDEX IF EXISTS "academy_template_sign_offs_companyId_templateResponseId_idx";
ALTER TABLE "academy_generated_documents" DROP COLUMN IF EXISTS "companyId";
ALTER TABLE "academy_template_sign_offs" DROP COLUMN IF EXISTS "companyId";
