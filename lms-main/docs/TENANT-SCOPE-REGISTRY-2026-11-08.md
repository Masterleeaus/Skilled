# Tenant scope registry, 2026-11-08

Issue #68, tag S7. Branch `claude/inventory-tenant-scope`, base `origin/main` at `98eb855`.

This is a read-only inventory. No schema, migration, source or lockfile was changed, no database was touched, and no Prisma command was run. Sources: `apps/backend/prisma/schema.prisma` (58 models), the 31 folders in `apps/backend/prisma/migrations/`, `apps/backend/prisma/disabled-migrations/`, and the raw SQL files in the repo. A scripted cross-check (kept outside the repo) confirmed that the schema's 58 mapped tables equal the 58 tables the migration chain creates, once the two Company-related renames are applied.

**Central mapping:** unknown: Central registry not in this repo. This applies to every row in section 3.

## Scope classes

- `company-owned`: a company column exists and is required.
- `company-optional`: a company column exists and is nullable. This is a tenant leak risk.
- `global`: no company column, and the data is curriculum or reference data.
- `user-global`: no company column, and the data belongs to a user identity. The tenant is not stored on the row.
- `unscoped-suspicious`: no company column, and the data looks tenant-specific.

Tenant column names: the Academy tenant column is `companyId`. Two integration tables use `companyRef` instead (`academy_integration_audit`, `academy_service_credentials`). They are counted as tenant columns and noted in the table.

## 1. Counts by scope class

| Class | Count | Models |
|---|---:|---|
| company-optional | 6 | AcademyCourseLessonSelection, AcademyPracticalEvidence, AcademyExternalIdentity, AcademyTemplateResponse, AcademyPathwayEnrolment, AcademyIntegrationAudit (companyRef) |
| unscoped-suspicious | 5 | Coupon, AuditLog, AcademyTemplateSignOff, AcademyGeneratedDocument, Company (tenant root) |
| company-owned | 12 | CompanyMember, AcademyTrainingAssignment, AcademyVerifiedCompetency, AcademyServiceCredential (companyRef), AcademyBusinessLessonField, AcademyLessonContextSnapshot, AcademyTutorConversation, AcademyTutorMessage, AcademyTutorToolAudit, AcademyChatbot, AcademyChatbotConversation, AcademyChatbotMessage |
| global | 19 | Category, Course, Module, Lesson, VideoObjectCleanup, Quiz, Question, Option, Assignment, LiveClass, AcademyContentLesson, AcademyLessonRevision, AcademyCurriculumTrack, AcademyLessonPlacement, AcademyCourseTrack, AcademyKnowledgeAnswerKey, AcademyLessonReview, AcademyCurriculumPathway, AcademyPathwayCourse |
| user-global | 16 | User, RefreshToken, Enrollment, LessonProgress, QuizAttempt, Answer, AssignmentSubmission, Attendance, Certificate, Notification, Review, DiscussionThread, DiscussionReply, Payment, AcademyLearnerCompletion, AcademyKnowledgeAttempt |
| **Total** | **58** | |

## 2. Decisions for the owner

Read these first. Section 3 has the full row for each model.

### company-optional (6)

1. **AcademyCourseLessonSelection**: `companyId` NULL is the course-wide default, by design. Any read path that treats NULL as "any company" shows these rows to every tenant. The partial unique index that covers NULL exists only in SQL, not in the schema.
2. **AcademyPracticalEvidence**: NULL means legacy and unassigned. The SQL comment says these rows cannot enter tenant assessor queues. Any query that omits `companyId` reads them.
3. **AcademyExternalIdentity**: NULL means a legacy identity. The schema comment says the application denies these. There is no FK, by design. The global unique key `(service, externalUserRef)` still exists, so the same external ref cannot appear in two companies until the disabled drop is enabled.
4. **AcademyTemplateResponse**: nullable with an FK. NULL rows are not bound to a tenant, and the schema has no comment on why.
5. **AcademyPathwayEnrolment**: nullable with an FK. The schema says "optionally scoped to an Academy company". NULL means a learner enrolment with no tenant. Confirm this is intended.
6. **AcademyIntegrationAudit**: the column is `companyRef`, not `companyId`, and it is nullable with no FK. NULL is expected for denied attempts where the company is unknown. The audit records the attempt, not tenant data.

