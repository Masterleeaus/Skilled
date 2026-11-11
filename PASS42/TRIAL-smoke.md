# PASS42 tester trial: release smoke run (Titan Academy LMS)

Date: 2026-11-02. Scope: `/home/claude/p29m/lms-main/apps` (backend `apps/backend`, frontend `apps/frontend`).
Scratch database only: `lms_trial`. No Prisma schema or migration change (schema md5 `c0a1246d83a9cc32b7d05b6e9ce1a0fa`, unchanged). No feature code changed. No git commit. No memory tool used.

## Owner decision and what the approvals are

Every lesson revision in the trial is approved under the owner decision of 2026-11-02. These approvals are an OWNER TRIAL APPROVAL. They are NOT an expert or subject-matter review. Every approval note reads `Owner trial approval 2026-11-02. Not an expert review.`
Safety and licensing content has not been expert-checked. Register item ACA-024 remains OPEN. Licence notices are left in the delivered lesson bodies. No banner or label was added to any lesson page.

## Result summary

| Measure | Result |
|---|---|
| Lesson rows in `lms_trial` | 236 (216 from the reviewed import manifest, 20 editable template lessons) |
| Revisions drafted | 236 (plus 1 deliberate control draft, see G1) |
| Approvals stored (APPROVED, exact note, hash-bound) | 236 of 236 |
| Revisions published through the publish path (gate ON) | 138 |
| Revisions refused by the publication gate | 98 (all STRUCTURE_INCOMPLETE, none for hash or approval reasons) |
| Smoke checks, final clean run | 39 pass, 0 fail (of 39) |
| Backend 5xx responses during the run | 0 |

Not force-published: no publish was run with the gate off. The audit log has 138 `LESSON_REVISION_PUBLISHED` rows and 0 `LESSON_REVISION_PUBLISHED_GATE_OFF` rows.

## Setup

- Database: `lms_trial` (created fresh on 2026-11-02, PostgreSQL 16 at 127.0.0.1:5432). Migrations applied with `prisma migrate deploy` (all applied). Pathways seeded with `prisma/seed-pathways.ts` (3 pathways, 33 items). `prisma/seed.ts` was NOT run, because it wipes all tables and creates demo accounts.
- Not used: `lms_trial_seed_test`. It holds 221 `BRIEF` lesson rows from the importer, with no revisions and no bodies. Their IDs (for example `U01-01`) do not map to the canonical lessons (see `curriculum/planning/BRIEF-DRAFT-RECONCILIATION.csv`, ACA-010). It was left untouched. `lms_trial_test` was not touched.
- Redis: 127.0.0.1:6399 (the harness port, as in BUILD-trial.md).
- Object storage: MinIO is not installed and its official download returns HTTP 410. Docker has no daemon. The backend's startup bucket check was served by the `moto` S3 emulator (`moto_server` on 127.0.0.1:9000, Python package `moto[server]`). Storage health reports `ok`. Real MinIO was not tested, and file upload flows were not exercised.
- Email: no SMTP server is running. The verification token for the self-registered learner was read from `users.emailVerifyToken` in the scratch database, then submitted to `/api/auth/verify-email`.
- Publication gate: `ACADEMY_PUBLICATION_GATE` unset, so ON (the default).
- Backend: `dist/server.js` built with `npm run build` (exit 0), listening on port 5000. Health: `database ok`, `redis ok`, `storage ok`.
- Frontend: `npm run build` with `NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api` (exit 0), served with `next start` on port 3000.
- Secrets: JWT secrets and the trial password were generated at run time and held only in process environments. No secret value is in any file.

### Accounts (scratch database only)

| Account | Role | Id | Used for |
|---|---|---|---|
| trial-owner@trial.local | ADMIN | cmvz4cy8g00007dsw0ir21ycb | Drafted every revision (recorded as author), org OWNER, signs off |
| trial-reviewer@trial.local | TEACHER | cmvz4cy8l00017dsw88f9qms7 | Approved and published (independent reviewer) |
| trial-learner@trial.local | STUDENT | cmvz4cy8o00027dsw5qdpu96u | Learner flows, org LEARNER |
| trial-register-<run>@trial.local | STUDENT | created by smoke L1 | Self-registration test |

Why the reviewer account approves: the owner account drafted every revision through the API, so the author rule applies to it (no self-approval, `lesson-review.service.ts` lines 207 to 209, with the author read from the audit row written by `insertDraft`). The brief's fallback applied: a second trial account (`trial-reviewer`) approved and published. The owner account was not used to bypass the rule.

### Lesson loading (scratch only)

- 216 lessons from `curriculum/import/canonical-import-manifest.json`, each file checked against its recorded SHA-256 before loading. 0 problems.
- 20 editable template lessons (`lessonKind: "template"`, all in `curriculum/shared/`). These are NOT listed in the manifest, so they were added by a scan of the canonical files.
- The loader is a scratch script at `/home/claude/work/trial-pass42/load-lessons.mjs` (outside the repo). It creates `AcademyContentLesson` rows with `contentStatus BRIEF`. Non-null brief columns were derived as labels: `serviceGroup` from `courseSlugs`, `unit` from `moduleTitle`, `objective` from the first summary item, `assessment` as a knowledge-check count. These labels are not content.
- The importer that the manifest describes does not exist (CURRICULUM-data.md, ACA-009).

