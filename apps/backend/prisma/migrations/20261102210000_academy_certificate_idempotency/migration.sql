-- Academy-only constraint: enforce one certificate per student/course even if a BullMQ
-- job is retried or delivered concurrently. Review duplicates before applying to any
-- existing populated Academy database. Never run this against Field or Desk.
CREATE UNIQUE INDEX "certificates_studentId_courseId_key"
    ON "certificates"("studentId", "courseId");
