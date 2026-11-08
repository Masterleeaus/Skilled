import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { redis } from "../config/redis";
import { minioClient, MINIO_BUCKET } from "../config/minio";
import { sendSuccess } from "../utils/response";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  const checks: Record<string, "ok" | "down"> = {
    database: "down",
    redis: "down",
    storage: "down",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "down";
  }

  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "ok" : "down";
  } catch {
    checks.redis = "down";
  }

  try {
    await minioClient.bucketExists(MINIO_BUCKET);
    checks.storage = "ok";
  } catch {
    checks.storage = "down";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return sendSuccess(
    res,
    { checks, healthy: allOk },
    allOk ? "All systems operational" : "One or more dependencies are down",
    allOk ? 200 : 503,
  );
});

export default router;
