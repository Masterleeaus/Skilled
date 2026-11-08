# Payment path review: licence track

Scope: checkout request (`licenceTrack`), Stripe session metadata and success URL, verify step, enrolment created after payment, payment record.
Repo: `/home/claude/p29m/lms-main`. Changes were made after the owner's change of plan (apply minimal backend fixes, log them here).

## Trace

1. **Checkout request.** `apps/frontend/src/app/courses/[slug]/page.tsx:87-91` posts `{ courseId, couponCode, licenceTrack: track }`. The backend validates with `initiatePaymentSchema` (`apps/backend/src/modules/payments/payment.validators.ts:14-18`): `z.enum(LICENCE_TRACKS).optional()`. A missing track is accepted and defaults to `non-licensed`. An unknown track is refused (422 through the Zod handler). It is not silently defaulted.
2. **Checkout service.** `apps/backend/src/modules/payments/payment.service.ts:8-74`. The track is passed to `paymentProvider.initiate` and written to the `Payment` row (`licenceTrack`, lines 45 and 69). The zero-amount path writes it to both the enrolment and the payment.
3. **Stripe session.** `apps/backend/src/modules/payments/stripe.provider.ts:38-40`. Metadata carries `licenceTrack`. The success URL carries `&track=` (informational only).
4. **Success page.** `apps/frontend/src/app/payment/success/page.tsx`. It ignores the URL `track`, calls `/payments/verify/:ref`, and builds the course link from the enrolment's saved `licenceTrack`. This is correct.
5. **Verify.** `payment.service.ts:76-118`. The Stripe session is re-fetched, and metadata is compared against the immutable `Payment` row: reference, student, track (`?? DEFAULT`), course, currency, amount. A mismatch throws 409 before any write. The track is taken from the DB record, not the URL or the Stripe redirect.
6. **Enrolment.** `payment.service.ts` upsert with `create: { licenceTrack: payment.licenceTrack }`. The enrolment is created on the paid track.
7. **Payment record.** Stores `licenceTrack` on both paths. Migration `apps/backend/prisma/migrations/20261103120000_licence_track_enrolment/migration.sql` adds the column with default `non-licensed`.

## Checks

| Check | Result |
|---|---|
| Enrolment track equals paid track (new enrolment) | Pass. Upsert `create` uses `payment.licenceTrack`. |
| Enrolment track equals paid track (enrolment already exists) | **Fail before fix** (finding 2). |
| Verify refuses a track mismatch | Pass for session-vs-record mismatch (`payment.service.ts:91-99`). Session with no metadata defaults to non-licensed and is only accepted if the record is non-licensed, so it fails closed. |
| Learner cannot pay for one track and get the other | **Partly fails.** A `?track=` on learner routes overrides the saved track (finding 1). The `PATCH /enrollments/:courseId/licence-track` switch is free (finding 3). |
| Missing track falls back safely | Pass. Missing means non-licensed, in checkout, enrol, and `savedLicenceTrack`. |
| Unknown track | Refused (422) at checkout, enrol and PATCH. Refused on `?track=`. Saved unknown values read as non-licensed. |
| Payment record stores the track | Pass, both paid and zero-amount paths. |
| Success return URL is trusted | No. The server ignores the URL track, and the page uses the saved enrolment track. |

## Findings (ranked)

### 1. High. Enrolled learners can read the other track's lessons with `?track=`. Not fixed; owner decision needed.

- `apps/backend/src/modules/curriculum/curriculum.routes.ts:143` (lesson body): `const track = requestedLicenceTrack(req.query.track, activeEnrolment.licenceTrack);`
- Same pattern at `curriculum.routes.ts:108` (outline) and `:168` (progress), and `apps/backend/src/modules/courses/course.routes.ts:57` (course detail).
- `apps/backend/src/modules/curriculum/licence-track.ts:152-155` (`requestedLicenceTrack`): a `?track=` value wins over the saved enrolment track.
- The frontend sends `track` on the body fetch (`apps/frontend/src/lib/curriculum.api.ts:83-84`), and the student page keeps a URL track over the saved one (`apps/frontend/src/app/student/courses/[slug]/page.tsx:54`).

Effect: a learner who paid for or enrolled on non-licensed can open `.../lessons/<id>/body?track=licensed` and read licence-required lesson text. The enrolment track is not enforced on reads.

Existing tests pin this as intended preview behaviour: `apps/backend/src/tests/academy-licence-track.test.ts` (licensed outline, body and progress previews by an enrolled learner) and `academy-licence-track-saved.test.ts` ("a ?track= in the URL overrides the saved track for previewing").

I tried a fix (ignore `?track=` for enrolled STUDENT users, keep it for staff and unenrolled visitors). It broke four of those deliberate preview tests, so I reverted it. The fix is a product decision: either remove learner previews, or restrict them to staff. Suggested patch: in `licence-track.ts` add

```ts
export function learnerLicenceTrack(queryTrack: unknown, savedTrack: unknown, role: string | undefined): LicenceTrack {
  if (role === "STUDENT" && savedTrack !== undefined && savedTrack !== null) {
    parseLicenceTrack(queryTrack);
    return savedLicenceTrack(savedTrack);
  }
  return requestedLicenceTrack(queryTrack, savedTrack);
}
```

then replace the four call sites with `learnerLicenceTrack(req.query.track, <saved>, req.user?.role)`. Update the preview tests to match.

### 2. Medium. An existing enrolment keeps its track, so a second payment on another track can succeed silently. Fixed.

