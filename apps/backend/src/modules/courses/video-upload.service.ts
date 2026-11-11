import multer from "multer";
import crypto from "crypto";
import path from "path";
import os from "os";
import { mkdirSync, statSync } from "fs";
import { open, readdir, lstat } from "fs/promises";
import { createReadStream } from "fs";
import { unlink } from "fs/promises";
import type { NextFunction, Request, Response } from "express";
import { minioClient, MINIO_BUCKET, buildObjectKey, STORAGE_FOLDERS } from "../../config/minio";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
// Multipart framing (boundaries and text fields) can add a little to the file size.
const MULTIPART_OVERHEAD_ALLOWANCE = 1024 * 1024;
const MAX_VIDEO_REQUEST_BYTES = MAX_VIDEO_SIZE + MULTIPART_OVERHEAD_ALLOWANCE;

// Defaults apply when the env values are absent (for example, in tests that mock the env module).
export const DEFAULT_MAX_CONCURRENT_VIDEO_UPLOADS_PER_USER = 2;
export const DEFAULT_MAX_INFLIGHT_VIDEO_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2GiB

// Extensions must agree with the declared MIME type. A mismatch is rejected.
const VIDEO_EXTENSION_MIME = new Map<string, string>([
  [".mp4", "video/mp4"],
  [".mov", "video/quicktime"],
  [".webm", "video/webm"],
]);

const EBML_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const SIGNATURE_READ_BYTES = 256;

// Multer's disk storage normally writes mode-0644 files. Keep them under a
// mode-0700 directory so other local accounts cannot read private videos.
const uploadTmpDir = path.join(os.tmpdir(), `titan-academy-uploads-${process.getuid?.() ?? "app"}`);
mkdirSync(uploadTmpDir, { recursive: true, mode: 0o700 });
const tmpInfo = statSync(uploadTmpDir);
if (!tmpInfo.isDirectory() || (tmpInfo.mode & 0o077) !== 0 ||
    (process.getuid && tmpInfo.uid !== process.getuid())) {
  throw new Error("Academy upload temporary directory is not private or owned by this process");
}

/** Temporary files written by each multer request, so they can be removed if the request ends early. */
const tempFilesByRequest = new WeakMap<object, Set<string>>();

function trackTempFile(req: object, filePath: string) {
  const files = tempFilesByRequest.get(req) ?? new Set<string>();
  files.add(filePath);
  tempFilesByRequest.set(req, files);
}

/** Deletes any temporary files still tracked for a request. Missing files are not an error. */
export async function discardTrackedTempFiles(req: object): Promise<void> {
  const files = tempFilesByRequest.get(req);
  tempFilesByRequest.delete(req);
  if (!files) return;
  await Promise.all(
    [...files].map((file) =>
      unlink(file).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") logger.warn(`Could not remove temporary video upload: ${error.message}`);
      }),
    ),
  );
}

/**
 * Counts in-flight video uploads per user and the bytes they may occupy in temporary storage.
 * reserve() throws 429 when the user is at the concurrency limit, and 503 when the byte budget is full.
 * The returned release function is idempotent.
 */
export class VideoUploadQuota {
  private readonly perUser = new Map<string, number>();
  private inflightBytes = 0;

  constructor(
    private readonly limits: { maxConcurrentPerUser: number; maxInflightBytes: number },
  ) {}

  reserve(userId: string, bytes: number): () => void {
    const current = this.perUser.get(userId) ?? 0;
    if (current >= this.limits.maxConcurrentPerUser) {
      throw new AppError("Too many video uploads are already in progress for this account. Wait for one to finish, then try again.", 429);
    }
    if (this.inflightBytes + bytes > this.limits.maxInflightBytes) {
      throw new AppError("The server is receiving too many video uploads right now. Try again in a few minutes.", 503);
    }
    this.perUser.set(userId, current + 1);
    this.inflightBytes += bytes;

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const remaining = (this.perUser.get(userId) ?? 1) - 1;
      if (remaining <= 0) this.perUser.delete(userId);
      else this.perUser.set(userId, remaining);
      this.inflightBytes -= bytes;
    };
  }

  snapshot() {
    return { users: this.perUser.size, inflightBytes: this.inflightBytes };
  }
}

export const videoUploadQuota = new VideoUploadQuota({
  maxConcurrentPerUser: env.VIDEO_UPLOAD_MAX_CONCURRENT_PER_USER ?? DEFAULT_MAX_CONCURRENT_VIDEO_UPLOADS_PER_USER,
  maxInflightBytes: env.VIDEO_UPLOAD_MAX_INFLIGHT_BYTES ?? DEFAULT_MAX_INFLIGHT_VIDEO_UPLOAD_BYTES,
});

