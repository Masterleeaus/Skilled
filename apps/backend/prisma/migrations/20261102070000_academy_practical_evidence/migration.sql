CREATE TABLE "academy_practical_evidence" (
 "id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "lessonId" TEXT NOT NULL,
 "revisionId" TEXT NOT NULL, "description" TEXT NOT NULL, "evidenceUrls" JSONB NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'PENDING', "assessorId" TEXT, "assessorFeedback" TEXT,
 "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "academy_practical_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "academy_practical_evidence_learnerId_createdAt_idx" ON "academy_practical_evidence"("learnerId", "createdAt");
CREATE INDEX "academy_practical_evidence_status_createdAt_idx" ON "academy_practical_evidence"("status", "createdAt");
ALTER TABLE "academy_practical_evidence" ADD CONSTRAINT "academy_practical_evidence_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
