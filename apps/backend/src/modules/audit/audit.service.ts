import { prisma } from "../../config/prisma";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";

interface AuditLogInput {
  userId: string;
  action: string; // e.g. "USER_DELETED", "ROLE_CHANGED", "COURSE_PUBLISHED"
  entity: string; // e.g. "User", "Course"
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

// Fire-and-forget style — callers await it but a failure here should never
// block the actual business operation. Call this AFTER the operation succeeds.
export async function recordAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      oldValue: input.oldValue ? JSON.parse(JSON.stringify(input.oldValue)) : undefined,
      newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : undefined,
    },
  });
}

interface ListAuditLogQuery {
  page?: number;
  limit?: number;
  entity?: string;
  userId?: string;
  action?: string;
}

export async function listAuditLogs(query: ListAuditLogQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where = {
    ...(query.entity && { entity: query.entity }),
    ...(query.userId && { userId: query.userId }),
    ...(query.action && { action: query.action }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, pagination: buildPaginationMeta(total, page, limit) };
}
