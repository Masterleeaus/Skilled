/**
 * Assignment attachment upload: admission control (per-user, global and in-flight byte limits), streaming to
 * private temporary files, magic-byte validation, storage error handling, and quota and temp-file release on
 * success, failure and client disconnect. The HTTP tests run the real multer, validation and quota code through
 * a small Express app on loopback. Object storage is mocked, as in the video upload tests.
 */
import http, { type ClientRequest } from "node:http";
import { ReadStream, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Readable } from "node:stream";
import express, { type NextFunction, type Request, type Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../config/minio", () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn() },
  MINIO_BUCKET: "test-bucket",
  buildObjectKey: (folder: string, name: string) => `${folder}/${name}`,
  STORAGE_FOLDERS: { videos: "videos", images: "images", certificates: "certificates", assignments: "assignments" },
}));

import { minioClient } from "../config/minio";
import { AppError } from "../utils/AppError";
import {
  ASSIGNMENT_MAX_REQUEST_BYTES,
  AssignmentUploadQuota,
  assertAssignmentFileContent,
  assignmentUploadTmpDir,
  beginAssignmentUpload,
  createAssignmentUploadReservation,
  finishAssignmentUpload,
  matchesAssignmentSignature,
  receiveAssignmentAttachments,
  uploadAssignmentAttachments,
  verifyAssignmentAttachments,
} from "../modules/assignments/assignment-upload.service";

const MIB = 1024 * 1024;
const BOUNDARY = "----titanAssignmentTest";
const TEMP_PREFIX = "titan-academy-assignment-";
const PDF_BYTES = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(64 * 1024, 0x20)]);
const PNG_BYTES = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(1024, 1)]);
const JPEG_BYTES = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(1024, 2)]);
const stored = { etag: "test-etag", versionId: null };
const EXECUTABLE_BYTES = Buffer.from("MZ\x90\x00\x03\x00\x00\x00#!/bin/sh\necho owned\n".padEnd(256, " "), "latin1");

interface Reply {
  status: number;
  body: { message?: string; data?: { attachments?: { key: string; name: string }[] } } | undefined;
}

// Files the test route received, to check that disk storage (not memory) carried them.
const receivedFiles: Express.Multer.File[] = [];

function buildApp(quota: AssignmentUploadQuota) {
  const app = express();
  app.post(
    "/submit",
    (req: Request, _res: Response, next: NextFunction) => {
      Object.assign(req, { user: { userId: String(req.headers["x-user-id"] ?? "anon"), role: "STUDENT" } });
      next();
    },
    createAssignmentUploadReservation(quota),
    receiveAssignmentAttachments,
    verifyAssignmentAttachments,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        beginAssignmentUpload(req);
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        receivedFiles.push(...files);
        const attachments = files.length ? await uploadAssignmentAttachments(files) : [];
        res.status(201).json({ data: { attachments } });
      } catch (err) {
        next(err);
      } finally {
        await finishAssignmentUpload(req);
      }
    },
  );
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof AppError ? err.statusCode : 500;
    res.status(status).json({ message: err instanceof AppError ? err.message : "Internal server error" });
  });
  return app;
}

function filePart(name: string, filename: string, type: string, content: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`),
    content,
    Buffer.from("\r\n"),
  ]);
}

function multipartBody(parts: Buffer[]): Buffer {
  return Buffer.concat([...parts, Buffer.from(`--${BOUNDARY}--\r\n`)]);
}

/** Opens a POST with a declared Content-Length. The caller writes the body and ends it, or holds it open. */
function openUpload(port: number, userId: string, contentLength: number) {
  const req: ClientRequest = http.request({
    host: "127.0.0.1",
    port,
    method: "POST",
    path: "/submit",
    headers: {
      "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      "content-length": String(contentLength),
      "x-user-id": userId,
    },
  });
  const response = new Promise<Reply>((resolve, reject) => {
    req.once("response", (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => { data += chunk; });
      res.on("end", () => {
        let body: Reply["body"];
        try { body = data ? JSON.parse(data) : undefined; } catch { body = undefined; }
        resolve({ status: res.statusCode ?? 0, body });
      });
      res.on("error", reject);
    });
    req.once("error", reject);
  });
  response.catch(() => undefined); // Destroying a held request rejects this promise on purpose.
  req.flushHeaders(); // Node sends nothing until the body starts or the request ends.
  return { req, response };
}

async function sendUpload(port: number, userId: string, body: Buffer): Promise<Reply> {
  const { req, response } = openUpload(port, userId, body.length);
  req.end(body);
  return response;
}

async function waitFor(check: () => boolean, label: string, timeoutMs = 4000): Promise<void> {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error(`Timed out waiting for: ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof AppError ? error.statusCode : undefined;
  }
  return undefined;
}

