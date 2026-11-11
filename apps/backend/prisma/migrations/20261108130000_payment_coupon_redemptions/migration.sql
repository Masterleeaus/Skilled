-- Payment checkout claims and per-coupon redemption tracking (issues #47 and #48).
-- ADDITIVE ONLY: new nullable/defaulted columns, a foreign key, indexes. No existing rows are changed.
-- Preflight: existing coupons start at redeemedCount = 0 and existing payments have couponId NULL.
-- Before applying, check that no learner has two PENDING payments for one course (the partial unique index below
-- would fail on them):
--   SELECT "studentId", "courseId", count(*) FROM "payments" WHERE "status" = 'PENDING' GROUP BY 1, 2 HAVING count(*) > 1;

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "redeemedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "checkoutUrl" TEXT,
ADD COLUMN     "couponId" TEXT;

-- CreateIndex
CREATE INDEX "payments_couponId_idx" ON "payments"("couponId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- At most one open (PENDING) checkout per learner and course. This is a PostgreSQL partial index,
-- which the Prisma schema cannot represent. Concurrent checkout requests race on this index; the loser gets P2002.
CREATE UNIQUE INDEX "payments_one_pending_per_student_course_key"
  ON "payments"("studentId", "courseId") WHERE "status" = 'PENDING';
