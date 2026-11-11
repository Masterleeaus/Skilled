# HASH fix: D1 (content hash key order) and D2 (course publish needs a module)

Date: 2026-11-02. Scratch database `lms_trial` only. No Prisma schema or migration change. No git commit. No memory tool used.
Backups of every edited file: `/home/claude/work/hash-fix-backup/` (`lesson-review.service.ts`, `template.model.ts`, `course.service.ts`, `lesson-review.test.ts`).

## D1: cause

`contentHashOf` (`apps/backend/src/modules/curriculum/lesson-review.service.ts`, line 27 before the change) hashed `JSON.stringify(body)`. The hash is written at draft time from the body as received (`insertDraft`, line 173). Approval (`recordReview`, line 203) and the publication gate re-hash the body as read back from Postgres. `jsonb` returns keys shorter-first, then bytewise, so any body not already in that order hashes differently and is refused with HTTP 409 `Stored content hash does not match the revision body`.

Evidence: all 236 canonical lesson files differ from their jsonb read-back order (offline check, `/home/claude/work/hash-fix-rerun/offline-before.mjs`).

## D1: change

- New shared module `apps/backend/src/utils/content-hash.ts`: `canonicalJson` (object keys sorted at every level, array order kept), `sha256Hex`, `contentHash`.
- `contentHashOf` now returns `contentHash(body)`. Used by draft write, approval, publish gate, reviewer detail and queue.
- `apps/backend/src/modules/templates/template.model.ts`: its own `stableStringify` was the same algorithm. It now imports the shared function and keeps the `stableStringify` name, so template document hashes are unchanged.
- Call sites checked with `grep -rn "createHash\|contentHash"`. Token hashes (`utils/token.ts`, `auth/token.utils.ts`, `integration.routes.ts`) are not content hashes and were not changed.
- Not changed: the lesson context snapshot hash in `curriculum/curriculum.routes.ts` (lines 411 and 477). It is computed and verified from the same stored row, so jsonb order does not affect it, and changing it would make existing snapshot rows fail verification. The trial has 0 snapshot rows. Owner decision whether to move it to `contentHash` too.

## D1: existing stored hashes (read-only check, `/home/claude/work/hash-fix-rerun/analyse-stored-hashes.mjs`)

- 237 revisions (236 approved plus 1 control) store the old formula. 237 of 237 match `sha256(JSON.stringify(body))`; 0 of 237 match the canonical hash.
- 236 APPROVED review rows are bound to those old hashes.
- Answer: yes, the approvals exist with the old hash and they need re-approving on a new revision. The old rows were not rewritten. Under the fixed code the old revisions cannot be approved or published (integrity mismatch).
- The 138 revisions already PUBLISHED stay published. Their stored hash no longer matches the canonical hash, so the reviewer detail reports `hashIntegrity: false` for them. Owner decision: publish the re-approved revisions as superseding versions, or accept the mismatch.

## D1: tests

| Check | Result |
|---|---|
| `npm run build` (tsc) | exit 0 |
| `npx tsc -p tsconfig.test.json --noEmit` | exit 0 |
| `lesson-review.test.ts` on fixed code | 32 passed, 0 failed (30 existing, 2 new) |
| New regression test: non-canonical key order, approve and publish with the same hash | passes on fixed code, fails on old code (run with the pre-change `lesson-review.service.ts` restored for one run; 2 failures, the regression test and the key-order hash test) |
| Full vitest suite, `DATABASE_URL` on `lms_trial`, unit-test env values set | 15 files passed, 225 tests passed, 0 failed |
| Full vitest suite, same run without env values | `auth.test.ts` and `health.test.ts` fail at env validation (CLIENT_URL, REDIS_URL, JWT and MINIO values missing from the shell). Not a code failure. |
| Integration suites (`src/tests/integration/*`, 5 files) | Fail closed. `harness.ts` refuses any database whose name lacks "test" (`lms_trial`). Not run against `lms_trial`. Not renamed or bypassed. |

Log: `/home/claude/work/hash-fix-backup/vitest-full-env.log`.

## D1: live re-run on the fixed build (raw lesson key order, no normalising)

Backend restarted on the fixed `dist/`. Owner and reviewer passwords were reset in the scratch database for the driver (`/home/claude/work/hash-fix-rerun/rerun.mjs`).

| Stage | Before (earlier trial run, old code) | After (fixed build) |
|---|---|---|
| Draft (new revision) | 236 HTTP 201 (body reordered to jsonb order) | 236 of 236 HTTP 201, local hash equals server hash in 236 of 236 |
| Approve | 236 of 236 HTTP 409 `Stored content hash does not match` (first attempt) | 236 of 236 HTTP 201 |
| Publish, lessons whose publish was refused | 98 HTTP 409, all `STRUCTURE_INCOMPLETE` | 98 HTTP 409, all `STRUCTURE_INCOMPLETE`, 0 hash reasons. 0 newly published |
| Publish, lessons already published | 138 published | not re-published (138 new approved DRAFT revisions left in place) |
| PUBLISHED revisions | 138 | 138 |

Raw results: `/home/claude/work/hash-fix-rerun/rerun-results.json`. The 98 remaining publish refusals are the content gap in the canonical files (empty `summary` and `qualityStandard`), not the hash.

Database after the re-run: 473 revisions (237 before, +236 new), 472 APPROVED reviews (+236), 138 PUBLISHED, 335 DRAFT.

Side effects in `lms_trial` (scratch): 236 new revisions and 236 approvals; 138 of the new revisions remain DRAFT and approved; trial owner and reviewer password hashes reset.

## D2: decision

Bug, not a rule. A course's academy content reaches learners through its attached published tracks (`AcademyCourseTrack`, `track.status PUBLISHED`), and the learner eligibility queries in `curriculum.routes.ts` read those tracks, not modules. The module-count check blocked a course that has real content.

Change in `apps/backend/src/modules/courses/course.service.ts` (`setPublishStatus`): publishing is refused only when the course has no modules AND no attached published track with at least one lesson placement. Message changed to `Cannot publish a course with no modules or published tracks`.

Live check (`/home/claude/work/hash-fix-rerun/d2-check.mjs`, scratch course `cmvz4oyme01gn7dde1my9i25d`):
- No modules, no track: publish HTTP 400 (refused).
- Attach published track `trial-core-mvz4dcqi`: HTTP 201.
- Publish: HTTP 200. The course was then unpublished again (HTTP 200).

Courses blocked before the change in the trial: any course with no modules, including track-only courses. The smoke run added a module to work around it (S1b).

## Not done

- No expert review of any lesson. Approvals in the re-run carry the note `Owner trial approval 2026-11-02. Not an expert review.` ACA-024 remains open.
- The 98 structurally incomplete lessons are not fixed (content gap).
- Snapshot hash in `curriculum.routes.ts` left on `JSON.stringify` (see D1 change).
