import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { initializeStorage } from "./config/minio";
import { cleanupStaleVideoUploads } from "./modules/courses/video-upload.service";
import { prisma } from "./config/prisma";
import { redis, bullConnection } from "./config/redis";
import { emailQueue } from "./jobs/email.queue";
import { certificateQueue } from "./jobs/certificate.queue";

const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: { origin: env.CLIENT_URL, credentials: true },
});

io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on("disconnect", () => logger.info(`Socket disconnected: ${socket.id}`));
});

async function start() {
  await prisma.$queryRaw`SELECT 1`;
  if (await redis.ping() !== "PONG") throw new Error("Redis readiness check failed");
  await initializeStorage();
  const staleUploadsRemoved = await cleanupStaleVideoUploads();
  if (staleUploadsRemoved) logger.info(`Cleaned ${staleUploadsRemoved} stale Academy video uploads`);

  httpServer.listen(env.PORT, env.HOST, () => {
    logger.info(`Server running on http://${env.HOST}:${env.PORT} [${env.NODE_ENV}]`);
  });
}

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Stopping Titan Academy API");
  try {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => error ? reject(error) : resolve());
    });
    await Promise.all([emailQueue.close(), certificateQueue.close()]);
    await Promise.all([prisma.$disconnect(), redis.quit(), bullConnection.connection.quit()]);
  } catch (error) {
    logger.error("Academy API shutdown failed", error);
    process.exitCode = 1;
  }
}
process.on("SIGINT", () => { void shutdown(); });
process.on("SIGTERM", () => { void shutdown(); });

start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
