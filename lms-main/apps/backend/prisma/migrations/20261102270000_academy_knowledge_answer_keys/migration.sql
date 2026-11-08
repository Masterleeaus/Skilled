-- PASS43 server-side knowledge-check answer keys. Additive: a new table only; no existing row or column changes.
-- Keys are keyed by pinned lesson revision and check ID, so a key can never apply to a different revision's wording.
-- CreateTable
CREATE TABLE "academy_knowledge_answer_keys" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "rationale" TEXT,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_knowledge_answer_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_knowledge_answer_keys_revisionId_checkId_key" ON "academy_knowledge_answer_keys"("revisionId", "checkId");

-- AddForeignKey
ALTER TABLE "academy_knowledge_answer_keys" ADD CONSTRAINT "academy_knowledge_answer_keys_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
