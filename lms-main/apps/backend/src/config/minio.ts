import { Client } from "minio";
import { env } from "./env";
import { logger } from "./logger";

export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const MINIO_BUCKET = env.MINIO_BUCKET;

// Folder separation by type, per security checklist (section 11)
export const STORAGE_FOLDERS = {
  videos: "videos",
  images: "images",
  certificates: "certificates",
  assignments: "assignments",
} as const;

export async function ensureBucketExists() {
  // Never hide connectivity / authentication failures as "bucket missing":
  // attempting makeBucket on an unavailable server obscures the real fault.
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(MINIO_BUCKET);
    logger.info(`MinIO bucket "${MINIO_BUCKET}" created`);
  }
}

export function buildObjectKey(
  folder: (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS],
  randomFileName: string,
) {
  return `${folder}/${randomFileName}`;
}
