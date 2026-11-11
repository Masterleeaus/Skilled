-- Additive curriculum inventory; no changes to existing LMS course or learner tables.
CREATE TABLE "academy_content_lessons" (
 "id" TEXT NOT NULL,
 "sourceId" TEXT NOT NULL,
 "layer" TEXT NOT NULL,
 "serviceGroup" TEXT NOT NULL,
 "unit" TEXT NOT NULL,
 "title" TEXT NOT NULL,
 "objective" TEXT NOT NULL,
 "assessment" TEXT NOT NULL,
 "contentStatus" TEXT NOT NULL DEFAULT 'BRIEF',
 "sourceVersion" TEXT NOT NULL,
 "sourceHash" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "academy_content_lessons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academy_content_lessons_sourceId_key" ON "academy_content_lessons"("sourceId");
CREATE INDEX "academy_content_lessons_layer_serviceGroup_idx" ON "academy_content_lessons"("layer", "serviceGroup");