function tempFiles(): string[] {
  return readdirSync(assignmentUploadTmpDir).filter((name) => name.startsWith(TEMP_PREFIX));
}

let server: http.Server;
let port: number;
let quota: AssignmentUploadQuota;
const openRequests: ClientRequest[] = [];

function startServer(limits: { maxConcurrentPerUser: number; maxConcurrentGlobal: number; maxInflightBytes: number }) {
  quota = new AssignmentUploadQuota(limits);
  server = http.createServer(buildApp(quota));
  return new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      port = (server.address() as AddressInfo).port;
      resolve();
    });
  });
}

function stopServer() {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

const GENEROUS_LIMITS = { maxConcurrentPerUser: 5, maxConcurrentGlobal: 50, maxInflightBytes: 1024 * MIB };

beforeEach(async () => {
  receivedFiles.length = 0;
  vi.mocked(minioClient.putObject).mockReset();
  vi.mocked(minioClient.removeObject).mockReset();
  vi.mocked(minioClient.removeObject).mockResolvedValue(undefined);
  // Default storage double: drains the stream it is given, as a real client would.
  vi.mocked(minioClient.putObject).mockImplementation(async (_bucket, _key, body) => {
    for await (const _chunk of body as Readable) {
      // consume
    }
    return stored;
  });
  await startServer(GENEROUS_LIMITS);
});

afterEach(async () => {
  for (const req of openRequests.splice(0)) req.destroy();
  await waitFor(() => quota.snapshot().inflightRequests === 0, "quota drained");
  await stopServer();
});

describe("AssignmentUploadQuota", () => {
  it("rejects a user at the per-user limit with 429 without affecting other users", () => {
    const limited = new AssignmentUploadQuota({ maxConcurrentPerUser: 1, maxConcurrentGlobal: 10, maxInflightBytes: 10_000 });
    const release = limited.reserve("student-a", 100);
    expect(statusOf(() => limited.reserve("student-a", 100))).toBe(429);
    expect(() => limited.reserve("student-b", 100)).not.toThrow();
    release();
  });

  it("rejects with 503 when the global request limit is reached", () => {
    const limited = new AssignmentUploadQuota({ maxConcurrentPerUser: 5, maxConcurrentGlobal: 2, maxInflightBytes: 10_000 });
    limited.reserve("student-a", 1);
    limited.reserve("student-b", 1);
    expect(statusOf(() => limited.reserve("student-c", 1))).toBe(503);
  });

  it("rejects with 503 when the in-flight byte budget is exhausted", () => {
    const limited = new AssignmentUploadQuota({ maxConcurrentPerUser: 5, maxConcurrentGlobal: 10, maxInflightBytes: 150 });
    limited.reserve("student-a", 100);
    expect(statusOf(() => limited.reserve("student-b", 100))).toBe(503);
  });

  it("releases each reservation exactly once, and a second release is a no-op", () => {
    const limited = new AssignmentUploadQuota({ maxConcurrentPerUser: 1, maxConcurrentGlobal: 1, maxInflightBytes: 100 });
    const release = limited.reserve("student-a", 100);
    release();
    release();
    expect(limited.snapshot()).toEqual({ users: 0, inflightRequests: 0, inflightBytes: 0 });
    expect(() => limited.reserve("student-a", 100)).not.toThrow();
  });
});

describe("assignment content validation", () => {
  it("accepts the signature that matches each allowed extension", () => {
    expect(matchesAssignmentSignature(PDF_BYTES.subarray(0, 16), ".pdf")).toBe(true);
    expect(matchesAssignmentSignature(PNG_BYTES.subarray(0, 16), ".png")).toBe(true);
    expect(matchesAssignmentSignature(JPEG_BYTES.subarray(0, 16), ".jpg")).toBe(true);
    expect(matchesAssignmentSignature(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), ".doc")).toBe(true);
    expect(matchesAssignmentSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04]), ".docx")).toBe(true);
    expect(matchesAssignmentSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04]), ".zip")).toBe(true);
  });

  it("rejects an empty header, a PNG extension with JPEG bytes, and an unlisted extension", () => {
    expect(matchesAssignmentSignature(Buffer.alloc(0), ".pdf")).toBe(false);
    expect(matchesAssignmentSignature(JPEG_BYTES.subarray(0, 16), ".png")).toBe(false);
    expect(matchesAssignmentSignature(EXECUTABLE_BYTES.subarray(0, 16), ".exe")).toBe(false);
  });

  it("rejects a spoofed PDF whose content is an executable, and accepts a genuine PDF", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "assignment-upload-spoof-"));
    try {
      const spoofed = path.join(dir, "spoofed.bin");
      writeFileSync(spoofed, EXECUTABLE_BYTES);
      await expect(assertAssignmentFileContent({ path: spoofed, originalname: "essay.pdf", mimetype: "application/pdf" }))
        .rejects.toMatchObject({ statusCode: 400 });

      const genuine = path.join(dir, "genuine.bin");
      writeFileSync(genuine, PDF_BYTES);
      await expect(assertAssignmentFileContent({ path: genuine, originalname: "essay.pdf", mimetype: "application/pdf" }))
        .resolves.toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("assignment attachment HTTP intake", () => {
  it("streams a valid submission to storage from a temporary file and removes that file", async () => {
    const body = multipartBody([
      filePart("attachments", "essay.pdf", "application/pdf", PDF_BYTES),
      filePart("attachments", "diagram.png", "image/png", PNG_BYTES),
    ]);
    const reply = await sendUpload(port, "student-a", body);

    expect(reply.status).toBe(201);
    expect(reply.body?.data?.attachments).toEqual([
      { key: expect.stringMatching(/^assignments\/[a-f0-9]{32}\.pdf$/) as unknown as string, name: "essay.pdf" },
      { key: expect.stringMatching(/^assignments\/[a-f0-9]{32}\.png$/) as unknown as string, name: "diagram.png" },
    ]);

    // Memory bound: disk storage carried the bytes (no Buffer on the file), and each object body is a read stream.
    expect(receivedFiles).toHaveLength(2);
    for (const file of receivedFiles) {
      expect(file).not.toHaveProperty("buffer");
      expect(typeof file.path).toBe("string");
    }
    const puts = vi.mocked(minioClient.putObject).mock.calls;
    expect(puts).toHaveLength(2);
    for (const call of puts) {
      expect(call[2]).toBeInstanceOf(ReadStream);
      expect(Buffer.isBuffer(call[2])).toBe(false);
      expect(call[3]).toBeGreaterThan(0);
    }

    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after success");
    expect(tempFiles()).toEqual([]);
  });

  it("rejects a spoofed file whose content does not match its declared type, and leaves nothing behind", async () => {
    const body = multipartBody([filePart("attachments", "essay.pdf", "application/pdf", EXECUTABLE_BYTES)]);
    const reply = await sendUpload(port, "student-a", body);

    expect(reply.status).toBe(400);
    expect(reply.body?.message).toBe("Uploaded file content does not match its declared type");
    expect(vi.mocked(minioClient.putObject)).not.toHaveBeenCalled();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after rejection");
    expect(tempFiles()).toEqual([]);
  });

  it("rejects a mismatched extension and MIME type, and a disallowed file type, before any object is written", async () => {
    const mismatched = await sendUpload(port, "student-a", multipartBody([
      filePart("attachments", "photo.png", "image/jpeg", JPEG_BYTES),
    ]));
    expect(mismatched.status).toBe(400);

    const executable = await sendUpload(port, "student-a", multipartBody([
      filePart("attachments", "run.exe", "application/pdf", EXECUTABLE_BYTES),
    ]));
    expect(executable.status).toBe(400);
    expect(executable.body?.message).toMatch(/Invalid file type for assignment attachment/);

    expect(vi.mocked(minioClient.putObject)).not.toHaveBeenCalled();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after type rejection");
    expect(tempFiles()).toEqual([]);
  });

  it("rejects a malformed multipart body with 400 and releases the reservation", async () => {
    const junk = "this is not multipart at all";
    const { req, response } = openUpload(port, "student-a", Buffer.byteLength(junk));
    req.end(junk);
    const reply = await response;
    expect(reply.status).toBe(400);
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after malformed body");
    expect(tempFiles()).toEqual([]);
  });

  it("rejects a single file over 20MB with 413 and removes its partial temporary file", async () => {
    const oversized = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(20 * MIB + 1024, 0x20)]);
    const reply = await sendUpload(port, "student-a", multipartBody([
      filePart("attachments", "huge.pdf", "application/pdf", oversized),
    ]));
    expect(reply.status).toBe(413);
    expect(vi.mocked(minioClient.putObject)).not.toHaveBeenCalled();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after size rejection");
    expect(tempFiles()).toEqual([]);
  });

  it("rejects a declared body above the 5-file request limit with 413 before reserving any quota", async () => {
    const { req, response } = openUpload(port, "student-a", ASSIGNMENT_MAX_REQUEST_BYTES + 1);
    openRequests.push(req);
    const reply = await response;
    expect(reply.status).toBe(413);
    expect(quota.snapshot().inflightRequests).toBe(0);
  });
});

