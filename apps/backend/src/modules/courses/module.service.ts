import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "./course.service";
import type { CreateModuleInput } from "./module.validators";

export async function createModule(
  courseId: string,
  input: CreateModuleInput,
  userId: string,
  role: Role,
) {
  await assertCourseOwnership(courseId, userId, role);

  const orderIndex =
    input.orderIndex ??
    (await prisma.module.count({ where: { courseId } })); // append at end by default

  return prisma.module.create({
    data: { courseId, title: input.title, orderIndex },
  });
}

export async function listModules(courseId: string) {
  // Public module listings must not bypass the published-course gate.
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { isPublished: true, deletedAt: true },
  });
  if (!course || !course.isPublished || course.deletedAt) throw new NotFoundError("Course");
  return prisma.module.findMany({
    where: { courseId },
    orderBy: { orderIndex: "asc" },
    include: { lessons: { orderBy: { orderIndex: "asc" } } },
  });
}

export async function updateModule(
  moduleId: string,
  input: { title?: string },
  userId: string,
  role: Role,
) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw new NotFoundError("Module");

  await assertCourseOwnership(module.courseId, userId, role);
  return prisma.module.update({ where: { id: moduleId }, data: input });
}

/**
 * Reorder policy (used for modules in a course; lessons in a module must follow the same rules):
 *  - `order` must name every current child of the parent exactly once. A complete permutation is required.
 *    Omitted children would keep their old orderIndex and collide with the new positions, so they are rejected.
 *  - Duplicate IDs are rejected.
 *  - Foreign IDs (children of another parent, or nonexistent) are rejected. A mixed-parent list therefore fails
 *    the same way. Error messages do not echo the IDs back.
 *  - Every rejection is a 400 raised inside the transaction, so no row changes.
 *  - Each write is scoped to the parent (`where: { id, courseId }`). The write cannot move a row that has left
 *    the parent after the check, and a write that matches no row aborts the whole transaction.
 */
export function assertCompleteOrder(order: string[], childIds: string[], label: string): void {
  const seen = new Set<string>();
  for (const id of order) {
    if (seen.has(id)) throw new AppError(`Duplicate ${label} ID in reorder request`, 400);
    seen.add(id);
  }

  const children = new Set(childIds);
  if (order.some((id) => !children.has(id))) {
    throw new AppError(`${label} IDs must belong to the parent being reordered`, 400);
  }
  if (order.length !== children.size) {
    throw new AppError(`Reorder must include every ${label.toLowerCase()} in the parent exactly once`, 400);
  }
}

export async function reorderModules(courseId: string, order: string[], userId: string, role: Role) {
  await assertCourseOwnership(courseId, userId, role);

  await prisma.$transaction(
    async (tx) => {
      const existing = await tx.module.findMany({ where: { courseId }, select: { id: true } });
      assertCompleteOrder(order, existing.map((m) => m.id), "Module");

      for (const [index, moduleId] of order.entries()) {
        const { count } = await tx.module.updateMany({
          where: { id: moduleId, courseId },
          data: { orderIndex: index },
        });
        if (count !== 1) throw new AppError("Module reorder failed; no changes were saved", 400);
      }
    },
    { isolationLevel: "Serializable" },
  );
}

export async function deleteModule(moduleId: string, userId: string, role: Role) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw new NotFoundError("Module");

  await assertCourseOwnership(module.courseId, userId, role);
  await prisma.module.delete({ where: { id: moduleId } }); // hard delete — no soft-delete on Module per schema
}
