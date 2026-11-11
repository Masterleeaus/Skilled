/**
 * Central SSO login-state stores. Each record is written once per login and consumed exactly once.
 * The Redis store uses SET NX PX for the write and GETDEL for the read, so a state cannot be consumed twice
 * even across instances. The in-memory store is for tests only and must not run in production.
 */
import type { CentralStateRecord, CentralStateStore } from "./central-oidc";

export const CENTRAL_STATE_PREFIX = "central-sso:state:";

/** The subset of ioredis used here. */
export interface CentralRedisLike {
  set(key: string, value: string, px: "PX", milliseconds: number, nx: "NX"): Promise<"OK" | null>;
  getdel(key: string): Promise<string | null>;
}

export function createRedisCentralStateStore(redis: CentralRedisLike): CentralStateStore {
  return {
    async save(stateDigest, record, ttlMs) {
      const written = await redis.set(`${CENTRAL_STATE_PREFIX}${stateDigest}`, JSON.stringify(record), "PX", ttlMs, "NX");
      if (written !== "OK") throw new Error("central state collision");
    },
    async consume(stateDigest) {
      const raw = await redis.getdel(`${CENTRAL_STATE_PREFIX}${stateDigest}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as Partial<CentralStateRecord>;
        if (typeof parsed.nonce !== "string" || typeof parsed.verifier !== "string" ||
            typeof parsed.bindingHash !== "string" || typeof parsed.expiresAt !== "number") return null;
        return { nonce: parsed.nonce, verifier: parsed.verifier, bindingHash: parsed.bindingHash, expiresAt: parsed.expiresAt };
      } catch {
        return null;
      }
    },
  };
}

/** Test double with the same one-use semantics. Not for production use. */
export function createMemoryCentralStateStore(clock: () => number = Date.now): CentralStateStore & { size(): number } {
  const records = new Map<string, { record: CentralStateRecord; expiresAt: number }>();
  return {
    async save(stateDigest, record, ttlMs) {
      if (records.has(stateDigest)) throw new Error("central state collision");
      records.set(stateDigest, { record, expiresAt: clock() + ttlMs });
    },
    async consume(stateDigest) {
      const entry = records.get(stateDigest);
      records.delete(stateDigest);
      if (!entry || entry.expiresAt <= clock()) return null;
      return entry.record;
    },
    size: () => records.size,
  };
}
