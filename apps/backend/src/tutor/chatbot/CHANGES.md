# Chatbot storage port: Desk (Drizzle) to LMS (Prisma)

Agent T4. Source is read-only: `/home/claude/desk-handoff/desk-review/server/modules/chatbot/`.
Schema: the chatbot models are merged into `prisma/schema.prisma` (DRAFT, not applied). The draft migration is in `prisma/migrations-draft/20261108120100_academy_chatbot/migration.sql`. `PROPOSED-SCHEMA.prisma` in this folder is the original proposal and is superseded by the merge. No migration was applied and no database was touched.

## Tenant key decision (L1, decided)

The chatbot uses the LMS tenant id as-is: the `Company` cuid (the tenant model, formerly `AcademyOrganisation`). Desk's UUID-only rule does not apply to LMS tenants.

- `requireCompanyId()` now accepts a cuid-style id (letters and digits, 20 to 30 characters, starting with a letter) or a UUID. It still rejects empty, non-string and malformed values with a 403.
- `isUuidCompanyId()` keeps Desk's strict UUID rule as a separate export. It is not deleted.
- `isCuidCompanyId()` is the LMS rule on its own. `isCompanyId()` is the combined rule used by `requireCompanyId()`.
- The Prisma schema holds `companyId` as a plain `String` (no `@db.Uuid`), and ids are `@default(cuid())`, as in the other Academy models.
- Tests: `tests/tutor/chatbot/chatbot-store.test.mjs` covers cuid accepted, UUID still accepted, empty and malformed rejected, and a cross-tenant read with cuid tenants returning nothing.

## Files

Copied from Desk, unchanged (verified with `cmp`):
- `chatbot-service.ts`
- `conversation-export.ts`
- `generative-ui/builder-registry.ts`, `generative-ui/index.ts`, `generative-ui/response-composer.ts`, `generative-ui/semantics.ts`, `generative-ui/spec-normaliser.ts`, `generative-ui/spec-validator.ts`

Copied, then edited:
- `chatbot-scope.ts`: the import from Desk `infrastructure/database/tenant-context.ts` does not exist in the LMS. `isCompanyId` is copied in as a local function with the same UUID-only rule.
- `chatbot-storage.ts`: the Drizzle implementation, its imports and its row mappers are removed. The `ChatbotStorage` interface, types and in-memory store are unchanged. The header comment was updated.

New:
- `chatbot-store-prisma.ts`: `PrismaChatbotStorage` (class) and `createPrismaChatbotStorage` (factory). The Prisma client is a constructor argument, typed structurally as `ChatbotPrismaClient`. The file has no runtime import of `@prisma/client`.
- `PROPOSED-SCHEMA.prisma`: proposed models for T3.
- `tests/tutor/chatbot/chatbot-store.test.mjs` (outside this folder, in the LMS tests tree): 10 tests.

Not ported:
- `chatbot-routes.ts`: Express routes, out of scope.
- `index.ts`: module wiring, out of scope.
- `schema.DRAFT.ts`: replaced by `PROPOSED-SCHEMA.prisma`.
- `createDrizzleChatbotStorage`'s lazy `import("../../db.ts")`: replaced by constructor injection.
- PDF export: already returns 501 in Desk, so nothing changed.
- Row-level security from `DRAFT_company_scope.sql`: not ported. Tenant isolation in the LMS is application-level only, through the `companyId` filters.

## Storage queries ported (11 interface methods)

| Method | Desk (Drizzle) | LMS (Prisma) |
|---|---|---|
| insertChatbot | insert chatbots returning | `academyChatbot.create` |
| findChatbot | select where company_id and id, limit 1 | `academyChatbot.findFirst` |
| listChatbots | select where company_id, order by created_at asc | `academyChatbot.findMany` |
| updateChatbot | update set (allow-list) where company_id and id returning | `academyChatbot.updateMany` then `findFirst` |
| insertConversation | insert chatbot_conversations returning | `academyChatbotConversation.create` |
| findConversation | select where company_id and id, limit 1 | `academyChatbotConversation.findFirst` |
| listConversations | select where company_id, order by created_at asc | `academyChatbotConversation.findMany` |
| updateConversation | update set (allow-list) where company_id and id returning | `academyChatbotConversation.updateMany` then `findFirst` |
| insertMessage | ownership select (company_id, id), then insert | `academyChatbotConversation.findFirst` (select id), then `academyChatbotMessage.create` |
| listMessages | select where company_id and conversation_id, order by created_at asc | `academyChatbotMessage.findMany` |
| markUserMessagesRead | update set read_at where company_id, conversation_id, role = user, read_at is null | `academyChatbotMessage.updateMany`, returns `count` |

Every query's `where` (or `data`, on create) carries `companyId`. `requireCompanyId()` runs before the first query in every method. The tests check this on every logged call.

## Table shapes relied on

- `chatbots`: id, company_id, title (<=200), language (default en), welcome_message, instructions, generative_ui_enabled (default true), active (default true), created_at, updated_at.
- `chatbot_conversations`: id, company_id, chatbot_id, session_id (<=128), channel (default web), connect_agent_at (null while the bot handles the chat), is_shown_on_history (default true), ticket_status (new or closed, default new), pinned (default false), last_activity_at, created_at, updated_at.
- `chatbot_messages`: id, company_id, conversation_id, role (user or assistant), message, content_type (text or titan-ui), ui_spec (jsonb, nullable), media_url, media_name, is_internal_note (default false), read_at, created_at.
- Composite keys: `(company_id, id)` unique on chatbots and conversations. Foreign keys `(company_id, chatbot_id)` and `(company_id, conversation_id)`.