### unscoped-suspicious (5)

7. **Coupon**: no company column. `usageLimit` and `redeemedCount` are one counter shared by all tenants that use the code. If coupons were meant to be per company, usage leaks across tenants.
8. **AuditLog**: no company column. `entity`/`entityId` and the JSON `oldValue`/`newValue` can hold tenant-scoped records, and the log cannot be filtered by tenant.
9. **AcademyTemplateSignOff**: no company column. The tenant is reachable only through `templateResponseId`, whose `companyId` is nullable.
10. **AcademyGeneratedDocument**: issued learner documents with assembled content. No company column. The tenant is reachable only through `templateResponseId`, whose `companyId` is nullable.
11. **Company**: the tenant root (`academy_companies`). It has no company column by definition. It is listed so the owner confirms it is the only by-design exception.

### Also worth a decision (classed user-global or global)

- The learner records in the `user-global` class (Enrollment, Payment, Certificate, AcademyLearnerCompletion, AcademyKnowledgeAttempt and others) store no tenant. The tenant can only be inferred through `CompanyMember`, which a user can have zero or several of.
- `AcademyLearnerCompletion` has no company column, but its sibling `AcademyVerifiedCompetency` does. This looks inconsistent.
- `Payment` is financial data with no company column. It is classed `user-global` under the rule, but it is the highest-value record in that class.
- `Course` and `LiveClass` are classed `global` on the assumption that the catalogue is shared across companies. The schema does not say so. Confirm this.

## 3. Model registry (58 models)

Key facts that apply to all rows:
- PK: all 58 models use `id String @id @default(cuid())`. There are no composite `@@id` keys.
- Table: all 58 models have `@@map`. The two renamed tables are `Company` (`academy_companies`) and `CompanyMember` (`academy_company_members`).
- "FK" means a foreign key that exists in the migration SQL. "Relation" means a Prisma `@relation` to `Company`.
- Partial unique indexes that Prisma cannot express are marked "SQL only".

Order: `company-optional`, `unscoped-suspicious`, `company-owned`, `global`, `user-global`.

