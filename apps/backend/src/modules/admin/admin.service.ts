import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { recordAuditLog } from "../audit/audit.service";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import type { ListUsersQuery } from "./admin.validators";

export async function listUsers(query: ListUsersQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Prisma.UserWhereInput = {
    ...(query.role && { role: query.role }),
    ...(query.search && {
      OR: [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: buildPaginationMeta(total, page, limit) };
}

export async function updateUserRole(targetUserId: string, newRole: Role, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError("User");
  if (user.id === adminId) throw new AppError("You cannot change your own role", 400);
  if (newRole === "ADMIN") {
    throw new AppError("Promoting users to Admin is not allowed. The system keeps a single Admin account.", 400);
  }

  const updated = await prisma.user.update({ where: { id: targetUserId }, data: { role: newRole } });

  await recordAuditLog({
    userId: adminId,
    action: "ROLE_CHANGED",
    entity: "User",
    entityId: targetUserId,
    oldValue: { role: user.role },
    newValue: { role: newRole },
  });

  return updated;
}

export async function toggleUserActive(targetUserId: string, isActive: boolean, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError("User");
  if (user.id === adminId) throw new AppError("You cannot deactivate your own account", 400);

  const updated = await prisma.user.update({ where: { id: targetUserId }, data: { isActive } });

  await recordAuditLog({
    userId: adminId,
    action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entity: "User",
    entityId: targetUserId,
    oldValue: { isActive: user.isActive },
    newValue: { isActive },
  });

  return updated;
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("User");

  if (user.role === "TEACHER") {
    const courses = await prisma.course.findMany({
      where: { teacherId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { ...user, courses };
  }

  if (user.role === "STUDENT") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      select: {
        id: true,
        progressPercentage: true,
        status: true,
        enrolledAt: true,
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });
    return { ...user, enrollments };
  }

  return user;
}

export const USER_DELETION_POLICY = "soft-deleted; history retained";

/**
 * Deletion policy: soft deletion only. Users own historical rows (audit logs, payments, enrolments,
 * submissions, certificates, assignments, external identities, competencies) that must stay attributable,
 * so this function never issues a hard delete and never cascades into those rows. It sets deletedAt and
 * isActive=false, revokes every refresh token the user holds, and writes an audit entry, all in one transaction.
 *
 * Deleting an already-deleted user is a 404. The conditional update guards against two admins racing.
 *
 * Any irreversible purge is a separate, guarded process (retention review, export first, explicit
 * approval). It is deliberately not reachable from this endpoint.
 */
export async function deleteUser(targetUserId: string, adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user || user.deletedAt) throw new NotFoundError("User");
  if (user.id === adminId) throw new AppError("You cannot delete your own account", 400);

  const deletedAt = new Date();
  await prisma.$transaction(async (tx) => {
    const marked = await tx.user.updateMany({
      where: { id: targetUserId, deletedAt: null },
      data: { deletedAt, isActive: false },
    });
    if (marked.count !== 1) throw new NotFoundError("User");

    await tx.refreshToken.updateMany({
      where: { userId: targetUserId, isRevoked: false },
      data: { isRevoked: true },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "USER_SOFT_DELETED",
        entity: "User",
        entityId: targetUserId,
        oldValue: { email: user.email, role: user.role, isActive: user.isActive, deletedAt: null },
        newValue: { deletedAt: deletedAt.toISOString(), isActive: false, policy: USER_DELETION_POLICY },
      },
    });
  });

  return { id: targetUserId, deletedAt, isActive: false, policy: USER_DELETION_POLICY };
}
