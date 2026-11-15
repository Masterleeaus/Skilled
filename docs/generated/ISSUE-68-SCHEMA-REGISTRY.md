# Issue #68: Prisma model and migration registry

Status: inventory only, generated 2026-11-15 from `apps/backend/prisma/schema.prisma` and `apps/backend/prisma/migrations/` on `Main`. This file records the current state. It does not change the schema, migrations, or tenant behaviour. The schema consolidation in #68 is remaining work.

## Counts

- Prisma models: **62** (the issue text says 57; the schema has grown since the issue was written).
- Models with `companyId` required: 14. Nullable: 7. No `companyId`: 41.
- Migrations: 38 directories, plus `migration_lock.toml`.
- Raw SQL call sites (`$queryRaw` / `$executeRaw` family): 8 non-test source files (listed below), plus test harnesses.

## Groups

- `academy_*` tables (32): Academy-owned. Carries the `academy_companies` / `academy_company_members` tenant model.
- `skilled_*` tables (4): Central link, session, and OIDC login state.
- Generic names (26): `users`, `courses`, `lessons`, `payments`, `notifications`, `audit_logs`, and similar. These are the names the issue asks to reconcile with the shared Central registry. No Central registry file exists in this repository, so ownership is marked "to confirm".

## Models

Columns: Prisma model, table, `companyId` scope, `@@unique` count, `@@index` count, group. "Owner" for every row is **to confirm** until the Central registry is available.

62
| Prisma model | Table | companyId | @@unique | @@index | Group |
|---|---|---|---|---|---|
| User | users | none | 0 | 1 | generic-shared-name |
| SkilledCentralSession | skilled_central_sessions | required | 0 | 4 | skilled-central-oidc |
| RefreshToken | refresh_tokens | none | 0 | 1 | generic-shared-name |
| Category | categories | none | 0 | 0 | generic-shared-name |
| Course | courses | none | 0 | 3 | generic-shared-name |
| Module | modules | none | 0 | 1 | generic-shared-name |
| Lesson | lessons | none | 0 | 1 | generic-shared-name |
| VideoObjectCleanup | video_object_cleanup | none | 0 | 1 | generic-shared-name |
| Enrollment | enrollments | none | 1 | 2 | generic-shared-name |
| LessonProgress | lesson_progress | none | 1 | 2 | generic-shared-name |
| Quiz | quizzes | none | 0 | 1 | generic-shared-name |
| Question | questions | none | 0 | 1 | generic-shared-name |
| Option | options | none | 0 | 1 | generic-shared-name |
| QuizAttempt | quiz_attempts | none | 0 | 2 | generic-shared-name |
| Answer | answers | none | 1 | 2 | generic-shared-name |
| Assignment | assignments | none | 0 | 1 | generic-shared-name |
| AssignmentSubmission | assignment_submissions | none | 1 | 2 | generic-shared-name |
| LiveClass | live_classes | none | 0 | 1 | generic-shared-name |
| Attendance | attendances | none | 1 | 2 | generic-shared-name |
| Certificate | certificates | none | 1 | 1 | generic-shared-name |
| Notification | notifications | none | 0 | 1 | generic-shared-name |
| Review | reviews | none | 1 | 1 | generic-shared-name |
| DiscussionThread | discussion_threads | none | 0 | 2 | generic-shared-name |
| DiscussionReply | discussion_replies | none | 0 | 1 | generic-shared-name |
| Coupon | coupons | none | 0 | 0 | generic-shared-name |
| Payment | payments | none | 0 | 3 | generic-shared-name |
| AuditLog | audit_logs | none | 0 | 2 | generic-shared-name |
| AcademyContentLesson | academy_content_lessons | none | 0 | 1 | academy |
| AcademyLessonRevision | academy_lesson_revisions | none | 1 | 1 | academy |
| AcademyCurriculumTrack | academy_curriculum_tracks | none | 0 | 0 | academy |
| AcademyLessonPlacement | academy_lesson_placements | none | 2 | 1 | academy |
| AcademyCourseTrack | academy_course_tracks | none | 2 | 1 | academy |
| AcademyCourseLessonSelection | academy_course_lesson_selections | nullable | 1 | 2 | academy |
| AcademyLearnerCompletion | academy_learner_completions | nullable | 1 | 2 | academy |
| AcademyKnowledgeAttempt | academy_knowledge_attempts | nullable | 0 | 2 | academy |
| AcademyKnowledgeAnswerKey | academy_knowledge_answer_keys | none | 1 | 0 | academy |
| AcademyPracticalEvidence | academy_practical_evidence | nullable | 0 | 3 | academy |
| Company | academy_companies | none | 0 | 0 | academy |
| CentralCompanyLink | skilled_central_company_links | required | 0 | 1 | skilled-central-oidc |
| CentralCompanyLinkAudit | skilled_central_company_link_audits | required | 0 | 2 | skilled-central-oidc |
| CompanyMember | academy_company_members | required | 1 | 1 | academy |
| AcademyTrainingAssignment | academy_training_assignments | required | 1 | 1 | academy |
| AcademyVerifiedCompetency | academy_verified_competencies | required | 0 | 2 | academy |
| AcademyExternalIdentity | academy_external_identities | nullable | 2 | 2 | academy |
| AcademyIntegrationAudit | academy_integration_audit | none | 0 | 2 | academy |
| AcademyServiceCredential | academy_service_credentials | none | 0 | 1 | academy |
| AcademyBusinessLessonField | academy_business_lesson_fields | required | 1 | 1 | academy |
| AcademyLessonContextSnapshot | academy_lesson_context_snapshots | required | 0 | 1 | academy |
| AcademyLessonReview | academy_lesson_reviews | none | 0 | 2 | academy |
| AcademyTemplateResponse | academy_template_responses | nullable | 1 | 2 | academy |
| AcademyTemplateSignOff | academy_template_sign_offs | none | 0 | 2 | academy |
| AcademyGeneratedDocument | academy_generated_documents | none | 1 | 0 | academy |
| AcademyCurriculumPathway | academy_curriculum_pathways | none | 0 | 0 | academy |
| AcademyPathwayCourse | academy_pathway_courses | none | 2 | 1 | academy |
| AcademyPathwayEnrolment | academy_pathway_enrolments | nullable | 1 | 2 | academy |
| AcademyTutorConversation | academy_tutor_conversations | required | 1 | 2 | academy |
| AcademyTutorMessage | academy_tutor_messages | required | 0 | 1 | academy |
| AcademyTutorToolAudit | academy_tutor_tool_audits | required | 0 | 2 | academy |
| AcademyChatbot | academy_chatbots | required | 1 | 1 | academy |
| AcademyChatbotConversation | academy_chatbot_conversations | required | 1 | 2 | academy |
| AcademyChatbotMessage | academy_chatbot_messages | required | 0 | 2 | academy |
| SkilledOidcLoginState | skilled_oidc_login_states | none | 0 | 1 | skilled-central-oidc |