| # | Model | Table (`@@map`) | PK | Tenant column | Link to company | Unique or index with tenant column | Central mapping | Scope class | Reason and notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | AcademyCourseLessonSelection | academy_course_lesson_selections | id | `companyId`, nullable | Relation + FK | unique (companyId, courseId, sourceId); partial unique (courseId, sourceId) WHERE companyId IS NULL (SQL only) | unknown: Central registry not in this repo | company-optional | NULL = course-wide default by design. See section 2, item 1. |
| 2 | AcademyPracticalEvidence | academy_practical_evidence | id | `companyId`, nullable | Relation + FK | index (companyId, status, createdAt) | unknown: Central registry not in this repo | company-optional | NULL = legacy unassigned. See item 2. |
| 3 | AcademyExternalIdentity | academy_external_identities | id | `companyId`, nullable | none (no FK, by design) | unique (service, companyId, externalUserRef); global unique (service, externalUserRef) kept; index (companyId, userId) | unknown: Central registry not in this repo | company-optional | Legacy NULL identities are denied by the app. See item 3. |
| 4 | AcademyTemplateResponse | academy_template_responses | id | `companyId`, nullable | Relation + FK | index (companyId, status) | unknown: Central registry not in this repo | company-optional | See item 4. |
| 5 | AcademyPathwayEnrolment | academy_pathway_enrolments | id | `companyId`, nullable | Relation + FK | index (companyId, status) | unknown: Central registry not in this repo | company-optional | Schema says optional. See item 5. |
| 6 | AcademyIntegrationAudit | academy_integration_audit | id | `companyRef`, nullable (not `companyId`) | none | index (companyRef, createdAt) | unknown: Central registry not in this repo | company-optional | Denied attempts may have no company. See item 6. |
| 7 | Coupon | coupons | id | none | none | unique (code) only | unknown: Central registry not in this repo | unscoped-suspicious | Shared `usageLimit`/`redeemedCount` counter. See item 7. |
| 8 | AuditLog | audit_logs | id | none | none (FK to User only) | index (userId); index (entity, entityId) | unknown: Central registry not in this repo | unscoped-suspicious | Generic entity with JSON values. See item 8. |
| 9 | AcademyTemplateSignOff | academy_template_sign_offs | id | none (tenant via templateResponse) | none | index (templateResponseId, decidedAt) | unknown: Central registry not in this repo | unscoped-suspicious | Tenant only through nullable parent. See item 9. |
| 10 | AcademyGeneratedDocument | academy_generated_documents | id | none (tenant via templateResponse) | none | unique (templateResponseId, version); unique (signOffId) | unknown: Central registry not in this repo | unscoped-suspicious | Tenant only through nullable parent. See item 10. |
| 11 | Company | academy_companies | id | none (is the tenant key) | n/a | none | unknown: Central registry not in this repo | unscoped-suspicious | Tenant root. Expected by design. See item 11. |
| 12 | CompanyMember | academy_company_members | id | `companyId`, required | Relation + FK | unique (companyId, userId); index (userId) | unknown: Central registry not in this repo | company-owned | Membership links a user to a tenant. |
| 13 | AcademyTrainingAssignment | academy_training_assignments | id | `companyId`, required | Relation + FK | unique (companyId, learnerId, courseId); index (learnerId, status) | unknown: Central registry not in this repo | company-owned | Index name is mapped to `academy_training_assignments_org_learner_course_key`. |
| 14 | AcademyVerifiedCompetency | academy_verified_competencies | id | `companyId`, required | Relation + FK | index (companyId, learnerId) | unknown: Central registry not in this repo | company-owned | |
| 15 | AcademyServiceCredential | academy_service_credentials | id | `companyRef`, required (not `companyId`) | none (no FK) | index (service, companyRef) | unknown: Central registry not in this repo | company-owned | Tenant named by value only. A credential can name a company that does not exist. |
| 16 | AcademyBusinessLessonField | academy_business_lesson_fields | id | `companyId`, required | none (no FK) | unique (companyId, fieldKey); index (companyId, status) | unknown: Central registry not in this repo | company-owned | No FK, so `companyId` is not checked against `academy_companies`. |
| 17 | AcademyLessonContextSnapshot | academy_lesson_context_snapshots | id | `companyId`, required | none (no FK) | index (companyId, learnerId, createdAt) | unknown: Central registry not in this repo | company-owned | No FK, as for row 16. |
| 18 | AcademyTutorConversation | academy_tutor_conversations | id | `companyId`, required | Relation + FK | unique (companyId, id); index (companyId, learnerId, createdAt) | unknown: Central registry not in this repo | company-owned | Other tutor tables reference this composite key. |
| 19 | AcademyTutorMessage | academy_tutor_messages | id | `companyId`, required | none direct; composite FK (companyId, conversationId) | index (conversationId, createdAt); no index starts with companyId | unknown: Central registry not in this repo | company-owned | Tenant enforced through the composite FK to the conversation. |
| 20 | AcademyTutorToolAudit | academy_tutor_tool_audits | id | `companyId`, required | none direct; composite FK (companyId, conversationId) | index (companyId, createdAt); index (conversationId, createdAt) | unknown: Central registry not in this repo | company-owned | As row 19. `userId` is text, not an FK. |
| 21 | AcademyChatbot | academy_chatbots | id | `companyId`, required | Relation + FK | unique (companyId, id); index (companyId, active) | unknown: Central registry not in this repo | company-owned | |
| 22 | AcademyChatbotConversation | academy_chatbot_conversations | id | `companyId`, required | Relation + FK; composite FK to chatbot | unique (companyId, id); indexes (companyId, lastActivityAt), (companyId, sessionId) | unknown: Central registry not in this repo | company-owned | CHECK on `ticketStatus` in SQL only. |
| 23 | AcademyChatbotMessage | academy_chatbot_messages | id | `companyId`, required | Relation + FK; composite FK to conversation | indexes (companyId, conversationId, createdAt), (companyId, conversationId, role, readAt) | unknown: Central registry not in this repo | company-owned | CHECKs on `role` and `contentType` in SQL only. |
| 24 | Category | categories | id | none | none | unique (slug) | unknown: Central registry not in this repo | global | Catalogue reference data. |
| 25 | Course | courses | id | none | none | unique (slug); index (teacherId); index (categoryId) | unknown: Central registry not in this repo | global | Shared catalogue assumed. `teacherId` is a user. Confirm. |
| 26 | Module | modules | id | none | none (FK to course) | index (courseId) | unknown: Central registry not in this repo | global | Curriculum structure. |
| 27 | Lesson | lessons | id | none | none (FK to module) | index (moduleId) | unknown: Central registry not in this repo | global | Curriculum content. |
| 28 | VideoObjectCleanup | video_object_cleanup | id | none | none | unique (objectKey) | unknown: Central registry not in this repo | global | Queue of lesson video object keys. Media for global lessons. |
| 29 | Quiz | quizzes | id | none | none (FK to course) | index (courseId) | unknown: Central registry not in this repo | global | Assessment content. |
| 30 | Question | questions | id | none | none | index (quizId) | unknown: Central registry not in this repo | global | Assessment content. |
| 31 | Option | options | id | none | none | index (questionId) | unknown: Central registry not in this repo | global | Assessment content. |
| 32 | Assignment | assignments | id | none | none (FK to course; `createdById` is a user) | index (courseId) | unknown: Central registry not in this repo | global | Course content. Submissions are `user-global`. |
| 33 | LiveClass | live_classes | id | none | none (FK to course; `createdById` is a user) | index (courseId) | unknown: Central registry not in this repo | global | Course schedule. Attendance is `user-global`. |
| 34 | AcademyContentLesson | academy_content_lessons | id | none | none | unique (sourceId); index (layer, serviceGroup) | unknown: Central registry not in this repo | global | Canonical lesson inventory. |
| 35 | AcademyLessonRevision | academy_lesson_revisions | id | none | none (FK to lesson) | unique (lessonId, version); index (lessonId, status) | unknown: Central registry not in this repo | global | Immutable authored revisions. |
| 36 | AcademyCurriculumTrack | academy_curriculum_tracks | id | none | none | unique (slug) | unknown: Central registry not in this repo | global | Curriculum track. |
| 37 | AcademyLessonPlacement | academy_lesson_placements | id | none | none (FKs to track, lesson, revision) | unique (trackId, lessonId); unique (trackId, position) | unknown: Central registry not in this repo | global | Curriculum composition. |
| 38 | AcademyCourseTrack | academy_course_tracks | id | none | none (FK to course, NOT VALID) | unique (courseId, trackId); unique (courseId, position) | unknown: Central registry not in this repo | global | Course composition. FK validation is disabled. |
| 39 | AcademyKnowledgeAnswerKey | academy_knowledge_answer_keys | id | none | none | unique (revisionId, checkId) | unknown: Central registry not in this repo | global | Server-only answer keys. Sensitive, but not tenant data. |
| 40 | AcademyLessonReview | academy_lesson_reviews | id | none | none (FKs to revision, reviewer user) | index (revisionId, decidedAt); index (reviewerId) | unknown: Central registry not in this repo | global | Content governance on revisions. Reviewer is a user. |
| 41 | AcademyCurriculumPathway | academy_curriculum_pathways | id | none | none | unique (code) | unknown: Central registry not in this repo | global | Role pathway definitions. |
| 42 | AcademyPathwayCourse | academy_pathway_courses | id | none | none (FK to pathway) | unique (pathwayId, courseSlug); unique (pathwayId, position) | unknown: Central registry not in this repo | global | Pathway course order. |
| 43 | User | users | id | none | none | unique (email) | unknown: Central registry not in this repo | user-global | Identity. The tenant comes from `CompanyMember`. |
| 44 | RefreshToken | refresh_tokens | id | none | none (FK to user) | index (userId) | unknown: Central registry not in this repo | user-global | Belongs to a user. |
| 45 | Enrollment | enrollments | id | none | none (FKs to user, course) | unique (studentId, courseId) | unknown: Central registry not in this repo | user-global | Learner enrolment. Tenant not stored. |
| 46 | LessonProgress | lesson_progress | id | none | none | unique (studentId, lessonId) | unknown: Central registry not in this repo | user-global | Learner progress. |
| 47 | QuizAttempt | quiz_attempts | id | none | none | partial unique (studentId, quizId) WHERE IN_PROGRESS (SQL only) | unknown: Central registry not in this repo | user-global | Learner attempt. |
| 48 | Answer | answers | id | none (via attempt) | none | unique (attemptId, questionId) | unknown: Central registry not in this repo | user-global | Learner answer. Scoped only through the attempt. |
| 49 | AssignmentSubmission | assignment_submissions | id | none | none | unique (assignmentId, studentId) | unknown: Central registry not in this repo | user-global | Learner submission. Includes uploaded attachments (JSON). |
| 50 | Attendance | attendances | id | none | none | unique (liveClassId, studentId) | unknown: Central registry not in this repo | user-global | Learner attendance. |
| 51 | Certificate | certificates | id | none | none | unique (studentId, courseId); unique (certificateNumber); unique (verificationToken) | unknown: Central registry not in this repo | user-global | Learner credential. Public verify endpoint. |
| 52 | Notification | notifications | id | none | none (FK to user) | index (userId) | unknown: Central registry not in this repo | user-global | Belongs to a user. |
| 53 | Review | reviews | id | none | none | unique (courseId, studentId) | unknown: Central registry not in this repo | user-global | Learner review. |
| 54 | DiscussionThread | discussion_threads | id | none | none | index (courseId); index (lessonId) | unknown: Central registry not in this repo | user-global | Learner-authored content. |
| 55 | DiscussionReply | discussion_replies | id | none | none | index (threadId) | unknown: Central registry not in this repo | user-global | User-authored content. |
| 56 | Payment | payments | id | none | none (FKs to user, course, coupon) | unique (transactionId); partial unique (studentId, courseId) WHERE PENDING (SQL only) | unknown: Central registry not in this repo | user-global | Financial record with no tenant. Highest-value record in this class. See section 2. |
| 57 | AcademyLearnerCompletion | academy_learner_completions | id | none | none (FK to revision) | unique (learnerId, lessonId, revisionId) | unknown: Central registry not in this repo | user-global | Learner training completion. Sibling `AcademyVerifiedCompetency` has a company column. |
| 58 | AcademyKnowledgeAttempt | academy_knowledge_attempts | id | none | none (FK to revision) | index (learnerId, revisionId, createdAt) | unknown: Central registry not in this repo | user-global | Learner check attempt. |

