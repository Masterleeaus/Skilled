/**
 * Lesson video object lifecycle: replacement and lesson deletion remove the MinIO object only after the
 * database change commits, keep the old object when the update fails, and tolerate MinIO failures.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const events: string[] = [];
  const tx = {
    $queryRaw: vi.fn(),
    lesson: { update: vi.fn(), delete: vi.fn() },
  };
  const prisma = {
    lesson: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  const minio = { putObject: vi.fn(), removeObject: vi.fn() };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { events, tx, prisma, minio, logger };
});

vi.mock("../config/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../config/logger", () => ({ logger: mocks.logger }));
vi.mock("../config/minio", () => ({
  minioClient: mocks.minio,
  MINIO_BUCKET: "test-bucket",
  buildObjectKey: (folder: string, name: string) => `${folder}/${name}`,
  STORAGE_FOLDERS: { videos: "videos", images: "images", certificates: "certificates", assignments: "assignments" },
}));
vi.mock("../modules/courses/course.service", () => ({
  assertCourseOwnership: vi.fn(async () => ({ id: "course-1" })),
}));

import { attachUploadedLessonVideo, deleteLesson } from "../modules/courses/lesson.service";

const OLD_KEY = `videos/${"a".repeat(32)}.mp4`;
const NEW_KEY = `videos/${"b".repeat(32)}.mp4`;

function primeLesson(videoUrl: string | null) {
  mocks.prisma.lesson.findUnique.mockResolvedValue({ id: "lesson-1", module: { courseId: "course-1" } });
  mocks.tx.$queryRaw.mockResolvedValue([{ videoUrl }]);
}

beforeEach(() => {
  mocks.events.length = 0;
  mocks.tx.lesson.update.mockImplementation(async ({ data }: { data: { videoUrl: string } }) => {
    mocks.events.push(`db-update:${data.videoUrl}`);
    return { id: "lesson-1", videoUrl: data.videoUrl };
  });
  mocks.tx.lesson.delete.mockImplementation(async () => {
    mocks.events.push("db-delete");
    return { id: "lesson-1" };
  });
  // Runs the transaction callback, then records the commit. A rejected callback never commits.
  mocks.prisma.$transaction.mockImplementation(async (work: (tx: typeof mocks.tx) => Promise<unknown>) => {
    const result = await work(mocks.tx);
    mocks.events.push("commit");
    return result;
  });
  mocks.minio.removeObject.mockImplementation(async (_bucket: string, key: string) => {
    mocks.events.push(`minio-remove:${key}`);
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("lesson video replacement", () => {
  it("deletes the previous object only after the new key is committed", async () => {
    primeLesson(OLD_KEY);

    const lesson = await attachUploadedLessonVideo("lesson-1", NEW_KEY, "teacher-1", "TEACHER" as never);

    expect(lesson).toEqual({ id: "lesson-1", videoUrl: NEW_KEY });
    expect(mocks.events).toEqual([
      `db-update:${NEW_KEY}`,
      "commit",
      `minio-remove:${OLD_KEY}`,
    ]);
    expect(mocks.minio.removeObject).toHaveBeenCalledTimes(1);
  });

  it("keeps the old object and deletes the new upload when the database update fails", async () => {
    primeLesson(OLD_KEY);
    mocks.tx.lesson.update.mockRejectedValueOnce(new Error("connection reset"));

    await expect(
      attachUploadedLessonVideo("lesson-1", NEW_KEY, "teacher-1", "TEACHER" as never),
    ).rejects.toThrow("connection reset");

    expect(mocks.minio.removeObject).toHaveBeenCalledTimes(1);
    expect(mocks.minio.removeObject).toHaveBeenCalledWith("test-bucket", NEW_KEY);
    expect(mocks.minio.removeObject).not.toHaveBeenCalledWith("test-bucket", OLD_KEY);
  });

  it("does not delete anything when the previous value is an external URL", async () => {
    primeLesson("https://cdn.example.com/lesson.mp4");

    await attachUploadedLessonVideo("lesson-1", NEW_KEY, "teacher-1", "TEACHER" as never);

    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("resolves when the replaced object cannot be removed, and logs the failure", async () => {
    primeLesson(OLD_KEY);
    mocks.minio.removeObject.mockRejectedValueOnce(new Error("MinIO unavailable"));

    await expect(
      attachUploadedLessonVideo("lesson-1", NEW_KEY, "teacher-1", "TEACHER" as never),
    ).resolves.toMatchObject({ videoUrl: NEW_KEY });
    expect(mocks.logger.warn).toHaveBeenCalled();
  });
});

describe("lesson deletion", () => {
  it("deletes the object only after the row deletion commits", async () => {
    primeLesson(OLD_KEY);

    await deleteLesson("lesson-1", "teacher-1", "TEACHER" as never);

    expect(mocks.events).toEqual(["db-delete", "commit", `minio-remove:${OLD_KEY}`]);
  });

  it("does not touch MinIO when the row deletion fails", async () => {
    primeLesson(OLD_KEY);
    mocks.tx.lesson.delete.mockRejectedValueOnce(new Error("foreign key violation"));

    await expect(deleteLesson("lesson-1", "teacher-1", "TEACHER" as never)).rejects.toThrow("foreign key violation");
    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("completes the deletion and logs when MinIO fails", async () => {
    primeLesson(OLD_KEY);
    mocks.minio.removeObject.mockRejectedValueOnce(new Error("MinIO unavailable"));

    await expect(deleteLesson("lesson-1", "teacher-1", "TEACHER" as never)).resolves.toBeUndefined();
    expect(mocks.events).toContain("db-delete");
    expect(mocks.logger.warn).toHaveBeenCalled();
  });

  it("never removes an object outside the videos folder or a lesson without a video", async () => {
    primeLesson("videos/../assignments/secret.pdf");
    await deleteLesson("lesson-1", "teacher-1", "TEACHER" as never);

    primeLesson(null);
    await deleteLesson("lesson-1", "teacher-1", "TEACHER" as never);

    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });
});