- `apps/backend/src/modules/payments/payment.service.ts:107-111` (old): `prisma.enrollment.upsert({ ..., create: { ..., licenceTrack: payment.licenceTrack }, update: {} })`. The `update: {}` keeps the existing track.
- `payment.service.ts:8-74`: checkout only blocks an existing enrolment, not a second PENDING payment. Two checkouts (licensed and non-licensed) can both be started. If the second completes while the first enrolment exists, the learner has paid for a track they do not get.

Fix applied (see change log). The learner must contact support. No automatic refund.

### 3. Medium. Post-purchase track switch at no charge. Not changed; product decision.

- `apps/backend/src/modules/enrollment/enrollment.service.ts:31-42` and route `enrollment.routes.ts:101-111`: `PATCH .../licence-track` lets an ACTIVE or COMPLETED learner switch between tracks. The price does not depend on the track (`payment.service.ts:22-26`).

If tracks are meant to be priced the same, this is intended. If the licensed track is a premium, a learner can pay for non-licensed and switch. Confirm before shipping.

### 4. Low. Checkout does not check the licence file. Not changed.

- `payment.service.ts:8-74` never calls `licenceIndexForTrack`. A learner can pay for the non-licensed track while the licence file is unreadable, and then gets 503 on every lesson until it is restored.
- Suggested: call `licenceIndexForTrack(licenceTrack)` before `paymentProvider.initiate`, returning 503 for non-licensed.

### 5. Low. The DB default hides a missing write. Not changed.

- `apps/backend/prisma/schema.prisma:571` and migration: `Payment.licenceTrack` defaults to `'non-licensed'`. A future `payment.create` that omits the field would record non-licensed silently. Consider removing the DB default for `payments` (keep it for `enrollments` if needed for backfill).

### 6. Low. Redundant `&track=` on the success URL. Not changed.

- `apps/backend/src/modules/payments/stripe.provider.ts:40`. The server never reads it and the success page uses the enrolment's saved track. It is harmless, but it can mislead a future change into trusting it. Consider removing it and its test assertion (`academy-licence-track-saved.test.ts`, the `success_url` expectations).

### 7. Low. Types are loose. Not changed.

- `apps/backend/src/modules/payments/payment-provider.interface.ts:8` and `:24`: `licenceTrack: string` and `string | null`. Use `LicenceTrack` (from `curriculum/licence-track.ts`). The verify comparison `(result.licenceTrack ?? DEFAULT) !== payment.licenceTrack` (`payment.service.ts:93`) is still fail-closed for any unknown string, so this is a type-safety fix only.

### 8. Info. Pending checkouts are not de-duplicated. Not changed.

- `payment.service.ts:17-20`: only `alreadyEnrolled` is checked. Suggested: refuse or reuse a PENDING payment for the same student and course, and add a partial unique index. This is also a pre-existing double-charge risk, not only a track issue.

## Changes made

### Change 1: verify refuses a track that conflicts with the existing enrolment (finding 2)

File: `apps/backend/src/modules/payments/payment.service.ts`, inserted at lines 101-110, before the `prisma.$transaction` in `verifyAndCompletePayment`.

Old:
```ts
  if (result.status === "SUCCEEDED") {
    await prisma.$transaction([
```

New:
```ts
  if (result.status === "SUCCEEDED") {
    // An enrolment that already exists keeps its track (the upsert below never rewrites it). Paying for a different track
    // must not succeed silently, so the payment stays PENDING and no enrolment is changed.
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId } },
      select: { licenceTrack: true },
    });
    if (existing && existing.licenceTrack !== payment.licenceTrack) {
      throw new AppError("This course is already enrolled on a different licence track. The payment was not applied; contact support.", 409);
    }
    await prisma.$transaction([
```

Effect: the payment stays PENDING, and no enrolment is changed. Stripe webhook retries will keep getting 503 for this session; support must refund manually.

### Change 2: tests

File: `apps/backend/src/tests/academy-licence-track-saved.test.ts`, new `describe("the verify step refuses a payment for a different track than the enrolment")` with one test. It creates a licensed checkout, seeds a non-licensed enrolment, and asserts 409, payment still PENDING, enrolment track unchanged. Before change 1 this returned 200 and marked the payment SUCCEEDED.

No existing expectation was changed.

Attempted and reverted: a read-path change for finding 1 (see above). Nothing from it remains in the code.

## Tests run

Command: `cd apps/backend && npx vitest run <file>`. Backend runs with the in-memory Prisma double and a mocked Stripe SDK, so no database, Redis, MinIO or Stripe network service is needed. Nothing skipped.

- `src/tests/academy-licence-track-saved.test.ts`: pass (includes checkout, verify, enrolment and PATCH tests).
- `src/tests/academy-licence-track.test.ts`: pass.
- All files matching `stripe|/payments|checkout|licence` under `src`: 4 files, 80 tests, pass.
- `npx tsc --noEmit -p apps/backend`: exit 0.

Not run: the frontend, and any test that needs a real Postgres or live Stripe. The Stripe webhook path (`stripe.webhook.ts`) has no test.

## Decisions made (for review)

1. Did not change finding 1 (`?track=` read bypass). It conflicts with tested preview behaviour, and the owner needs to choose.
2. Did not change finding 3 (free track switch). Pricing intent is unknown.
3. Chose to leave the payment PENDING on conflict (finding 2), not to auto-refund. Refunds need a human.
4. Did not remove the success-URL `track` parameter (finding 6). The change is harmless and an existing test asserts it.

## Memory

Nothing from memory was used in this review.