describe("assignment admission control over HTTP", () => {
  it("answers simultaneous maximum-size uploads with 503 once the in-flight byte budget is full", async () => {
    await stopServer();
    await startServer({ maxConcurrentPerUser: 5, maxConcurrentGlobal: 50, maxInflightBytes: ASSIGNMENT_MAX_REQUEST_BYTES + MIB });

    // Student A starts a maximum-size submission and holds it open after the first megabyte.
    const first = openUpload(port, "student-a", ASSIGNMENT_MAX_REQUEST_BYTES);
    openRequests.push(first.req);
    first.req.write(filePart("attachments", "big.pdf", "application/pdf", Buffer.concat([PDF_BYTES, Buffer.alloc(MIB, 0x20)])));
    await waitFor(() => quota.snapshot().inflightRequests === 1, "first maximum-size upload reserved");
    await waitFor(() => tempFiles().length === 1, "first upload staged on disk");
    expect(quota.snapshot().inflightBytes).toBe(ASSIGNMENT_MAX_REQUEST_BYTES);

    // A second maximum-size submission from another student has no budget left. It is refused on its declared size.
    const second = openUpload(port, "student-b", ASSIGNMENT_MAX_REQUEST_BYTES);
    openRequests.push(second.req);
    const secondReply = await second.response;
    expect(secondReply.status).toBe(503);
    expect(secondReply.body?.message).toMatch(/too many attachment uploads/);
    second.req.destroy();

    // Client disconnect releases the first reservation and deletes its partial file.
    first.req.destroy();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after disconnect");
    expect(quota.snapshot().inflightBytes).toBe(0);
    await waitFor(() => tempFiles().length === 0, "temporary file removed after disconnect");

    const retry = await sendUpload(port, "student-b", multipartBody([filePart("attachments", "a.pdf", "application/pdf", PDF_BYTES)]));
    expect(retry.status).toBe(201);
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after retry");
  });

  it("answers a second concurrent submission from the same student with 429", async () => {
    await stopServer();
    await startServer({ maxConcurrentPerUser: 1, maxConcurrentGlobal: 50, maxInflightBytes: 1024 * MIB });

    const held = openUpload(port, "student-a", 4 * MIB);
    openRequests.push(held.req);
    held.req.write(Buffer.from(`--${BOUNDARY}\r\n`));
    await waitFor(() => quota.snapshot().inflightRequests === 1, "first upload reserved");

    const extra = await sendUpload(port, "student-a", multipartBody([filePart("attachments", "a.pdf", "application/pdf", PDF_BYTES)]));
    expect(extra.status).toBe(429);
    expect(extra.body?.message).toMatch(/Too many attachment uploads/);

    held.req.destroy();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released");
  });

  it("answers with 503 when the global concurrent request limit is reached, across different students", async () => {
    await stopServer();
    await startServer({ maxConcurrentPerUser: 5, maxConcurrentGlobal: 2, maxInflightBytes: 1024 * MIB });

    const a = openUpload(port, "student-a", 1024);
    const b = openUpload(port, "student-b", 1024);
    openRequests.push(a.req, b.req);
    a.req.write(Buffer.from(`--${BOUNDARY}\r\n`));
    b.req.write(Buffer.from(`--${BOUNDARY}\r\n`));
    await waitFor(() => quota.snapshot().inflightRequests === 2, "two uploads reserved");

    const c = await sendUpload(port, "student-c", multipartBody([filePart("attachments", "a.pdf", "application/pdf", PDF_BYTES)]));
    expect(c.status).toBe(503);

    a.req.destroy();
    b.req.destroy();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released");
  });
});

