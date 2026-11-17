/**
 * Self-service resend of the email verification link. Runs the real auth service and route against the same kind
 * of hoisted Prisma mock as auth-token-hardening.test.ts. Route tests reload the router per test so the in-memory
 * rate-limit counters start empty.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  refreshToken: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../config/prisma", () => ({ prisma: db }));
vi.mock("../jobs/email.queue", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

import { sendVerificationEmail } from "../jobs/email.queue";
import { resendVerificationEmail, verifyEmail } from "../modules/auth/auth.service";
import { hashToken } from "../modules/auth/token.utils";
import { errorHandler } from "../middleware/errorHandler";

const DAY_MS = 24 * 60 * 60 * 1000;

type Row = {
  id: string;
  email: string;
  isEmailVerified: boolean;
  deletedAt: Date | null;
  emailVerifyToken: string | null;
  emailVerifyExpiresAt: Date | null;
};

function unverifiedRow(overrides: Partial<Row> = {}): Row {
  return {
    id: "user-1",
    email: "pending@example.com",
    isEmailVerified: false,
    deletedAt: null,
    emailVerifyToken: null,
    emailVerifyExpiresAt: null,
    ...overrides,
  };
}

/** Matches the subset of Prisma where-clauses the verification queries use: equality and a gt on dates. */
function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return (value as Record<string, unknown>[]).some((clause) => matches(row, clause));
    if (key === "NOT") return !matches(row, value as Record<string, unknown>);
    if (value && typeof value === "object" && "startsWith" in value) {
      const current = row[key as keyof Row];
      return typeof current === "string" && current.startsWith((value as { startsWith: string }).startsWith);
    }
    if (value && typeof value === "object" && "gt" in value) {
      const current = row[key as keyof Row];
      return current instanceof Date && current > (value as { gt: Date }).gt;
    }
    return row[key as keyof Row] === value;
  });
}

/** Backs the user mocks with one in-memory row, so writes made by the service are visible to later reads. */
function backWithRow(row: Row) {
  db.user.findUnique.mockImplementation(async ({ where }: { where: { email?: string; id?: string } }) =>
    matches(row, where) ? { ...row } : null,
  );
  db.user.findFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) =>
    matches(row, where) ? { ...row } : null,
  );
  db.user.update.mockImplementation(async ({ data }: { data: Partial<Row> }) => {
    Object.assign(row, data);
    return { ...row };
  });
  db.user.updateMany.mockImplementation(async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
    if (!matches(row, where)) return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  });
  return row;
}

async function freshRouteApp() {
  vi.resetModules();
  const [{ default: authRoutes }, mail] = await Promise.all([
    import("../modules/auth/auth.routes"),
    import("../jobs/email.queue"),
  ]);
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(errorHandler);
  return { app, sendVerificationEmail: mail.sendVerificationEmail as unknown as ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work(db));
});

