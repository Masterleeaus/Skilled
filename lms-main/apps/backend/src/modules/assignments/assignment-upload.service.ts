import multer from "multer";
import crypto from "crypto";
import path from "path";
import { minioClient, MINIO_BUCKET, buildObjectKey, STORAGE_FOLDERS } from "../../config/minio";
import { AppError } from "../../utils/AppError";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "image/png",
  "image/jpeg",
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const uploadAssignmentFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new AppError("Invalid file type for assignment attachment", 400));
    }
    cb(null, true);
  },
});

export async function removeAssignmentAttachments(attachments: { key: string }[]) {
  await Promise.allSettled(attachments.map(({ key }) => minioClient.removeObject(MINIO_BUCKET, key)));
}

export async function uploadAssignmentAttachments(
  files: Express.Multer.File[],
): Promise<{ key: string; name: string }[]> {
  const uploaded = [];
  try {
  for (const file of files) {
    const randomName = `${crypto.randomBytes(16).toString("hex")}${path.extname(file.originalname)}`;
    const objectKey = buildObjectKey(STORAGE_FOLDERS.assignments, randomName);

    await minioClient.putObject(MINIO_BUCKET, objectKey, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });

    uploaded.push({ key: objectKey, name: file.originalname });
  }
  return uploaded;
  } catch (error) {
    await removeAssignmentAttachments(uploaded);
    throw error;
  }
}
