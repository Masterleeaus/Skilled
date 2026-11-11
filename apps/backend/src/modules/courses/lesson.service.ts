import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError, NotFoundError } from "../../utils/AppError";
import { assertCourseOwnership } from "./course.service";
import { assertCompleteOrder } from "./module.service";
import type { CreateLessonInput } from "./module.validators";
import { removeVideoObject, removeVideoObjects } from "./video-upload.service";

/** Current video and caption keys, read under a row lock so concurrent media changes cannot both miss each other. */
async function lockLessonMediaKeys(
  tx: Pick<Prisma.TransactionClient, "$queryRaw">,
  lessonId: string,
): Promise<{ videoUrl: string | null; captionTrackKey: string | null }> {
  const rows = await tx.$queryRaw<Array<{ videoUrl: string | null; captionTrackKey: string | null }>>`
    SELECT "videoUrl", "captionTrackKey" FROM "lessons" WHERE id = ${lessonId} FOR UPDATE`;
  if (rows.length === 0) throw new NotFoundError("Lesson");
  return { videoUrl: rows[0].videoUrl, captionTrackKey: rows[0].captionTrackKey ?? null };
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

  if (input.videoUrl === undefined) {
    return prisma.lesson.update({ where: { id: lessonId }, data: input });
  }

  // A videoUrl change replaces the stored key. The previous key is read under the same lock as the update.
  const committed = await prisma.$transaction(async (tx) => {
    const previousVideoKey = (await lockLessonMediaKeys(tx, lessonId)).videoUrl;
    const updated = await tx.lesson.update({ where: { id: lessonId }, data: input });
    return { lesson: updated, previousVideoKey };
  });
  // Remove the replaced object only after the commit. If the update failed, the old object is kept.
  if (committed.previousVideoKey && committed.previousVideoKey !== input.videoUrl) {
    await removeVideoObject(committed.previousVideoKey);
  }
  return committed.lesson;
}

export async function reorderLessons(
  moduleId: string,
  order: string[],
  userId: string,
  role: Role,
) {
  const module = await getModuleOrThrow(moduleId);
  await assertCourseOwnership(module.courseId, userId, role);

  // Same policy as reorderModules: a complete permutation of this module's lessons, scoped writes, one transaction.
  await prisma.$transaction(
    async (tx) => {
      const existing = await tx.lesson.findMany({ where: { moduleId }, select: { id: true } });
      assertCompleteOrder(order, existing.map((lesson) => lesson.id), "Lesson");

      for (const [index, lessonId] of order.entries()) {
        const { count } = await tx.lesson.updateMany({
          where: { id: lessonId, moduleId },
          data: { orderIndex: index },
        });
        if (count !== 1) throw new AppError("Lesson reorder failed; no changes were saved", 400);
      }
    },
    { isolationLevel: "Serializable" },
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
    const previousVideoKey = (await lockLessonMediaKeys(tx, lessonId)).videoUrl;
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

/**
 * Points a lesson at a newly uploaded caption object and returns the previous caption key.
 * Same rules as setLessonVideoKey: a missing lesson or a caller without rights writes nothing.
 */
export async function setLessonCaptionKey(
  lessonId: string,
  objectKey: string,
  userId: string,
  role: Role,
) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson");
  await assertCourseOwnership(lesson.module.courseId, userId, role);

  return prisma.$transaction(async (tx) => {
    const previousCaptionKey = (await lockLessonMediaKeys(tx, lessonId)).captionTrackKey;
    const updated = await tx.lesson.update({ where: { id: lessonId }, data: { captionTrackKey: objectKey } });
    return { lesson: updated, previousCaptionKey };
  });
}

/**
 * Attaches an uploaded caption object to a lesson.
 * - If the database update fails, the new caption object is removed and the old one is kept.
 * - After the update commits, the replaced caption object is removed. A MinIO failure never fails the request.
 */
export async function attachUploadedLessonCaptions(
  lessonId: string,
  objectKey: string,
  userId: string,
  role: Role,
) {
  let committed: Awaited<ReturnType<typeof setLessonCaptionKey>>;
  try {
    committed = await setLessonCaptionKey(lessonId, objectKey, userId, role);
  } catch (error) {
    await removeVideoObject(objectKey);
    throw error;
  }
  if (committed.previousCaptionKey && committed.previousCaptionKey !== objectKey) {
    await removeVideoObject(committed.previousCaptionKey);
  }
  return committed.lesson;
}

export async function deleteLesson(lessonId: string, userId: string, role: Role) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) throw new NotFoundError("Lesson");

  await assertCourseOwnership(lesson.module.courseId, userId, role);
  // Read the media keys under the same lock as the delete, so a concurrent replacement cannot be missed.
  const keys = await prisma.$transaction(async (tx) => {
    const current = await lockLessonMediaKeys(tx, lessonId);
    await tx.lesson.delete({ where: { id: lessonId } });
    return current;
  });
  // The row is gone. Only now are the objects removed, so a rolled-back delete keeps the video and captions.
  await removeVideoObjects([keys.videoUrl, keys.captionTrackKey]);
}
