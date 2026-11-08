# Pass 42 schema design (Titan Academy LMS)

Owner: schema agent. Schema: `apps/backend/prisma/schema.prisma`.
Migration: `apps/backend/prisma/migrations/20261102200000_academy_template_pathway_review/migration.sql`.

Conventions followed: Academy models use `academy_` table names, `String` status columns with string defaults (no Prisma enums), `Json` for structured payloads, and named `User` relations when a model has more than one link to `User`. Lesson body content stays in `AcademyLessonRevision.body` (Json) and is immutable and hashed by `contentHash`.

Naming note: the feature brief called these `CurriculumPathway` and `PathwayCourse`. They are named `AcademyCurriculumPathway` and `AcademyPathwayCourse` to match the Academy prefix used by every other Academy model.

---

## 1. AcademyTemplateResponse (`academy_template_responses`)

One row per learner, per template lesson, per template. Holds the learner's fill-in values.

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| organisationId | String? | FK to AcademyOrganisation, `onDelete: Restrict`. Null for solo learners. |
| learnerId | String | FK to User (relation `AcademyTemplateLearner`) |
| lessonId | String | FK to AcademyContentLesson |
| revisionId | String | FK to AcademyLessonRevision. The revision the learner started against. |
| templateId | String | e.g. `TPL-10-T01` from `editableTemplates[].templateId` |
| fieldValues | Json | Map of `fieldId` to value (text, date, checklist, table, and so on) |
| status | String, default `IN_PROGRESS` | `IN_PROGRESS` / `SUBMITTED` / `SIGNED_OFF` |
| submittedAt | DateTime? | Set on submit |
| createdAt, updatedAt | DateTime | |

- Unique: `[learnerId, lessonId, templateId]`. Revisions do not create a new response.
- Indexes: `[organisationId, status]`, `[lessonId, status]`.
- Relations: `signOffs` (AcademyTemplateSignOff[]), `documents` (AcademyGeneratedDocument[]).
- Feature: template lesson player and saving or submitting a template.

## 2. AcademyTemplateSignOff (`academy_template_sign_offs`)

Assessor sign-off of a template response against `assessmentRubric`. This is separate from content review (section 4).

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| templateResponseId | String | FK to AcademyTemplateResponse |
| assessorId | String | FK to User (relation `AcademyTemplateSignOffAssessor`) |
| decision | String | `SIGNED_OFF` / `CHANGES_REQUESTED` |
| rubricResults | Json | Per-criterion result, for example `{ "<criterion>": "meets" \| "does_not_meet" }` |
| notes | String? (Text) | Assessor feedback |
| practicalEvidenceId | String? @unique | FK to AcademyPracticalEvidence. Link to the evidence the assessor observed. |
| decidedAt | DateTime | default now() |

- Indexes: `[templateResponseId, decidedAt]`, `[assessorId]`.
- Multiple sign-offs per response are allowed, so a returned response can be re-signed.
- Feature: assessor sign-off queue and the document issue step.

## 3. AcademyGeneratedDocument (`academy_generated_documents`)

The assembled learner document from a template's `outputDocument`. A row is issued only when linked to a SIGNED_OFF sign-off.

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| templateResponseId | String | FK to AcademyTemplateResponse |
| version | Int | Per response, starting at 1 |
| contentHash | String | Hash of the assembled output |
| assembled | Json | Title, format, sections with resolved values, footer |
| signOffId | String? @unique | FK to AcademyTemplateSignOff. Set when issued. |
| issuedAt | DateTime? | Null until issued |
| createdAt | DateTime | |

- Unique: `[templateResponseId, version]`.
- Application rule: `issuedAt` and `signOffId` are set together, and only for a `SIGNED_OFF` sign-off.
- Feature: document assembly and the learner's document download.

## 4. AcademyLessonReview (`academy_lesson_reviews`)

Content review of a lesson revision. Replaces the JSON `reviewStatus` as the source of truth for review decisions. The JSON values (`NOT REVIEWED`, `needs-human-review`, `technical_review_required`, `editorial_complete_pending_technical_review`) stay in the lesson files.

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| revisionId | String | FK to AcademyLessonRevision, `onDelete: Restrict` |
| contentHash | String | Hash of the revision reviewed. An approval is valid only for this hash. |
| reviewerId | String | FK to User (relation `AcademyLessonReviewer`) |
| decision | String | `APPROVED` / `REJECTED` / `CHANGES_REQUESTED` |
| notes | String? (Text) | |
| decidedAt | DateTime | default now() |

- Indexes: `[revisionId, decidedAt]`, `[reviewerId]`. Multiple reviews per revision are allowed as history.
- Because revisions are immutable, an edited lesson gets a new revision and a new hash. Older approvals do not carry over.
- Feature: curriculum review queue.

## 5. AcademyCurriculumPathway (`academy_curriculum_pathways`)

From `curriculum/structure/PATHWAYS.json`: PATH-SOLO, PATH-TEAM-MEMBER, PATH-TEAM-OWNER.

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| code | String @unique | `PATH-SOLO` etc. |
| title | String | `Solo operator`, `Team member`, `Team owner` |
| description | String (Text) | Maps from the JSON `summary` |
| status | String, default `DRAFT` | JSON status is `DRAFT` |
| createdAt, updatedAt | DateTime | |

