# PASS42 LMS database load: lms (SkilledAt.Work / Titan Academy)

Date: 2026-11-02. Database: `lms` (role `lms`, 127.0.0.1:5432, PostgreSQL 16). The trial database `lms_trial` was not used. The curriculum importer was not run. Credentials were read at run time into the process environment only; no password, URL containing one, or secret is recorded in this file or in any work file. No application code, schema, migration, lesson file, level CSV or course map was changed. No git commit. No memory tool used.

## Changes to repository files

- `curriculum/import/canonical-import-manifest.json`: `canonicalSha256` refreshed for 17 entries, as the coordinator instructed (rewritten lesson files). Old and new values are in the backup `/home/claude/work/lms-load/canonical-import-manifest.pre-coordinator-refresh.json`. The 17 entries: F14-L01, F15-L01, F15-L04, S12-L03, S12-L08, additional-specialist-services-L12, F08-L02, S14-L03, S14-L05, S14-L08, high-access-window-cleaning-L02, roof-cleaning-soft-washing-L09, high-access-window-cleaning-L03, high-access-window-cleaning-L11, roof-cleaning-soft-washing-L03, roof-cleaning-soft-washing-L08, roof-cleaning-soft-washing-L12. After the refresh, 216 of 216 manifest entries match their files.
- Not in the manifest, so not changed: `courses/solar-panel-cleaning/solar-panel-cleaning-L12.json` and `courses/roof-soft-washing/roof-cleaning-soft-washing-L01.json` (both in the coordinator list). They are level-file lessons; the 622-lesson load uses their current content.
- Earlier, before this session, the manifest had been refreshed at 22:55:29 (98 entries, the summary and quality-standard fills). That change was already in place.

## Starting state

- Connection confirmed: current database `lms`, current user `lms`.
- Migrations: 20 of 20 applied (repository has 20 migration folders). `academy_course_lesson_selections` exists.
- Lessons before the load: 0. Revisions: 0. Users: 0.
- Pathways: 0 before the run; seeded with `prisma/seed-pathways.ts` (3 pathways, 33 items). `prisma/seed.ts` was not run.

## Lessons loaded (content, hash-checked)

| Set | Source | Result |
|---|---|---|
| Manifest entries | `canonical-import-manifest.json` (216) | 216 rows loaded, 0 hash refusals |
| Template lessons | `curriculum/shared/*` with `lessonKind: "template"` (20, not in manifest) | 20 rows loaded, 0 refused |
| Level-file lessons with a full body | `curriculum/shared` and `curriculum/lessons` IDs from `curriculum/levels/*.csv` not yet loaded | 379 rows loaded, 0 refused |
| Level-file lessons, title only | `curriculum/lessons/converted/*` (243 files, which hold only `id`, `title` and `knowledgeChecks`) | 243 refused: no lesson body |

Total lesson rows: 615 (236 + 379). Refused: 243, listed in `/home/claude/work/lms-load/refused-title-only.txt` (for example C11-L01). The level CSVs hold 858 unique lesson IDs; 615 + 243 = 858.

Each loaded file's SHA-256 was checked against the manifest where an entry exists. The 379 level-file rows record their SHA-256 in `sourceHash`; they have no reviewed manifest entry (this is an owner decision point, see below).

## Approval and publication (gate on, no force-publish)

- Accounts (scratch, same names as the trial): `trial-owner@trial.local` (ADMIN, drafted every revision), `trial-reviewer@trial.local` (TEACHER, approved and published), `trial-learner@trial.local` (STUDENT). Passwords generated per run, set in the database only.
- Drafts: 615 (author trial-owner). Approvals: 615, decision `APPROVED`, note exactly `Owner trial approval. Not an expert review.`, by trial-reviewer. Publishes: 615, HTTP 200, through `POST /api/academy/curriculum/revisions/:id/publish`.
- Database checks: 615 published revisions, 615 approvals with the exact note, 0 approval hashes differing from their revision hash, 0 approvals by the author, 0 lessons without a published revision, 615 `LESSON_REVISION_PUBLISHED` audit rows, 0 `LESSON_REVISION_PUBLISHED_GATE_OFF` rows. `ACADEMY_PUBLICATION_GATE` was unset, so the gate was on.
- Refused by the gate: 0. (In the trial, 98 lessons were refused for empty summary and quality standard; those canonical files now carry content.)
- Drafting used the trial's key-order normalisation (`NORMALIZE=1`), so the locally computed hash differs from the stored hash in the driver's log. The server hashes a sorted-key canonical form (`lesson-review.service.ts` line 31), so approval passed. Drafts without normalisation were not re-tested.

