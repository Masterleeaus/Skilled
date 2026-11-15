/**
 * Refresh-token rotation and replay. A rotated token that is presented again means a copy exists outside the
 * device that rotated it, so every live refresh credential of that user is revoked. A logged-out token presented
 * again is refused without revoking anything, because logout is not a rotation.
 */
import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../utils/AppError";

const db = vi.hoisted(() => {
  const client = {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    refreshToken: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) => work(client));
  return client;
});

vi.mock("../config/prisma", () => ({ prisma: db }));
vi.mock("../jobs/email.queue", () => ({ sendVerificationEmail: vi.fn(), sendResetPasswordEmail: vi.fn() }));

import { refreshAccessToken } from "../modules/auth/auth.service";
import { hashToken } from "../modules/auth/token.utils";

const RAW = "presented-refresh-token";
const user = {
  id: "user-1",
  email: "learner@example.com",
  passwordHash: bcrypt.hashSync("unused", 4),
  fullName: "Learner",
  role: "STUDENT" as const,
  isActive: true,
  isEmailVerified: true,
  deletedAt: null,
};

function storedRow(overrides: Partial<{ isRevoked: boolean; replacedAt: Date | null; expiresAt: Date }> = {}) {
  return {
    id: "rt-1",
    userId: user.id,
    tokenHash: hashToken(RAW),
    deviceInfo: "laptop",
    isRevoked: false,
    replacedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user,
    ...overrides,
  };
}

const revokeAllCall = { where: { userId: user.id, isRevoked: false }, data: { isRevoked: true } };

beforeEach(() => {
  vi.clearAllMocks();
  db.refreshToken.updateMany.mockResolvedValue({ count: 0 });
  db.refreshToken.create.mockResolvedValue({ id: "rt-new" });
});

describe("refresh token replay", () => {
  it("revokes every live refresh token of the user when a rotated token is presented again", async () => {
    db.refreshToken.findFirst.mockResolvedValue(
      storedRow({ isRevoked: true, replacedAt: new Date(Date.now() - 1000) }),
    );

    await expect(refreshAccessToken(RAW)).rejects.toThrow(UnauthorizedError);

    expect(db.refreshToken.updateMany).toHaveBeenCalledWith(revokeAllCall);
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("revokes the family even when the replayed token has already expired", async () => {
    db.refreshToken.findFirst.mockResolvedValue(
      storedRow({ isRevoked: true, replacedAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(refreshAccessToken(RAW)).rejects.toThrow("Invalid or expired refresh token");
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith(revokeAllCall);
  });

  it("refuses a logged-out token without revoking the user's other sessions", async () => {
    db.refreshToken.findFirst.mockResolvedValue(storedRow({ isRevoked: true, replacedAt: null }));

    await expect(refreshAccessToken(RAW)).rejects.toThrow("Invalid or expired refresh token");
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });

  it("refuses an expired, unrotated token without revoking anything", async () => {
    db.refreshToken.findFirst.mockResolvedValue(storedRow({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(refreshAccessToken(RAW)).rejects.toThrow("Invalid or expired refresh token");
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("refuses an unknown token without revoking anything", async () => {
    db.refreshToken.findFirst.mockResolvedValue(null);

    await expect(refreshAccessToken(RAW)).rejects.toThrow("Invalid or expired refresh token");
    expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("rotates a valid token and records when the old one was replaced", async () => {
    db.refreshToken.findFirst.mockResolvedValue(storedRow());
    db.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await refreshAccessToken(RAW);

    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe(RAW);
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: "rt-1", tokenHash: hashToken(RAW), isRevoked: false }),
      data: { isRevoked: true, replacedAt: expect.any(Date) },
    });
    expect(db.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(db.refreshToken.updateMany).not.toHaveBeenCalledWith(revokeAllCall);
  });

  it("does not revoke the family when a concurrent rotation already consumed the token", async () => {
    db.refreshToken.findFirst.mockResolvedValue(storedRow());
    db.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(refreshAccessToken(RAW)).rejects.toThrow("Refresh token already used");
    expect(db.refreshToken.updateMany).toHaveBeenCalledTimes(1);
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  });
});
