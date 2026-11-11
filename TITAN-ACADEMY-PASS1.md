# Titan Academy — TypeScript Upgrade Pass 1

This is an additive curriculum-composition foundation, **not a deployed or live-tested LMS**.

- `AcademyContentLesson`: original 221 inventory briefs, unchanged.
- `AcademyLessonRevision`: immutable-by-policy revision records with structured JSON body, hash and publishing status. **Application-level enforcement of immutability remains to be implemented.**
- `AcademyCurriculumTrack`: reusable course/pathway composition container; not yet linked to existing `Course`.
- `AcademyLessonPlacement`: positions canonical lessons in tracks; optional pinned revision.
- Existing Course, Module, Lesson, LessonProgress, assessments and payments preserved.

## Verification
`node apps/backend/prisma/verify-titan-composition.mjs`

## Deployment (not performed)
From `apps/backend`: install dependencies, configure DATABASE_URL, run `npx prisma validate`, `npx prisma migrate deploy`, `npx prisma generate`, and `npm run curriculum:import`.

## Next pass
Implement authenticated APIs and editorial workflows; validate revision belongs to the same lesson as a placement, add tenant scope, and integrate tracks with legacy course records and learner progress. Do not publish briefs as complete lessons.