describe("assignment storage failures and disconnects", () => {
  it("removes already-stored objects and temporary files when a later object write fails, and reports 503", async () => {
    vi.mocked(minioClient.putObject)
      .mockImplementationOnce(async (_bucket, _key, body) => { for await (const _c of body as Readable) { /* drain */ } return stored; })
      .mockRejectedValueOnce(new Error("connection refused"));

    const reply = await sendUpload(port, "student-a", multipartBody([
      filePart("attachments", "essay.pdf", "application/pdf", PDF_BYTES),
      filePart("attachments", "diagram.png", "image/png", PNG_BYTES),
    ]));

    expect(reply.status).toBe(503);
    expect(reply.body?.message).toMatch(/storage is unavailable/);
    expect(minioClient.removeObject).toHaveBeenCalledTimes(1);
    expect(vi.mocked(minioClient.removeObject).mock.calls[0][1]).toMatch(/^assignments\/.*\.pdf$/);
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after storage failure");
    expect(tempFiles()).toEqual([]);
  });

  it("keeps the reservation until the handler finishes when the client disconnects during storage, then releases it", async () => {
    let finishStorage!: () => void;
    const storageGate = new Promise<void>((resolve) => { finishStorage = resolve; });
    let storageStarted!: () => void;
    const started = new Promise<void>((resolve) => { storageStarted = resolve; });
    vi.mocked(minioClient.putObject).mockImplementationOnce(async () => {
      storageStarted();
      await storageGate;
      return stored;
    });

    const body = multipartBody([filePart("attachments", "essay.pdf", "application/pdf", PDF_BYTES)]);
    const { req } = openUpload(port, "student-a", body.length);
    req.end(body);
    await started;

    req.destroy();
    await new Promise((resolve) => setTimeout(resolve, 50));
    // The handler still owns the temporary file, so the quota must still be held.
    expect(quota.snapshot().inflightRequests).toBe(1);
    expect(tempFiles()).toHaveLength(1);

    finishStorage();
    await waitFor(() => quota.snapshot().inflightRequests === 0, "quota released after handler finished");
    await waitFor(() => tempFiles().length === 0, "temporary file removed after handler finished");
  });

  it("uploadAssignmentAttachments maps a storage failure to a 503 AppError and never throws a raw client error", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "assignment-upload-storage-"));
    try {
      const file = path.join(dir, "upload.bin");
      writeFileSync(file, PDF_BYTES);
      vi.mocked(minioClient.putObject).mockRejectedValueOnce(new Error("ECONNRESET"));
      await expect(uploadAssignmentAttachments([
        { path: file, originalname: "essay.pdf", mimetype: "application/pdf", size: PDF_BYTES.length } as Express.Multer.File,
      ])).rejects.toMatchObject({ statusCode: 503 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
