import multer from "multer";
import crypto from "crypto";
import os from "os";
import path from "path";
import { mkdirSync, statSync, createReadStream } from "fs";
import { open, unlink } from "fs/promises";
import type { NextFunction, Request, Response } from "express";
import { minioClient, MINIO_BUCKET, buildObjectKey, STORAGE_FOLDERS } from "../../config/minio";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "../../utils/AppError";

const MIB = 1024 * 1024;

export const ASSIGNMENT_MAX_FILES = 5;
export const ASSIGNMENT_MAX_FILE_SIZE = 20 * MIB;
// Multipart framing (boundaries, the text field and part headers) adds a little on top of the file bytes.
const MULTIPART_OVERHEAD_ALLOWANCE = 1 * MIB;
export const ASSIGNMENT_MAX_REQUEST_BYTES = ASSIGNMENT_MAX_FILES * ASSIGNMENT_MAX_FILE_SIZE + MULTIPART_OVERHEAD_ALLOWANCE;

// Defaults apply when the env values are absent (for example, in tests that mock the env module).
export const DEFAULT_MAX_CONCURRENT_ASSIGNMENT_UPLOADS_PER_USER = 2;
export const DEFAULT_MAX_CONCURRENT_ASSIGNMENT_UPLOADS_GLOBAL = 8;
export const DEFAULT_MAX_INFLIGHT_ASSIGNMENT_UPLOAD_BYTES = 512 * MIB;

const PDF_MAGIC = Buffer.from("%PDF-", "latin1");
const OLE_COMPOUND_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const ZIP_LOCAL_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const ZIP_EMPTY_MAGIC = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const SIGNATURE_READ_BYTES = 16;

interface AssignmentFileType {
  mimetype: string;
  signatures: Buffer[];
}

// The extension must agree with the declared MIME type, and the leading bytes must agree with both.
const ASSIGNMENT_FILE_TYPES = new Map<string, AssignmentFileType>([
  [".pdf", { mimetype: "application/pdf", signatures: [PDF_MAGIC] }],
  [".doc", { mimetype: "application/msword", signatures: [OLE_COMPOUND_MAGIC] }],
  [".docx", {
    mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signatures: [ZIP_LOCAL_MAGIC],
  }],
  [".zip", { mimetype: "application/zip", signatures: [ZIP_LOCAL_MAGIC, ZIP_EMPTY_MAGIC] }],
  [".png", { mimetype: "image/png", signatures: [PNG_MAGIC] }],
  [".jpg", { mimetype: "image/jpeg", signatures: [JPEG_MAGIC] }],
  [".jpeg", { mimetype: "image/jpeg", signatures: [JPEG_MAGIC] }],
]);

const ALLOWED_TYPES_MESSAGE = "Invalid file type for assignment attachment. Allowed: pdf, doc, docx, zip, png, jpg";

// Multer writes each attachment to a private temporary file instead of a Buffer in the Node.js heap.
// Mode 0700 keeps other local accounts from reading student work while it is staged.
const uploadTmpDir = path.join(os.tmpdir(), `titan-academy-assignment-uploads-${process.getuid?.() ?? "app"}`);
mkdirSync(uploadTmpDir, { recursive: true, mode: 0o700 });
const tmpInfo = statSync(uploadTmpDir);
if (!tmpInfo.isDirectory() || (tmpInfo.mode & 0o077) !== 0 ||
    (process.getuid && tmpInfo.uid !== process.getuid())) {
  throw new Error("Academy assignment upload temporary directory is not private or owned by this process");
}
export const assignmentUploadTmpDir = uploadTmpDir;

/**
 * Counts in-flight assignment uploads per user, across all users, and the bytes they may occupy in
 * temporary storage. reserve() throws 429 when the user is at the per-user limit, and 503 when the
 * global request or byte budget is full. The returned release function is idempotent.
 */
export class AssignmentUploadQuota {
  private readonly perUser = new Map<string, number>();
  private inflightRequests = 0;
  private inflightBytes = 0;

  constructor(
    private readonly limits: { maxConcurrentPerUser: number; maxConcurrentGlobal: number; maxInflightBytes: number },
  ) {}

  reserve(userId: string, bytes: number): () => void {
    const current = this.perUser.get(userId) ?? 0;
    if (current >= this.limits.maxConcurrentPerUser) {
      throw new AppError("Too many attachment uploads are already in progress for this account. Wait for one to finish, then try again.", 429);
    }
    if (this.inflightRequests >= this.limits.maxConcurrentGlobal ||
        this.inflightBytes + bytes > this.limits.maxInflightBytes) {
      throw new AppError("The server is receiving too many attachment uploads right now. Try again in a few minutes.", 503);
    }
    this.perUser.set(userId, current + 1);
    this.inflightRequests += 1;
    this.inflightBytes += bytes;

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const remaining = (this.perUser.get(userId) ?? 1) - 1;
      if (remaining <= 0) this.perUser.delete(userId);
      else this.perUser.set(userId, remaining);
      this.inflightRequests -= 1;
      this.inflightBytes -= bytes;
    };
  }

  snapshot() {
    return { users: this.perUser.size, inflightRequests: this.inflightRequests, inflightBytes: this.inflightBytes };
  }
}

