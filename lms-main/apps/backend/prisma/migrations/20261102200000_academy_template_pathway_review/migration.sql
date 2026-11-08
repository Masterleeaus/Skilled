-- Pass 42 schema: template responses and sign-off, generated documents, lesson reviews, role pathways.
-- Additive only: seven new tables. No existing table, column or index is altered.
-- Pre-existing index-name drift is deliberately NOT included here (see SCHEMA-design.md).
-- CreateTable
CREATE TABLE "academy_lesson_reviews" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_lesson_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_template_responses" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "learnerId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldValues" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_template_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_template_sign_offs" (
    "id" TEXT NOT NULL,
    "templateResponseId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rubricResults" JSONB NOT NULL,
    "notes" TEXT,
    "practicalEvidenceId" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_template_sign_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_generated_documents" (
    "id" TEXT NOT NULL,
    "templateResponseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "assembled" JSONB NOT NULL,
    "signOffId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_curriculum_pathways" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_curriculum_pathways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_pathway_courses" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_pathway_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_pathway_enrolments" (
    "id" TEXT NOT NULL,
    "pathwayId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "organisationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "academy_pathway_enrolments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academy_lesson_reviews_revisionId_decidedAt_idx" ON "academy_lesson_reviews"("revisionId", "decidedAt");

-- CreateIndex
CREATE INDEX "academy_lesson_reviews_reviewerId_idx" ON "academy_lesson_reviews"("reviewerId");

-- CreateIndex
CREATE INDEX "academy_template_responses_organisationId_status_idx" ON "academy_template_responses"("organisationId", "status");

-- CreateIndex
CREATE INDEX "academy_template_responses_lessonId_status_idx" ON "academy_template_responses"("lessonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "academy_template_responses_learnerId_lessonId_templateId_key" ON "academy_template_responses"("learnerId", "lessonId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_template_sign_offs_practicalEvidenceId_key" ON "academy_template_sign_offs"("practicalEvidenceId");

-- CreateIndex
CREATE INDEX "academy_template_sign_offs_templateResponseId_decidedAt_idx" ON "academy_template_sign_offs"("templateResponseId", "decidedAt");

-- CreateIndex
CREATE INDEX "academy_template_sign_offs_assessorId_idx" ON "academy_template_sign_offs"("assessorId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_generated_documents_signOffId_key" ON "academy_generated_documents"("signOffId");

-- CreateIndex
CREATE UNIQUE INDEX "academy_generated_documents_templateResponseId_version_key" ON "academy_generated_documents"("templateResponseId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "academy_curriculum_pathways_code_key" ON "academy_curriculum_pathways"("code");

-- CreateIndex
CREATE INDEX "academy_pathway_courses_courseSlug_idx" ON "academy_pathway_courses"("courseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "academy_pathway_courses_pathwayId_courseSlug_key" ON "academy_pathway_courses"("pathwayId", "courseSlug");

-- CreateIndex
CREATE UNIQUE INDEX "academy_pathway_courses_pathwayId_position_key" ON "academy_pathway_courses"("pathwayId", "position");

-- CreateIndex
CREATE INDEX "academy_pathway_enrolments_learnerId_status_idx" ON "academy_pathway_enrolments"("learnerId", "status");

-- CreateIndex
CREATE INDEX "academy_pathway_enrolments_organisationId_status_idx" ON "academy_pathway_enrolments"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "academy_pathway_enrolments_pathwayId_learnerId_key" ON "academy_pathway_enrolments"("pathwayId", "learnerId");

-- AddForeignKey
ALTER TABLE "academy_lesson_reviews" ADD CONSTRAINT "academy_lesson_reviews_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_lesson_reviews" ADD CONSTRAINT "academy_lesson_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_responses" ADD CONSTRAINT "academy_template_responses_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "academy_organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_responses" ADD CONSTRAINT "academy_template_responses_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_responses" ADD CONSTRAINT "academy_template_responses_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "academy_content_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_responses" ADD CONSTRAINT "academy_template_responses_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_sign_offs" ADD CONSTRAINT "academy_template_sign_offs_templateResponseId_fkey" FOREIGN KEY ("templateResponseId") REFERENCES "academy_template_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_sign_offs" ADD CONSTRAINT "academy_template_sign_offs_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_template_sign_offs" ADD CONSTRAINT "academy_template_sign_offs_practicalEvidenceId_fkey" FOREIGN KEY ("practicalEvidenceId") REFERENCES "academy_practical_evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_generated_documents" ADD CONSTRAINT "academy_generated_documents_templateResponseId_fkey" FOREIGN KEY ("templateResponseId") REFERENCES "academy_template_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_generated_documents" ADD CONSTRAINT "academy_generated_documents_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "academy_template_sign_offs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_pathway_courses" ADD CONSTRAINT "academy_pathway_courses_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "academy_curriculum_pathways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_pathway_enrolments" ADD CONSTRAINT "academy_pathway_enrolments_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "academy_curriculum_pathways"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_pathway_enrolments" ADD CONSTRAINT "academy_pathway_enrolments_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_pathway_enrolments" ADD CONSTRAINT "academy_pathway_enrolments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "academy_organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

