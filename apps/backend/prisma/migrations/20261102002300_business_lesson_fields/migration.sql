CREATE TABLE "academy_business_lesson_fields" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "sourceSystem" TEXT,
  "sourceRecordRef" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "academy_business_lesson_fields_org_key" UNIQUE ("organisationId", "fieldKey")
);
CREATE INDEX "academy_business_lesson_fields_org_status_idx" ON "academy_business_lesson_fields" ("organisationId", "status");
CREATE TABLE "academy_lesson_context_snapshots" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "learnerId" TEXT NOT NULL,
  "lessonRevisionId" TEXT NOT NULL,
  "resolvedFields" JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "academy_lesson_context_snapshots_org_learner_idx" ON "academy_lesson_context_snapshots" ("organisationId", "learnerId", "createdAt");
