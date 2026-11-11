/**
 * Lesson video upload admission control and content checks: per-user concurrency, in-flight byte budget,
 * quota release on completion and failure, and magic-byte validation against spoofed MIME headers.
 */
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../config/minio", () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn() },
  MINIO_BUCKET: "test-bucket",
  buildObjectKey: (folder: string, name: string) => `${folder}/${name}`,
  STORAGE_FOLDERS: { videos: "videos", images: "images", certificates: "certificates", assignments: "assignments" },
}));

import { AppError } from "../utils/AppError";
import {
  VideoUploadQuota,
  assertVideoSignature,
  createVideoUploadReservation,
  isConsistentVideoDeclaration,
  matchesVideoSignature,
  verifyUploadedVideo,
} from "../modules/courses/video-upload.service";

let workDir: string;

beforeAll(() => {
  workDir = mkdtempSync(path.join(tmpdir(), "video-upload-limits-test-"));
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function u32be(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value, 0);
  return buffer;
}

const MP4_HEADER = Buffer.concat([u32be(24), Buffer.from("ftypisom"), Buffer.alloc(16)]);
const MOV_HEADER = Buffer.concat([u32be(20), Buffer.from("ftypqt  "), Buffer.alloc(8)]);
const WEBM_HEADER = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84]),
  Buffer.from("webm"),
  Buffer.alloc(24),
]);
const MATROSKA_HEADER = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x88]),
  Buffer.from("matroska"),
  Buffer.alloc(24),
]);
const SPOOFED_EXECUTABLE = Buffer.from("MZ\x90\x00\x03\x00\x00\x00#!/bin/sh\necho owned\n".padEnd(64, " "), "latin1");

function writeTemp(name: string, bytes: Buffer): string {
  const file = path.join(workDir, name);
  writeFileSync(file, bytes);
  return file;
}

function fakeRequest(userId: string, contentLength?: number): Request {
  const headers: Record<string, string> = contentLength === undefined ? {} : { "content-length": String(contentLength) };
  return { headers, user: { userId, role: "TEACHER" } } as unknown as Request;
}

function fakeResponse() {
  return new EventEmitter() as EventEmitter & Response;
}

/** Runs the reservation middleware and resolves with what next() received (undefined on success). */
function runReservation(
  middleware: ReturnType<typeof createVideoUploadReservation>,
  req: Request,
  res: Response,
): Promise<unknown> {
  return new Promise((resolve) => {
    const next: NextFunction = (err?: unknown) => resolve(err);
    middleware(req, res, next);
  });
}

describe("VideoUploadQuota", () => {
  it("rejects a user at the concurrency limit with 429 without affecting other users", () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 1, maxInflightBytes: 10_000 });
    const release = quota.reserve("teacher-a", 100);

    expect(() => quota.reserve("teacher-a", 100)).toThrow(AppError);
    try {
      quota.reserve("teacher-a", 100);
    } catch (error) {
      expect((error as AppError).statusCode).toBe(429);
    }
    expect(() => quota.reserve("teacher-b", 100)).not.toThrow();

    release();
  });

  it("rejects with 503 when the in-flight byte budget is exhausted", () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 5, maxInflightBytes: 150 });
    quota.reserve("teacher-a", 100);

    try {
      quota.reserve("teacher-b", 100);
      throw new Error("expected reserve to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).statusCode).toBe(503);
    }
  });

  it("releases its reservation exactly once, and the release is idempotent", () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 1, maxInflightBytes: 100 });
    const release = quota.reserve("teacher-a", 100);
    release();
    release();

    expect(quota.snapshot()).toEqual({ users: 0, inflightBytes: 0 });
    expect(() => quota.reserve("teacher-a", 100)).not.toThrow();
  });
});