describe("resendVerificationEmail (service)", () => {
  it("does nothing for an unknown email", async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(resendVerificationEmail("nobody@example.com")).resolves.toBeUndefined();

    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("issues no token and sends no email for a verified account", async () => {
    db.user.findUnique.mockResolvedValue(unverifiedRow({ isEmailVerified: true }));

    await resendVerificationEmail("pending@example.com");

    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("issues no token and sends no email for a deleted account", async () => {
    db.user.findUnique.mockResolvedValue(unverifiedRow({ deletedAt: new Date() }));

    await resendVerificationEmail("pending@example.com");

    expect(db.user.update).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("stores only the hash of a new 24-hour token and emails the raw value", async () => {
    const row = backWithRow(unverifiedRow());
    const before = Date.now();

    await resendVerificationEmail("pending@example.com");

    const raw = vi.mocked(sendVerificationEmail).mock.calls[0][1] as string;
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(row.emailVerifyToken).not.toBe(raw);
    expect(row.emailVerifyToken).toBe(`sha256:${hashToken(raw)}`);
    expect(row.emailVerifyExpiresAt!.getTime()).toBeGreaterThanOrEqual(before + DAY_MS);
    expect(row.emailVerifyExpiresAt!.getTime()).toBeLessThanOrEqual(Date.now() + DAY_MS);
    expect(vi.mocked(sendVerificationEmail).mock.calls[0][0]).toBe("pending@example.com");
  });

  it("makes the previous link stop working once a new one is issued", async () => {
    const row = backWithRow(unverifiedRow());

    await resendVerificationEmail("pending@example.com");
    const first = vi.mocked(sendVerificationEmail).mock.calls[0][1] as string;
    await resendVerificationEmail("pending@example.com");
    const second = vi.mocked(sendVerificationEmail).mock.calls[1][1] as string;
    expect(second).not.toBe(first);

    await expect(verifyEmail(first)).rejects.toThrow("Invalid or expired verification token");
    await expect(verifyEmail(second)).resolves.toBeUndefined();
    expect(row.isEmailVerified).toBe(true);
  });

  it("does not fail the caller when enqueueing the email fails, and logs no address or token", async () => {
    const row = backWithRow(unverifiedRow());
    const enqueueError = new Error("redis unavailable");
    enqueueError.name = "RedisError";
    vi.mocked(sendVerificationEmail).mockRejectedValueOnce(enqueueError);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(resendVerificationEmail("pending@example.com")).resolves.toBeUndefined();

    const raw = vi.mocked(sendVerificationEmail).mock.calls[0][1] as string;
    expect(row.emailVerifyToken).toBe(`sha256:${hashToken(raw)}`);
    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(logged).not.toContain(raw);
    expect(logged).not.toContain("pending@example.com");
    errorSpy.mockRestore();
  });
});

describe("POST /api/auth/resend-verification (route)", () => {
  it("answers unknown, verified and unverified emails with the same status and body", async () => {
    const { app, sendVerificationEmail: sendMail } = await freshRouteApp();
    db.user.findUnique.mockImplementation(async ({ where }: { where: { email: string } }) => {
      if (where.email === "verified@example.com") return unverifiedRow({ email: where.email, isEmailVerified: true });
      if (where.email === "pending@example.com") return unverifiedRow({ email: where.email });
      return null;
    });
    db.user.update.mockResolvedValue({});

    const unknown = await request(app).post("/api/auth/resend-verification").send({ email: "nobody@example.com" });
    const verified = await request(app).post("/api/auth/resend-verification").send({ email: "verified@example.com" });
    const pending = await request(app).post("/api/auth/resend-verification").send({ email: "pending@example.com" });

    expect(unknown.status).toBe(202);
    expect(verified.status).toBe(202);
    expect(pending.status).toBe(202);
    expect(verified.body).toEqual(unknown.body);
    expect(pending.body).toEqual(unknown.body);
    expect(unknown.body).toEqual({
      success: true,
      message: "If that account is awaiting verification, a new link has been sent",
      data: null,
    });
    // Only the unverified account caused a send.
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toBe("pending@example.com");
  });

  it("rejects a malformed email before any lookup", async () => {
    const { app } = await freshRouteApp();

    const res = await request(app).post("/api/auth/resend-verification").send({ email: "not-an-email" });

    // Validation failures use the app's error handler, which maps zod errors to 422.
    expect(res.status).toBe(422);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("limits repeat requests for one address to 3 an hour, while other addresses are still served", async () => {
    const { app } = await freshRouteApp();
    db.user.findUnique.mockResolvedValue(null);
    const ask = (email: string) => request(app).post("/api/auth/resend-verification").send({ email });

    expect((await ask("pending@example.com")).status).toBe(202);
    expect((await ask("Pending@Example.com")).status).toBe(202);
    expect((await ask("pending@example.com")).status).toBe(202);
    const blocked = await ask("pending@example.com");
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect((await ask("other@example.com")).status).toBe(202);
  });

  it("limits all requests from one IP to 5 per window", async () => {
    const { app } = await freshRouteApp();
    db.user.findUnique.mockResolvedValue(null);
    const ask = (email: string) => request(app).post("/api/auth/resend-verification").send({ email });

    for (let i = 0; i < 5; i += 1) {
      expect((await ask(`person${i}@example.com`)).status).toBe(202);
    }
    expect((await ask("person5@example.com")).status).toBe(429);
  });
});
