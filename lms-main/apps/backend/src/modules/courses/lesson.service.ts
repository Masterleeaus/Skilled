import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "./course.service";
import type { CreateLessonInput } from "./module.validators";
import { removeVideoObject } from "./video-upload.service";

/** Reads the current videoUrl under a row lock, so concurrent video changes cannot both miss each other. */
async function lockLessonVideoKey(tx: Pick<Prisma.TransactionClient, "$queryRaw">, lessonId: string): Promise<string | null> {
  const rows = await tx.$queryRaw<Array<{ videoUrl: string | null }>>`
    SELECT "videoUrl" FROM "lessons" WHERE id = ${lessonId} FOR UPDATE`;
  if (rows.length === 0) throw new NotFoundError("Lesson");
  return rows[0].videoUrl;
}

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

/**
 * Points a lesson at a newly uploaded video object and returns the previous key.
 * Throws when the lesson is missing or the caller may not edit it. Nothing is written in that case.
 */
export async function setLessonVideoKey(
  lessonId: string,
  objectKey: string,
  userId: string,
  role: Role,
) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson");
  await assertCourseOwnership(lesson.module.courseId, userId, role);

  return prisma.$transaction(async (tx) => {
    const previousVideoKey = await lockLessonVideoKey(tx, lessonId);
    const updated = await tx.lesson.update({ where: { id: lessonId }, data: { videoUrl: objectKey } });
    return { lesson: updated, previousVideoKey };
  });
}

/**
 * Attaches an object that was already uploaded to MinIO.
 * - If the database update fails, the new object is removed and the old one is kept.
 * - After the update commits, the replaced object is removed. A MinIO failure is logged and never rethrown.
 */
export async function attachUploadedLessonVideo(
  lessonId: string,
  objectKey: string,
  userId: string,
  role: Role,
) {
  let committed: Awaited<ReturnType<typeof setLessonVideoKey>>;
  try {
    committed = await setLessonVideoKey(lessonId, objectKey, userId, role);
  } catch (error) {
    await removeVideoObject(objectKey);
    throw error;
  }
  if (committed.previousVideoKey && committed.previousVideoKey !== objectKey) {
    await removeVideoObject(committed.previousVideoKey);
  }
  return committed.lesson;
}

export async function deleteLesson(lessonId: string, userId: string, role: Role) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson");

  await assertCourseOwnership(lesson.module.courseId, userId, role);
  // Read the video key under the same lock as the delete, so a concurrent replacement cannot be missed.
  const videoKey = await prisma.$transaction(async (tx) => {
    const key = await lockLessonVideoKey(tx, lessonId);
    await tx.lesson.delete({ where: { id: lessonId } });
    return key;
  });
  // The row is gone. Only now is the object removed, so a rolled-back delete keeps the video.
  await removeVideoObject(videoKey);
}
