import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { AppError, UnauthorizedError, NotFoundError } from "../../utils/AppError";
import {
  signAccessToken,
  generateRefreshToken,
  generateFamilyId,
  hashToken,
  generateShortToken,
  refreshExpiryDate,
} from "./token.utils";
import type { RegisterInput, LoginInput } from "./auth.validators";
import { sendVerificationEmail, sendResetPasswordEmail } from "../../jobs/email.queue";

const SALT_ROUNDS = 12;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

/** The fields every token-issuing path reads. Matches the columns checked by authenticate middleware. */
export interface AccountEligibilityFields {
  deletedAt: Date | null;
  isActive: boolean;
  isEmailVerified: boolean;
}

/**
 * Single eligibility rule for login, refresh and password reset. A soft-deleted account is never eligible,
 * even if it is still active and verified: soft deletion keeps the row, so these flags alone do not exclude it.
 */
export function isAccountEligible(user: AccountEligibilityFields): boolean {
  return !user.deletedAt && user.isActive && user.isEmailVerified;
}

/** Throws the caller-facing error for an ineligible account. Deleted accounts report as deactivated so deletion is not disclosed. */
export function assertAccountEligible(user: AccountEligibilityFields): void {
  if (user.deletedAt || !user.isActive) throw new UnauthorizedError("Account is deactivated");
  if (!user.isEmailVerified) throw new UnauthorizedError("Please verify your email first");
}

/** Revokes every live refresh credential the user holds. */
async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

/** Revokes every live credential in one rotation chain. Used when a retired credential is presented again. */
async function revokeRefreshFamily(familyId: string) {
  await prisma.refreshToken.updateMany({
    where: { familyId, isRevoked: false },
    data: { isRevoked: true },
  });
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const emailVerifyToken = generateShortToken();

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: "STUDENT",
      emailVerifyToken: hashToken(emailVerifyToken),
      emailVerifyExpiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  });

  await sendVerificationEmail(user.email, emailVerifyToken);

  return { id: user.id, email: user.email, fullName: user.fullName };
}

export async function verifyEmail(token: string) {
  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: tokenHash, emailVerifyExpiresAt: { gt: new Date() } },
  });
  if (!user) throw new AppError("Invalid or expired verification token", 400);

  const consumed = await prisma.user.updateMany({
    where: { id: user.id, emailVerifyToken: tokenHash, emailVerifyExpiresAt: { gt: new Date() } },
    data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiresAt: null },
  });
  if (consumed.count !== 1) throw new AppError("Invalid or expired verification token", 400);
}

/**
 * Issues a fresh verification token for an unverified account. Writing the new hash over the single stored column
 * is what invalidates the previous link. Returns nothing: the caller answers the same way whatever happened here.
 */
export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Unknown, deleted and already verified accounts get no token and no email.
  if (!user || user.deletedAt || user.isEmailVerified) return;

  const verifyToken = generateShortToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: hashToken(verifyToken),
      emailVerifyExpiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  });

  try {
    await sendVerificationEmail(user.email, verifyToken);
  } catch (err) {
    // The token is already stored, so a retry can succeed. Log the error type only, never the address or token.
    console.error("resend-verification: email enqueue failed", err instanceof Error ? err.name : "unknown");
  }
}

export async function loginUser(input: LoginInput, deviceInfo?: string) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) throw new UnauthorizedError("Invalid email or password");

  assertAccountEligible(user);

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const { raw: refreshTokenRaw, hash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      familyId: generateFamilyId(),
      deviceInfo: deviceInfo ?? "unknown",
      expiresAt: refreshExpiryDate(),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenRaw,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  };
}

/**
 * Rotate refresh credentials on each use. Every credential in a rotation chain shares a familyId. A credential
 * that was already rotated away is being presented again: that is reuse, so the whole family is revoked. A stolen
 * copy then cannot keep a session alive alongside the legitimate one.
 */
export async function refreshAccessToken(refreshTokenRaw: string) {
  const hash = hashToken(refreshTokenRaw);
  // Revoked rows are matched too: finding one here is reuse, not an ordinary miss.
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: hash },
    include: { user: true },
  });

  if (!stored) throw new UnauthorizedError("Invalid or expired refresh token");
  if (stored.isRevoked) {
    await revokeRefreshFamily(stored.familyId);
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
  if (stored.expiresAt <= new Date()) throw new UnauthorizedError("Invalid or expired refresh token");
  if (!isAccountEligible(stored.user)) {
    // A deleted account keeps no live sessions. Revoke what it holds, then refuse.
    if (stored.user.deletedAt) await revokeAllRefreshTokens(stored.userId);
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const { raw: rotatedToken, hash: rotatedHash } = generateRefreshToken();
  // The conditional write is our replay guard: concurrent requests cannot
  // both consume the same credential. Creation is in the same transaction so
  // a failed insert does not revoke an otherwise valid session. A request that
  // loses the race has presented a credential that was just rotated, which is
  // reuse. The family is revoked after the transaction returns, because a throw
  // inside it would roll the revocation back.
  const outcome = await prisma.$transaction(async (tx) => {
    const consumed = await tx.refreshToken.updateMany({
      where: { id: stored.id, tokenHash: hash, isRevoked: false, expiresAt: { gt: new Date() } },
      data: { isRevoked: true },
    });
    if (consumed.count !== 1) return "reused" as const;
    await tx.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: rotatedHash,
        familyId: stored.familyId,
        deviceInfo: stored.deviceInfo,
        expiresAt: refreshExpiryDate(),
      },
    });
    return "rotated" as const;
  });

  if (outcome === "reused") {
    await revokeRefreshFamily(stored.familyId);
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  return {
    accessToken: signAccessToken({ userId: stored.user.id, role: stored.user.role }),
    refreshToken: rotatedToken,
  };
}

// Logout single device — only revokes the session tied to this refresh token
export async function logoutDevice(refreshTokenRaw: string) {
  const hash = hashToken(refreshTokenRaw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash },
    data: { isRevoked: true },
  });
}

// Logout all devices — revokes every session for the user
export async function logoutAllDevices(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the email exists — always respond as success upstream.
  // Soft-deleted accounts get no reset link.
  if (!user || user.deletedAt) return;

  const resetToken = generateShortToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashToken(resetToken),
      resetPasswordExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  await sendResetPasswordEmail(user.email, resetToken);
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: tokenHash, resetPasswordExpiresAt: { gt: new Date() } },
  });
  if (!user || user.deletedAt) throw new AppError("Invalid or expired reset token", 400);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.user.updateMany({
      where: { id: user.id, deletedAt: null, resetPasswordToken: tokenHash, resetPasswordExpiresAt: { gt: new Date() } },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
    if (consumed.count !== 1) throw new AppError("Invalid or expired reset token", 400);
    // Revoke all sessions only after the password update successfully consumes the token.
    await tx.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });
  });
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function updateProfile(userId: string, input: { fullName?: string; avatarUrl?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });
}
