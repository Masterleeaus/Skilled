# MERGE-D: assignment.routes.ts and assignment.service.ts

Merge member D. Pass 56 (THEIRS) carried into OURS.
Backups of the pre-merge OURS files: /home/claude/work/merge-D-backup/

## Basis

- OURS service equals the Pass 41, Pass 42 and pre-merge baselines byte for byte. We had no service changes to keep.
- OURS routes differ from the Pass 42 baseline only by the `param(req, "...")` helper (imported from `utils/requestParams`) on every route param, plus the import. That is an Express 5 typing fix and is kept.

## Decisions

### assignment.service.ts (156 lines), taken from THEIRS in full

| Lines | Change | Source |
|---|---|---|
| 5 | Imports `recalculateCourseProgress` from enrollment | THEIRS |
| 20-41 | New `configureAssignmentPassingMarks` (range check 1..totalMarks, recalculates enrolled learners) | THEIRS |
| 43-53 | `listAssignmentsForCourse(courseId, userId, role)` now enforces enrollment or course ownership. Returns the same array | THEIRS |
| 61-72 | `assertCanSubmitAssignment` exported. Checks enrollment and that the course is published and not deleted | THEIRS |
| 74-110 | `submitAssignment` uses that preflight, then recalculates progress after upsert. Same return shape | THEIRS |
| 123-129 | `getMySubmission` now checks enrollment | THEIRS |
| 154-155 | `gradeSubmission` recalculates progress after grading | THEIRS |

### assignment.routes.ts (156 lines), hand merge

| Lines | Decision | Kept from |
|---|---|---|
| 1, 39, 57, 84, 107, 124, 143 | `param()` helper on all route params | OURS |
| 5-11 | `gradePassingMarksSchema` added to the validators import (line 10) | THEIRS |
| 12 | `removeAssignmentAttachments` added to the upload import | THEIRS |
| 36-47 | `GET /course/:courseId` gets `authenticate` and passes `userId` and `role`. OURS had no auth here. Route path and response shape unchanged | THEIRS (auth), OURS (param) |
| 49-62 | New `PATCH /:assignmentId/passing-marks` (`course:update:own`) | THEIRS |
| 64-72 | Submit preflight middleware runs `assertCanSubmitAssignment` before multer. Typed as `Request<{ assignmentId: string }>` so the `req.params.assignmentId` literal typechecks under `string | string[]` | THEIRS (logic), typed for Express 5 |
| 75 | Multer runs after the preflight | THEIRS |
| 84-97 | Submit wrapped in try/catch: on failure, `removeAssignmentAttachments` runs and the error is rethrown | THEIRS |

## Response shapes

No change to existing response shapes. The new `PATCH /:assignmentId/passing-marks` returns the updated assignment. It is a new route, not a changed one.

## Verification

- `node scripts/test-assignment-integrity.mjs` (run in OURS, after the merge): PASS, 32 checks.
- `tsc --noEmit -p apps/backend` (run in OURS, after the merge): 8 errors in total.
  - `src/modules/assignments/assignment.service.ts(5,26)`: `recalculateCourseProgress` is not exported from `enrollment.service.ts` on our side. It is a private function there at line 166. THEIRS exports it at line 174. Owner of the enrollment file must export it. This blocks the build until that is done.
  - `src/jobs/email.worker.ts` (7 errors): SMTP_* fields missing from the env type. Not in my files.
  - My two files produce no other errors.
