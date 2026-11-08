-- Additive schema: existing LMS enrolments, lesson progress and courses are untouched.
CREATE TABLE "academy_lesson_revisions" (
 "id" TEXT NOT NULL, "lessonId" TEXT NOT NULL, "version" INTEGER NOT NULL,
 "body" JSONB NOT NULL, "contentHash" TEXT NOT NULL,
 "status" TEXT NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "publishedAt" TIMESTAMP(3), CONSTRAINT "academy_lesson_revisions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "academy_curriculum_tracks" (
 "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL,
 "scope" TEXT NOT NULL, "serviceGroup" TEXT,
 "status" TEXT NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "academy_curriculum_tracks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "academy_lesson_placements" (
 "id" TEXT NOT NULL, "trackId" TEXT NOT NULL, "lessonId" TEXT NOT NULL,
 "revisionId" TEXT, "position" INTEGER NOT NULL, "required" BOOLEAN NOT NULL DEFAULT true,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "academy_lesson_placements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academy_lesson_revisions_lessonId_version_key" ON "academy_lesson_revisions"("lessonId","version");
CREATE INDEX "academy_lesson_revisions_lessonId_status_idx" ON "academy_lesson_revisions"("lessonId","status");
CREATE UNIQUE INDEX "academy_curriculum_tracks_slug_key" ON "academy_curriculum_tracks"("slug");
CREATE UNIQUE INDEX "academy_lesson_placements_trackId_lessonId_key" ON "academy_lesson_placements"("trackId","lessonId");
CREATE UNIQUE INDEX "academy_lesson_placements_trackId_position_key" ON "academy_lesson_placements"("trackId","position");
CREATE INDEX "academy_lesson_placements_lessonId_idx" ON "academy_lesson_placements"("lessonId");
ALTER TABLE "academy_lesson_revisions" ADD CONSTRAINT "academy_lesson_revisions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "academy_content_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_lesson_placements" ADD CONSTRAINT "academy_lesson_placements_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "academy_curriculum_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academy_lesson_placements" ADD CONSTRAINT "academy_lesson_placements_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "academy_content_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academy_lesson_placements" ADD CONSTRAINT "academy_lesson_placements_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
