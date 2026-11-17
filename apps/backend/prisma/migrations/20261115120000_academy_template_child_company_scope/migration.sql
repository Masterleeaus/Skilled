-- Template sign-offs and generated documents gain a direct tenant company column.
-- Additive only: nullable column, FK and index per table. Reversed by rollback.sql in this folder.
--
-- Backfill rule: a child row takes the company of its parent template response. Rows whose parent response has
-- no company stay NULL. Application code writes the column from the response on every new row.

ALTER TABLE "academy_template_sign_offs" ADD COLUMN "companyId" TEXT;
ALTER TABLE "academy_generated_documents" ADD COLUMN "companyId" TEXT;

CREATE INDEX "academy_template_sign_offs_companyId_templateResponseId_idx" ON "academy_template_sign_offs"("companyId", "templateResponseId");
CREATE INDEX "academy_generated_documents_companyId_templateResponseId_idx" ON "academy_generated_documents"("companyId", "templateResponseId");

ALTER TABLE "academy_template_sign_offs" ADD CONSTRAINT "academy_template_sign_offs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_generated_documents" ADD CONSTRAINT "academy_generated_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "academy_template_sign_offs" s
SET "companyId" = r."companyId"
FROM "academy_template_responses" r
WHERE r."id" = s."templateResponseId" AND s."companyId" IS NULL AND r."companyId" IS NOT NULL;

UPDATE "academy_generated_documents" d
SET "companyId" = r."companyId"
FROM "academy_template_responses" r
WHERE r."id" = d."templateResponseId" AND d."companyId" IS NULL AND r."companyId" IS NOT NULL;
