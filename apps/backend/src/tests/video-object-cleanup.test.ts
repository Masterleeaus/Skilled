/**
 * Lesson video object cleanup (issue #51 remainder):
 * - PATCH /lessons/:id replaces the object only after the commit, and keeps it when the update fails.
 * - Module deletion collects the lesson video keys before the delete, and removes them only after the commit.
 * - Failed removals are queued in VideoObjectCleanup, and the drain retries them, marks them complete and never
 *   deletes a key outside the managed video prefix.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const events: string[] = [];
  const tx = {
    $queryRaw: vi.fn(),
    lesson: { update: vi.fn(), delete: vi.fn() },
    module: { delete: vi.fn() },
  };
  const prisma = {
    lesson: { findUnique: vi.fn(), update: vi.fn() },
    module: { findUnique: vi.fn() },
    videoObjectCleanup: { createMany: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
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

import { updateLesson } from "../modules/courses/lesson.service";
import { deleteModule } from "../modules/courses/module.service";
import { drainVideoObjectCleanup, removeVideoObject, removeVideoObjects } from "../modules/courses/video-upload.service";

const OLD_KEY = `videos/${"a".repeat(32)}.mp4`;
const NEW_KEY = `videos/${"b".repeat(32)}.mp4`;
const THIRD_KEY = `videos/${"c".repeat(32)}.webm`;
const OUTSIDE_KEY = "assignments/secret.pdf";
const ACTOR = ["teacher-1", "TEACHER" as never] as const;

function primeLesson(videoUrl: string | null) {
  mocks.prisma.lesson.findUnique.mockResolvedValue({ id: "lesson-1", module: { courseId: "course-1" } });
  mocks.tx.$queryRaw.mockResolvedValue([{ videoUrl }]);
}

beforeEach(() => {
  mocks.events.length = 0;
  mocks.tx.lesson.update.mockImplementation(async ({ data }: { data: { videoUrl?: string } }) => {
    mocks.events.push(`db-update:${data.videoUrl}`);
    return { id: "lesson-1", videoUrl: data.videoUrl };
  });
  mocks.tx.module.delete.mockImplementation(async () => {
    mocks.events.push("db-delete-module");
    return { id: "module-1" };
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
  mocks.prisma.videoObjectCleanup.createMany.mockResolvedValue({ count: 0 });
  mocks.prisma.videoObjectCleanup.updateMany.mockResolvedValue({ count: 1 });
  mocks.prisma.videoObjectCleanup.findMany.mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PATCH lesson videoUrl replacement", () => {
  it("removes the replaced object only after the new key commits", async () => {
    primeLesson(OLD_KEY);

    const lesson = await updateLesson("lesson-1", { videoUrl: NEW_KEY }, ...ACTOR);

    expect(lesson).toEqual({ id: "lesson-1", videoUrl: NEW_KEY });
    expect(mocks.events).toEqual([`db-update:${NEW_KEY}`, "commit", `minio-remove:${OLD_KEY}`]);
  });

  it("keeps the old object when the database update fails", async () => {
    primeLesson(OLD_KEY);
    mocks.tx.lesson.update.mockRejectedValueOnce(new Error("connection reset"));

    await expect(updateLesson("lesson-1", { videoUrl: NEW_KEY }, ...ACTOR)).rejects.toThrow("connection reset");

    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("does not remove anything when the videoUrl is unchanged or the PATCH has no videoUrl", async () => {
    primeLesson(OLD_KEY);
    await updateLesson("lesson-1", { videoUrl: OLD_KEY }, ...ACTOR);

    primeLesson(OLD_KEY);
    mocks.prisma.lesson.update.mockResolvedValue({ id: "lesson-1", title: "Renamed" });
    await updateLesson("lesson-1", { title: "Renamed" }, ...ACTOR);

    expect(mocks.prisma.lesson.update).toHaveBeenCalledWith({ where: { id: "lesson-1" }, data: { title: "Renamed" } });
    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("never removes an external URL that was replaced", async () => {
    primeLesson("https://cdn.example.com/lesson.mp4");

    await updateLesson("lesson-1", { videoUrl: NEW_KEY }, ...ACTOR);

    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("queues the replaced object for retry when its removal fails, and still resolves", async () => {
    primeLesson(OLD_KEY);
    mocks.minio.removeObject.mockRejectedValueOnce(new Error("MinIO unavailable"));

    await expect(updateLesson("lesson-1", { videoUrl: NEW_KEY }, ...ACTOR)).resolves.toMatchObject({ videoUrl: NEW_KEY });
    expect(mocks.prisma.videoObjectCleanup.createMany).toHaveBeenCalledWith({
      data: [{ objectKey: OLD_KEY, lastError: "MinIO unavailable", attempts: 1 }],
      skipDuplicates: true,
    });
  });
});

describe("module deletion", () => {
  it("collects lesson video keys before the delete and removes them only after the commit", async () => {
    mocks.prisma.module.findUnique.mockResolvedValue({ id: "module-1", courseId: "course-1" });
    mocks.tx.$queryRaw.mockImplementation(async () => {
      mocks.events.push("collect-keys");
      return [{ videoUrl: OLD_KEY }, { videoUrl: null }, { videoUrl: THIRD_KEY }];
    });

    await deleteModule("module-1", ...ACTOR);

    expect(mocks.events).toEqual([
      "collect-keys",
      "db-delete-module",
      "commit",
      `minio-remove:${OLD_KEY}`,
      `minio-remove:${THIRD_KEY}`,
    ]);
  });

  it("removes nothing when the module delete fails", async () => {
    mocks.prisma.module.findUnique.mockResolvedValue({ id: "module-1", courseId: "course-1" });
    mocks.tx.$queryRaw.mockResolvedValue([{ videoUrl: OLD_KEY }]);
    mocks.tx.module.delete.mockRejectedValueOnce(new Error("foreign key violation"));

    await expect(deleteModule("module-1", ...ACTOR)).rejects.toThrow("foreign key violation");
    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("deletes a key shared by two lessons exactly once", async () => {
    mocks.prisma.module.findUnique.mockResolvedValue({ id: "module-1", courseId: "course-1" });
    mocks.tx.$queryRaw.mockResolvedValue([{ videoUrl: OLD_KEY }, { videoUrl: OLD_KEY }]);

    await deleteModule("module-1", ...ACTOR);

    expect(mocks.minio.removeObject).toHaveBeenCalledTimes(1);
    expect(mocks.minio.removeObject).toHaveBeenCalledWith("test-bucket", OLD_KEY);
  });
});

describe("removeVideoObjects safety", () => {
  it("never deletes keys outside the managed video prefix", async () => {
    await removeVideoObjects([OUTSIDE_KEY, "videos/../assignments/x.pdf", "https://cdn.example.com/a.mp4", null, undefined, ""]);

    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
    expect(mocks.prisma.videoObjectCleanup.createMany).not.toHaveBeenCalled();
  });

  it("logs and does not reject when the failure cannot be queued", async () => {
    mocks.minio.removeObject.mockRejectedValueOnce(new Error("MinIO unavailable"));
    mocks.prisma.videoObjectCleanup.createMany.mockRejectedValueOnce(new Error("database down"));

    await expect(removeVideoObject(OLD_KEY)).resolves.toBeUndefined();
    expect(mocks.logger.error).toHaveBeenCalledWith(expect.stringContaining("Manual cleanup required"));
  });
});

describe("drainVideoObjectCleanup", () => {
  it("removes pending objects and marks their rows complete", async () => {
    mocks.prisma.videoObjectCleanup.findMany.mockResolvedValue([
      { id: "row-1", objectKey: OLD_KEY },
      { id: "row-2", objectKey: THIRD_KEY },
    ]);

    const result = await drainVideoObjectCleanup();

    expect(result).toEqual({ completed: 2, failed: 0, rejected: 0 });
    expect(mocks.minio.removeObject).toHaveBeenCalledWith("test-bucket", OLD_KEY);
    expect(mocks.minio.removeObject).toHaveBeenCalledWith("test-bucket", THIRD_KEY);
    expect(mocks.prisma.videoObjectCleanup.updateMany).toHaveBeenCalledWith({
      where: { id: "row-1", completedAt: null },
      data: expect.objectContaining({ completedAt: expect.any(Date), lastError: null }),
    });
  });

  it("keeps a failing row pending, records the error and counts the attempt", async () => {
    mocks.prisma.videoObjectCleanup.findMany.mockResolvedValue([{ id: "row-1", objectKey: OLD_KEY }]);
    mocks.minio.removeObject.mockRejectedValueOnce(new Error("MinIO unavailable"));

    const result = await drainVideoObjectCleanup();

    expect(result).toEqual({ completed: 0, failed: 1, rejected: 0 });
    expect(mocks.prisma.videoObjectCleanup.updateMany).toHaveBeenCalledWith({
      where: { id: "row-1", completedAt: null },
      data: { attempts: { increment: 1 }, lastError: "MinIO unavailable" },
    });
    expect(mocks.prisma.videoObjectCleanup.updateMany.mock.calls.some(([arg]) => arg.data.completedAt)).toBe(false);
  });

  it("never deletes a row key outside the prefix and closes the row", async () => {
    mocks.prisma.videoObjectCleanup.findMany.mockResolvedValue([{ id: "row-1", objectKey: OUTSIDE_KEY }]);

    const result = await drainVideoObjectCleanup();

    expect(result).toEqual({ completed: 0, failed: 0, rejected: 1 });
    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
    expect(mocks.prisma.videoObjectCleanup.updateMany).toHaveBeenCalledWith({
      where: { id: "row-1", completedAt: null },
      data: expect.objectContaining({ completedAt: expect.any(Date) }),
    });
  });

  it("is a no-op once no rows are pending", async () => {
    const result = await drainVideoObjectCleanup();

    expect(result).toEqual({ completed: 0, failed: 0, rejected: 0 });
    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
    expect(mocks.prisma.videoObjectCleanup.updateMany).not.toHaveBeenCalled();
  });

  it("only selects pending rows", async () => {
    await drainVideoObjectCleanup();

    expect(mocks.prisma.videoObjectCleanup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { completedAt: null } }),
    );
  });
});