## Smoke test (learner flows against lms, backend on 127.0.0.1:5000)

- Result: **39 pass, 0 fail (of 39)**. Results: `/home/claude/work/lms-load/smoke-results.json`, log `/home/claude/work/lms-load/smoke.log`.
- Covered: owner setup (course, track with 615 placements, organisation, business fields), learner register, verify, login, course list, course open, enrolment, outline (no answer keys, licence notices present), progress, completion, template TPL-14 (open, save, submit, owner sees, self sign-off refused 403, owner sign-off, document issued, PDF download), pathways (list, self and team enrolment, progress access), gate control (author cannot approve, unapproved revision refused 409, learner cannot publish 403, reviewer queue).
- Backend log (`/home/claude/work/lms-load/backend.log`): no 5xx responses. Health: database, redis, storage all ok (storage is a `moto` stub on 127.0.0.1:9000, not MinIO).

## Level gate (course `handyman`, CSV slug)

- Created course slug `handyman` with a track of 130 published lessons from `curriculum/levels/handyman.csv` (base 74, group 12, specialised 44). Learner enrolled.
- Before base is finished: group (12) and specialised (44) lessons are locked; their bodies are withheld (`body: null`) in the outline. A group completion attempt returns **403** "The group level is locked until the base level is finished."
- Result: **block verified.**
- Unlock after base is finished: **not verified.** The 74 base completions were recorded (HTTP 200), but the group level stays locked. The rule (`level-rules.ts` lines 5 to 7, 107 to 108) needs a passed knowledge-check attempt for every base lesson that has checks. 63 of 74 base lessons have checks.
- Cause: knowledge-check answer keys are not in the published revision bodies. Of 1,693 knowledge checks in published revisions, 0 carry `correctIndex`. The attempt route (`curriculum.routes.ts` lines 168 and 170) grades only against `correctIndex` in the stored body, and the outline strips answer keys (`publicLessonBody`, lines 140 to 143). The keys exist in `curriculum/assessments/<ID>.assessment.json` (for example `F11-L05.assessment.json`), which the loader does not merge into revision bodies. As a result, no learner can pass a knowledge check in lms, so base cannot finish and group and specialised stay locked in every course with checks.

## Gaps and decisions for the owner

1. **Knowledge-check answer keys not in lesson bodies.** Blocks passing any check and so unlocks group and specialised levels. Fix needs a loader or content decision (merge `curriculum/assessments` keys into a new revision and re-approve). Not patched.
2. **622 level-file lessons were not in the reviewed manifest.** 379 were loaded and approved under the owner note; they have no reviewed manifest entry. 243 are title-only and not loaded.
3. **Test data left in lms**: smoke course, track, organisation, learner completions, a template response and issued document, a pathway enrolment, the `handyman` gate course. The three trial accounts exist with run-time passwords that are not stored. Reset before any real use.
4. **Solar L12 and roof L01** (coordinator list) are not in the manifest; they were loaded from current files via the level set.

## Running processes (left running for reuse)

- Backend (`node dist/server.js`, port 5000, lms). Redis on 127.0.0.1:6399 (scratch). `moto_server` on 127.0.0.1:9000 (storage stub).

## Files

- Work directory: `/home/claude/work/lms-load/` (loaders `load-lessons.mjs`, `load-missing.mjs`; driver `drive.mjs`; smoke `smoke.mjs`; gate `gate.mjs`, `gate2.mjs`; results `drive-results.json`, `smoke-results.json`, `gate-results.json`; lists `accepted.json`, `accepted-level.json`, `refused-title-only.txt`; manifest backup).
- Connection helper (no secrets stored): `/home/claude/work/lms-load/lms-env.sh`.
