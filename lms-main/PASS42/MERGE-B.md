# Merge B: assignment frontend and API helpers (Pass 56 into OURS)

Sources: OURS = /home/claude/p29m/lms-main, THEIRS = /home/claude/work/pass56/lms-main, manifest = PASS56-CHANGE-MANIFEST.json.
Backups of every touched file: /home/claude/work/merge-B-backup/ (same relative paths).

## 1. Pre-replacement hash check (class A)

Each OURS file was compared with the Pass 55 `before_sha256` in the manifest.

| File | OURS hash vs Pass 55 | Action |
|---|---|---|
| backend/src/modules/assignments/assignment-upload.service.ts | MATCH | Replaced with THEIRS (THEIRS = after_sha256 ad1f1719...) |
| backend/src/modules/assignments/assignment.validators.ts | MATCH | Replaced with THEIRS (after_sha256 2b0328da...) |
| frontend/src/lib/assignment.api.ts | MATCH | Replaced with THEIRS (after_sha256 44fde215...) |
| frontend/src/lib/course-mutations.api.ts | MATCH | Replaced with THEIRS (after_sha256 3ed16197...) |

Post-copy check: each file now matches its after_sha256. Line deltas match the manifest (9+, 6+, 6+, 1+, 0-).

## 2. Hand merges (class B)

Both pages differed from the Pass 55 hash in OURS, so they were merged by hand.

### 2a. apps/frontend/src/app/teacher/courses/[slug]/page.tsx

- Kept OURS line 8 and line 27: `fetchCourseBySlug` (OURS API name). THEIRS uses `fetchCourseForManagement`, which OURS does not export. Not taken.
- Added from THEIRS, lines 173-178: "Assignment thresholds" link to `/teacher/courses/${slug}/assignments`. This is the Pass 56 addition (the manifest's +6 lines), and it points at the new assignments page.
- Not taken: THEIRS "Assessments & grading" link (THEIRS lines 167-172, link to `/quizzes`). It is not a Pass 56 change, since the manifest's +6 lines are fully accounted for by the thresholds link. It is in the Pass 55 base, and OURS lacks it. OURS may have removed it on purpose, so I did not restore it. **Decision needed from main session.**

### 2b. apps/frontend/src/app/teacher/courses/[slug]/assignments/new/page.tsx

- Kept OURS line 7 and line 18: `fetchCourseBySlug`.
- Added from THEIRS, line 26: `passingMarks` state (default 10).
- Added from THEIRS, line 30: `createAssignment` payload includes `passingMarks` (replaces the OURS line without it).
- Added from THEIRS, lines 74-80: "Minimum passing marks" input and helper text.
- Added from THEIRS, line 83: button `disabled` also checks `totalMarks < 1 || passingMarks < 1 || passingMarks > totalMarks`.
- Kept OURS: title, instructions, due date, total marks, router, and the Topbar.

Diff of merged vs THEIRS: only the `fetchCourseBySlug` lines (intentional), plus the Assessments & grading link (intentional omission above).

## 3. Assignments page (new in Pass 56)

`apps/frontend/src/app/teacher/courses/[slug]/assignments/page.tsx` already existed in OURS. Its hash (46aa264f...) is identical to THEIRS and to the manifest. Left unchanged.

It imports `fetchCourseForManagement` from `@/lib/course-detail.api`. That export does not exist in OURS (see section 4). It was not changed, because the fix belongs to the owner of `course-detail.api.ts`, and the same gap exists in OURS `quizzes/page.tsx`.

## 4. Verification

- `npx tsc --noEmit -p apps/frontend/tsconfig.json`: exit 2, 10 errors.
  - In my scope: `assignments/page.tsx(7,10)` imports `fetchCourseForManagement`, which is not exported.
  - Pre-existing in OURS, outside my files: `payment/success/page.tsx(27,79)` (string | null type error); `quizzes/[quizId]/grading/page.tsx` (`fetchQuizSubmissions` and `gradeQuizAnswer` missing from `quiz.api`, plus 4 implicit-any errors); `quizzes/page.tsx(7,10)` (`fetchCourseForManagement` missing).
  - No errors in the merged course page, the merged new page, or the four class A files.
- `npx next build`: exit 1. "Compiled successfully" but "Failed to compile" at the type-check step. Failing: `payment/success/page.tsx:27:79`. Warnings for the same missing imports listed above. ESLint also fails: "Invalid Options: useEslintrc, extensions" (config issue, pre-existing).
- Side effects: `tsconfig.tsbuildinfo` rewritten by tsc; `.next/` produced or updated by the build. `next-env.d.ts` unchanged.

## 5. Backend routes the pages need that are missing in OURS (not added)

- `PATCH /assignments/:assignmentId/passing-marks` (used by `updateAssignmentPassingMarks` in `assignment.api.ts`, and by the assignments page). OURS `assignment.routes.ts` has no such route. THEIRS has it at line 45. This belongs to file D (`assignment.routes.ts`), which is not mine.
- `POST /assignments` must accept `passingMarks` (used by the new-assignment page). OURS `assignment.service.ts` and validators belong to D and C. The validators are now THEIRS, which include it.

## 6. Open items for the main session

1. Decide whether "Assessments & grading" should be restored to the course page (section 2a).
2. Fix `fetchCourseForManagement` in `course-detail.api.ts` (or switch the callers to `fetchCourseBySlug`). This is outside my files. It also blocks `quizzes/page.tsx`.
3. Add the passing-marks route in file D.
4. The payment, quiz grading, and ESLint failures are pre-existing and are not caused by this merge.
