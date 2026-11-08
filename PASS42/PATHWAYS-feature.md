# PASS42 role pathways: feature evidence

Scope: role pathways (PATH-SOLO, PATH-TEAM-MEMBER, PATH-TEAM-OWNER) from `curriculum/structure/PATHWAYS.json`. Schema and migrations were not edited. The Prisma client was regenerated from the unchanged schema.

## Model (owner decision, round 2)

- **Base modules** are required items stored by module title, with no course rows. Key: `module:<title>`. Their lessons reach a learner through the courses they enrol in.
- **Service courses** are one optional item per pathway, key `service:learner-chosen`. Learners choose service courses and enrol in them directly. Those enrolments are not counted.
- **Course items** (plain course slug) are supported by the seed and API. None are seeded.

The `academy_pathway_courses.courseSlug` column holds these keys because the schema has no item-kind column.

### Base-module progress

- Each base module title maps to one Universal-layer unit (`BASE_MODULE_UNITS` in `pathway.seed.ts`). A test checks that every mapped unit exists in `apps/backend/prisma/curriculum/titan-three-layer-lessons.json`.
- Base lessons for a learner are Universal-layer `AcademyContentLesson` rows with that unit, placed in a published track attached to a course the learner is enrolled in (`ACTIVE` or `COMPLETED`).
- A base lesson is completed when the learner has an `AcademyLearnerCompletion` for it.
- Module states: `NO_LESSONS` (none delivered), `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.

### Pathway progress

- Required items are base modules and required course items, each counted once.
- A module is complete when all its delivered base lessons are complete. A course is complete when its `Enrollment` is `COMPLETED`.
- Percentage is completed required items over required items, rounded. Status: `NO_REQUIRED_ITEMS`, `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.
- The service slot is optional and never counted.

## Files

Created or rewritten in round 2:
- `apps/backend/src/modules/pathways/pathway.progress.ts`: progress for module, course and service items.
- `apps/backend/src/modules/pathways/pathway.seed.ts`: idempotent seed, `BASE_MODULE_UNITS`, item keys.
- `apps/backend/src/modules/pathways/pathway.service.ts`: list, detail, enrolment, progress, access rules, base-lesson counts.
- `apps/backend/src/tests/pathways-seed.test.ts` (5 tests) and `apps/backend/src/tests/pathways-enrolment.test.ts` (15 tests).
- `apps/frontend/src/lib/pathway.api.ts`, `apps/frontend/src/app/pathways/page.tsx`, `apps/frontend/src/app/pathways/[code]/page.tsx`.

Unchanged from round 1:
- `apps/backend/src/modules/pathways/pathway.routes.ts`, `pathway.validators.ts`, `apps/backend/prisma/seed-pathways.ts` (CLI, now calls `seedPathways(prisma, file)`).
- `apps/backend/src/app.ts`: two lines, the import and `app.use("/api/academy/pathways", pathwayRoutes)`. Another agent's template-route lines are also in this file.

Backups: `/home/claude/work/pathways-pass42-backup/` (round 1 `app.ts`) and `/home/claude/work/pathways-pass42-backup/round2/` (round 1 versions of every file changed in round 2).

Not edited: `schema.prisma`, migrations, `support/fake-prisma.ts`, template, review and publication, field-service, quality and ops tests, `package.json`, navigation.

## Endpoints (all require a bearer token)

| Method and path | Who | Behaviour |
|---|---|---|
| GET `/api/academy/pathways` | any authenticated user | All pathways with item counts, the caller's enrolment and progress summary |
| GET `/api/academy/pathways/:code` | any authenticated user | Ordered items (kind, label, required, state), the caller's enrolment and progress (null if not enrolled) |
| POST `/api/academy/pathways/:code/enrolments` | self, or org OWNER or MANAGER for another learner | Body `{ learnerId?, organisationId? }`. Returns 201 |
| GET `/api/academy/pathways/:code/learners/:learnerId/progress` | self, or org OWNER or MANAGER of the enrolment's organisation | Progress for one learner |

