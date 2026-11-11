/**
 * Lesson caption tracks over HTTP, through the real app and the in-memory Prisma double.
 * Covers the upload guards (role, ownership, extension, WebVTT content, size), the captionsUrl returned with the
 * video URL, and the grant-cookie-protected caption stream. MinIO calls are stubbed on the real client.
 */
import { Readable } from "node:stream";
import request from "supertest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "caption-track-http-secret",
    JWT_ACCESS_EXPIRES: "15m",
    NODE_ENV: "test",
    CLIENT_URL: "http://localhost:3000",
    REDIS_URL: "redis://127.0.0.1:6399",
    MINIO_ENDPOINT: "127.0.0.1",
    MINIO_PORT: 9099,
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: "test-access",
    MINIO_SECRET_KEY: "test-secret",
    MINIO_BUCKET: "test-bucket",
  },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../config/logger", () => ({
  logger: { error: () => undefined, warn: () => undefined, info: () => undefined, debug: () => undefined },
  httpLogStream: { write: () => undefined },
}));

import { resetFakeDb, seed } from "./support/fake-prisma";
import { token } from "./support/academy-fixtures";
import { app } from "../app";
import { minioClient } from "../config/minio";
import { createPlaybackGrant, PLAYBACK_COOKIE, playbackCookiePath } from "../modules/courses/video-playback.service";
import { MAX_CAPTION_BYTES } from "../modules/courses/caption-track.service";

const TEACHER = "teacher-1";
const OTHER_TEACHER = "teacher-2";
const LEARNER = "learner-1";
const COURSE = "course-1";
const LESSON_NO_MEDIA = "les-1";
const LESSON_WITH_CAPTIONS = "les-2";
const VIDEO_KEY = `videos/${"a".repeat(32)}.mp4`;
const CAPTION_KEY = `videos/${"b".repeat(32)}.vtt`;
const VTT = Buffer.from("WEBVTT\n\n00:00.000 --> 00:02.000\nHello, crew.\n", "utf8");

const CAPTIONS_UPLOAD = (lessonId: string) => `/api/courses/lessons/${lessonId}/captions`;
const VIDEO_URL = (lessonId: string) => `/api/courses/lessons/${lessonId}/video-url`;
const CAPTIONS_STREAM = (lessonId: string) => `/api/courses/lessons/${lessonId}/video/stream/captions`;

