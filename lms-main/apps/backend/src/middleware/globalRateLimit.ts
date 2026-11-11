import { Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";

// Health checks are polled by load balancers and monitors, so they are never throttled.
const HEALTH_PATH_PATTERN = /^\/api\/health\/?$/;

export function isGlobalRateLimitExempt(req: Pick<Request, "path">): boolean {
  return HEALTH_PATH_PATTERN.test(req.path);
}

// Defaults mirror the env schema. They also apply when a caller passes nothing, so a limiter never silently falls back
// to express-rate-limit's built-in 5 requests per minute.
export const DEFAULT_GLOBAL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const DEFAULT_GLOBAL_RATE_LIMIT_MAX = 1000;

export interface GlobalRateLimitOptions {
  windowMs?: number;
  limit?: number;
}

// Per-client-IP ceiling across the whole app. Per-route limiters still apply on top of it, and each keeps its own counter.
export function createGlobalRateLimiter({
  windowMs = DEFAULT_GLOBAL_RATE_LIMIT_WINDOW_MS,
  limit = DEFAULT_GLOBAL_RATE_LIMIT_MAX,
}: GlobalRateLimitOptions = {}): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isGlobalRateLimitExempt(req),
    message: { success: false, message: "Too many requests, please try again later", errors: [] },
  });
}