## Decisions (review these)

1. **Tenant key: resolved (L1).** The LMS cuid is used as-is. See "Tenant key decision" above.
2. Models are named `AcademyChatbot`, `AcademyChatbotConversation`, `AcademyChatbotMessage`, mapped to `academy_chatbots`, `academy_chatbot_conversations`, `academy_chatbot_messages`. No existing model name clashes with them.
3. Columns are camelCase with no `@map`, following the existing Academy models. The DRAFT SQL uses snake_case, so the physical column names differ from the DRAFT.
4. `companyId` is a plain `String`, and ids are `cuid()`, as in the other Academy models. The field is `companyId`, the same name the other Academy models use after the Company rename, so the store and its tests did not need to change.
5. `ticketStatus`, `role` and `contentType` stay as `String` with CHECK constraints. Prisma cannot express CHECK, so the constraints are in the draft migration SQL by hand. Prisma enums were not used, to keep the DRAFT values.
6. `updatedAt` has no `@updatedAt`. The store sets it explicitly, as Desk does.
7. Timestamps are plain `DateTime` and `uiSpec` is plain `Json?`, as in the other Academy models. The `@db.Timestamp(6)` and `@db.JsonB` annotations from the proposal were dropped for that reason.
8. Foreign keys have no explicit `onDelete` in the original proposal. Superseded by owner decision 3 above (explicit Restrict).

## Owner decisions (L3, applied)

1. **Field name stays `companyId`.** Not renamed to `organisationId`. Reason: the store, its tests and the Desk port already use `companyId`, so a rename would touch files outside this change.
2. **Tenant foreign key added.** Each chatbot table (`academy_chatbots`, `academy_chatbot_conversations`, `academy_chatbot_messages`) has `companyId` referencing `academy_companies(id)`. The column type is TEXT on both sides, because `Company.id` is a cuid `String`. Constraint names in the draft migration: `chatbots_company_fk`, `chatbot_conversations_company_fk`, `chatbot_messages_company_fk`. Reason: a chatbot row must not point at a tenant that does not exist, and the owner asked for the tenant key to be enforced by the database, not only by the application.
3. **Delete rule is Restrict.** The Prisma relations set `onDelete: Restrict` explicitly, and the draft SQL uses `ON DELETE RESTRICT`. Reason: it matches the other Academy relations to `Company`, which all use `onDelete: Restrict`. Deleting an organisation with chatbot data fails instead of silently removing conversations and messages.
4. **No `onUpdate` in the schema.** The existing schema never sets `onUpdate`, so the Prisma relations do not either. The draft SQL keeps `ON UPDATE CASCADE`, which is Prisma's default and what `prisma migrate diff` would generate.
5. **Back-relation fields added on `Company`:** `chatbots`, `chatbotConversations`, `chatbotMessages`. Prisma requires one per relation. No other field on `AcademyOrganisation` changed.

## Drizzle-only types changed

- `varchar("id").primaryKey().default(gen_random_uuid())` becomes `String @id @default(uuid())`. Prisma generates the id on the client, so the DRAFT's database default is not carried over.
- `jsonb().$type<Record<string, unknown>>()` becomes `Json? @db.JsonB`. The store casts the value to `Record<string, unknown> | null`.
- `timestamp()` (no time zone) becomes `DateTime @db.Timestamp(6)`.
- `$inferSelect` and `$inferInsert` types become hand-written `ChatbotRow`, `ConversationRow` and `MessageRow` interfaces in the store.
- `and`, `eq`, `asc` and `isNull` become `where` and `orderBy` objects. `isNull(read_at)` becomes `readAt: null`.
- `.returning()` becomes `updateMany` (count) followed by `findFirst`. This is two round trips and is not atomic. The caller can wrap it in a transaction if that matters.
- Prisma does not accept a JS `null` when creating a `Json?` column. `uiSpec` is therefore left out of the create when it is absent, which stores SQL NULL, as Desk does.
- The composite `foreignKey()` becomes a composite `@relation(fields: [companyId, x], references: [companyId, id])`.

## Open items (not decided here)

- Row-level security. The DRAFT policies are not carried over.
- N+1 queries inherited from the service. `listConversations` and `unreadCounts` call `listMessages` once per conversation, and filter in memory. This is Desk's behaviour and was kept. On Prisma it is one query per conversation.
- `package.json` has no `"type"` field, so Node prints a module-type warning when the test runs. This is harmless. The existing ai-runtime tests have the same warning. I did not change `package.json`.

## Test

Command: `cd /home/claude/lms-work/apps/backend && node --experimental-transform-types --test tests/tutor/chatbot/chatbot-store.test.mjs tests/tutor/store/store.test.mjs`
Result: 23 of 23 pass (14 chatbot, 9 store). Node v22.23.4. No packages were installed. `tsc` was not run. No database was touched.
`prisma validate` was not run: `node_modules/.bin/prisma` is not present, and prisma was not installed.

## Rename (build R2)

- The tenant model is now `Company` (table `academy_companies`), formerly `AcademyOrganisation`. Earlier entries above describe the names at the time they were written. The chatbot's `companyId` field is unchanged, and its foreign key points at `academy_companies(id)`.
- `PROPOSED-SCHEMA.prisma` is updated to match.
