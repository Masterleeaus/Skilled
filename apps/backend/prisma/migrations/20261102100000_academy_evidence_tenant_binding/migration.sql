-- Legacy evidence lacks a trustworthy tenant context. Preserve it without guessing ownership.
-- A null organisationId is legacy-unassigned and cannot enter tenant assessor queues.
ALTER TABLE "academy_practical_evidence" ADD COLUMN "organisationId" TEXT;
CREATE INDEX "academy_practical_evidence_organisationId_status_createdAt_idx" ON "academy_practical_evidence"("organisationId", "status", "createdAt");
ALTER TABLE "academy_practical_evidence" ADD CONSTRAINT "academy_practical_evidence_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "academy_organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