export const assignmentUploadQuota = new AssignmentUploadQuota({
  maxConcurrentPerUser: env.ASSIGNMENT_UPLOAD_MAX_CONCURRENT_PER_USER ?? DEFAULT_MAX_CONCURRENT_ASSIGNMENT_UPLOADS_PER_USER,
  maxConcurrentGlobal: env.ASSIGNMENT_UPLOAD_MAX_CONCURRENT_GLOBAL ?? DEFAULT_MAX_CONCURRENT_ASSIGNMENT_UPLOADS_GLOBAL,
  maxInflightBytes: env.ASSIGNMENT_UPLOAD_MAX_INFLIGHT_BYTES ?? DEFAULT_MAX_INFLIGHT_ASSIGNMENT_UPLOAD_BYTES,
});

/**
 * Per-request state. The quota reservation and the temporary files live here, so a request
 * that fails, is rejected, or disconnects releases both. `processing` is set once the route
 * handler owns the files. Until then, the response's close event cleans up. After that, the
 * handler's finally block does.
 */
interface UploadLease {
  release: () => void;
  tempFiles: Set<string>;
  processing: boolean;
  disposed: boolean;
}

const leases = new WeakMap<object, UploadLease>();

async function disposeLease(lease: UploadLease): Promise<void> {
  if (lease.disposed) return;
  lease.disposed = true;
  lease.release();
  const files = [...lease.tempFiles];
  lease.tempFiles.clear();
  await Promise.all(
    files.map((file) =>
      unlink(file).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") logger.warn(`Could not remove temporary assignment upload: ${error.message}`);
      }),
    ),
  );
}

/**
 * Reserves quota before multer writes any bytes to disk. The reservation uses the declared
 * Content-Length, which bounds the body. Chunked requests reserve the maximum request size.
 * If the response closes before the handler takes over, the reservation is released and the
 * temporary files are removed. That covers rejection, failure and client disconnect.
 */
export function createAssignmentUploadReservation(quota: AssignmentUploadQuota) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers["content-length"];
      const declared = header === undefined ? NaN : Number(header);
      if (Number.isFinite(declared) && declared > ASSIGNMENT_MAX_REQUEST_BYTES) {
        throw new AppError("Attachments exceed the request limit of 5 files of 20MB each", 413);
      }
      const bytes = Number.isFinite(declared) && declared >= 0 ? declared : ASSIGNMENT_MAX_REQUEST_BYTES;
      const release = quota.reserve(req.user!.userId, bytes);
      const lease: UploadLease = { release, tempFiles: new Set<string>(), processing: false, disposed: false };
      leases.set(req, lease);
      res.once("close", () => {
        if (!lease.processing) void disposeLease(lease);
      });
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const reserveAssignmentUploadSlot = createAssignmentUploadReservation(assignmentUploadQuota);

function extensionOf(filename: string): string {
  return path.extname(filename).toLowerCase();
}

const receiveAttachments = multer({
  storage: multer.diskStorage({
    destination: uploadTmpDir,
    filename: (req, _file, cb) => {
      const lease = leases.get(req);
      if (!lease) return cb(new AppError("Upload reservation missing", 500), "");
      if (lease.disposed) return cb(new AppError("The upload was interrupted", 400), "");
      const name = `titan-academy-assignment-${crypto.randomUUID()}`;
      lease.tempFiles.add(path.join(uploadTmpDir, name));
      cb(null, name);
    },
  }),
  limits: {
    fileSize: ASSIGNMENT_MAX_FILE_SIZE,
    files: ASSIGNMENT_MAX_FILES,
    fields: 2,
    parts: ASSIGNMENT_MAX_FILES + 2,
  },
  fileFilter: (_req, file, cb) => {
    const type = ASSIGNMENT_FILE_TYPES.get(extensionOf(file.originalname));
    if (!type || type.mimetype !== file.mimetype) {
      return cb(new AppError(ALLOWED_TYPES_MESSAGE, 400));
    }
    cb(null, true);
  },
}).array("attachments", ASSIGNMENT_MAX_FILES);

function toUploadError(err: unknown): unknown {
  if (err instanceof AppError) return err;
  if (!(err instanceof multer.MulterError)) {
    // Filesystem errors carry a code (for example ENOSPC). They are server-side and retryable.
    // Parser errors from a malformed body do not, and are client errors.
    if (typeof (err as NodeJS.ErrnoException | undefined)?.code === "string") {
      logger.error(`Assignment attachment storage failed: ${(err as Error).message}`);
      return new AppError("Attachment storage is unavailable. Try again later.", 503);
    }
    return new AppError("Malformed attachment upload", 400);
  }
  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return new AppError("Each attachment must be 20MB or smaller", 413);
    case "LIMIT_FILE_COUNT":
    case "LIMIT_PART_COUNT":
      return new AppError(`A submission can include at most ${ASSIGNMENT_MAX_FILES} attachments`, 400);
    case "LIMIT_UNEXPECTED_FILE":
      return new AppError("Attachments must be sent in the 'attachments' field", 400);
    default:
      return new AppError("Malformed attachment upload", 400);
  }
}

