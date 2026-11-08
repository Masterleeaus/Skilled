# Pass 42: lesson review and publication workflow (ACA-008, ACA-026)

Status: implemented and tested locally. Register items ACA-008 and ACA-026 remain OPEN in `SKILLED-MASTER-IMPROVEMENT-REGISTER.md`; this pass does not close them, because a dependency-enabled build and PostgreSQL verification (ACA-001, ACA-003) are still open.

## Publication gate setting

- Name: `ACADEMY_PUBLICATION_GATE`
- Default: **ON**. Unset, empty, or any value other than an explicit off value keeps the gate on.
- Explicit off values: `off`, `false`, `0` (case-insensitive, surrounding spaces ignored).
- Where it is read: `publicationGateEnabled()` in `apps/backend/src/modules/curriculum/lesson-review.service.ts`, read from `process.env` at each publish, not at module load.
- Not registered in `apps/backend/src/config/env.ts` or `.env.example`, because those files are outside this pass's scope. Owner may want to register it there.
- With the gate off, publication skips the approval and structural checks. Each such publish writes audit action `LESSON_REVISION_PUBLISHED_GATE_OFF`.

Switch history: the brief says an earlier build switched the assessment publication gate off at the owner's request. I found no evidence of this in the repository. No file references `ACADEMY_PUBLICATION_GATE`, and the existing assessment gate (`scripts/validate-assessment-publication.mjs`, PASS40) has no on/off switch; its only environment variable is `ACADEMY_ASSESSMENT_APPROVALS`, which sets the approvals file path. The earlier switch-off is therefore unverified here, and the default above is ON regardless.

## Behaviour

- **Review**: `POST /api/academy/curriculum/revisions/:id/reviews` takes `decision` (APPROVED, REJECTED, CHANGES_REQUESTED), `contentHash` and `notes`. It stores an `AcademyLessonReview` with the hash the reviewer saw. A hash that does not match the current content returns 409, and nothing is stored. Notes are required for REJECTED and CHANGES_REQUESTED.
- **Binding**: an approval applies only to the hash it was made against. Editing a stored body (without recomputing its hash) causes CONTENT_HASH_MISMATCH. Re-hashing an edit causes NOT_APPROVED_FOR_CURRENT_HASH until that new content is approved.
- **Decision rule**: the newest review for the current hash must be APPROVED. A later rejection of the same content blocks publication.
- **Structural checks** (`evaluateStructure`): identity (id and title); instruction sections or a procedure; summary; quality standard; then for knowledge lessons, at least one knowledge check with 3 or 4 options; for `lessonKind: "template"`, editable templates, an assessment rubric, and an output document that places each template field exactly once. Unknown lesson kinds fail.
- **Publish**: `POST /api/academy/curriculum/revisions/:id/publish` is now the only publish path. It is limited to ADMIN and TEACHER. A blocked publish returns 409, with the reasons in `errors`.
- **Author independence** (owner decision): a reviewer can never approve a revision they authored or last edited. Revisions are immutable, so each edit is a new revision, and its author is its last editor. The author is recorded as a `LESSON_REVISION_DRAFTED` audit row written in the same transaction that creates the revision. The schema has no author column, and the schema cannot be changed in this pass. Approval by the author returns 403. Approval where no author is recorded returns 409, so it fails closed. The publish gate also ignores an approval by the author, reporting `APPROVER_NOT_INDEPENDENT`. Only APPROVED is restricted. REJECTED and CHANGES_REQUESTED by anyone with the role are allowed.
- **Source drafts (ACA-026)**: `createDraftRevision` and `importDraftRevisions` refuse any status other than DRAFT and any `publishedAt`. A bulk import is atomic: one refused item writes nothing. The existing revision-create route now uses `createDraftRevision`, so it ignores any requested status.
- **Reviewer role**: ADMIN and TEACHER (owner decision).

## Files changed

New (backend):
- `apps/backend/src/modules/curriculum/lesson-review.service.ts`
- `apps/backend/src/modules/curriculum/lesson-review.routes.ts`
- `apps/backend/src/tests/lesson-review.test.ts`

Edited (backend), backups in `/home/claude/work/review-pass42-backup/`:
- `apps/backend/src/modules/curriculum/curriculum.routes.ts`: revision create uses `createDraftRevision`; old `POST /revisions/:id/publish` removed (it was unconditional, which was the ACA-008 gap); `router.use(lessonReviewRoutes)` added; two imports. Note: this file also carries another agent's ACA-013 edits (`assertCompetencyAwardable`), which are not part of this pass.
- `apps/backend/src/tests/support/fake-prisma.ts`: additive only. Adds the `lessonReviews` relation on revisions, a `reviewer`/`revision` relation on reviews, and a default for reviews. Existing academy tests are unaffected (89 tests pass, below).

