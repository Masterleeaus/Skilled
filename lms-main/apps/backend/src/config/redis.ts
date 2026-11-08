import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error(`Redis error: ${err.message}`));

// Separate connection for BullMQ (recommended by BullMQ docs — don't share
// the same ioredis instance across pub/sub + queue operations)
export const bullConnection = {
  connection: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
};
