import Redis from "ioredis";
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

// Separate connection for BullMQ (recommended by BullMQ docs — don't share
// the same ioredis instance across pub/sub + queue operations)
export const bullConnection = {
  connection: new Redis(env.REDIS_URL, connectionOptions()),
};
