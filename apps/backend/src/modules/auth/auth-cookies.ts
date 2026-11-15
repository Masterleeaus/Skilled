import type { CookieOptions, Response } from "express";

/**
 * One place for the refresh cookie attributes, so login, refresh and logout
 * cannot drift apart.
 *
 * SameSite=Lax: the browser withholds this cookie from cross-site POST, PUT,
 * PATCH and DELETE requests, which is the main CSRF defence for /api/auth.
 * Lax (not Strict) is kept so the cookie still arrives on top-level navigations
 * from outside the app, such as a link in an email, and the SPA then refreshes.
 */
export const REFRESH_COOKIE = "refreshToken";
export const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function refreshCookieOptions(isProd: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

/** Clearing uses the same attributes except maxAge, so the browser matches the original cookie. */
export function refreshCookieClearOptions(isProd: boolean): CookieOptions {
  const { maxAge: _maxAge, ...rest } = refreshCookieOptions(isProd);
  return rest;
}

export function setRefreshCookie(res: Response, token: string, isProd: boolean): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(isProd));
}

export function clearRefreshCookie(res: Response, isProd: boolean): void {
  res.clearCookie(REFRESH_COOKIE, refreshCookieClearOptions(isProd));
}