## Approvals

- Drafts: 236 `POST /api/academy/curriculum/lessons/:sourceId/revisions` as trial-owner, each body reordered to Postgres `jsonb` key order (see defect D1).
- Approvals: 236 `POST /api/academy/curriculum/revisions/:id/reviews` as trial-reviewer, `decision APPROVED`, `contentHash` = the revision's stored hash, note `Owner trial approval 2026-11-02. Not an expert review.`, `decidedAt` set by the server.
- Database checks: 236 revisions have an APPROVED review with the exact note; 0 review hashes differ from their revision hashes; 236 approvals are by trial-reviewer; 0 approvals by the author of their revision; 0 published revisions without an approval.
- Approve-stage failures: 0.

## Publication (gate ON, through `POST /api/academy/curriculum/revisions/:id/publish`)

- 138 PUBLISHED. These are 118 canonical knowledge lessons and all 20 template lessons. Each has `LESSON_REVISION_PUBLISHED` in the audit log.
- 98 refused with HTTP 409 `Publication blocked by the lesson review gate`, reason `STRUCTURE_INCOMPLETE`. They remain DRAFT, approved but unpublished:
  - 92 lessons with an empty `summary` and an empty `qualityStandard` (failed checks: `summary, quality-standard`).
  - 6 lessons with an empty `qualityStandard` only (failed check: `quality-standard`): `additional-specialist-services-L01`, `-L04`, `-L10`, `-L12`, `custom-eco-cleaning-products-L03`, `-L10`.
  - These are content gaps in the canonical files. They were not filled in here, because filling them would be authoring content nobody has approved. The owner decides whether to supply the content and re-approve.
- Full per-lesson results: `/home/claude/work/trial-pass42/drive-results.json`.

## Smoke tests (HTTP, final clean run, 39 of 39 pass)

| ID | Check | Expected | Actual |
|---|---|---|---|
| S1b | Owner adds a module (a course cannot be published without one, see D2) | 201 | 201 pass |
| S1 | Owner creates category and course | 201 | 201 pass |
| S2 | Owner publishes course (`PATCH /api/courses/:id/publish`) | 200 | 200 pass |
| S3 | Owner creates track and places 138 published revisions | 201 each | 201 pass |
| S4 | Owner publishes track | 200 | 200 pass |
| S5 | Owner attaches track to course | 201 | 201 pass |
| S6 | Owner creates organisation (becomes OWNER) | 201 | 201 pass |
| S7 | Owner adds trial learner as LEARNER | 201 | 201 pass |
| S8 | Owner sets and approves the 9 business fields TPL-14 references | 200 | 200 pass |
| L1 | Learner self-registers | 201 | 201 pass |
| L2 | Verify email with stored token | 200 | 200 pass |
| L3 | Learner logs in | 200 | 200 pass |
| L4 | Learner lists courses, sees trial course | 200 | 200 pass |
| L5 | Learner opens course by slug | 200 | 200 pass |
| L6 | Learner enrols in course | 201 | 201 pass |
| L7 | Learner opens course outline (138 of 138 published lessons) | 200 | 200 pass |
| L8 | Outline has no knowledge-check answer keys | none | none pass |
| L9 | Licence notices remain in the outline body | present | present pass |
| L10 | Learner reads course progress (`GET /api/academy/curriculum/courses/:id/progress/me`) | 200 | 200 pass |
| L11 | Learner records completion of a published lesson | 200 | 200 pass |
| T1 | Learner opens template lesson TPL-14 | 200 | 200 pass |
| T2 | Learner saves draft of TPL-14-T01 | 200 | 200 pass |
| T3 | Learner submits TPL-14-T01 | 201 | 201 pass |
| T4 | Owner sees the submitted response | 200 | 200 pass |
| T5 | Learner cannot sign off own response | 403 | 403 pass |
| T6 | Owner signs off, document issued | 201 | 201 pass |
| T7 | Learner sees issued document | 200 | 200 pass |
| T8 | Learner downloads PDF (content-type application/pdf, starts `%PDF-`) | 200 | 200 pass |
| P1 | Learner lists pathways (3) | 200 | 200 pass |
| P2 | Learner enrols self in PATH-SOLO | 201 | 201 pass |
| P3 | Solo learner reads own PATH-SOLO progress | 200 | 200 pass |
| P4 | Org owner enrols org learner in PATH-TEAM-MEMBER | 201 | 201 pass |
| P5 | Org owner reads that learner's progress | 200 | 200 pass |
| P6 | A different learner cannot read that progress | 403 | 403 pass |
| G1 | Owner drafts an unapproved control revision of TPL-14 | 201 | 201 pass |
| G2 | Author cannot approve own revision | 403 | 403 pass |
| G3 | Gate refuses the unapproved control revision | 409 | 409 pass (`NOT_APPROVED_FOR_CURRENT_HASH`) |
| G4 | Learner cannot call publish | 403 | 403 pass |
| G5 | Reviewer queue lists the control revision | 200 | 200 pass |