/**
 * Reserves quota before multer writes any bytes to disk. The reservation uses the declared
 * Content-Length, which is an upper bound on the body. Chunked requests reserve the maximum.
 * The reservation is released, and tracked temporary files are removed, when the response closes.
 * That covers completion, failure and client disconnect.
 */
export function createVideoUploadReservation(quota: VideoUploadQuota) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers["content-length"];
      const declared = header === undefined ? NaN : Number(header);
      if (Number.isFinite(declared) && declared > MAX_VIDEO_REQUEST_BYTES) {
        throw new AppError("Video file exceeds the 500MB limit", 413);
      }
      const bytes = Number.isFinite(declared) && declared >= 0 ? declared : MAX_VIDEO_REQUEST_BYTES;
      const release = quota.reserve(req.user!.userId, bytes);
      res.once("close", () => {
        release();
        void discardTrackedTempFiles(req);
      });
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const reserveVideoUploadSlot = createVideoUploadReservation(videoUploadQuota);

export const uploadVideo = multer({
  // Stream multipart data to a private temporary file instead of buffering up to
  // 500MB in the Node.js heap. Multer removes its temporary file on upload errors.
  storage: multer.diskStorage({
    destination: uploadTmpDir,
    filename: (req, _file, cb) => {
      const name = `titan-academy-video-${crypto.randomUUID()}`;
      trackTempFile(req, path.join(uploadTmpDir, name));
      cb(null, name);
    },
  }),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO_MIME.has(file.mimetype)) {
      return cb(new AppError("Invalid file type. Allowed: mp4, webm, mov", 400));
    }
    if (!isConsistentVideoDeclaration(file.originalname, file.mimetype)) {
      return cb(new AppError("File extension does not match its declared video type", 400));
    }
    cb(null, true);
  },
});

/** True when the declared MIME type matches the file extension. The client's MIME header alone is not trusted. */
export function isConsistentVideoDeclaration(originalname: string, mimetype: string): boolean {
  return VIDEO_EXTENSION_MIME.get(path.extname(originalname).toLowerCase()) === mimetype;
}

/**
 * True when the leading bytes match the container for the declared MIME type.
 * MP4 and QuickTime use an ISO BMFF "ftyp" box at offset 4. WebM uses an EBML header whose DocType is "webm".
 */
export function matchesVideoSignature(header: Buffer, mimetype: string): boolean {
  if (mimetype === "video/webm") {
    return header.length >= 4 &&
      header.subarray(0, 4).equals(EBML_MAGIC) &&
      header.subarray(0, Math.min(header.length, 64)).includes("webm");
  }
  if (mimetype === "video/mp4" || mimetype === "video/quicktime") {
    if (header.length < 12 || header.subarray(4, 8).toString("latin1") !== "ftyp") return false;
    const boxSize = header.readUInt32BE(0);
    return boxSize === 1 || boxSize >= 8;
  }
  return false;
}

/** Reads the first bytes of an uploaded temporary file and checks them against the declared type. */
export async function assertVideoSignature(file: Pick<Express.Multer.File, "path" | "mimetype">): Promise<void> {
  if (!file.path) throw new AppError("Uploaded video temporary file missing", 500);
  const handle = await open(file.path, "r");
  let header: Buffer;
  try {
    const buffer = Buffer.alloc(SIGNATURE_READ_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, SIGNATURE_READ_BYTES, 0);
    header = buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
  if (!matchesVideoSignature(header, file.mimetype)) {
    throw new AppError("Uploaded file content does not match its declared video type", 400);
  }
}

/** Runs after multer. It rejects spoofed content and removes the temporary file when it does. */
export async function verifyUploadedVideo(req: Request, _res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) return next();
  try {
    if (!isConsistentVideoDeclaration(file.originalname, file.mimetype)) {
      throw new AppError("File extension does not match its declared video type", 400);
    }
    await assertVideoSignature(file);
  } catch (err) {
    if (file.path) await unlink(file.path).catch(() => undefined);
    return next(err);
  }
  next();
}

export async function uploadLessonVideo(file: Express.Multer.File): Promise<string> {
  const randomName = `${crypto.randomBytes(16).toString("hex")}${path.extname(file.originalname).toLowerCase()}`;
  const objectKey = buildObjectKey(STORAGE_FOLDERS.videos, randomName);

  if (!file.path) throw new AppError("Uploaded video temporary file missing", 500);
  try {
    await minioClient.putObject(MINIO_BUCKET, objectKey, createReadStream(file.path), file.size, {
      "Content-Type": file.mimetype,
    });
    return objectKey; // stored as Lesson.videoUrl (a private MinIO object key)
  } finally {
    // Clean up even when MinIO fails; no 500MB temporary files accumulate.
    await unlink(file.path).catch(() => undefined);
  }
}