- Relations: `courses` (AcademyPathwayCourse[]), `enrolments` (AcademyPathwayEnrolment[]).

## 6. AcademyPathwayCourse (`academy_pathway_courses`)

Ordered course slugs that belong to a pathway.

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| pathwayId | String | FK to AcademyCurriculumPathway, `onDelete: Cascade` |
| courseSlug | String | Course slug, matching curriculum `courseSlugs` |
| required | Boolean, default true | Set false for learner-chosen service courses |
| position | Int | Ordering within the pathway |
| createdAt | DateTime | |

- Unique: `[pathwayId, courseSlug]`, `[pathwayId, position]`.
- Index: `[courseSlug]`.
- Course ID is not used. Curriculum data identifies courses by slug, and this table keeps that.
- **Not seeded.** `PATHWAYS.json` lists base modules by title (for example "Workplace safety and risk") and service courses as "Chosen by the learner". It has no course slugs, so no rows are created in this pass. See Decisions for review.

## 7. AcademyPathwayEnrolment (`academy_pathway_enrolments`)

Links a learner to a pathway.

| Field | Type | Notes |
|---|---|---|
| id | String cuid | PK |
| pathwayId | String | FK to AcademyCurriculumPathway, `onDelete: Restrict` |
| learnerId | String | FK to User (relation `AcademyPathwayLearner`) |
| organisationId | String? | FK to AcademyOrganisation. Null for solo learners. |
| status | String, default `ACTIVE` | `ACTIVE` / `COMPLETED` / `WITHDRAWN` |
| enrolledAt | DateTime | default now() |
| completedAt | DateTime? | |

- Unique: `[pathwayId, learnerId]`.
- Indexes: `[learnerId, status]`, `[organisationId, status]`.
- Feature: pathway enrolment and progress.

---

## Existing models: changes

Relation fields were added to these models. No existing column, index or model was renamed or removed.

- `User`: `academyTemplateResponses`, `academyTemplateSignOffs`, `academyLessonReviews`, `academyPathwayEnrolments`.
- `AcademyOrganisation`: `templateResponses`, `pathwayEnrolments`.
- `AcademyContentLesson`: `templateResponses`.
- `AcademyLessonRevision`: `lessonReviews`, `templateResponses`.
- `AcademyPracticalEvidence`: `templateSignOffs`.

## Practical evidence links (item 5)

- **Verified competency link: already present, no change.** `AcademyVerifiedCompetency.evidenceId` is `@unique` and references `AcademyPracticalEvidence`. A competency award therefore traces to exactly one evidence record.
- **Template sign-off link: added.** `AcademyTemplateSignOff.practicalEvidenceId` (unique, nullable) references `AcademyPracticalEvidence`. This is the only new link between the two areas. The chain is sign-off to evidence to competency.

## Licence notices (item 3)

No column added. `licenceNotice` and licence text stay in the revision `body` JSON under `safetyAndRegulatory[]`. They are part of the hashed, immutable revision, so a column would copy data that can drift.

## Migration

- Folder: `20261102200000_academy_template_pathway_review`
- Contents: 7 `CREATE TABLE`, 17 indexes (including unique indexes), and 15 foreign keys.
- Existing migrations were applied first to `lms_schema_check`. They applied cleanly.

## Pre-existing drift (not fixed here)

Four indexes were renamed by Prisma in the diff, but are not renamed in the migration history. They are excluded from the new migration so that this pass does not change existing objects:

- `academy_business_lesson_fields_org_key` to `academy_business_lesson_fields_organisationId_fieldKey_key`
- `academy_business_lesson_fields_org_status_idx` to `academy_business_lesson_fields_organisationId_status_idx`
- `academy_lesson_context_snapshots_org_learner_idx` to `academy_lesson_context_snapshots_organisationId_learnerId_c_idx`
- `academy_training_assignments_organisationId_learnerId_courseId_` to `academy_training_assignments_organisationId_learnerId_cours_key`

A later migration should rename them, or the next `prisma migrate dev` will generate them.

## Decisions for review

1. Model names carry the `Academy` prefix (`AcademyCurriculumPathway`, `AcademyPathwayCourse`), not the names in the brief.
2. Base modules in `PATHWAYS.json` are titles, not course slugs. They are not seeded into `academy_pathway_courses`. Needs a mapping from module title to course slug before seeding.
3. Existing `AcademyCourseTrack` and `AcademyCurriculumTrack` already group courses and lessons. Pathways are a separate concept (learner role), so new models were added rather than reusing them. Confirm this is the intent.
4. `AcademyTemplateResponse` is unique per learner, lesson and template, not per revision. Responses keep the `revisionId` they started on.
5. Organisation scoping is optional (`organisationId` nullable) on response and enrolment, to match `AcademyPracticalEvidence`. Solo learners have no organisation.
6. Two application rules are not enforced by the database: `AcademyGeneratedDocument.issuedAt` and `signOffId` are set together and only for a `SIGNED_OFF` sign-off; `AcademyLessonReview.contentHash` must equal the reviewed revision's `contentHash`.
7. `prisma format` re-aligned existing lines and moved the `academyExternalIdentities` relation line above `@@map` inside `User`. This is whitespace and placement only.
8. The four pre-existing index renames are excluded from the migration (see above).
