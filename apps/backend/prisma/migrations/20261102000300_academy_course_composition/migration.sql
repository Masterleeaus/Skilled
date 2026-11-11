CREATE TABLE "academy_course_tracks" ("id" TEXT NOT NULL, "courseId" TEXT NOT NULL, "trackId" TEXT NOT NULL, "position" INTEGER NOT NULL, "required" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "academy_course_tracks_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "academy_course_tracks_courseId_trackId_key" ON "academy_course_tracks"("courseId", "trackId");
CREATE UNIQUE INDEX "academy_course_tracks_courseId_position_key" ON "academy_course_tracks"("courseId", "position");
CREATE INDEX "academy_course_tracks_trackId_idx" ON "academy_course_tracks"("trackId");
ALTER TABLE "academy_course_tracks" ADD CONSTRAINT "academy_course_tracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "academy_curriculum_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "academy_learner_completions" ("id" TEXT NOT NULL, "learnerId" TEXT NOT NULL, "lessonId" TEXT NOT NULL, "revisionId" TEXT NOT NULL, "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "academy_learner_completions_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "academy_learner_completions_learnerId_lessonId_revisionId_key" ON "academy_learner_completions"("learnerId", "lessonId", "revisionId");
CREATE INDEX "academy_learner_completions_learnerId_lessonId_idx" ON "academy_learner_completions"("learnerId", "lessonId");
ALTER TABLE "academy_learner_completions" ADD CONSTRAINT "academy_learner_completions_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "academy_lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
