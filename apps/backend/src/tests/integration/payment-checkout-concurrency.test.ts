// Issue #47 follow-up: two checkouts for the same learner and course race on PostgreSQL. The partial unique index on
// PENDING payments decides the winner, so at most one PENDING row and one Stripe session can exist. Runs only against a
// disposable local database (see harness.ts); otherwise the suite is reported as skipped.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { configureTestEnvironment, describeWithServices, type Db } from "./harness";

const provider = vi.hoisted(() => ({
  initiate: vi.fn(),
  verify: vi.fn(),
  refund: vi.fn(),
}));

vi.mock("../../modules/payments/stripe.provider", () => ({ paymentProvider: provider }));

configureTestEnvironment();

const ROUNDS = 5;
const COURSE_PRICE = 100;
const DISCOUNT_PERCENT = 10;

describeWithServices("checkout claims under concurrent requests (PostgreSQL)", () => {
  let db: Db;
  let initiateCheckout: typeof import("../../modules/payments/payment.service").initiateCheckout;
  const prefix = `conc-${randomUUID().slice(0, 8)}`;
  const created: { learnerIds: string[]; teacherId?: string; categoryId?: string; courseId?: string; couponId?: string } = { learnerIds: [] };
  const sessionsByLearner = new Map<string, number>();
  const sessionAmounts = new Map<string, { studentId: string; courseId: string; amount: number }>();

  beforeAll(async () => {
    ({ prisma: db } = await import("../../config/prisma"));
    ({ initiateCheckout } = await import("../../modules/payments/payment.service"));

    const teacher = await db.user.create({
      data: { email: `${prefix}-teacher@example.test`, passwordHash: "integration-test-not-a-login", fullName: `${prefix} teacher`, role: "TEACHER", isEmailVerified: true },
      select: { id: true },
    });
    created.teacherId = teacher.id;
    const category = await db.category.create({ data: { name: `${prefix} category`, slug: `${prefix}-category` }, select: { id: true } });
    created.categoryId = category.id;
    const course = await db.course.create({
      data: { title: `${prefix} course`, slug: `${prefix}-course`, description: "concurrency fixture", categoryId: category.id, teacherId: teacher.id, price: COURSE_PRICE, isPublished: true },
      select: { id: true },
    });
    created.courseId = course.id;
    const coupon = await db.coupon.create({
      data: { code: `${prefix.toUpperCase()}-SAVE`, discountPercent: DISCOUNT_PERCENT, usageLimit: ROUNDS * 2 },
      select: { id: true },
    });
    created.couponId = coupon.id;

    // The Stripe double: each create records its session, and each verify reports the recorded session as open.
    let counter = 0;
    provider.initiate.mockImplementation(async (params: { studentId: string; courseId: string; amount: number }) => {
      counter += 1;
      const id = `cs_conc_${prefix}_${counter}`;
      sessionsByLearner.set(params.studentId, (sessionsByLearner.get(params.studentId) ?? 0) + 1);
      sessionAmounts.set(id, { studentId: params.studentId, courseId: params.courseId, amount: params.amount });
      return { checkoutUrl: `https://checkout.example.test/${id}`, providerReference: id };
    });
    provider.verify.mockImplementation(async (providerReference: string) => {
      const session = sessionAmounts.get(providerReference);
      return {
        status: "PENDING",
        providerReference,
        amount: session?.amount ?? 0,
        currency: "usd",
        courseId: session?.courseId ?? null,
        studentId: session?.studentId ?? null,
        licenceTrack: "non-licensed",
      };
    });
  }, 120000);

  afterAll(async () => {
    if (!db) return;
    if (created.courseId) await db.payment.deleteMany({ where: { courseId: created.courseId } });
    if (created.couponId) await db.coupon.deleteMany({ where: { id: created.couponId } });
    if (created.courseId) await db.course.deleteMany({ where: { id: created.courseId } });
    if (created.categoryId) await db.category.deleteMany({ where: { id: created.categoryId } });
    await db.user.deleteMany({ where: { id: { in: [...created.learnerIds, ...(created.teacherId ? [created.teacherId] : [])] } } });
    await db.$disconnect?.();
  });

  it(`never leaves two PENDING rows or two Stripe sessions for one learner and course, over ${ROUNDS} races`, async () => {
    for (let round = 1; round <= ROUNDS; round += 1) {
      const learner = await db.user.create({
        data: { email: `${prefix}-learner-${round}@example.test`, passwordHash: "integration-test-not-a-login", fullName: `${prefix} learner ${round}`, role: "STUDENT", isEmailVerified: true },
        select: { id: true },
      });
      created.learnerIds.push(learner.id);
      const couponCode = `${prefix.toUpperCase()}-SAVE`;

      const results = await Promise.allSettled([
        initiateCheckout(created.courseId!, learner.id, couponCode),
        initiateCheckout(created.courseId!, learner.id, couponCode),
      ]);

      // Every request either gets the checkout URL or a 409 conflict. Nothing else is acceptable.
      for (const result of results) {
        if (result.status === "fulfilled") {
          expect(result.value).toMatchObject({ free: false });
          expect((result.value as { checkoutUrl: string }).checkoutUrl).toMatch(/^https:\/\/checkout\.example\.test\/cs_conc_/);
        } else {
          expect(result.reason).toMatchObject({ statusCode: 409 });
        }
      }
      expect(results.some((result) => result.status === "fulfilled")).toBe(true);

      // Exactly one session was created for this learner, and exactly one PENDING row points at it.
      expect(sessionsByLearner.get(learner.id)).toBe(1);
      const pending = await db.payment.findMany({ where: { studentId: learner.id, courseId: created.courseId!, status: "PENDING" } });
      expect(pending).toHaveLength(1);
      expect(pending[0].transactionId.startsWith("cs_conc_")).toBe(true);
    }

    // One reservation per learner, so the coupon counter is exactly the number of learners who got a session.
    const coupon = await db.coupon.findUnique({ where: { id: created.couponId! }, select: { redeemedCount: true } });
    expect(coupon?.redeemedCount).toBe(ROUNDS);
    expect(provider.initiate).toHaveBeenCalledTimes(ROUNDS);
  }, 120000);
});
