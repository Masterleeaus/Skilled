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

// Outside production, bucket creation is retried with these delays before the API
// starts without object storage. Production never degrades: the failure is fatal.
const BUCKET_RETRY_DELAYS_MS = [500, 1000, 2000, 4000];

let storageReady = false;

/** True only after the bucket was confirmed or created during startup. */
export function isStorageReady() {
  return storageReady;
}

/**
 * Prepares object storage at startup. Production: throws on failure (fatal).
 * Other environments: retries with backoff, then logs a warning and resolves
 * false so the API can still start with storage uploads disabled.
 */
export async function initializeStorage(): Promise<boolean> {
  const isProduction = env.NODE_ENV === "production";
  for (let attempt = 0; ; attempt++) {
    try {
      await ensureBucketExists();
      storageReady = true;
      return true;
    } catch (error) {
      if (isProduction) throw error;
      if (attempt >= BUCKET_RETRY_DELAYS_MS.length) {
        const endpoint = `${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`;
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          `MinIO object storage unavailable at ${endpoint} (bucket "${MINIO_BUCKET}", ${attempt + 1} attempts: ${reason}). ` +
            "Storage uploads are disabled and storage health reports down until the API is restarted with MinIO reachable. The API continues to start.",
        );
        return false;
      }
      logger.warn(`MinIO not ready at ${env.MINIO_ENDPOINT}:${env.MINIO_PORT}, retrying bucket setup (attempt ${attempt + 2})`);
      await new Promise((resolve) => setTimeout(resolve, BUCKET_RETRY_DELAYS_MS[attempt]));
    }
  }
}

export function buildObjectKey(
  folder: (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS],
  randomFileName: string,
) {
  return `${folder}/${randomFileName}`;
}
