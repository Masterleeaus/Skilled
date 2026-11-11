/** Private Academy video delivery: browsers never need the MinIO address or keys. */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { pipeline } from "stream/promises";
import { env } from "../../config/env";
import { minioClient, MINIO_BUCKET } from "../../config/minio";
import { AppError } from "../../utils/AppError";

export const PLAYBACK_COOKIE = "academyPlayback";
export const PLAYBACK_COOKIE_PATH = "/api/courses/lessons";
/** Restrict each playback grant to one stream path so simultaneous lessons do not
 * overwrite one another's cookies. Encode the lesson ID to prevent path injection. */
export function playbackCookiePath(lessonId: string): string {
  if (!lessonId || !/^[a-zA-Z0-9_-]+$/.test(lessonId)) {
    throw new AppError("Invalid lesson identifier", 400);
  }
  return `${PLAYBACK_COOKIE_PATH}/${encodeURIComponent(lessonId)}/video/stream`;
}
const playbackSecret = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET)
  .update("academy-playback-grant-v1").digest("hex");

export function createPlaybackGrant(lessonId: string, userId: string): string {
  return jwt.sign({ lessonId, userId, purpose: "academy-video" }, playbackSecret, {
    algorithm: "HS256", audience: "academy-video", issuer: "titan-academy", expiresIn: "1h",
  });
}

export function verifyPlaybackGrant(token: string, lessonId: string): string {
  let claims: string | jwt.JwtPayload;
  try {
    claims = jwt.verify(token, playbackSecret, {
      algorithms: ["HS256"], audience: "academy-video", issuer: "titan-academy",
    });
  } catch {
    throw new AppError("Video playback grant expired or invalid", 401);
  }
  if (typeof claims === "string" || claims.purpose !== "academy-video" ||
      claims.lessonId !== lessonId || typeof claims.userId !== "string" || !claims.userId) {
    throw new AppError("Video playback grant does not match lesson", 403);
  }
  return claims.userId;
}

/** RFC 9110 single byte ranges only; reject multipart and invalid ranges. */
export function resolveByteRange(range: string | undefined, size: number):
  { start: number; end: number; partial: boolean } | null {
  if (!Number.isSafeInteger(size) || size <= 0) return null;
  if (!range) return { start: 0, end: size - 1, partial: false };
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix < 1) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return null;
    end = Math.min(end, size - 1);
  }
  return { start, end, partial: true };
}

function videoMime(objectKey: string): string {
  const ext = objectKey.toLowerCase().split(".").pop();
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return "video/mp4";
}

/**
 * Stream small byte windows for browser seeking. No public object-storage ports.
 * contentType overrides the video MIME guess; caption tracks pass text/vtt.
 */
export async function streamPrivateVideo(req: Request, res: Response, objectKey: string, contentType?: string) {
  if (!/^videos\/[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9]+)?$/.test(objectKey)) {
    throw new AppError("Invalid private video object", 404);
  }
  const stat = await minioClient.statObject(MINIO_BUCKET, objectKey);
  const size = stat.size;
  const selected = resolveByteRange(typeof req.headers.range === "string" ? req.headers.range : undefined, size);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Vary", "Cookie");
  if (!selected) {
    res.status(416).setHeader("Content-Range", `bytes */${size}`);
    res.end();
    return;
  }
  const { start, end, partial } = selected;
  res.status(partial ? 206 : 200);
  res.setHeader("Content-Type", contentType ?? videoMime(objectKey));
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Content-Length", String(end - start + 1));
  if (partial) res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  if (req.method === "HEAD") { res.end(); return; }
  const stream = partial
    ? await minioClient.getPartialObject(MINIO_BUCKET, objectKey, start, end - start + 1)
    : await minioClient.getObject(MINIO_BUCKET, objectKey);
  try {
    await pipeline(stream, res);
  } catch (error) {
    // A client disconnect is expected during seeking; abort upstream reads.
    stream.destroy();
    if (!res.headersSent) throw error;
    if (!res.destroyed) res.destroy(error instanceof Error ? error : undefined);
  }
}
