/**
 * Verification and reset tokens are stored as SHA-256 digests (prefixed "sha256:"). The emailed value is the only
 * copy of the raw token, so a database reader who sees the stored value cannot use it as a link. Legacy rows, which
 * hold the raw token with no prefix, still work until they expire, so links sent before the change are not stranded.
 */
import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const client = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    refreshToken: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work(client));
  return client;
});

const mail = vi.hoisted(() => ({ sendVerificationEmail: vi.fn(), sendResetPasswordEmail: vi.fn() }));

vi.mock("../config/prisma", () => ({ prisma: db }));
vi.mock("../jobs/email.queue", () => mail);

import { forgotPassword, registerUser, resetPassword, verifyEmail } from "../modules/auth/auth.service";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
const digestForm = (value: string) => `sha256:${sha256(value)}`;

type Where = Record<string, unknown>;

/**
 * Evaluates the token condition the service sends for one column, the way the database would: a branch matches when
 * the stored value equals the branch value and the branch's NOT clause does not exclude it.
 */
function columnMatches(where: Where, column: string, stored: string | null): boolean {
  if (stored === null) return false;
  const branches = Array.isArray(where.OR) ? (where.OR as Where[]) : [where];
  return branches.some((branch) => {
    if (!(column in branch)) return false;
    const not = branch.NOT as Record<string, { startsWith: string }> | undefined;
    if (not?.[column] && stored.startsWith(not[column].startsWith)) return false;
    return branch[column] === stored;
  });
}

/** Simulates one users row whose token column holds `storedValue`. */
function fakeUserTable(column: "emailVerifyToken" | "resetPasswordToken", storedValue: string) {
  const row = { id: "user-1", email: "learner@example.com", deletedAt: null };
  db.user.findFirst.mockImplementation(async ({ where }: { where: Where }) =>
    columnMatches(where, column, storedValue) ? row : null,
  );
  db.user.updateMany.mockImplementation(async ({ where }: { where: Where }) => ({
    count: columnMatches(where, column, storedValue) ? 1 : 0,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  db.user.findUnique.mockResolvedValue(null);
  db.user.create.mockImplementation(async ({ data }: { data: { email: string } }) => ({ id: "user-1", email: data.email, fullName: "L" }));
  db.user.update.mockResolvedValue({});
  db.refreshToken.updateMany.mockResolvedValue({ count: 0 });
});

describe("email verification token storage", () => {
  it("stores the digest and sends the raw token", async () => {
    await registerUser({ email: "learner@example.com", password: "Password123!", fullName: "Learner" } as never);

    const stored = db.user.create.mock.calls[0][0].data.emailVerifyToken as string;
    const [, emailed] = mail.sendVerificationEmail.mock.calls[0] as [string, string];

    expect(emailed).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).toBe(digestForm(emailed));
    expect(stored).not.toContain(emailed);
  });

  it("verifies with the emailed token", async () => {
    await registerUser({ email: "learner@example.com", password: "Password123!", fullName: "Learner" } as never);
    const [, emailed] = mail.sendVerificationEmail.mock.calls[0] as [string, string];
    fakeUserTable("emailVerifyToken", digestForm(emailed));

    await expect(verifyEmail(emailed)).resolves.toBeUndefined();
    expect(db.user.updateMany.mock.calls[0][0].data).toMatchObject({ isEmailVerified: true, emailVerifyToken: null });
  });

  it("refuses the stored digest, which is not a usable token", async () => {
    const raw = "a".repeat(64);
    fakeUserTable("emailVerifyToken", digestForm(raw));

    await expect(verifyEmail(digestForm(raw))).rejects.toThrow("Invalid or expired verification token");
    await expect(verifyEmail(sha256(raw))).rejects.toThrow("Invalid or expired verification token");
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("still verifies a legacy row that holds the raw token, so links sent before the change keep working", async () => {
    const raw = "d".repeat(64);
    fakeUserTable("emailVerifyToken", raw);

    await expect(verifyEmail(raw)).resolves.toBeUndefined();
  });
});

describe("password reset token storage", () => {
  it("stores only the digest of the emailed reset token", async () => {
    db.user.findUnique.mockResolvedValue({ id: "user-1", email: "learner@example.com", deletedAt: null });

    await forgotPassword("learner@example.com");

    const stored = db.user.update.mock.calls[0][0].data.resetPasswordToken as string;
    const [, emailed] = mail.sendResetPasswordEmail.mock.calls[0] as [string, string];
    expect(stored).toBe(digestForm(emailed));
    expect(stored).not.toContain(emailed);
  });

  it("resets the password with the emailed token and clears the stored digest", async () => {
    const raw = "b".repeat(64);
    fakeUserTable("resetPasswordToken", digestForm(raw));

    await resetPassword(raw, "NewPassword123!");

    expect(db.user.updateMany.mock.calls[0][0].data).toMatchObject({ resetPasswordToken: null });
    expect(db.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });

  it("refuses the stored digest as a reset token", async () => {
    const raw = "c".repeat(64);
    fakeUserTable("resetPasswordToken", digestForm(raw));

    await expect(resetPassword(digestForm(raw), "NewPassword123!")).rejects.toThrow("Invalid or expired reset token");
    await expect(resetPassword(sha256(raw), "NewPassword123!")).rejects.toThrow("Invalid or expired reset token");
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("still resets with a legacy raw-token row that has not expired", async () => {
    const raw = "e".repeat(64);
    fakeUserTable("resetPasswordToken", raw);

    await resetPassword(raw, "NewPassword123!");
    expect(db.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });
});
