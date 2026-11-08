# Contract script triage (2026-11-08)

Five static contract scripts failed on `main`. Each was run from `lms-main/`, and each failing assertion was read against the current source. No source code changed: every failure was a source pattern that moved in a legitimate refactor, or a test harness mock that did not cover a newly imported module. No assertion was deleted, skipped or weakened, and no security property changed meaning.

Before: all five exited non-zero. After: all five exit 0.

## test-auth-route-contracts.mjs

| Assertion | Decision | Reason |
| --- | --- | --- |
| `Refresh validates active verified user` (`authService.includes('!stored.user.isActive') && ...includes('!stored.user.isEmailVerified')`) | (b) pattern updated | `refreshAccessToken` now calls `isAccountEligible(stored.user)` (auth.service.ts:120). The helper returns `!user.deletedAt && user.isActive && user.isEmailVerified`. The new check requires the refresh function to call the helper and the helper to contain the same three conditions. Same property. |

Result: 17 assertions pass (was 16 pass plus one failure).

## test-session-lifecycle-contract.mjs

| Assertion | Decision | Reason |
| --- | --- | --- |
| `account state checked on refresh` (`refresh.includes('!stored.user.isActive') && refresh.includes('!stored.user.isEmailVerified')`) | (b) pattern updated | Same refactor as above. The new check requires `isAccountEligible(stored.user)` inside the refresh slice and the helper's active and verified conditions in `auth.service.ts`. |

Result: 16 assertions pass.

## test-payment-security-contract.mjs

| Assertion | Decision | Reason |
| --- | --- | --- |
| `zero-price enrollment and receipt atomic` (`/await prisma\.\$transaction\(\[/`) | (b) pattern updated | The zero-cost path was changed from the array form of `$transaction` to an interactive transaction (`prisma.$transaction(async (tx) => ...)`, payment.service.ts:175). It still creates the enrolment, the receipt and the coupon redemption in one transaction, and a unique violation rolls all of them back. The check now slices the `if (amount === 0) {` block and requires an interactive transaction containing `tx.enrollment.create(` and `tx.payment.create(`. |

Result: 15 assertions pass.

## test-course-publication-access.mjs

| Assertion | Decision | Reason |
| --- | --- | --- |
| Script aborts with `Unexpected module import ../../config/logger` | (b) harness mock added | `course.service.ts` now imports `logger`. The executable harness mocks only the modules it expects. A logger stub was added. No assertion changed. |

Result: 29 executable assertions pass (10 private-preview teacher pages).

## test-video-upload-safety.mjs

| Assertion | Decision | Reason |
| --- | --- | --- |
| Script aborts with `Unexpected dependency: ../../config/env` | (b) harness mocks added | `video-upload.service.ts` now imports `env`, `logger` and `prisma`. Stubs were added for all three. |
| `Database update failures trigger object cleanup` (`videoRoute.includes('await minioClient.removeObject(MINIO_BUCKET, objectKey)')`) | (b) pattern moved | The cleanup moved out of the route into `attachUploadedLessonVideo` in `lesson.service.ts`. When `setLessonVideoKey` throws, it calls `removeVideoObject(objectKey)` and rethrows. The new check reads the `attachUploadedLessonVideo` slice and requires that `catch` shape. Same property, checked at its new location. |
| `Existing ownership-checked update remains in use` (`videoRoute.includes('await lessonService.updateLesson(')`) | (b) pattern updated | The route now calls `lessonService.attachUploadedLessonVideo(`, which calls `setLessonVideoKey`. That function runs `assertCourseOwnership` before the update. The new check requires the route to call the attach function, and the `setLessonVideoKey` slice to contain `assertCourseOwnership(lesson.module.courseId, userId, role)` and `tx.lesson.update(`. |
| New: `Video attach checks ownership before the database update` | added (part of the above) | Keeps the ownership property that the replaced assertion covered. |

Result: 26 assertions pass.

## Not changed, and why

- No assertion was classified as (c). Every failing assertion still expresses an intended property, so none was left failing.
- No source file was modified. The current code satisfies every security property the scripts assert.

## Verification

- `tsc --noEmit` and `tsc -p tsconfig.test.json --noEmit` in `apps/backend`: pass.
- `pnpm -C apps/backend lint`: pass.
- `vitest run` in `apps/backend`: baseline and after are identical, 60 files passed and 9 skipped, 916 tests passed and 114 skipped.
- The integration suites (skipped in the baseline) were not run. The local `lms_S2_test` database could not be migrated, because `prisma migrate deploy` failed with `permission denied to create database`.
