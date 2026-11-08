-- Prevent duplicate answers to one question in the same quiz attempt.
-- Preflight existing Academy data for duplicates before applying this migration.
CREATE UNIQUE INDEX "answers_attemptId_questionId_key" ON "answers"("attemptId", "questionId");

-- Exactly one actively running attempt per learner and quiz.
-- This is a PostgreSQL partial index, which Prisma schema cannot represent.
CREATE UNIQUE INDEX "quiz_attempts_one_active_per_student_quiz_key"
  ON "quiz_attempts"("studentId", "quizId") WHERE "status" = 'IN_PROGRESS';
