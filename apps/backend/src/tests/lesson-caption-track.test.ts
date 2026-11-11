/**
 * Lesson caption tracks (WebVTT): accepted and rejected content, the stored key and its prefix guard, the role check
 * before any write, and the replace and delete rules that keep the caption object in step with the lesson row.
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
    videoObjectCleanup: { createMany: vi.fn(async () => ({ count: 0 })) },
    $transaction: vi.fn(),
  };
  const minio = { putObject: vi.fn(), removeObject: vi.fn() };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  const assertCourseOwnership = vi.fn();
  return { events, tx, prisma, minio, logger, assertCourseOwnership };
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
  assertCourseOwnership: mocks.assertCourseOwnership,
}));

import { AppError, ForbiddenError } from "../utils/AppError";
import {
  MAX_CAPTION_BYTES,
  assertCaptionFile,
  isWebVttContent,
  uploadLessonCaptionTrack,
} from "../modules/courses/caption-track.service";
import { isManagedVideoKey, removeVideoObject } from "../modules/courses/video-upload.service";
import { attachUploadedLessonCaptions, deleteLesson, setLessonCaptionKey } from "../modules/courses/lesson.service";

const VTT = Buffer.from("WEBVTT\n\n00:00.000 --> 00:02.000\nHello, crew.\n", "utf8");
const OLD_VIDEO = `videos/${"a".repeat(32)}.mp4`;
const OLD_CAPTIONS = `videos/${"c".repeat(32)}.vtt`;
const NEW_CAPTIONS = `videos/${"d".repeat(32)}.vtt`;

function fileOf(buffer: Buffer, originalname = "captions.vtt", mimetype = "text/vtt") {
  return { buffer, size: buffer.length, originalname, mimetype } as Pick<Express.Multer.File, "buffer" | "size">;
}

function expectAppError(fn: () => unknown, statusCode: number) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(statusCode);
    return;
  }
  throw new Error("expected an AppError");
}

beforeEach(() => {
  mocks.events.length = 0;
  mocks.minio.putObject.mockReset().mockImplementation(async (_bucket: string, key: string) => {
    mocks.events.push(`put:${key}`);
    return { etag: "x" };
  });
  mocks.minio.removeObject.mockReset().mockImplementation(async (_bucket: string, key: string) => {
    mocks.events.push(`remove:${key}`);
  });
  mocks.assertCourseOwnership.mockReset().mockResolvedValue({ id: "course-1" });
  mocks.tx.lesson.update.mockReset().mockImplementation(async ({ data }: { data: Record<string, string> }) => {
    mocks.events.push(`db-update:${JSON.stringify(data)}`);
    return { id: "lesson-1", ...data };
  });
  mocks.tx.lesson.delete.mockReset().mockImplementation(async () => {
    mocks.events.push("db-delete");
    return { id: "lesson-1" };
  });
  mocks.tx.$queryRaw.mockReset();
  mocks.prisma.lesson.findUnique.mockReset().mockResolvedValue({ id: "lesson-1", module: { courseId: "course-1" } });
  mocks.prisma.$transaction.mockReset().mockImplementation(async (work: (tx: typeof mocks.tx) => Promise<unknown>) => {
    const result = await work(mocks.tx);
    mocks.events.push("commit");
    return result;
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

function primeLesson(captionTrackKey: string | null, videoUrl: string | null = OLD_VIDEO) {
  mocks.tx.$queryRaw.mockResolvedValue([{ videoUrl, captionTrackKey }]);
}

describe("WebVTT content check", () => {
  it("accepts a plain WEBVTT file", () => {
    expect(isWebVttContent(VTT)).toBe(true);
    expect(assertCaptionFile(fileOf(VTT))).toBe(VTT);
  });

  it("accepts a byte-order mark, and a header followed by whitespace or a line break", () => {
    expect(isWebVttContent(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), VTT]))).toBe(true);
    expect(isWebVttContent(Buffer.from("WEBVTT\r\n\r\n", "utf8"))).toBe(true);
    expect(isWebVttContent(Buffer.from("WEBVTT - Safety module\n", "utf8"))).toBe(true);
  });

  it.each([
    ["an HTML page", Buffer.from("<html><script>alert(1)</script></html>")],
    ["a header with no WEBVTT signature", Buffer.from("1\n00:00:00,000 --> 00:00:02,000\nHello\n")],
    ["a header that only starts with WEBVTT", Buffer.from("WEBVTTX\n\n")],
    ["a lowercase signature", Buffer.from("webvtt\n\n")],
    ["leading whitespace before the signature", Buffer.from(" WEBVTT\n\n")],
    ["an empty file", Buffer.alloc(0)],
    ["a binary executable header", Buffer.from([0x4d, 0x5a, 0x90, 0x00])],
    ["invalid UTF-8 after the signature", Buffer.from([0x57, 0x45, 0x42, 0x56, 0x54, 0x54, 0x0a, 0xff, 0xfe])],
  ])("rejects %s", (_label, bytes) => {
    expect(isWebVttContent(bytes)).toBe(false);
    expectAppError(() => assertCaptionFile(fileOf(bytes)), 400);
  });

  it("rejects a file over the size cap with 413", () => {
    const oversized = Buffer.concat([VTT, Buffer.alloc(MAX_CAPTION_BYTES)]);
    expect(oversized.length).toBeGreaterThan(MAX_CAPTION_BYTES);
    expectAppError(() => assertCaptionFile(fileOf(oversized)), 413);
  });

  it("accepts a file exactly at the cap", () => {
    const atCap = Buffer.concat([VTT, Buffer.alloc(MAX_CAPTION_BYTES - VTT.length, 0x20)]);
    expect(atCap.length).toBe(MAX_CAPTION_BYTES);
    expect(assertCaptionFile(fileOf(atCap))).toBe(atCap);
  });
});

describe("caption storage", () => {
  it("stores a valid caption file under the managed video prefix as text/vtt", async () => {
    const key = await uploadLessonCaptionTrack(fileOf(VTT));

    expect(key).toMatch(/^videos\/[a-f0-9]{32}\.vtt$/);
    expect(isManagedVideoKey(key)).toBe(true);
    expect(mocks.minio.putObject).toHaveBeenCalledTimes(1);
    expect(mocks.minio.putObject).toHaveBeenCalledWith(
      "test-bucket",
      key,
      VTT,
      VTT.length,
      { "Content-Type": "text/vtt; charset=utf-8" },
    );
  });

  it("writes nothing to storage when the content is not WebVTT or is too large", async () => {
    await expect(uploadLessonCaptionTrack(fileOf(Buffer.from("<html></html>")))).rejects.toMatchObject({ statusCode: 400 });
    await expect(uploadLessonCaptionTrack(fileOf(Buffer.concat([VTT, Buffer.alloc(MAX_CAPTION_BYTES)])))).rejects.toMatchObject({
      statusCode: 413,
    });
    expect(mocks.minio.putObject).not.toHaveBeenCalled();
  });
});

describe("prefix guard on caption keys", () => {
  it.each([
    `videos/${"e".repeat(32)}.vtt`,
    `videos/${"E".repeat(32)}.VTT`,
  ])("treats %s as a managed key", (key) => {
    expect(isManagedVideoKey(key)).toBe(true);
  });

  it.each([
    `captions/${"e".repeat(32)}.vtt`,
    `images/${"e".repeat(32)}.vtt`,
    `videos/${"e".repeat(31)}.vtt`,
    `videos/../${"e".repeat(32)}.vtt`,
    `videos/${"e".repeat(32)}.vtt/../../secret`,
    `https://example.test/videos/${"e".repeat(32)}.vtt`,
    null,
    undefined,
  ])("does not treat %s as a managed key", (key) => {
    expect(isManagedVideoKey(key)).toBe(false);
  });

  it("never deletes a caption-looking key outside the managed prefix", async () => {
    await removeVideoObject(`captions/${"e".repeat(32)}.vtt`);
    await removeVideoObject(`images/${"e".repeat(32)}.vtt`);
    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });

  it("deletes a managed caption key", async () => {
    await removeVideoObject(OLD_CAPTIONS);
    expect(mocks.minio.removeObject).toHaveBeenCalledWith("test-bucket", OLD_CAPTIONS);
  });
});

describe("caption attach: role and ownership", () => {
  it("refuses a caller who does not own the course, before any write", async () => {
    mocks.assertCourseOwnership.mockRejectedValueOnce(new ForbiddenError("You do not own this course"));

    await expect(setLessonCaptionKey("lesson-1", NEW_CAPTIONS, "teacher-2", "TEACHER")).rejects.toBeInstanceOf(ForbiddenError);

    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.lesson.update).not.toHaveBeenCalled();
  });

  it("refuses a missing lesson with 404 and writes nothing", async () => {
    mocks.prisma.lesson.findUnique.mockResolvedValueOnce(null);

    await expect(setLessonCaptionKey("missing", NEW_CAPTIONS, "teacher-1", "TEACHER")).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("passes the caller role through to the ownership check", async () => {
    primeLesson(null);
    await setLessonCaptionKey("lesson-1", NEW_CAPTIONS, "admin-1", "ADMIN");
    expect(mocks.assertCourseOwnership).toHaveBeenCalledWith("course-1", "admin-1", "ADMIN");
  });
});

describe("caption attach: replacement and rollback", () => {
  it("stores the new caption key and removes the replaced caption object only after the commit", async () => {
    primeLesson(OLD_CAPTIONS);

    const lesson = await attachUploadedLessonCaptions("lesson-1", NEW_CAPTIONS, "teacher-1", "TEACHER");

    expect(lesson).toMatchObject({ captionTrackKey: NEW_CAPTIONS });
    expect(mocks.events).toEqual([
      `db-update:${JSON.stringify({ captionTrackKey: NEW_CAPTIONS })}`,
      "commit",
      `remove:${OLD_CAPTIONS}`,
    ]);
  });

  it("does not touch the video key when captions are replaced", async () => {
    primeLesson(OLD_CAPTIONS);

    await attachUploadedLessonCaptions("lesson-1", NEW_CAPTIONS, "teacher-1", "TEACHER");

    expect(mocks.events.some((event) => event.includes(OLD_VIDEO))).toBe(false);
  });

  it("removes the new caption object and keeps the old one when the database update fails", async () => {
    primeLesson(OLD_CAPTIONS);
    mocks.tx.lesson.update.mockRejectedValueOnce(new Error("connection reset"));

    await expect(attachUploadedLessonCaptions("lesson-1", NEW_CAPTIONS, "teacher-1", "TEACHER")).rejects.toThrow("connection reset");

    expect(mocks.minio.removeObject).toHaveBeenCalledTimes(1);
    expect(mocks.minio.removeObject).toHaveBeenCalledWith("test-bucket", NEW_CAPTIONS);
  });

  it("still succeeds when the replaced object cannot be removed from storage", async () => {
    primeLesson(OLD_CAPTIONS);
    mocks.minio.removeObject.mockRejectedValueOnce(new Error("minio unavailable"));

    const lesson = await attachUploadedLessonCaptions("lesson-1", NEW_CAPTIONS, "teacher-1", "TEACHER");

    expect(lesson).toMatchObject({ captionTrackKey: NEW_CAPTIONS });
    expect(mocks.prisma.videoObjectCleanup.createMany).toHaveBeenCalled();
  });
});

describe("caption objects on lesson deletion", () => {
  it("removes both the video and the caption object after the row is deleted", async () => {
    primeLesson(OLD_CAPTIONS);

    await deleteLesson("lesson-1", "teacher-1", "TEACHER");

    expect(mocks.events).toEqual(["db-delete", "commit", `remove:${OLD_VIDEO}`, `remove:${OLD_CAPTIONS}`]);
  });

  it("keeps the caption object when the delete rolls back", async () => {
    primeLesson(OLD_CAPTIONS);
    mocks.tx.lesson.delete.mockRejectedValueOnce(new Error("deadlock"));

    await expect(deleteLesson("lesson-1", "teacher-1", "TEACHER")).rejects.toThrow("deadlock");

    expect(mocks.minio.removeObject).not.toHaveBeenCalled();
  });
});
