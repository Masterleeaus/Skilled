# Tutor store: changes (T3)

## Schema (prisma/schema.prisma)
- Added to existing models (relation back-fields only; the column rename is in the last section):
  - `User.academyTutorConversations` (relation `AcademyTutorLearner`)
  - `Company.tutorConversations` (was `AcademyOrganisation.tutorConversations`)
- New models:
  - `AcademyTutorConversation` (`academy_tutor_conversations`): id, companyId, learnerId, createdAt, updatedAt.
    Unique (companyId, id). Indexes on createdAt and (companyId, learnerId, createdAt).
  - `AcademyTutorMessage` (`academy_tutor_messages`): id, companyId, conversationId, role, content, createdAt.
    Composite FK (companyId, conversationId) to the conversation, ON DELETE CASCADE.
  - `AcademyTutorToolAudit` (`academy_tutor_tool_audits`): id, companyId, conversationId, tool, userId (text, no FK),
    inputHash, status, durationMs, error, createdAt. Composite FK as for messages.
- Ids are String cuid, matching the rest of the schema. The tenant is Company (runtime companyId).

## Retention (retention.ts)
- `purgeExpiredTutorData(client, { retentionDays = 30, now, batchSize = 500 })`.
- Expiry is conversation createdAt strictly before now minus retentionDays. Messages and audits are deleted
  with their conversation, in one transaction per batch.
- Platform-wide, not per company. Nothing schedules it yet.

## Store (prisma-store.ts)
- `PrismaTutorStore(prisma)`: Prisma client injected. Not constructed at load.
- Every method calls the runtime's `requireCompanyId`.
- `toolAuditSink({ companyId, conversationId })` returns the function for `ToolExecutorOptions.audit`.
  It refuses entries whose company_id differs.

## Migration
- `prisma/migrations-draft/20261108120000_academy_tutor_store/migration.sql`. DRAFT, not applied, not in the real
  migrations folder.

## Decisions for review
1. Tenant = Company.id (formerly AcademyOrganisation.id), column companyId. This build renames the column; see the rename section below.
2. Retention age = conversation createdAt, not last activity. A conversation still in use after 30 days is deleted.
3. Tool audit userId is text with no FK, because the runtime passes string|number|null.
4. Learner FK is a plain User FK, matching AcademyTrainingAssignment. Learner membership in the org is not enforced in the DB.

## Not done / unverified
- prisma validate not run: prisma CLI not installed in the working copy (no node_modules).
- tsc not run, per instructions. The real PrismaClient is not checked against TutorPrismaClient.
- RetrievalStore port not implemented: the schema has no chunk or document table to back findCandidates.
- The runtime has no conversation or message port. Those methods are the store's own API.

## Rename and single-write turn (build R2)

- Every tutor row carries `companyId` (was `organisationId`). The tenant is the `Company` model, table `academy_companies`.
- `recordExchange({ companyId, learnerId, userContent, assistantContent })` writes the conversation and both messages in one `$transaction` array. The conversation id is a UUID set by the store, so the two message rows can name it in the same batch. It is a String column, so this is valid. The schema default is `cuid()`, so this is a choice to review.
- `createConversation` and `appendMessage` remain for other callers. The route no longer uses them.
- The constructor now also requires `$transaction`.
- Not verified against a real Prisma client. The batch form of `$transaction` and the `companyId` column names depend on R1's schema.
