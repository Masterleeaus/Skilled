/**
 * Account lifecycle: deleted accounts get no new tokens, refresh credentials of deleted accounts are revoked,
 * and admin deletion is a soft delete that keeps history. Runs the real auth and admin services against a
 * small hoisted Prisma mock (the shared fake does not model the refresh token to user relation).
 */
import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, UnauthorizedError } from "../utils/AppError";

const db = vi.hoisted(() => {
  const client = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    refreshToken: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  // The transaction callback receives the same client, so writes inside it hit the same mocks.
  client.$transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work(client));
  return client;
});

vi.mock("../config/prisma", () => ({ prisma: db }));
vi.mock("../jobs/email.queue", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

import { sendResetPasswordEmail } from "../jobs/email.queue";
import { loginUser, refreshAccessToken, forgotPassword, resetPassword } from "../modules/auth/auth.service";
import { deleteUser, USER_DELETION_POLICY } from "../modules/admin/admin.service";

const PASSWORD = "Password123!";
// Low cost keeps the suite fast. bcrypt.compare reads the cost from the hash, so the code under test is unchanged.
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);
const ADMIN_ID = "admin-1";

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

function storedRefreshToken(user: UserRow) {
  return { id: "rt-1", userId: user.id, tokenHash: "hash", deviceInfo: "test", user };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.refreshToken.updateMany.mockResolvedValue({ count: 0 });
  db.refreshToken.create.mockResolvedValue({ id: "rt-new" });
  db.user.updateMany.mockResolvedValue({ count: 1 });
  db.auditLog.create.mockResolvedValue({ id: "audit-1" });
});

describe("login eligibility", () => {
  it("rejects a soft-deleted user with a correct password and issues no tokens", async () => {
    db.user.findUnique.mockResolvedValue(userRow({ deletedAt: new Date("2026-01-01") }));

    await expect(loginUser({ email: "learner@example.com", password: PASSWORD })).rejects.toThrow(UnauthorizedError);
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("still logs in an active, verified, non-deleted user", async () => {
    db.user.findUnique.mockResolvedValue(userRow());

    const result = await loginUser({ email: "learner@example.com", password: PASSWORD }, "laptop");

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.id).toBe("user-1");
    expect(db.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it("keeps rejecting deactivated and unverified users", async () => {
    db.user.findUnique.mockResolvedValueOnce(userRow({ isActive: false }));
    await expect(loginUser({ email: "learner@example.com", password: PASSWORD })).rejects.toThrow("Account is deactivated");

    db.user.findUnique.mockResolvedValueOnce(userRow({ isEmailVerified: false }));
    await expect(loginUser({ email: "learner@example.com", password: PASSWORD })).rejects.toThrow(/verify/i);
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe("refresh eligibility", () => {
  it("rejects a refresh token whose owner is soft-deleted and revokes that user's live tokens", async () => {
    const deleted = userRow({ deletedAt: new Date("2026-01-01") });
    db.refreshToken.findFirst.mockResolvedValue(storedRefreshToken(deleted));

    await expect(refreshAccessToken("raw-token")).rejects.toThrow("Invalid or expired refresh token");
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isRevoked: false },
      data: { isRevoked: true },
    });
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects a deactivated user without revoking, as before", async () => {
    db.refreshToken.findFirst.mockResolvedValue(storedRefreshToken(userRow({ isActive: false })));

    await expect(refreshAccessToken("raw-token")).rejects.toThrow(UnauthorizedError);
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rotates the refresh token for an active, verified, non-deleted user", async () => {
    db.refreshToken.findFirst.mockResolvedValue(storedRefreshToken(userRow()));
    db.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await refreshAccessToken("raw-token");

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(db.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it("rejects an unknown refresh token", async () => {
    db.refreshToken.findFirst.mockResolvedValue(null);

    await expect(refreshAccessToken("unknown")).rejects.toThrow("Invalid or expired refresh token");
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});

describe("password reset eligibility", () => {
  it("sends no reset email to a soft-deleted account", async () => {
    db.user.findUnique.mockResolvedValue(userRow({ deletedAt: new Date("2026-01-01") }));

    await forgotPassword("learner@example.com");

    expect(db.user.update).not.toHaveBeenCalled();
    expect(sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  it("refuses to consume a reset token for a soft-deleted account", async () => {
    db.user.findFirst.mockResolvedValue(userRow({ deletedAt: new Date("2026-01-01") }));

    await expect(resetPassword("reset-token", "NewPassword123!")).rejects.toThrow("Invalid or expired reset token");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("admin deleteUser (soft deletion)", () => {
  it("sets deletedAt and isActive=false, revokes refresh tokens and writes an audit record", async () => {
    db.user.findUnique.mockResolvedValue(userRow());
    db.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const result = await deleteUser("user-1", ADMIN_ID);

    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", deletedAt: null },
      data: { deletedAt: expect.any(Date), isActive: false },
    });
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isRevoked: false },
      data: { isRevoked: true },
    });
    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: ADMIN_ID,
        action: "USER_SOFT_DELETED",
        entity: "User",
        entityId: "user-1",
        newValue: expect.objectContaining({ isActive: false, policy: "soft-deleted; history retained" }),
      }),
    });
    expect(result).toEqual({
      id: "user-1",
      deletedAt: expect.any(Date),
      isActive: false,
      policy: USER_DELETION_POLICY,
    });
  });

  it("makes no hard delete call and never touches historical rows", async () => {
    db.user.findUnique.mockResolvedValue(userRow());

    await deleteUser("user-1", ADMIN_ID);

    expect(db.user.delete).not.toHaveBeenCalled();
    expect(db.user.deleteMany).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("treats deleting an already-deleted user as not found and writes nothing", async () => {
    db.user.findUnique.mockResolvedValue(userRow({ deletedAt: new Date("2026-01-01") }));

    await expect(deleteUser("user-1", ADMIN_ID)).rejects.toThrow(NotFoundError);
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it("does not write an audit record when a concurrent delete already marked the user", async () => {
    db.user.findUnique.mockResolvedValue(userRow());
    db.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(deleteUser("user-1", ADMIN_ID)).rejects.toThrow(NotFoundError);
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });

  it("returns not found for a missing user", async () => {
    db.user.findUnique.mockResolvedValue(null);

    await expect(deleteUser("missing", ADMIN_ID)).rejects.toThrow(NotFoundError);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("refuses to delete the caller's own account", async () => {
    db.user.findUnique.mockResolvedValue(userRow({ id: ADMIN_ID, role: "ADMIN" }));

    await expect(deleteUser(ADMIN_ID, ADMIN_ID)).rejects.toThrow("You cannot delete your own account");
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });
});
