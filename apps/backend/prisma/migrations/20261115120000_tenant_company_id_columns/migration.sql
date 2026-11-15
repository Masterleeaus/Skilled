-- Tenant column rename: "companyId" -> company_id, to match Central's canonical snake_case schema (issue #68).
--
-- Renames the scalar tenant column on 21 tables. Prisma field names stay companyId; schema.prisma maps them with
-- @map("company_id"). Index and foreign key names are NOT changed: schema.prisma pins their existing names with map:, so
-- no constraint is renamed here. companyRef (academy_integration_audit, academy_service_credentials) is not renamed: it is a
-- Central reference string with no foreign key to academy_companies, so it is not the same kind of column.
--
-- Guarded and re-runnable. Each table is renamed only when "companyId" exists and "company_id" does not. If both exist the
-- migration stops, because that state needs a human decision. Nothing else is touched.
--
-- Not run against any shared or production database. Rehearse on a restored copy first.

-- skilled_central_sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_sessions' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_sessions' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on skilled_central_sessions';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_sessions' AND column_name = 'companyId') THEN
    ALTER TABLE "skilled_central_sessions" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_course_lesson_selections
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_course_lesson_selections';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_course_lesson_selections' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_course_lesson_selections" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_learner_completions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_learner_completions' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_learner_completions' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_learner_completions';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_learner_completions' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_learner_completions" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_knowledge_attempts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_knowledge_attempts' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_knowledge_attempts' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_knowledge_attempts';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_knowledge_attempts' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_knowledge_attempts" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_practical_evidence
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_practical_evidence';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_practical_evidence' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_practical_evidence" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- skilled_central_company_links
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_company_links' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_company_links' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on skilled_central_company_links';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_company_links' AND column_name = 'companyId') THEN
    ALTER TABLE "skilled_central_company_links" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- skilled_central_company_link_audits
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_company_link_audits' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_company_link_audits' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on skilled_central_company_link_audits';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'skilled_central_company_link_audits' AND column_name = 'companyId') THEN
    ALTER TABLE "skilled_central_company_link_audits" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_company_members
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_company_members';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_company_members' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_company_members" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_training_assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_training_assignments';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_training_assignments' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_training_assignments" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_verified_competencies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_verified_competencies';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_verified_competencies' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_verified_competencies" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_external_identities
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_external_identities';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_external_identities' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_external_identities" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_business_lesson_fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_business_lesson_fields';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_business_lesson_fields' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_business_lesson_fields" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_lesson_context_snapshots
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_lesson_context_snapshots';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_lesson_context_snapshots' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_lesson_context_snapshots" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_template_responses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_template_responses';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_template_responses' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_template_responses" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_pathway_enrolments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_pathway_enrolments';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_pathway_enrolments' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_pathway_enrolments" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_tutor_conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_conversations' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_conversations' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_tutor_conversations';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_conversations' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_tutor_conversations" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_tutor_messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_messages' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_messages' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_tutor_messages';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_messages' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_tutor_messages" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_tutor_tool_audits
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_tool_audits' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_tool_audits' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_tutor_tool_audits';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_tutor_tool_audits' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_tutor_tool_audits" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_chatbots
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbots' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbots' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_chatbots';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbots' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_chatbots" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_chatbot_conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbot_conversations' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbot_conversations' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_chatbot_conversations';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbot_conversations' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_chatbot_conversations" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;

-- academy_chatbot_messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbot_messages' AND column_name = 'companyId')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbot_messages' AND column_name = 'company_id') THEN
    RAISE EXCEPTION 'tenant rename: both "companyId" and company_id exist on academy_chatbot_messages';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'academy_chatbot_messages' AND column_name = 'companyId') THEN
    ALTER TABLE "academy_chatbot_messages" RENAME COLUMN "companyId" TO "company_id";
  END IF;
END $$;
