# Checkout claims: preflight and operations (issues #47, #48)

The migration `20261108130000_payment_coupon_redemptions` creates the partial unique index
`payments_one_pending_per_student_course_key` on `payments("studentId", "courseId") WHERE status = 'PENDING'`.
It fails if any learner already has two PENDING payments for one course.

## 1. Duplicate PENDING rows (run before applying the migration)

```sql
SELECT "studentId", "courseId", count(*) AS pending_rows
FROM "payments"
WHERE "status" = 'PENDING'
GROUP BY "studentId", "courseId"
HAVING count(*) > 1;
```

An empty result means the migration can apply. For each row returned, list the rows:

```sql
SELECT id, "transactionId", "couponId", "licenceTrack", amount, "createdAt", "checkoutUrl"
FROM "payments"
WHERE "status" = 'PENDING' AND "studentId" = '<studentId>' AND "courseId" = '<courseId>'
ORDER BY "createdAt";
```

Resolve duplicates before the migration. Keep the newest row that holds a real Stripe session (`transactionId` starts
with `cs_`). Mark the others `FAILED`, but only after confirming in the Stripe dashboard that their sessions are expired
or were never paid. A `FAILED` row also gives back its coupon reservation, so decrement `coupons."redeemedCount"` by one
for each such row that has a `couponId`, in the same transaction:

```sql
BEGIN;
WITH released AS (
  UPDATE "payments" SET "status" = 'FAILED'
  WHERE id IN ('<id-1>', '<id-2>') AND "status" = 'PENDING'
  RETURNING "couponId"
)
UPDATE "coupons" c SET "redeemedCount" = c."redeemedCount" - r.n
FROM (SELECT "couponId", count(*) AS n FROM released WHERE "couponId" IS NOT NULL GROUP BY "couponId") r
WHERE c.id = r."couponId" AND c."redeemedCount" >= r.n;
COMMIT;
```

The `RETURNING` clause counts only the rows this statement moved from PENDING, so a row that was already FAILED is not
released twice. Run the `SELECT` above again after the commit and confirm that no duplicate remains before applying
the migration.

Do not change the rows of a learner who has paid: a `SUCCEEDED` row is not PENDING and is not part of this check.

## 2. Stripe webhook events

The webhook endpoint `/api/payments/stripe/webhook` must subscribe to:

- `checkout.session.completed` and `checkout.session.async_payment_succeeded` (fulfilment, existing)
- `checkout.session.expired` (releases an abandoned checkout's coupon reservation, new)

Without `checkout.session.expired`, abandoned checkouts keep their reservation until the expiry sweep runs.

## 3. Expiry sweep

`sweepAbandonedCheckouts()` in `apps/backend/src/modules/payments/payment.service.ts` settles PENDING Stripe checkouts
older than 24 hours (Stripe's default session lifetime). It is idempotent. It is exported but not yet scheduled: it
needs a worker job or cron entry that calls it periodically (for example hourly) in the backend process.

## 4. Stripe idempotency keys

Each checkout session is created with the idempotency key `academy-checkout-<paymentId>`, where `paymentId` is the
claimed row. Stripe keeps a key's result for 24 hours. An abandoned claim (older than 2 minutes, with no session linked)
is resumed with the same key when the learner retries the same checkout. Stripe then returns any session the earlier
attempt created instead of making a second one.

Known residual: an abandoned claim retried with different options (coupon, licence track or amount) is released. If the
dead request had created a Stripe session, that session is not linked to any row, and its payment cannot be fulfilled
automatically. Find such sessions in the Stripe dashboard by their learner and course metadata and handle them by hand.