Access rules:
- A learner may enrol themselves. With `organisationId`, they must belong to that organisation.
- Enrolling another learner needs `organisationId`, an OWNER or MANAGER membership in it, and the target as a member. Platform `ADMIN` has no bypass, matching the Academy training routes.
- Progress for another learner needs an OWNER or MANAGER membership in the enrolment's organisation. Otherwise the answer is 403, whether or not the enrolment exists.

Enrolment rules:
- Enrolment creates no base-module rows. Required course items go through `enrollInCourse`, so course rules apply. An ACTIVE or COMPLETED existing enrolment is reused. A CANCELLED one blocks.
- If a course blocks enrolment, the course enrolments this call created are deleted, no pathway row is written, and the response carries the course's own status code.
- Optional and service items are never enrolled automatically. A missing required course item answers 422.

## Item keys seeded from PATHWAYS.json

No course slugs are mapped. Every seeded item is a base module or the service slot.

| Pathway | Item key | Required |
|---|---|---|
| PATH-SOLO | `module:Professional induction and standards` | yes |
| PATH-SOLO | `module:Workplace safety and risk` | yes |
| PATH-SOLO | `module:Tools, equipment and maintenance` | yes |
| PATH-SOLO | `module:Chemicals and materials` | yes |
| PATH-SOLO | `module:Quality and job documentation` | yes |
| PATH-SOLO | `module:Job management and service delivery` | yes |
| PATH-SOLO | `module:Customer communication and privacy` | yes |
| PATH-SOLO | `module:Starting a business` | yes |
| PATH-SOLO | `module:Quoting and pricing` | yes |
| PATH-SOLO | `module:Business operations and finance` | yes |
| PATH-SOLO | `module:Marketing and sales` | yes |
| PATH-SOLO | `service:learner-chosen` | no |
| PATH-TEAM-MEMBER | `module:Professional induction and standards` | yes |
| PATH-TEAM-MEMBER | `module:Workplace safety and risk` | yes |
| PATH-TEAM-MEMBER | `module:Tools, equipment and maintenance` | yes |
| PATH-TEAM-MEMBER | `module:Chemicals and materials` | yes |
| PATH-TEAM-MEMBER | `module:Quality and job documentation` | yes |
| PATH-TEAM-MEMBER | `module:Job management and service delivery` | yes |
| PATH-TEAM-MEMBER | `module:Customer communication and privacy` | yes |
| PATH-TEAM-MEMBER | `service:learner-chosen` | no |
| PATH-TEAM-OWNER | `module:Professional induction and standards` | yes |
| PATH-TEAM-OWNER | `module:Workplace safety and risk` | yes |
| PATH-TEAM-OWNER | `module:Tools, equipment and maintenance` | yes |
| PATH-TEAM-OWNER | `module:Chemicals and materials` | yes |
| PATH-TEAM-OWNER | `module:Quality and job documentation` | yes |
| PATH-TEAM-OWNER | `module:Job management and service delivery` | yes |
| PATH-TEAM-OWNER | `module:Customer communication and privacy` | yes |
| PATH-TEAM-OWNER | `module:Starting a business` | yes |
| PATH-TEAM-OWNER | `module:Quoting and pricing` | yes |
| PATH-TEAM-OWNER | `module:Business operations and finance` | yes |
| PATH-TEAM-OWNER | `module:Marketing and sales` | yes |
| PATH-TEAM-OWNER | `module:Growing and managing a team` | yes |
| PATH-TEAM-OWNER | `service:learner-chosen` | no |

Unmapped entries: none. Each base module title maps to a unit (below).

| Base module title | Curriculum unit (Universal layer) |
|---|---|
| Professional induction and standards | Professional Induction & Standards |
| Workplace safety and risk | Workplace Safety & Risk |
| Tools, equipment and maintenance | Tools & Equipment Management |
| Chemicals and materials | Materials, Chemicals & Consumables |
| Quality and job documentation | Quality Assurance & Evidence |
| Job management and service delivery | Job Management & Delivery |
| Customer communication and privacy | Customer Service & Communication |
| Starting a business | Starting a Home Services Business |
| Quoting and pricing | Quoting, Pricing & Profitability |
| Business operations and finance | Business Finance & Administration |
| Marketing and sales | Marketing & Sales |
| Growing and managing a team | Teams & Business Growth |