New (frontend):
- `apps/frontend/src/lib/lesson-review.api.ts`
- `apps/frontend/src/app/admin/lesson-review/page.tsx` (reviewer queue)
- `apps/frontend/src/app/admin/lesson-review/[revisionId]/page.tsx` (review page)

Edited (frontend):
- `apps/frontend/src/components/AdminNav.tsx`: one "Lesson review" link. Backup in the same backup folder.

Not touched: `schema.prisma`, migrations, template renderer, pathways, field-service integration, curriculum data files, quality and ops tests, the register, `env.ts`.

Generated, not source: `prisma generate` output in `node_modules` (no schema change); `apps/frontend/.next` build output.

## Tests

Backend, `apps/backend/src/tests/lesson-review.test.ts`: **30 of 30 passed**. Covers:
- approval hash match; approval refused on a stale hash
- publish after approval of the unchanged body
- approval invalid after an in-place edit; no carry-over to a re-hashed edit
- later rejection blocks publication
- gate blocks an unreviewed lesson; gate blocks a structurally incomplete lesson even when approved
- structural check rules; template field placement
- gate setting default and explicit off values; gate off allows publication only when explicitly set, with audit
- body-level `reviewStatus`/`status` claims do not grant publication
- DRAFT-only creation; atomic bulk import; bulk-imported drafts cannot be published
- static guard: only `lesson-review.service.ts` updates revision rows
- queue contents; detail view; HTTP: STUDENT gets 403 on publish; ADMIN publish 200 with approval and 409 without; creation ignores requested status
- author independence (7 tests): author refused (403); ADMIN and a different TEACHER may approve; the earlier author may approve a later edit by someone else but not their own; author recorded in the creating write; unknown author fails closed (409); stored self-approval ignored by the gate; HTTP: TEACHER author refused, STUDENT refused, other TEACHER accepted

Related suites (academy, permissions, ACA-012/013, lesson review): **96 of 96 passed** across 6 files, including the 30 above.

Full backend run (`npx vitest run`): **183 tests passed**. 8 suite files fail to load and run no tests: `auth` and `health` need environment variables, the integration harness needs environment and a database, and `tests/pass22-inactive-identity.test.cjs` has no suite. These match the baseline failures before this work.

Typecheck: `tsc` with a temporary config outside the repo, on the touched backend files. Zero errors in `lesson-review.*` and `fake-prisma.ts` (re-checked after the author changes). The `curriculum.routes.ts` errors are on pre-existing lines (28 to 306) with the same Express 5 `req.params` typing pattern. The repository's own `npm run build` fails at baseline (TypeScript 7 removed `moduleResolution: node10` and `baseUrl`, and `rootDir` excludes `prisma/`), which is ACA-001.

Frontend: `tsc --noEmit` on the frontend, zero errors (re-checked after the author changes; the earlier `next build` was before this change and was not re-run). `next build` compiled successfully and generated both new routes. The build prints an ESLint "Invalid Options" message from the existing lint configuration, unrelated to this pass.

Not done: no browser test and no automated accessibility audit of the new pages.

## Decisions for owner review

1. Reviewer role is ADMIN and TEACHER (owner decision, 2026-11-02). Authors cannot approve their own revisions (server-enforced, tested). Organisation ASSESSOR memberships are not used, because content review is global.
2. Gate-off bypasses the approval and structural checks, and is audited. It does not bypass the draft-only rule.
3. Latest decision for the current hash must be APPROVED.
4. Structural checks are ported from `scripts/reconcile-lesson-formats.mjs` and `curriculum/SCHEMA.md`, not imported, because the script sits outside the backend `rootDir`.

## Open

- Author record: it lives in the audit log, not on the revision. Revisions created before this change have no author row, so they cannot be approved until re-drafted or backfilled. Audit writes are only as reliable as the transaction that makes them.
- Pathways test flake: during one full run, 7 `pathways-enrolment` tests failed while another agent was editing the pathway files. Reruns pass, so this was not from this pass.
- Hash canonicalisation: `JSON.stringify` depends on key order. The same content re-serialised with different key order gets a different hash and would need re-review. Existing stored hashes use this formula, so changing it needs a migration plan.
- No verification against PostgreSQL; Serializable isolation is untested (ACA-003).
- The normalisation index (ACA-009) is not imported into revisions; nothing is publishable until a reviewer approves an imported draft.
- Learner lesson files contain no `correctIndex` (checked: 0 files), so no answer-key leak is blocked by this pass.
- The assessment publication gate (PASS40) is separate and unchanged.