## 4. Migration folders (31)

The chain is `apps/backend/prisma/migrations/`. "Live applied" is **unknown** for every row. No migration record for a live database exists in this repo. `docs/INSTALL.md` says migrations "have not been recorded as applied" on the Academy PostgreSQL 16 database. The rehearsal report and the E2E smoke run covered earlier chains on scratch databases. Section 6 has the details.

| # | Folder | Live applied | Creates | Alters, renames or other |
|---|---|---|---|---|
| 1 | `20260717195126_init` | unknown | 25 LMS tables: users, refresh_tokens, categories, courses, modules, lessons, enrollments, lesson_progress, quizzes, questions, options, quiz_attempts, answers, assignments, assignment_submissions, live_classes, attendances, certificates, notifications, reviews, discussion_threads, discussion_replies, coupons, payments, audit_logs; 10 enums | none |
| 2 | `20261102000100_academy_external_identity_audit` | unknown | academy_external_identities (unique service, externalUserRef), academy_integration_audit (`organisationRef`) | none |
| 3 | `20261102000100_titan_academy_content_inventory` | unknown | academy_content_lessons | Same timestamp as #2 (see section 6) |
| 4 | `20261102000200_titan_academy_curriculum_composition` | unknown | academy_lesson_revisions, academy_curriculum_tracks, academy_lesson_placements | none |
| 5 | `20261102000300_academy_course_composition` | unknown | academy_course_tracks, academy_learner_completions | none |
| 6 | `20261102002300_business_lesson_fields` | unknown | academy_business_lesson_fields (`organisationId` NOT NULL), academy_lesson_context_snapshots (`organisationId` NOT NULL) | none |
| 7 | `20261102060000_academy_knowledge_attempts` | unknown | academy_knowledge_attempts | none |
| 8 | `20261102070000_academy_practical_evidence` | unknown | academy_practical_evidence | none |
| 9 | `20261102080000_academy_organisations_training` | unknown | academy_organisations, academy_organisation_members, academy_training_assignments (`organisationId` NOT NULL) | none |
| 10 | `20261102090000_academy_verified_competencies` | unknown | academy_verified_competencies (`organisationId` NOT NULL) | none |
| 11 | `20261102100000_academy_evidence_tenant_binding` | unknown | none | Adds `organisationId` (nullable) to academy_practical_evidence, with index and FK |
| 12 | `20261102170000_academy_service_credentials` | unknown | academy_service_credentials (`organisationRef` NOT NULL) | none |
| 13 | `20261102190000_academy_identity_tenant_scope` | unknown | none | Adds `organisationId` (nullable) to academy_external_identities, with index |
| 14 | `20261102200000_academy_template_pathway_review` | unknown | academy_lesson_reviews, academy_template_responses, academy_template_sign_offs, academy_generated_documents, academy_curriculum_pathways, academy_pathway_courses, academy_pathway_enrolments | `organisationId` (nullable) on template_responses and pathway_enrolments |
| 15 | `20261102210000_academy_certificate_idempotency` | unknown | none | certificates: unique (studentId, courseId) |
| 16 | `20261102220000_academy_quiz_answer_uniqueness` | unknown | none | answers: unique (attemptId, questionId); quiz_attempts: partial unique (studentId, quizId) WHERE IN_PROGRESS |
| 17 | `20261102230000_academy_multiple_choice_answers` | unknown | none | answers: adds `selected_option_ids` JSONB |
| 18 | `20261102240000_assignment_passing_marks` | unknown | none | assignments: adds `passingMarks` with CHECK |
| 19 | `20261102250000_academy_course_lesson_selection` | unknown | academy_course_lesson_selections | none |
| 20 | `20261102260000_academy_course_lesson_organisation_scope` | unknown | none | selections: adds `organisationId` (nullable); drops unique (courseId, sourceId); adds unique (organisationId, courseId, sourceId); partial unique (courseId, sourceId) WHERE organisationId IS NULL; FK |
| 21 | `20261102270000_academy_knowledge_answer_keys` | unknown | academy_knowledge_answer_keys | none |
| 22 | `20261103120000_licence_track_enrolment` | unknown | none | enrollments and payments: adds `licenceTrack` TEXT NOT NULL DEFAULT 'non-licensed' |
| 23 | `20261108090000_academy_tenant_company_rename` | unknown | none | Renames academy_organisations to academy_companies and academy_organisation_members to academy_company_members. Renames `organisationId` to `companyId` on 10 tables: academy_company_members, academy_training_assignments, academy_verified_competencies, academy_practical_evidence, academy_external_identities, academy_business_lesson_fields, academy_lesson_context_snapshots, academy_course_lesson_selections, academy_template_responses, academy_pathway_enrolments. Renames `organisationRef` to `companyRef` on academy_integration_audit and academy_service_credentials. Renames indexes and constraints. Every step is guarded. Preflight 1 must run first. |
| 24 | `20261108100000_academy_external_identity_org_unique` | unknown | none | academy_external_identities: adds `companyId` IF NOT EXISTS; unique (service, companyId, externalUserRef). Global key kept. |
| 25 | `20261108100100_academy_course_tracks_course_fk` | unknown | none | academy_course_tracks: FK courseId to courses(id), ON DELETE CASCADE, NOT VALID |
| 26 | `20261108100200_academy_training_assignment_index_name` | unknown | none | Renames one index on academy_training_assignments. No table change. |
| 27 | `20261108120000_academy_tutor_store` | unknown | academy_tutor_conversations, academy_tutor_messages, academy_tutor_tool_audits (companyId NOT NULL) | FK conversations to academy_companies; composite FKs for messages and tool audits |
| 28 | `20261108120100_academy_chatbot` | unknown | academy_chatbots, academy_chatbot_conversations, academy_chatbot_messages (companyId NOT NULL) | FKs to academy_companies and composite FKs; CHECKs on ticketStatus, role, contentType |
| 29 | `20261108130000_payment_coupon_redemptions` | unknown | none | coupons: adds `redeemedCount`; payments: adds `checkoutUrl`, `couponId` with FK and index; partial unique (studentId, courseId) WHERE PENDING |
| 30 | `20261108140000_certificate_verification_token` | unknown | none | certificates: adds `verificationToken` (unique, nullable) and `showNameOnVerify` (default false). No backfill. |
| 31 | `20261108150000_video_object_cleanup` | unknown | video_object_cleanup | none |

