import type { NextFunction, Request, Response } from "express";

/**
 * Origin check for state-changing requests (CSRF defence in depth on top of SameSite cookies).
 *
 * - Safe methods (GET, HEAD, OPTIONS) pass through.
 * - A request with NO Origin header passes. Browsers send Origin on cross-site
 *   POST/PUT/PATCH/DELETE, so a missing Origin means a non-browser client
 *   (curl, mobile app, server-to-server). Such clients carry no ambient cookies
 *   from a victim's browser, so CSRF does not apply. This is a documented choice.
 * - A request WITH an Origin passes only if it exactly matches the allowlist.
 *   "null" and malformed values are rejected.
 */
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Builds the allowlist from AUTH_ALLOWED_ORIGINS (comma-separated). When that is
 * empty, it defaults to the origin of CLIENT_URL, the app's own frontend.
 * Throws on an entry that is not a valid absolute URL, so a bad config fails at startup.
 */
export function parseOriginAllowlist(raw: string | undefined, clientUrl: string): string[] {
  const entries = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const source = entries.length > 0 ? entries : [clientUrl];
  return [...new Set(source.map((entry) => new URL(entry).origin))];
}

export function createOriginGuard(allowedOrigins: readonly string[]) {
  const allowed = new Set(allowedOrigins);
  return function originGuard(req: Request, res: Response, next: NextFunction): void {
    if (!STATE_CHANGING_METHODS.has(req.method)) {
      next();
      return;
    }
    const origin = req.headers.origin;
    if (origin === undefined) {
      next();
      return;
    }
    let normalised: string | null;
    try {
      normalised = new URL(origin).origin;
    } catch {
      normalised = null;
    }
    if (normalised && allowed.has(normalised)) {
      next();
      return;
    }
    res.status(403).json({ success: false, message: "Cross-origin request rejected", errors: [] });
  };
}
