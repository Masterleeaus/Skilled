import { startEmailWorker } from "./jobs/email.worker";
import { startCertificateWorker } from "./jobs/certificate.worker";
import { emailQueue } from "./jobs/email.queue";
import { certificateQueue } from "./jobs/certificate.queue";
import { prisma } from "./config/prisma";
import { redis, bullConnection } from "./config/redis";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { drainVideoObjectCleanup } from "./modules/courses/video-upload.service";

// Failed lesson video removals are retried from the VideoObjectCleanup table.
const VIDEO_CLEANUP_INTERVAL_MS = 60 * 1000;

let videoCleanupRun: Promise<void> | null = null;

/** Runs one drain pass. Overlapping ticks are skipped, so a slow pass never runs twice at once. */
function runVideoCleanupDrain(): Promise<void> {
  if (videoCleanupRun) return videoCleanupRun;
  videoCleanupRun = (async () => {
    try {
      const result = await drainVideoObjectCleanup();
      if (result.completed || result.failed || result.rejected) {
        logger.info(`Lesson video cleanup: ${result.completed} removed, ${result.failed} still failing, ${result.rejected} rejected`);
      }
    } catch (error) {
      logger.error("Lesson video cleanup drain failed", error);
    } finally {
      videoCleanupRun = null;
    }
  })();
  return videoCleanupRun;
}

async function start() {
  await prisma.$queryRaw`SELECT 1`;
  if (await redis.ping() !== "PONG") throw new Error("Redis readiness check failed");
  const email = startEmailWorker();
  const certificate = startCertificateWorker();
  const videoCleanupTimer = setInterval(() => { void runVideoCleanupDrain(); }, VIDEO_CLEANUP_INTERVAL_MS);
  void runVideoCleanupDrain();
  logger.info(`Skilled workers started [${env.NODE_ENV}]`);

  let closing = false;
  const stop = async () => {
    if (closing) return;
    closing = true;
    logger.info("Stopping Skilled workers");
    try {
      clearInterval(videoCleanupTimer);
      await videoCleanupRun;
      await Promise.all([email.close(), certificate.close()]);
      await Promise.all([emailQueue.close(), certificateQueue.close()]);
      await Promise.all([prisma.$disconnect(), redis.quit(), bullConnection.connection.quit()]);
      process.exitCode = 0;
    } catch (error) {
      logger.error("Academy worker shutdown failed", error);
      process.exitCode = 1;
    }
  };
  process.on("SIGINT", () => { void stop(); });
  process.on("SIGTERM", () => { void stop(); });
}

start().catch((error) => {
  logger.error("Skilled workers failed to start", error);
  process.exitCode = 1;
  // Redis/BullMQ may have open handles even when startup fails.
  void Promise.allSettled([redis.disconnect(), bullConnection.connection.disconnect()]);
  process.exit(1);
});
