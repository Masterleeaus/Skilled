/**
 * Auth token hardening: refresh-token reuse revokes the whole rotation family, and email verification and
 * password reset tokens are stored only as SHA-256 hashes. Runs the real auth service against a hoisted Prisma
 * mock, the same way account-lifecycle.test.ts does.
 */
import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../utils/AppError";

const db = vi.hoisted(() => {
  const client = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return client;
});

vi.mock("../config/prisma", () => ({ prisma: db }));
vi.mock("../jobs/email.queue", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

import { sendResetPasswordEmail, sendVerificationEmail } from "../jobs/email.queue";
import {
  REFRESH_REUSE_GRACE_MS,
  forgotPassword,
  loginUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../modules/auth/auth.service";
import { hashToken } from "../modules/auth/token.utils";

const PASSWORD = "Password123!";
// Low cost keeps the suite fast. bcrypt.compare reads the cost from the hash, so the code under test is unchanged.
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);
const FUTURE = new Date(Date.now() + 60 * 60 * 1000);
const PAST = new Date(Date.now() - 60 * 60 * 1000);

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  isActive: boolean;
  isEmailVerified: boolean;
  deletedAt: Date | null;
};

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: "user-1",
    email: "learner@example.com",
    passwordHash: PASSWORD_HASH,
    fullName: "Learner",
    role: "STUDENT",
    isActive: true,
    isEmailVerified: true,
    deletedAt: null,
    ...overrides,
  };
}

/** A live, unrevoked refresh credential row in family fam-1, as the service reads it. */
function liveRefreshRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "rt-1",
    userId: "user-1",
    tokenHash: "stored-hash",
    familyId: "fam-1",
    deviceInfo: "test-device",
    isRevoked: false,
    expiresAt: FUTURE,
    user: userRow(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  // The transaction callback receives the same client, so writes inside it hit the same mocks.
  db.$transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work(db));
  db.refreshToken.updateMany.mockResolvedValue({ count: 0 });
  db.refreshToken.create.mockResolvedValue({ id: "rt-new" });
  db.user.updateMany.mockResolvedValue({ count: 1 });
});

describe("refresh-token reuse detection", () => {
  it("revokes the whole family when a credential that was already rotated is presented again", async () => {
    // Rotated well outside the grace window, so this is reuse. Reuse inside the window is covered below.
    db.refreshToken.findFirst.mockResolvedValue(
      liveRefreshRow({ isRevoked: true, replacedAt: new Date(Date.now() - 60 * 60 * 1000) }),
    );

    await expect(refreshAccessToken("retired-raw")).rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: hashToken("retired-raw") } }),
    );
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "fam-1", isRevoked: false },
      data: { isRevoked: true },
    });
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("revokes the family when a concurrent request loses the consume race", async () => {
    db.refreshToken.findFirst.mockResolvedValue(liveRefreshRow());
    db.refreshToken.updateMany.mockImplementation(async ({ where }: { where: { familyId?: string } }) =>
      where.familyId ? { count: 1 } : { count: 0 },
    );

    await expect(refreshAccessToken("raw")).rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.create).not.toHaveBeenCalled();
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "fam-1", isRevoked: false },
      data: { isRevoked: true },
    });
  });

  it("carries the family id forward when a credential rotates", async () => {
    db.refreshToken.findFirst.mockResolvedValue(liveRefreshRow());
    db.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await refreshAccessToken("raw");

    expect(result.refreshToken).toEqual(expect.any(String));
    expect(db.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", familyId: "fam-1", deviceInfo: "test-device" }),
    });
    // A successful rotation revokes nothing beyond the one consumed credential.
    expect(db.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });

  it("refuses an expired credential that was never rotated, without revoking anything", async () => {
    db.refreshToken.findFirst.mockResolvedValue(liveRefreshRow({ expiresAt: PAST }));

    await expect(refreshAccessToken("expired-raw")).rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("starts a separate family for each login", async () => {
    db.user.findUnique.mockResolvedValue(userRow());

    await loginUser({ email: "learner@example.com", password: PASSWORD }, "laptop");
    await loginUser({ email: "learner@example.com", password: PASSWORD }, "phone");

    const families = db.refreshToken.create.mock.calls.map(
      ([arg]) => (arg as { data: { familyId: string } }).data.familyId,
    );
    expect(families).toHaveLength(2);
    expect(families[0]).toEqual(expect.any(String));
    expect(families[0]).not.toBe(families[1]);
  });
});

