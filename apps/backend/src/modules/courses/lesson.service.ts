import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "./course.service";
import type { CreateLessonInput } from "./module.validators";

async function getModuleOrThrow(moduleId: string) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw new NotFoundError("Module");
  return module;
}

export async function createLesson(
  moduleId: string,
  input: CreateLessonInput,
  userId: string,
  role: Role,
) {
  const module = await getModuleOrThrow(moduleId);
  await assertCourseOwnership(module.courseId, userId, role);

  const orderIndex = input.orderIndex ?? (await prisma.lesson.count({ where: { moduleId } }));

  return prisma.lesson.create({
    data: {
      moduleId,
      title: input.title,
      videoUrl: input.videoUrl,
      duration: input.duration,
      isFreePreview: input.isFreePreview,
      orderIndex,
    },
  });
}

export async function updateLesson(
  lessonId: string,
  input: Partial<CreateLessonInput>,
  userId: string,
  role: Role,
) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson");

  await assertCourseOwnership(lesson.module.courseId, userId, role);
  return prisma.lesson.update({ where: { id: lessonId }, data: input });
}

export async function reorderLessons(
  moduleId: string,
  order: string[],
  userId: string,
  role: Role,
) {
  const module = await getModuleOrThrow(moduleId);
  await assertCourseOwnership(module.courseId, userId, role);

  await prisma.$transaction(
    order.map((lessonId, index) =>
      prisma.lesson.update({ where: { id: lessonId }, data: { orderIndex: index } }),
    ),
  );
}

export async function deleteLesson(lessonId: string, userId: string, role: Role) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson");

  await assertCourseOwnership(lesson.module.courseId, userId, role);
  await prisma.lesson.delete({ where: { id: lessonId } });
}