Models with **nullable** `companyId` (must be reviewed; the issue requires global curriculum data to be explicit and tenant rows to be non-null):

- `AcademyCourseLessonSelection`
- `AcademyLearnerCompletion`
- `AcademyKnowledgeAttempt`
- `AcademyPracticalEvidence`
- `AcademyExternalIdentity`
- `AcademyTemplateResponse`
- `AcademyPathwayEnrolment`

## Migrations

Migrations in order. Two migrations share timestamp `20261102000100` (see `curriculum/research/DEPLOY-RUNBOOK.md`); do not rename either.

- `20260717195126_init`
- `20261102000100_academy_external_identity_audit`
- `20261102000100_titan_academy_content_inventory`
- `20261102000200_titan_academy_curriculum_composition`
- `20261102000300_academy_course_composition`
- `20261102002300_business_lesson_fields`
- `20261102060000_academy_knowledge_attempts`
- `20261102070000_academy_practical_evidence`
- `20261102080000_academy_organisations_training`
- `20261102090000_academy_verified_competencies`
- `20261102100000_academy_evidence_tenant_binding`
- `20261102170000_academy_service_credentials`
- `20261102190000_academy_identity_tenant_scope`
- `20261102200000_academy_template_pathway_review`
- `20261102210000_academy_certificate_idempotency`
- `20261102220000_academy_quiz_answer_uniqueness`
- `20261102230000_academy_multiple_choice_answers`
- `20261102240000_assignment_passing_marks`
- `20261102250000_academy_course_lesson_selection`
- `20261102260000_academy_course_lesson_organisation_scope`
- `20261102270000_academy_knowledge_answer_keys`
- `20261103120000_licence_track_enrolment`
- `20261108090000_academy_tenant_company_rename`
- `20261108100000_academy_external_identity_org_unique`
- `20261108100100_academy_course_tracks_course_fk`
- `20261108100200_academy_training_assignment_index_name`
- `20261108120000_academy_tutor_store`
- `20261108120100_academy_chatbot`
- `20261108130000_payment_coupon_redemptions`
- `20261108140000_certificate_verification_token`
- `20261108150000_video_object_cleanup`
- `20261109100000_lesson_caption_track`
- `20261109140000_skilled_central_company_links`
- `20261109150000_skilled_central_sessions`
- `20261109160000_skilled_oidc_state`
- `20261110100000_academy_learner_company_scope`
- `20261115090000_refresh_token_replaced_at`

## Raw SQL call sites

- `apps/backend/src/modules/auth/central-oidc-state-adapter.ts`
- `apps/backend/src/modules/auth/central-oidc-state-sql.ts`
- `apps/backend/src/modules/courses/lesson.service.ts`
- `apps/backend/src/modules/courses/module.service.ts`
- `apps/backend/src/modules/quizzes/quiz.service.ts`
- `apps/backend/src/routes/health.route.ts`
- `apps/backend/src/server.ts`
- `apps/backend/src/tests/central-oidc-atomic-consume.test.ts`
- `apps/backend/src/tests/central-oidc-runtime-no-fallback.test.ts`
- `apps/backend/src/tests/central-oidc-runtime-sql-contract.test.ts`
- `apps/backend/src/tests/central-oidc-runtime-store-shape.test.ts`
- `apps/backend/src/tests/integration/harness.ts`
- `apps/backend/src/tests/lesson-caption-track.test.ts`
- `apps/backend/src/tests/lesson-video-lifecycle.test.ts`
- `apps/backend/src/tests/video-object-cleanup.test.ts`
- `apps/backend/src/worker.ts`

## Not done (remaining #68 work)

- Mapping each table to the Central canonical table registry (not in this repo).
- Replacing `academy_companies` with a shared `companies` table and FK.
- Making every company-owned row non-null, and marking the global curriculum tables explicitly.
- Reconciling `users`, `courses`, `payments`, `notifications`, `audit_logs` with shared entities.
- Locking Prisma `migrate dev` and schema push against shared production schemas.
- Disposable PostgreSQL verification (clean migration, drift, two-company isolation). Not run here.
