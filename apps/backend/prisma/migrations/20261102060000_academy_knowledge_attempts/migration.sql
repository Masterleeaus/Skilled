CREATE TABLE "academy_knowledge_attempts" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "learnerId" TEXT NOT NULL,
 "lessonId" TEXT NOT NULL,
 "revisionId" TEXT NOT NULL,
 "answers" JSONB NOT NULL,
 "score" INTEGER NOT NULL,
 "total" INTEGER NOT NULL,
 "passed" BOOLEAN NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "academy_knowledge_attempts_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "academy_knowledge_attempts_learnerId_revisionId_createdAt_idx" ON "academy_knowledge_attempts"("learnerId", "revisionId", "createdAt");
