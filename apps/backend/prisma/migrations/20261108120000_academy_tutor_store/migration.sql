-- Tutor store tables. Promoted from migrations-draft. ADDITIVE ONLY (new tables, indexes and foreign keys). Static, unverified.
-- Order dependency: runs AFTER 20261108090000_academy_tenant_company_rename, which creates academy_companies and "companyId"
--   on the applied tables. This migration references academy_companies and "companyId" directly.
-- Matches the schema.prisma models AcademyTutorConversation, AcademyTutorMessage and AcademyTutorToolAudit (static read only).
--   Not yet compared with `prisma migrate diff`. Run that before applying.
-- Tenant key: companyId (academy_companies.id, the Company tenant boundary). Retention: createdAt older than 30 days,
--   deleted by src/tutor/store/retention.ts.

-- CreateTable
CREATE TABLE "academy_tutor_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_tutor_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_tutor_messages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_tutor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_tutor_tool_audits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "userId" TEXT,
    "inputHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_tutor_tool_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_tutor_conversations_companyId_id_key" ON "academy_tutor_conversations"("companyId", "id");

-- CreateIndex
CREATE INDEX "academy_tutor_conversations_createdAt_idx" ON "academy_tutor_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "academy_tutor_conversations_companyId_learnerId_createdAt_idx" ON "academy_tutor_conversations"("companyId", "learnerId", "createdAt");

-- CreateIndex
CREATE INDEX "academy_tutor_messages_conversationId_createdAt_idx" ON "academy_tutor_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "academy_tutor_tool_audits_conversationId_createdAt_idx" ON "academy_tutor_tool_audits"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "academy_tutor_tool_audits_companyId_createdAt_idx" ON "academy_tutor_tool_audits"("companyId", "createdAt");

-- AddForeignKey (tenant: ON DELETE RESTRICT, a company with tutor data cannot be deleted)
ALTER TABLE "academy_tutor_conversations" ADD CONSTRAINT "academy_tutor_conversations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_tutor_conversations" ADD CONSTRAINT "academy_tutor_conversations_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (composite: a message must share its conversation's company)
ALTER TABLE "academy_tutor_messages" ADD CONSTRAINT "academy_tutor_messages_companyId_conversationId_fkey" FOREIGN KEY ("companyId", "conversationId") REFERENCES "academy_tutor_conversations"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (composite: a tool audit row must share its conversation's company)
ALTER TABLE "academy_tutor_tool_audits" ADD CONSTRAINT "academy_tutor_tool_audits_companyId_conversationId_fkey" FOREIGN KEY ("companyId", "conversationId") REFERENCES "academy_tutor_conversations"("companyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
