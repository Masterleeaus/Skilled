import multer from "multer";
import crypto from "crypto";
import path from "path";
import os from "os";
import { mkdirSync, statSync } from "fs";
import { readdir, lstat } from "fs/promises";
import { createReadStream } from "fs";
import { unlink } from "fs/promises";
import { minioClient, MINIO_BUCKET, buildObjectKey, STORAGE_FOLDERS } from "../../config/minio";
import { AppError } from "../../utils/AppError";

const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

// Multer's disk storage normally writes mode-0644 files. Keep them under a
// mode-0700 directory so other local accounts cannot read private videos.
const uploadTmpDir = path.join(os.tmpdir(), `titan-academy-uploads-${process.getuid?.() ?? "app"}`);
mkdirSync(uploadTmpDir, { recursive: true, mode: 0o700 });
const tmpInfo = statSync(uploadTmpDir);
if (!tmpInfo.isDirectory() || (tmpInfo.mode & 0o077) !== 0 ||
    (process.getuid && tmpInfo.uid !== process.getuid())) {
  throw new Error("Academy upload temporary directory is not private or owned by this process");
}

export const uploadVideo = multer({
  // Stream multipart data to a private temporary file instead of buffering up to
  // 500MB in the Node.js heap. Multer removes its temporary file on upload errors.
  storage: multer.diskStorage({
    destination: uploadTmpDir,
    filename: (_req, _file, cb) => cb(null, `titan-academy-video-${crypto.randomUUID()}`),
  }),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO_MIME.has(file.mimetype)) {
      return cb(new AppError("Invalid file type. Allowed: mp4, webm, mov", 400));
    }
    cb(null, true);
  },
});

export async function uploadLessonVideo(file: Express.Multer.File): Promise<string> {
  const randomName = `${crypto.randomBytes(16).toString("hex")}${path.extname(file.originalname)}`;
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
