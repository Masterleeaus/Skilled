import type { CookieOptions } from "express";

/**
 * Single source of truth for cookies set through Express (`res.cookie` / `res.clearCookie`).
 *
 * Policy (see docs/security/cookies-and-csrf.md for the reasoning):
 * - httpOnly is always on. Nothing in the browser may read a session credential.
 * - secure is on whenever NODE_ENV is "production", so local http development still works.
 *   A caller that is only ever served over HTTPS may pass `secure: true` explicitly.
 * - sameSite defaults to "lax". Use "strict" only when the cookie must never be sent on a
 *   cross-site navigation (for example, a media grant that is only ever requested by same-site
 *   players).
 * - path defaults to "/", which matches Express's own default. Scope a cookie to a narrower path
 *   only when a route family needs it.
 *
 * Lifetime and name are NOT decided here. Each caller passes its own maxAge and cookie name,
 * so existing lifetimes stay exactly as they were.
 */

export type SameSitePolicy = "strict" | "lax";

export interface CookieScope {
  /** Cookie path. Defaults to "/". */
  path?: string;
  /** Defaults to "lax". */
  sameSite?: SameSitePolicy;
  /** Defaults to true only when NODE_ENV is "production". */
  secure?: boolean;
  /** Lifetime in milliseconds. Omit for a session cookie. Never passed to clearCookie. */
  maxAgeMs?: number;
}

/** True only in production. Read at call time so tests and runtime configuration see the current value. */
export function isSecureCookieRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Options for `res.cookie(name, value, ...)`. */
export function cookieOptions(scope: CookieScope = {}): CookieOptions {
  return {
    httpOnly: true,
    secure: scope.secure ?? isSecureCookieRuntime(),
    sameSite: scope.sameSite ?? "lax",
    path: scope.path ?? "/",
    ...(scope.maxAgeMs === undefined ? {} : { maxAge: scope.maxAgeMs }),
  };
}

/**
 * Options for `res.clearCookie(name, ...)`. Express 5 strips maxAge from clearCookie anyway, but
 * omitting it here keeps the intent explicit. Attributes do not affect which cookie is cleared
 * (browsers match on name, path and domain), so passing the same scope keeps the call readable.
 */
export function clearCookieOptions(scope: CookieScope = {}): CookieOptions {
  const { maxAge: _ignored, ...rest } = cookieOptions(scope);
  return rest;
}
