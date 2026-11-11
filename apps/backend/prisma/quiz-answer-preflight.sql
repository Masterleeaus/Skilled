-- Read-only: must return zero rows before applying the quiz-answer uniqueness migration.
SELECT "attemptId", "questionId", COUNT(*) AS duplicates
FROM "answers"
GROUP BY "attemptId", "questionId"
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;

-- Read-only: must return zero rows before adding the partial active-attempt index.
SELECT "studentId", "quizId", COUNT(*) AS active_attempts
FROM "quiz_attempts"
WHERE "status" = 'IN_PROGRESS'
GROUP BY "studentId", "quizId"
HAVING COUNT(*) > 1
ORDER BY active_attempts DESC;
