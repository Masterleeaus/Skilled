-- Chatbot tables. Promoted from migrations-draft. ADDITIVE ONLY (new tables, indexes, foreign keys and CHECK constraints). Static, unverified.
-- Order dependency: runs AFTER 20261108090000_academy_tenant_company_rename, which creates academy_companies(id).
-- Matches the chatbot models in prisma/schema.prisma (AcademyChatbot, AcademyChatbotConversation, AcademyChatbotMessage)
--   (static read only). Not yet compared with `prisma migrate diff`. Run that before applying.
-- The CHECK constraints are not in schema.prisma. `prisma migrate diff` will not show them, so review them by hand.
-- Tenant key: companyId holds the Company id as-is (academy_companies.id, TEXT). Each table has a foreign key
-- from companyId to academy_companies(id) with ON DELETE RESTRICT (decided). See src/tutor/chatbot/CHANGES.md.
-- Prisma cannot express CHECK constraints, so the three CHECKs below are added here by hand.
-- ON UPDATE CASCADE is Prisma's default and is not overridden in the schema (no onUpdate is used anywhere in it).

-- CreateTable
CREATE TABLE "academy_chatbots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "welcomeMessage" TEXT,
    "instructions" TEXT,
    "generativeUiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_chatbots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_chatbot_conversations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "sessionId" VARCHAR(128) NOT NULL,
    "channel" VARCHAR(32) NOT NULL DEFAULT 'web',
    "connectAgentAt" TIMESTAMP(3),
    "isShownOnHistory" BOOLEAN NOT NULL DEFAULT true,
    "ticketStatus" VARCHAR(16) NOT NULL DEFAULT 'new',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_chatbot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_chatbot_messages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" VARCHAR(16) NOT NULL,
    "message" TEXT NOT NULL,
    "contentType" VARCHAR(16) NOT NULL DEFAULT 'text',
    "uiSpec" JSONB,
    "mediaUrl" TEXT,
    "mediaName" TEXT,
    "isInternalNote" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_chatbot_messages_pkey" PRIMARY KEY ("id")
);

-- CHECK constraints (hand-written; Prisma cannot express them)
ALTER TABLE "academy_chatbot_conversations"
    ADD CONSTRAINT "chatbot_conversations_ticket_status_check" CHECK ("ticketStatus" IN ('new', 'closed'));
ALTER TABLE "academy_chatbot_messages"
    ADD CONSTRAINT "chatbot_messages_role_check" CHECK ("role" IN ('user', 'assistant'));
ALTER TABLE "academy_chatbot_messages"
    ADD CONSTRAINT "chatbot_messages_content_type_check" CHECK ("contentType" IN ('text', 'titan-ui'));

-- CreateIndex
CREATE UNIQUE INDEX "chatbots_company_id_uidx" ON "academy_chatbots"("companyId", "id");
CREATE INDEX "chatbots_company_active_idx" ON "academy_chatbots"("companyId", "active");
CREATE UNIQUE INDEX "chatbot_conversations_company_id_uidx" ON "academy_chatbot_conversations"("companyId", "id");
CREATE INDEX "chatbot_conversations_company_activity_idx" ON "academy_chatbot_conversations"("companyId", "lastActivityAt");
CREATE INDEX "chatbot_conversations_company_session_idx" ON "academy_chatbot_conversations"("companyId", "sessionId");
CREATE INDEX "chatbot_messages_company_conversation_idx" ON "academy_chatbot_messages"("companyId", "conversationId", "createdAt");
CREATE INDEX "chatbot_messages_unread_idx" ON "academy_chatbot_messages"("companyId", "conversationId", "role", "readAt");

-- AddForeignKey (composite, tenant-bound: a child row cannot point at another company's parent)
ALTER TABLE "academy_chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_company_chatbot_fk"
    FOREIGN KEY ("companyId", "chatbotId") REFERENCES "academy_chatbots"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_chatbot_messages" ADD CONSTRAINT "chatbot_messages_company_conversation_fk"
    FOREIGN KEY ("companyId", "conversationId") REFERENCES "academy_chatbot_conversations"("companyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (tenant: companyId must name an existing academy_companies row; Restrict on company delete)
ALTER TABLE "academy_chatbots" ADD CONSTRAINT "chatbots_company_fk"
    FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_company_fk"
    FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_chatbot_messages" ADD CONSTRAINT "chatbot_messages_company_fk"
    FOREIGN KEY ("companyId") REFERENCES "academy_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