async function seedCourse(): Promise<void> {
  await seed("user", [
    { id: TEACHER, email: "teacher@example.test", passwordHash: "x", fullName: "Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: OTHER_TEACHER, email: "other@example.test", passwordHash: "x", fullName: "Other", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: LEARNER, email: "learner@example.test", passwordHash: "x", fullName: "Learner", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("category", [{ id: "cat-1", name: "Safety", slug: "safety" }]);
  await seed("course", [
    {
      id: COURSE,
      title: "Workplace safety",
      slug: "workplace-safety",
      description: "Course description text",
      categoryId: "cat-1",
      teacherId: TEACHER,
      price: 0,
      level: "BEGINNER",
      isPublished: true,
      deletedAt: null,
    },
  ]);
  await seed("module", [{ id: "mod-1", courseId: COURSE, title: "Module 1", orderIndex: 0 }]);
  await seed("lesson", [
    { id: LESSON_NO_MEDIA, moduleId: "mod-1", title: "Text only", videoUrl: null, captionTrackKey: null, orderIndex: 0 },
    {
      id: LESSON_WITH_CAPTIONS,
      moduleId: "mod-1",
      title: "Intro",
      videoUrl: VIDEO_KEY,
      captionTrackKey: CAPTION_KEY,
      isFreePreview: true,
      orderIndex: 1,
    },
  ]);
}

beforeEach(async () => {
  resetFakeDb();
  await seedCourse();
  vi.spyOn(minioClient, "putObject").mockResolvedValue({ etag: "x" } as never);
  vi.spyOn(minioClient, "removeObject").mockResolvedValue(undefined as never);
  vi.spyOn(minioClient, "statObject").mockResolvedValue({ size: VTT.length } as never);
  vi.spyOn(minioClient, "getObject").mockImplementation(async () => Readable.from([VTT]) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function vttUpload(agent: request.Test, bytes: Buffer, filename = "captions.vtt", type = "text/vtt") {
  return agent.attach("captions", bytes, { filename, contentType: type });
}

describe("POST /lessons/:lessonId/captions: role and ownership", () => {
  it("refuses a learner before the file is read or stored", async () => {
    const res = await vttUpload(request(app).post(CAPTIONS_UPLOAD(LESSON_NO_MEDIA)).set("Authorization", `Bearer ${token(LEARNER, "STUDENT")}`), VTT);

    expect(res.status).toBe(403);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("refuses a teacher who does not own the course", async () => {
    const res = await vttUpload(request(app).post(CAPTIONS_UPLOAD(LESSON_NO_MEDIA)).set("Authorization", `Bearer ${token(OTHER_TEACHER, "TEACHER")}`), VTT);

    expect(res.status).toBe(403);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown lesson", async () => {
    const res = await vttUpload(request(app).post(CAPTIONS_UPLOAD("missing")).set("Authorization", `Bearer ${token(TEACHER, "TEACHER")}`), VTT);

    expect(res.status).toBe(404);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("refuses an unauthenticated request", async () => {
    const res = await vttUpload(request(app).post(CAPTIONS_UPLOAD(LESSON_NO_MEDIA)), VTT);

    expect(res.status).toBe(401);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });
});

describe("POST /lessons/:lessonId/captions: file checks", () => {
  const owner = () => request(app).post(CAPTIONS_UPLOAD(LESSON_NO_MEDIA)).set("Authorization", `Bearer ${token(TEACHER, "TEACHER")}`);

  it("rejects a file whose name is not .vtt", async () => {
    const res = await vttUpload(owner(), VTT, "captions.txt", "text/plain");

    expect(res.status).toBe(400);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("rejects a .vtt file whose content is not WebVTT", async () => {
    const res = await vttUpload(owner(), Buffer.from("<html><script>alert(1)</script></html>"));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/WebVTT/);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("rejects a file with an unsupported declared type", async () => {
    const res = await vttUpload(owner(), VTT, "captions.vtt", "image/png");

    expect(res.status).toBe(400);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("rejects a file over the size cap with 413", async () => {
    const oversized = Buffer.concat([VTT, Buffer.alloc(MAX_CAPTION_BYTES)]);

    const res = await vttUpload(owner(), oversized);

    expect(res.status).toBe(413);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });

  it("rejects a request with no caption file", async () => {
    const res = await owner().field("note", "no file here");

    expect(res.status).toBe(400);
    expect(minioClient.putObject).not.toHaveBeenCalled();
  });
});

describe("GET video-url and the caption stream", () => {
  const teacher = () => request(app).get(VIDEO_URL(LESSON_WITH_CAPTIONS)).set("Authorization", `Bearer ${token(TEACHER, "TEACHER")}`);

  it("returns captionsUrl beside the video URL when the lesson has captions", async () => {
    const res = await teacher();

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe(`/api/courses/lessons/${LESSON_WITH_CAPTIONS}/video/stream`);
    expect(res.body.data.captionsUrl).toBe(`/api/courses/lessons/${LESSON_WITH_CAPTIONS}/video/stream/captions`);
  });

  it("issues no grant for a lesson with no video, so no captions URL is returned", async () => {
    const res = await request(app).get(VIDEO_URL(LESSON_NO_MEDIA)).set("Authorization", `Bearer ${token(TEACHER, "TEACHER")}`);

    expect(res.status).toBe(404);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("serves the caption file as WebVTT with the same grant cookie as the video", async () => {
    const issued = await teacher();
    const setCookies = ([] as string[]).concat(issued.headers["set-cookie"] ?? []);
    const cookie = setCookies.find((value) => value.startsWith(`${PLAYBACK_COOKIE}=`));
    expect(cookie).toBeDefined();

    const res = await request(app).get(CAPTIONS_STREAM(LESSON_WITH_CAPTIONS)).set("Cookie", cookie!.split(";")[0]);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^text\/vtt/);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.text).toBe(VTT.toString("utf8"));
    expect(minioClient.getObject).toHaveBeenCalledWith("test-bucket", CAPTION_KEY);
  });

  it("refuses the caption stream without a playback grant", async () => {
    const res = await request(app).get(CAPTIONS_STREAM(LESSON_WITH_CAPTIONS));

    expect(res.status).toBe(401);
    expect(minioClient.getObject).not.toHaveBeenCalled();
  });

  it("refuses a grant issued for a different lesson", async () => {
    const grant = createPlaybackGrant(LESSON_NO_MEDIA, TEACHER);

    const res = await request(app).get(CAPTIONS_STREAM(LESSON_WITH_CAPTIONS)).set("Cookie", `${PLAYBACK_COOKIE}=${grant}`);

    expect(res.status).toBe(403);
    expect(minioClient.getObject).not.toHaveBeenCalled();
  });

  it("returns 404 when a valid grant is used on a lesson with no captions", async () => {
    const grant = createPlaybackGrant(LESSON_NO_MEDIA, TEACHER);

    const res = await request(app).get(CAPTIONS_STREAM(LESSON_NO_MEDIA)).set("Cookie", `${PLAYBACK_COOKIE}=${grant}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Captions not found");
  });

  it("scopes the grant cookie to a path that covers the captions stream", () => {
    const cookiePath = playbackCookiePath(LESSON_WITH_CAPTIONS);
    expect(CAPTIONS_STREAM(LESSON_WITH_CAPTIONS).startsWith(`${cookiePath}/`)).toBe(true);
  });
});