Totals: 58 tables created across the chain. The rename turns two of them into `academy_companies` and `academy_company_members`. That gives the 58 mapped tables in the schema.

## 5. Disabled, draft and raw SQL files

| File | Status | What it would change |
|---|---|---|
| `apps/backend/prisma/disabled-migrations/20261108100300_DISABLED_academy_external_identity_drop_global_key.sql` | Disabled. Must not be placed in `migrations/` while disabled. | `DROP INDEX IF EXISTS "academy_external_identities_service_externalUserRef_key"`. Identities become unique per company, not globally. Preconditions: preflight 2 clean, app provisions `companyId`, human accepts the cross-company change. |
| `apps/backend/prisma/disabled-migrations/20261108100400_DISABLED_academy_course_tracks_fk_validate.sql` | Disabled. Only after preflight 3 returns zero rows. | `ALTER TABLE academy_course_tracks VALIDATE CONSTRAINT academy_course_tracks_courseId_fkey`. No data change. Scans the table and fails on orphans. |
| `apps/backend/prisma/preflight-20261108090000-company-rename.sql` | Read-only. Raises an error if target names exist. | Nothing. Must run before the rename. |
| `apps/backend/prisma/preflight-20261108100000-external-identity-scope.sql` | Read-only SELECTs. | Nothing. Duplicate triples and orphan `companyId` must be zero. |
| `apps/backend/prisma/preflight-20261108100100-course-tracks-fk.sql` | Read-only SELECT. | Nothing. Lists orphan `academy_course_tracks` rows. |
| `apps/backend/prisma/preflight-20261108100200-training-assignment-index-name.sql` | Read-only SELECT. | Nothing. Shows the index name state and checks for duplicates. |
| `apps/backend/prisma/quiz-answer-preflight.sql` | Read-only SELECTs. Not one of the four preflights in the notes. | Nothing. Checks for duplicate answers and active attempts before migration #16. Its status in the rollout order is not documented. |
| `scripts/check-certificate-duplicates.sql` | Read-only SELECT. | Nothing. Checks duplicate certificates before the certificate uniqueness migration. Its header mentions "Field or Desk data", which does not match this product. Likely copied from another project. |
| `apps/backend/prisma/migrations-draft/` | **Missing.** Referenced by `schema.prisma` (lines 1164 to 1168), by `src/tutor/chatbot/CHANGES.md`, and by `src/tutor/store/CHANGES.md`. | Nothing in the repo. The two drafts it held are promoted to `migrations/` as #27 and #28. |