## Tests

Backend, `npx vitest run` in `apps/backend`:
- `src/tests/pathways-seed.test.ts`: 5 passed. The three pathways load with base-module items and one service slot each (12, 8 and 13 items), no course rows, idempotency (second run leaves ids and timestamps unchanged), re-run after a JSON change removes the dropped module and keeps positions contiguous, duplicate items rejected, and every mapped unit exists in the curriculum file.
- `src/tests/pathways-enrolment.test.ts`: 15 passed.
  - Enrolment: required course items only, duplicate prevention, reuse of an existing course enrolment, rollback when a course blocks, 422 for a missing course.
  - Progress: base-module progress counts only lessons delivered through enrolled courses (the Vertical lesson and a lesson on a non-enrolled course are excluded), partly complete pathway (9 required items, 2 of 9 once residential and its lessons are done, 22%), service slot optional and not counted, list progress.
  - Access: learner cannot enrol another learner (service and HTTP 403), owner can enrol a member, refusals for a foreign manager, a non-member and a foreign organisation, progress access (403 for a learner, 200 for the owner), 404 and 401.
- Both files: 20 passed, 0 failed.
- Mutation check (round 1, access rule removed): 3 access tests failed.
- Full backend suite: 183 passed. 8 files fail at import, before any test runs. The causes are `app.ts` and `env.ts` exiting without environment variables, and another agent's integration harness. These failures predate this work.

Type checks:
- Backend `tsc --noEmit`: the project fails on tsconfig options (TS5102, TS5108, TS5090) and on rootDir for `prisma/*.ts` scripts (TS6059), before and after this work. A temporary standalone config checks the pathway files semantically. Its only error is in `src/modules/auth/token.utils.ts`, which I did not touch.
- Frontend `tsc --noEmit`: 0 errors.

Frontend build: `next build` in `apps/frontend` failed in round 1 with an ESLint options error and `Cannot find module for page: /_document`. Another agent was building into the same `.next` at the same time, so the build was checked in a scratch copy of the current source (`/home/claude/work/fe-candidate2`). That build succeeds and lists `/pathways` and `/pathways/[code]`.

## Decisions for review

1. Base modules are stored by title with no course rows. Their progress comes from lessons delivered through enrolled courses. A module with no delivered lessons (`NO_LESSONS`) counts as incomplete, so a pathway that depends on it cannot reach 100% until those lessons are delivered.
2. Module title to unit mapping is by hand (`BASE_MODULE_UNITS`). It was checked against the curriculum file, not against the database.
3. Each pathway has one optional service slot, not one row per service course, because the JSON names no courses.
4. Pathways are visible to every learner regardless of status. All three are `DRAFT`. A publication gate is not built.
5. Organisation managers are OWNER and MANAGER. Platform ADMIN has no bypass.
6. Enrolment is compensated by deleting created course enrolments, not with a transaction. A transaction would need `enrollInCourse` to accept a transaction client, which means editing the enrolment module.
7. Progress is computed on read. `AcademyPathwayEnrolment.status` stays `ACTIVE` and is not moved to `COMPLETED`.

## Open items

- Live database not checked: no credentials here. Run `npx tsx prisma/seed-pathways.ts` against a database and check the report.
- Base-lesson delivery depends on tracks being attached to courses. Until course-to-track attachments exist in the database, every base module shows `NO_LESSONS`.
- Service courses are chosen outside the pathway. A learner cannot record their choice inside the pathway.
- No navigation link to `/pathways`. The page is reachable by URL only.
- No manager UI to enrol other learners. The API supports it.
- `support/fake-prisma.ts` has no relations or unique constraints for the pathway tables. The service's own duplicate checks cover the tests, and the real database's unique constraints are not exercised here.
- Inactive users: like other routes, pathway routes check the token, not `isActive`.
- Backend `tsc` and `npm run build` were already failing before this change. Fixing the tsconfig is outside this scope.