/** Streams the multipart body to private temporary files. Multer removes its partial files on error. */
export function receiveAssignmentAttachments(req: Request, res: Response, next: NextFunction) {
  receiveAttachments(req, res, (err?: unknown) => {
    if (!err) return next();
    next(toUploadError(err));
  });
}

/** True when the leading bytes of a file match one of the signatures for its declared type. */
export function matchesAssignmentSignature(header: Buffer, extension: string): boolean {
  const type = ASSIGNMENT_FILE_TYPES.get(extension);
  if (!type) return false;
  return type.signatures.some((signature) => header.subarray(0, signature.length).equals(signature));
}

/**
 * Checks one stored attachment: the extension must agree with the declared MIME type, and the
 * content must start with that type's magic bytes. The client's MIME header is not trusted alone.
 */
export async function assertAssignmentFileContent(
  file: Pick<Express.Multer.File, "path" | "originalname" | "mimetype">,
): Promise<void> {
  const extension = extensionOf(file.originalname);
  const type = ASSIGNMENT_FILE_TYPES.get(extension);
  if (!type || type.mimetype !== file.mimetype) {
    throw new AppError("File extension does not match its declared type", 400);
  }
  if (!file.path) throw new AppError("Uploaded attachment temporary file missing", 500);

  const handle = await open(file.path, "r");
  let header: Buffer;
  try {
    const buffer = Buffer.alloc(SIGNATURE_READ_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, SIGNATURE_READ_BYTES, 0);
    header = buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
  if (!matchesAssignmentSignature(header, extension)) {
    throw new AppError("Uploaded file content does not match its declared type", 400);
  }
}

/** Runs after multer. A rejected file releases the request's quota and removes all of its temporary files. */
export async function verifyAssignmentAttachments(req: Request, _res: Response, next: NextFunction) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return next();
  try {
    for (const file of files) {
      await assertAssignmentFileContent(file);
    }
  } catch (err) {
    const lease = leases.get(req);
    if (lease) await disposeLease(lease);
    return next(err);
  }
  next();
}

/** Called by the route handler before it reads the files. Fails if the client disconnected first. */
export function beginAssignmentUpload(req: Request): void {
  const lease = leases.get(req);
  if (!lease) throw new AppError("Upload reservation missing", 500);
  if (lease.disposed) throw new AppError("The upload was interrupted before it could be processed", 400);
  lease.processing = true;
}

/** Called in the route handler's finally block. Releases quota and removes any remaining temporary files. */
export async function finishAssignmentUpload(req: Request): Promise<void> {
  const lease = leases.get(req);
  if (lease) await disposeLease(lease);
}

/** Display names are stored as text. Drop any path and control characters, and cap the length. */
function displayName(originalname: string): string {
  const visible = [...path.basename(originalname.replace(/\\/g, "/"))]
    .filter((char) => char.charCodeAt(0) >= 0x20 && char.charCodeAt(0) !== 0x7f)
    .join("");
  const cleaned = visible.trim().slice(0, 255);
  return cleaned || "attachment";
}

export async function removeAssignmentAttachments(attachments: { key: string }[]) {
  await Promise.allSettled(attachments.map(({ key }) => minioClient.removeObject(MINIO_BUCKET, key)));
}

/**
 * Streams each verified temporary file to object storage. The object body is a read stream, so no whole
 * file is buffered in memory. Each temporary file is removed as soon as its upload settles. If any upload
 * fails, the objects already stored for this submission are removed.
 */
export async function uploadAssignmentAttachments(
  files: Express.Multer.File[],
): Promise<{ key: string; name: string }[]> {
  const uploaded: { key: string; name: string }[] = [];
  try {
    for (const file of files) {
      if (!file.path) throw new AppError("Uploaded attachment temporary file missing", 500);
      const extension = extensionOf(file.originalname);
      const randomName = `${crypto.randomBytes(16).toString("hex")}${extension}`;
      const objectKey = buildObjectKey(STORAGE_FOLDERS.assignments, randomName);

      const body = createReadStream(file.path);
      // A failed or skipped read must not surface as an unhandled stream error during cleanup.
      body.on("error", () => undefined);
      try {
        await minioClient.putObject(MINIO_BUCKET, objectKey, body, file.size, {
          "Content-Type": file.mimetype,
        });
      } finally {
        // Wait for the descriptor to close before unlinking, so the cleanup cannot race a pending open.
        await new Promise<void>((resolve) => {
          if (body.closed) return resolve();
          body.once("close", () => resolve());
          body.destroy();
        });
        await unlink(file.path).catch(() => undefined);
      }
      uploaded.push({ key: objectKey, name: displayName(file.originalname) });
    }
    return uploaded;
  } catch (error) {
    await removeAssignmentAttachments(uploaded);
    if (error instanceof AppError) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    logger.error(`Assignment attachment upload to object storage failed: ${reason}`);
    throw new AppError("Attachment storage is unavailable. Try again later.", 503);
  }
}