## 6. Discrepancies and uncertainties

1. **Stale draft comments.** `schema.prisma` lines 1162 to 1168 say the chatbot tables are "DRAFT, NOT APPLIED" and that the SQL is in `migrations-draft/`. That folder is missing, and the SQL is in `migrations/` as #27 and #28. The `CHANGES.md` files say the same. Treat the comments as stale until the owner confirms.
2. **Migration applied status is unknown.** Repo evidence:
   - `docs/MIGRATION-REHEARSAL-2026-11-08.md` applied a 29-folder chain on a scratch database at base `1fbf352`. It names #29 and the earlier cut points. It does not name #27, #28, #30 or #31.
   - `docs/E2E-SMOKE-2026-11-08.md` says "30 migrations applied" on a scratch database.
   - The repo now has 31 folders. No recorded run covers the current chain.
3. **Same-prefix migrations.** `20261102000100_academy_external_identity_audit` and `20261102000100_titan_academy_content_inventory` share a timestamp. The rehearsal report says they share no tables and are order-independent.
4. **Preflight order.** `prisma/PREFLIGHT-ORDER.md` and `MIGRATION-FIX-NOTES.md` say the staged order cannot run in one `prisma migrate deploy`. The rehearsal report says preflights 2 and 4 fail before the rename. Maintainers need to decide this.
5. **Partial indexes and CHECKs are outside Prisma.** Prisma cannot show these, so `prisma migrate diff` will not catch drift in them:
   - `academy_course_lesson_selections`: partial unique for NULL companyId.
   - `quiz_attempts`: partial unique for IN_PROGRESS.
   - `payments`: partial unique for PENDING.
   - The chatbot CHECK constraints.