describe("createVideoUploadReservation middleware", () => {
  it("rejects over-limit concurrency, then frees the slot after the first upload completes", async () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 1, maxInflightBytes: 10_000_000 });
    const middleware = createVideoUploadReservation(quota);

    const firstRes = fakeResponse();
    expect(await runReservation(middleware, fakeRequest("teacher-a", 1000), firstRes)).toBeUndefined();

    const secondErr = await runReservation(middleware, fakeRequest("teacher-a", 1000), fakeResponse());
    expect(secondErr).toBeInstanceOf(AppError);
    expect((secondErr as AppError).statusCode).toBe(429);

    // Completion: the response closes after it was sent.
    firstRes.emit("finish");
    firstRes.emit("close");
    expect(quota.snapshot()).toEqual({ users: 0, inflightBytes: 0 });

    expect(await runReservation(middleware, fakeRequest("teacher-a", 1000), fakeResponse())).toBeUndefined();
  });

  it("releases the reservation when the request fails or the client disconnects", async () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 1, maxInflightBytes: 10_000_000 });
    const middleware = createVideoUploadReservation(quota);

    const failedRes = fakeResponse();
    expect(await runReservation(middleware, fakeRequest("teacher-a", 2_000_000), failedRes)).toBeUndefined();
    expect(quota.snapshot()).toEqual({ users: 1, inflightBytes: 2_000_000 });

    // Failure or disconnect: the response closes without finishing.
    failedRes.emit("close");
    expect(quota.snapshot()).toEqual({ users: 0, inflightBytes: 0 });
  });

  it("reserves the declared size, and the whole budget for chunked requests without Content-Length", async () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 5, maxInflightBytes: 600 * 1024 * 1024 });
    const middleware = createVideoUploadReservation(quota);

    const res = fakeResponse();
    await runReservation(middleware, fakeRequest("teacher-a", 4096), res);
    expect(quota.snapshot().inflightBytes).toBe(4096);
    res.emit("close");

    const chunkedErr = await runReservation(middleware, fakeRequest("teacher-b"), fakeResponse());
    expect(chunkedErr).toBeUndefined();
    expect(quota.snapshot().inflightBytes).toBeGreaterThan(500 * 1024 * 1024);
  });

  it("rejects a declared body larger than the 500MB video limit before reserving anything", async () => {
    const quota = new VideoUploadQuota({ maxConcurrentPerUser: 5, maxInflightBytes: 10 * 1024 * 1024 * 1024 });
    const err = await runReservation(
      createVideoUploadReservation(quota),
      fakeRequest("teacher-a", 600 * 1024 * 1024),
      fakeResponse(),
    );
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(413);
    expect(quota.snapshot()).toEqual({ users: 0, inflightBytes: 0 });
  });
});

describe("video content validation", () => {
  it("accepts ISO BMFF (mp4 and mov) and EBML/WebM headers with the matching declared type", () => {
    expect(matchesVideoSignature(MP4_HEADER, "video/mp4")).toBe(true);
    expect(matchesVideoSignature(MOV_HEADER, "video/quicktime")).toBe(true);
    expect(matchesVideoSignature(WEBM_HEADER, "video/webm")).toBe(true);
  });

  it("rejects a container that does not match the declared type", () => {
    expect(matchesVideoSignature(WEBM_HEADER, "video/mp4")).toBe(false);
    expect(matchesVideoSignature(MP4_HEADER, "video/webm")).toBe(false);
    expect(matchesVideoSignature(MATROSKA_HEADER, "video/webm")).toBe(false);
    expect(matchesVideoSignature(Buffer.alloc(0), "video/mp4")).toBe(false);
  });

  it("rejects a spoofed MIME type whose content is not a video, and accepts a genuine MP4 signature", async () => {
    const spoofed = writeTemp("spoofed-exe.bin", SPOOFED_EXECUTABLE);
    await expect(assertVideoSignature({ path: spoofed, mimetype: "video/mp4" })).rejects.toMatchObject({
      statusCode: 400,
    });

    const genuine = writeTemp("genuine.mp4", MP4_HEADER);
    await expect(assertVideoSignature({ path: genuine, mimetype: "video/mp4" })).resolves.toBeUndefined();
  });

  it("requires the extension, MIME type and signature to agree", () => {
    expect(isConsistentVideoDeclaration("lesson.mp4", "video/mp4")).toBe(true);
    expect(isConsistentVideoDeclaration("LESSON.MOV", "video/quicktime")).toBe(true);
    expect(isConsistentVideoDeclaration("lesson.webm", "video/webm")).toBe(true);
    expect(isConsistentVideoDeclaration("lesson.mp4", "video/quicktime")).toBe(false);
    expect(isConsistentVideoDeclaration("lesson.exe", "video/mp4")).toBe(false);
    expect(isConsistentVideoDeclaration("lesson", "video/mp4")).toBe(false);
  });

  it("verifyUploadedVideo removes a spoofed temporary file and passes an error to next()", async () => {
    const spoofed = writeTemp("spoofed-middleware.bin", SPOOFED_EXECUTABLE);
    const req = { file: { path: spoofed, mimetype: "video/mp4", originalname: "lesson.mp4" } } as unknown as Request;
    const next = vi.fn();

    await verifyUploadedVideo(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
    expect(existsSync(spoofed)).toBe(false);
  });

  it("verifyUploadedVideo keeps a valid temporary file and calls next() without an error", async () => {
    const valid = writeTemp("valid-middleware.mp4", MP4_HEADER);
    const req = { file: { path: valid, mimetype: "video/mp4", originalname: "lesson.mp4" } } as unknown as Request;
    const next = vi.fn();

    await verifyUploadedVideo(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(existsSync(valid)).toBe(true);
  });
});