describe("concurrent refresh grace window", () => {
  /** A credential rotated `agoMs` ago, so the row is revoked and carries replacedAt. */
  const rotatedRow = (agoMs: number, overrides: Record<string, unknown> = {}) =>
    liveRefreshRow({ isRevoked: true, replacedAt: new Date(Date.now() - agoMs), ...overrides });

  it("keeps the family and returns a valid session for a repeat inside the window", async () => {
    db.refreshToken.findFirst.mockResolvedValue(rotatedRow(1000));
    db.refreshToken.count.mockResolvedValue(1); // the first request's successor is still live

    const result = await refreshAccessToken("second-tab-raw");

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(db.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", familyId: "fam-1", deviceInfo: "test-device" }),
    });
    // No family revocation, and no consumption of the already-rotated row.
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("revokes the family when a rotated credential is presented after the window", async () => {
    db.refreshToken.findFirst.mockResolvedValue(rotatedRow(REFRESH_REUSE_GRACE_MS + 1000));

    await expect(refreshAccessToken("late-raw")).rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "fam-1", isRevoked: false },
      data: { isRevoked: true },
    });
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("does not revive a family that has no live credential left", async () => {
    db.refreshToken.findFirst.mockResolvedValue(rotatedRow(1000));
    db.refreshToken.count.mockResolvedValue(0);

    await expect(refreshAccessToken("second-tab-raw")).rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.create).not.toHaveBeenCalled();
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: "fam-1", isRevoked: false },
      data: { isRevoked: true },
    });
  });

  it("treats the loser of a same-moment consume race as a concurrent refresh inside the window", async () => {
    db.refreshToken.findFirst.mockResolvedValue(liveRefreshRow());
    db.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 }); // another request consumed the row first
    db.refreshToken.findUnique.mockResolvedValue({ replacedAt: new Date() }); // the winner just stamped it
    db.refreshToken.count.mockResolvedValue(1);

    const result = await refreshAccessToken("raced-raw");

    expect(result.refreshToken).toEqual(expect.any(String));
    expect(db.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(db.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ familyId: "fam-1" }),
    });
    expect(db.refreshToken.updateMany).toHaveBeenCalledTimes(1); // only the consume attempt, no family revoke
  });

  it("leaves a token from a different family unaffected by reuse in another family", async () => {
    // Reuse in fam-1 revokes fam-1 only.
    db.refreshToken.findFirst.mockResolvedValue(rotatedRow(REFRESH_REUSE_GRACE_MS + 1000));
    await expect(refreshAccessToken("fam-1-raw")).rejects.toThrow(UnauthorizedError);
    for (const [arg] of db.refreshToken.updateMany.mock.calls) {
      expect((arg as { where: { familyId?: string } }).where.familyId).toBe("fam-1");
    }

    // A live credential in fam-2 still rotates, into fam-2.
    db.refreshToken.updateMany.mockClear();
    db.refreshToken.create.mockClear();
    db.refreshToken.findFirst.mockResolvedValue(liveRefreshRow({ id: "rt-2", familyId: "fam-2", tokenHash: "h2" }));
    db.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });

    await refreshAccessToken("fam-2-raw");

    expect(db.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ familyId: "fam-2" }),
    });
    expect(db.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe("stored recovery tokens are not raw values", () => {
  it("stores a hash of the verification token and emails the raw value", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockImplementation(async ({ data }: { data: { email: string; fullName: string } }) => ({
      id: "user-2",
      email: data.email,
      fullName: data.fullName,
    }));

    await registerUser({ fullName: "New Learner", email: "new@example.com", password: PASSWORD, role: "STUDENT" } as never);

    const raw = vi.mocked(sendVerificationEmail).mock.calls[0][1] as string;
    const stored = (db.user.create.mock.calls[0][0] as { data: { emailVerifyToken: string } }).data.emailVerifyToken;
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).not.toBe(raw);
    expect(stored).toBe(`sha256:${hashToken(raw)}`);
  });

  it("stores a hash of the reset token and emails the raw value", async () => {
    db.user.findUnique.mockResolvedValue(userRow());

    await forgotPassword("learner@example.com");

    const raw = vi.mocked(sendResetPasswordEmail).mock.calls[0][1] as string;
    const stored = (db.user.update.mock.calls[0][0] as { data: { resetPasswordToken: string } }).data.resetPasswordToken;
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).not.toBe(raw);
    expect(stored).toBe(`sha256:${hashToken(raw)}`);
  });

  it("verifies an email with the emailed value and not with the stored hash", async () => {
    const raw = "a".repeat(64);
    const row = { id: "user-3", emailVerifyToken: `sha256:${hashToken(raw)}`, emailVerifyExpiresAt: FUTURE, isEmailVerified: false };
    db.user.findFirst.mockImplementation(async ({ where }: { where: { OR: { emailVerifyToken?: string; NOT?: unknown }[] } }) =>
      where.OR.some((c) => c.NOT === undefined && c.emailVerifyToken === row.emailVerifyToken) ? row : null,
    );
    db.user.updateMany.mockImplementation(async ({ where }: { where: { OR: { emailVerifyToken?: string; NOT?: unknown }[] } }) =>
      where.OR.some((c) => c.NOT === undefined && c.emailVerifyToken === row.emailVerifyToken) ? { count: 1 } : { count: 0 },
    );

    await expect(verifyEmail(row.emailVerifyToken)).rejects.toThrow("Invalid or expired verification token");
    await expect(verifyEmail(raw)).resolves.toBeUndefined();
  });

  it("resets a password with the emailed value and not with the stored hash", async () => {
    const raw = "b".repeat(64);
    const row = userRow({ id: "user-4" }) as UserRow & { resetPasswordToken: string; resetPasswordExpiresAt: Date };
    row.resetPasswordToken = `sha256:${hashToken(raw)}`;
    row.resetPasswordExpiresAt = FUTURE;
    db.user.findFirst.mockImplementation(async ({ where }: { where: { OR: { resetPasswordToken?: string; NOT?: unknown }[] } }) =>
      where.OR.some((c) => c.NOT === undefined && c.resetPasswordToken === row.resetPasswordToken) ? row : null,
    );
    db.user.updateMany.mockImplementation(async ({ where }: { where: { OR: { resetPasswordToken?: string; NOT?: unknown }[] } }) =>
      where.OR.some((c) => c.NOT === undefined && c.resetPasswordToken === row.resetPasswordToken) ? { count: 1 } : { count: 0 },
    );

    await expect(resetPassword(row.resetPasswordToken, "NewPassword123!")).rejects.toThrow("Invalid or expired reset token");
    await expect(resetPassword(raw, "NewPassword123!")).resolves.toBeUndefined();
  });
});