6. **No FK to `academy_companies`.** Rows 15, 16 and 17 (`AcademyServiceCredential`, `AcademyBusinessLessonField`, `AcademyLessonContextSnapshot`) are required-tenant rows with no FK. Row 3 (`AcademyExternalIdentity`) and row 6 (`AcademyIntegrationAudit`) have no FK by design.
7. **Tutor message and audit tables** have no direct FK to the company. Their tenant is enforced through a composite FK to the conversation. This is correct only if every row's `companyId` matches its conversation's.
8. **Column naming.** The tenant column is `companyId` on 16 tables and `companyRef` on 2. The `companyRef` tables are rows 6 and 15.
9. **Scope classes are inferred.** The class for `user-global`, `global` and `unscoped-suspicious` rows is a judgement from the model name and fields. Nothing in the repo records how these tables are meant to be scoped. The owner should confirm the borderline rows: 25, 32, 33, 39, 40, 56, 57, 7 and 8.
10. **Not verified.** I did not run `prisma validate`, `prisma generate`, `prisma migrate diff`, or any SQL against PostgreSQL. All findings are from reading the files, plus a scripted check that the 58 mapped tables equal the 58 tables the chain creates.

## 7. Method

- Models: read all 1233 lines of `schema.prisma`. Parsed each `model` block with a script to confirm the PK, `@@map`, tenant columns and `Company` relations. The script ran from the scratchpad, not the repo.
- Migrations: read the rename migration, the two fix migrations, the chatbot and tutor migrations, the disabled files and the preflights in full. Grepped every other folder for `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `DROP`, `DO $$`, and every `organisation`, `company` and `Company` reference.
- Nullability: each tenant column's SQL definition matches its schema field (NOT NULL or nullable) for all 12 required and 6 nullable tenant columns.
- Not done: no migration was executed, no database was queried, no Central contract was checked (it is not in this repo).