Notes on the checks:
- T5 is refused by the assessor-role check (`template.service.ts` line 251, the learner has the LEARNER role), not by the self-sign-off branch (`template.service.ts` line 163). The self-sign-off branch was NOT exercised, because a learner cannot hold an assessor role in the same organisation.
- G3 is a control. The unapproved control is a second TPL-14 revision with the same body. It stays as DRAFT in the database, deliberately, and appears in the reviewer queue.
- The 20 template lessons all published. The gate refused none of them.

### Frontend (HTTP status only, not a browser test)

`/` 200, `/login` 200, `/academy/assessor` 200, `/admin/lesson-review` 200, `/pathways` 200, `/student/courses/titan-academy-trial-course-mvz4dcqi` 200. `/academy` returns 404 (no page exists at that path; not in scope). The lesson pages were not rendered in a browser, so the "no banner" requirement was checked only by the absence of any change in the code, not visually.

## Failures seen during the run (earlier passes, same code) and their causes

These occurred before the final clean run. Each was either a defect in this run's scripts or a precondition, and each is recorded here for transparency.

1. S2 failed with HTTP 404 `Route /api/courses/<id>/publish not found`. Cause: my script used POST. The route is `PATCH` (`courses/course.routes.ts` line 71). Script fixed.
2. S2 failed with HTTP 400 `Cannot publish a course with no modules` (see D2). Worked around with S1b.
3. L6 and L7 failed with `Course is not published yet` and `Course is not published`. Cause: S2 failed. Consequential.
4. P6 gave 200 instead of 403. Cause: my script had the learner read their own record, which the app allows. Script fixed to test a different learner.
5. T6 failed with HTTP 409 `Document cannot be issued until business values are approved: {{business:business.support_phone}}`. Cause: TPL-14 references nine business fields; only one was approved. Script fixed (S8 approves all nine).
6. Approve-stage HTTP 409 `Stored content hash does not match the revision body` for every lesson on the first attempt (see D1). Worked around in the driver.

## Defects and findings (recorded, not patched)

- D1 (code bug, P0 for approvals): the content hash depends on key order, but Postgres `jsonb` does not keep key order. `contentHashOf` (`lesson-review.service.ts` line 27) uses `JSON.stringify`. `insertDraft` stores the hash of the body as received (line 173), but `recordReview` re-hashes the body as read back from the database (line 203) and compares it with the stored hash (line 204). Any body whose key order is not already in `jsonb` order is refused with HTTP 409 at approval, so no lesson can be approved through the API. The trial worked around this by reordering each body's keys to `jsonb` order (shorter keys first, then bytewise) in `drive-lessons.mjs`, which is scratch only. The fix belongs in the hash canonicalisation (`stableStringify` already exists in `templates/template.model.ts` line 158). Changing the formula needs a migration plan for existing stored hashes, which is an owner decision (REVIEW-publication.md lists it as open).
- D2 (code behaviour, blocks academy-only courses): `course.service.ts` line 115 refuses to publish a course with no modules. An academy course built from tracks alone cannot reach learners. The trial added one module. Owner decision whether track-only courses should publish.
- D3 (test coverage gap): the self-sign-off branch (`template.service.ts` line 163) is not reachable by a learner account, so the explicit "Learners cannot sign off their own response" message was not observed. Only the role refusal (403, line 251) was observed.
- D4 (content gap, expected by the gate): 98 canonical lessons have an empty `qualityStandard`, and 92 of them also have an empty `summary`. These cannot be published. Content owner action needed.
- D5 (manifest gap): the 20 template lessons are not in `canonical-import-manifest.json`. The manifest importer is not built (ACA-009).
- D6 (data gap): `lms_trial_seed_test` holds 221 BRIEF rows with no revisions, which cannot be approved or published. They are unmapped to the canonical lessons (ACA-010).
- D7 (environment): MinIO was replaced by `moto` for the storage check; uploads, certificates and assignment files were not tested. Email delivery was not tested.

## Not tested

- Browser rendering of lesson, template and pathway pages; accessibility; the absence of banners was not checked visually.
- Real MinIO, email delivery, Stripe, the video and assignment upload flows.
- The explicit self-sign-off branch (D3).
- Concurrency and Serializable isolation (ACA-003).

## Other things done in this run

- A `next build` started by another process (pid 29297, 21:28) left `.next` without a build ID. I rebuilt the frontend with `npm run build` and started it. The `.next` directory and `tsconfig.tsbuildinfo` were regenerated by that build (build artifacts only).
- A backend process (pid 29263) left running from an interrupted run against `lms_trial` was stopped before the clean rebuild.
- Evidence files (outside the repo): `/home/claude/work/trial-pass42/` (`drive-results.json`, `smoke-results.json`, `smoke.log`, `backend.log`, `frontend-build.log`, `accounts.json` with ids only).
