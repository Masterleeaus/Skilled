import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/AppError";
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

export async function reorderModules(courseId: string, order: string[], userId: string, role: Role) {
  await assertCourseOwnership(courseId, userId, role);

  await prisma.$transaction(
    order.map((moduleId, index) =>
      prisma.module.update({ where: { id: moduleId }, data: { orderIndex: index } }),
    ),
  );
}

export async function deleteModule(moduleId: string, userId: string, role: Role) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw new NotFoundError("Module");

  await assertCourseOwnership(module.courseId, userId, role);
  await prisma.module.delete({ where: { id: moduleId } }); // hard delete — no soft-delete on Module per schema
}
