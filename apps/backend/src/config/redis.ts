import Redis from "ioredis";
import type { ConnectionOptions } from "bullmq";
import { env } from "./env";
import { logger } from "./logger";

// The password comes from REDIS_PASSWORD and is passed as an option, never embedded in REDIS_URL (see env.ts).
// Build fresh options per connection because ioredis may mutate the object it receives.
const connectionOptions = () => ({
  maxRetriesPerRequest: null, // required by BullMQ
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
});

export const redis = new Redis(env.REDIS_URL, connectionOptions());

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error(`Redis error: ${err.message}`));

// BullMQ bundles its own ioredis types, so it cannot accept a Redis instance created here once ioredis
// is upgraded past BullMQ's pinned version. It receives plain options instead and opens its own connection.
// Queue.close() and Worker.close() release that connection during shutdown.
function bullConnectionOptions(url: string): ConnectionOptions {
  const parsed = new URL(url);
  const db = Number(parsed.pathname.slice(1));
  return {
    host: parsed.hostname.replace(/^\[(.*)\]$/, "$1"),
    port: parsed.port ? Number(parsed.port) : 6379,
    ...(parsed.protocol === "rediss:" ? { tls: {} } : {}),
    ...(parsed.pathname.length > 1 && Number.isInteger(db) ? { db } : {}),
    ...connectionOptions(),
  };
}

// Separate connection for BullMQ (recommended by BullMQ docs — don't share
// the same ioredis instance across pub/sub + queue operations)
export const bullConnection: { connection: ConnectionOptions } = {
  connection: bullConnectionOptions(env.REDIS_URL),
};
