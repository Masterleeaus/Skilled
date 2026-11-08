CREATE TABLE "academy_verified_competencies" (
 "id" TEXT NOT NULL, "organisationId" TEXT NOT NULL, "learnerId" TEXT NOT NULL,
 "lessonId" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "evidenceId" TEXT NOT NULL,
 "assessorId" TEXT NOT NULL, "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3), CONSTRAINT "academy_verified_competencies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academy_verified_competencies_evidenceId_key" ON "academy_verified_competencies"("evidenceId");
CREATE INDEX "academy_verified_competencies_organisationId_learnerId_idx" ON "academy_verified_competencies"("organisationId", "learnerId");
CREATE INDEX "academy_verified_competencies_learnerId_lessonId_idx" ON "academy_verified_competencies"("learnerId", "lessonId");
ALTER TABLE "academy_verified_competencies" ADD CONSTRAINT "academy_verified_competencies_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "academy_organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_verified_competencies" ADD CONSTRAINT "academy_verified_competencies_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_verified_competencies" ADD CONSTRAINT "academy_verified_competencies_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_verified_competencies" ADD CONSTRAINT "academy_verified_competencies_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "academy_practical_evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