const MANAGED_VIDEO_KEY = /^videos\/[a-f0-9]{32}(\.[a-z0-9]{1,8})?$/i;
const DRAIN_BATCH_SIZE = 50;

/** True only for keys this service writes. External URLs and other folders are never removed. */
export function isManagedVideoKey(key: string | null | undefined): key is string {
  return typeof key === "string" && MANAGED_VIDEO_KEY.test(key);
}

function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Removes lesson video objects. Call it only after the database change that made them unreferenced has committed.
 * Keys outside the managed prefix are ignored and duplicates are removed once. It never rejects.
 * Each object that fails is written to the VideoObjectCleanup table, so the worker drain retries it later.
 */
export async function removeVideoObjects(keys: ReadonlyArray<string | null | undefined>): Promise<void> {
  const failures: Array<{ objectKey: string; lastError: string }> = [];
  for (const key of new Set(keys.filter(isManagedVideoKey))) {
    try {
      await minioClient.removeObject(MINIO_BUCKET, key);
    } catch (error) {
      const reason = errorReason(error);
      logger.warn(`Lesson video object "${key}" removal failed: ${reason}. Queued for retry.`);
      failures.push({ objectKey: key, lastError: reason });
    }
  }
  if (failures.length === 0) return;
  try {
    // attempts starts at 1 because the immediate removal above was the first attempt.
    await prisma.videoObjectCleanup.createMany({
      data: failures.map((failure) => ({ ...failure, attempts: 1 })),
      skipDuplicates: true,
    });
  } catch (error) {
    logger.error(`Lesson video objects ${failures.map((f) => `"${f.objectKey}"`).join(", ")} could not be queued for removal (${errorReason(error)}). Manual cleanup required.`);
  }
}

/** Single-key form of removeVideoObjects. */
export async function removeVideoObject(key: string | null | undefined): Promise<void> {
  await removeVideoObjects([key]);
}

export interface VideoObjectCleanupDrainResult {
  completed: number;
  failed: number;
  rejected: number;
}

/**
 * Retries pending rows from VideoObjectCleanup. Safe to run repeatedly and from overlapping workers:
 * a row is marked complete only by the update that matches it while it is still pending, and an object that is
 * already gone counts as removed. A key outside the managed prefix is never deleted. Its row is closed as rejected.
 * Rows are taken oldest-first, fewest attempts first, in batches of DRAIN_BATCH_SIZE.
 */
export async function drainVideoObjectCleanup(): Promise<VideoObjectCleanupDrainResult> {
  const rows = await prisma.videoObjectCleanup.findMany({
    where: { completedAt: null },
    orderBy: [{ attempts: "asc" }, { createdAt: "asc" }],
    take: DRAIN_BATCH_SIZE,
    select: { id: true, objectKey: true },
  });
  const result: VideoObjectCleanupDrainResult = { completed: 0, failed: 0, rejected: 0 };

  for (const row of rows) {
    if (!isManagedVideoKey(row.objectKey)) {
      await prisma.videoObjectCleanup.updateMany({
        where: { id: row.id, completedAt: null },
        data: { completedAt: new Date(), lastError: "Rejected: key is outside the managed video prefix; nothing was deleted" },
      });
      logger.error(`Video cleanup row "${row.id}" has a key outside the managed prefix. It was closed without deleting anything.`);
      result.rejected++;
      continue;
    }

    try {
      await minioClient.removeObject(MINIO_BUCKET, row.objectKey);
    } catch (error) {
      const reason = errorReason(error);
      await prisma.videoObjectCleanup.updateMany({
        where: { id: row.id, completedAt: null },
        data: { attempts: { increment: 1 }, lastError: reason },
      });
      logger.warn(`Pending lesson video object "${row.objectKey}" is still not removed: ${reason}. Will retry.`);
      result.failed++;
      continue;
    }

    await prisma.videoObjectCleanup.updateMany({
      where: { id: row.id, completedAt: null },
      data: { attempts: { increment: 1 }, lastError: null, completedAt: new Date() },
    });
    result.completed++;
  }
  return result;
}

/** Cleanup for worker/process crashes. Never delete non-Academy files or symlinks. */
export async function cleanupStaleVideoUploads(now = Date.now()): Promise<number> {
  let removed = 0;
  for (const name of await readdir(uploadTmpDir)) {
    if (!/^titan-academy-video-[a-f0-9-]{36}$/.test(name)) continue;
    const candidate = path.join(uploadTmpDir, name);
    try {
      const file = await lstat(candidate);
      if (!file.isFile() || file.isSymbolicLink() || now - file.mtimeMs < 24 * 60 * 60 * 1000) continue;
      await unlink(candidate);
      removed++;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return removed;
}
