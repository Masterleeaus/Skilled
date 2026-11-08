-- READ-ONLY ACADEMY PREFLIGHT. Run against titan_academy ONLY.
-- Do not apply the uniqueness migration if duplicate rows are returned.
-- This query does not read or change Field or Desk data.
SELECT "studentId", "courseId", COUNT(*) AS duplicate_count
FROM "certificates"
GROUP BY "studentId", "courseId"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, "studentId", "courseId";
