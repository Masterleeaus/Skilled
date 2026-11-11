/** Lesson caption tracks: WebVTT uploads stored as private objects under the managed video prefix. */
import crypto from "crypto";
import path from "path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { minioClient, MINIO_BUCKET, buildObjectKey, STORAGE_FOLDERS } from "../../config/minio";
import { AppError } from "../../utils/AppError";
import { isManagedVideoKey } from "./video-upload.service";

/** Caption files are small text. The cap keeps the in-memory upload buffer small. */
export const MAX_CAPTION_BYTES = 1024 * 1024; // 1MB

const CAPTION_MIME = new Set(["text/vtt", "text/plain", "application/octet-stream"]);
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * Multer keeps the file in memory; it is at most MAX_CAPTION_BYTES. Only the .vtt extension and a
 * permitted declared type reach the content check. Oversized files map to 413 and everything else to 400.
 */
const captionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CAPTION_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".vtt") {
      return cb(new AppError("Caption file must be a .vtt WebVTT file", 400));
    }
    if (!CAPTION_MIME.has(file.mimetype)) {
      return cb(new AppError("Caption file has an unsupported content type", 400));
    }
    cb(null, true);
  },
}).single("captions");

/** Maps multer's own errors to the API's error shape. Other errors pass through unchanged. */
function toCaptionUploadError(err: unknown): unknown {
  if (err instanceof AppError) return err;
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return new AppError("Caption file must be 1MB or smaller", 413);
    return new AppError("Malformed caption upload: send one file in the 'captions' field", 400);
  }
  return err;
}

/** Receives one caption file from the multipart body. The caller checks ownership before this runs. */
export function receiveCaptionFile(req: Request, res: Response, next: NextFunction) {
  captionUpload(req, res, (err?: unknown) => {
    if (!err) return next();
    next(toCaptionUploadError(err));
  });
}

/**
 * True when the bytes are a WebVTT file: valid UTF-8, an optional byte-order mark, then "WEBVTT"
 * followed by end of text or whitespace (WebVTT signature rule). Anything else is rejected.
 */
export function isWebVttContent(bytes: Buffer): boolean {
  const body = bytes.subarray(0, UTF8_BOM.length).equals(UTF8_BOM) ? bytes.subarray(UTF8_BOM.length) : bytes;
  if (body.subarray(0, 6).toString("latin1") !== "WEBVTT") return false;
  const next = body.subarray(6, 7);
  if (next.length === 1 && !/[ \t\r\n]/.test(next.toString("latin1"))) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  return true;
}

/** Validates a received caption file and returns its bytes. Throws 400 when the content is not WebVTT. */
export function assertCaptionFile(file: Pick<Express.Multer.File, "buffer" | "size">): Buffer {
  if (!file.buffer || file.size <= 0) throw new AppError("Caption file is empty", 400);
  if (file.size > MAX_CAPTION_BYTES) throw new AppError("Caption file must be 1MB or smaller", 413);
  if (!isWebVttContent(file.buffer)) throw new AppError("Caption file must be WebVTT (content must begin with WEBVTT)", 400);
  return file.buffer;
}

/**
 * Stores a caption file under the managed video prefix and returns its object key.
 * The key is always videos/<random>.vtt, so it passes the same guard as lesson video keys.
 */
export async function uploadLessonCaptionTrack(file: Pick<Express.Multer.File, "buffer" | "size">): Promise<string> {
  const bytes = assertCaptionFile(file);
  const objectKey = buildObjectKey(STORAGE_FOLDERS.videos, `${crypto.randomBytes(16).toString("hex")}.vtt`);
  if (!isManagedVideoKey(objectKey)) throw new AppError("Caption storage key is outside the managed prefix", 500);
  await minioClient.putObject(MINIO_BUCKET, objectKey, bytes, bytes.length, {
    "Content-Type": "text/vtt; charset=utf-8",
  });
  return objectKey; // stored as Lesson.captionTrackKey (a private MinIO object key)
}
