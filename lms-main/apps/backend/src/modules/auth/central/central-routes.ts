/**
 * Central SSO browser routes: GET /auth/titan/academy/start and GET /auth/titan/academy/callback.
 *
 * On success the callback creates an ordinary Skilled refresh session (same table, same cookie, same rotation and
 * logout as email/password login) and redirects to the frontend. The frontend's existing mount-time
 * POST /auth/refresh turns that cookie into an access token. No token is placed in a URL.
 *
 * Mounted only when CENTRAL_SSO_ENABLED=true (see central-sso.mount.ts).
 */
import { randomBytes } from "node:crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { CENTRAL_SSO_CALLBACK_PATH } from "../../../config/central-sso";
import type { CentralDb } from "./central-link";
import { resolveCentralLogin } from "./central-link";
import type { CentralOidcClient } from "./central-oidc";
import { generateRefreshToken, refreshExpiryDate } from "../token.utils";
import { CentralAuthError } from "./central-errors";

/** Same name as the email/password login cookie, so one session model serves both paths. */
export const SESSION_COOKIE = "refreshToken";
/** Matches the cookie path the existing login sets for /api/auth/login, so /api/auth/refresh and /logout receive it. */
export const SESSION_COOKIE_PATH = "/api/auth";
export const BINDING_COOKIE = "titan_central_sso_binding";
const BINDING_TTL_MS = 300_000;
const CALLBACK_PARAMS = new Set(["state", "code", "error", "error_description"]);

export interface CentralRouterDeps {
  db: CentralDb;
  oidc: CentralOidcClient;
  /** Where the browser lands after a successful sign-in. */
  afterLoginUrl: string;
  logger?: (event: string, fields: Record<string, string | number | boolean>) => void;
}

const bindingCookie = (maxAge?: number) => ({
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: CENTRAL_SSO_CALLBACK_PATH,
  ...(maxAge === undefined ? {} : { maxAge }),
});

export function createCentralSsoRouter({ db, oidc, afterLoginUrl, logger = () => {} }: CentralRouterDeps): Router {
  const router = Router();
  // One sign-in uses two requests (start and callback), so the budget is per IP for both together.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, please try again later", errors: [] },
  });

  router.get("/start", limiter, async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      // The binding is random per browser and is never accepted from a query string or body.
      const binding = randomBytes(32).toString("base64url");
      const { authorizationUrl } = await oidc.begin(binding);
      res.cookie(BINDING_COOKIE, binding, bindingCookie(BINDING_TTL_MS));
      res.redirect(302, authorizationUrl);
    } catch (error) {
      logger("central_login_begin_failed", { reason: error instanceof CentralAuthError ? error.reason : "unexpected_error" });
      res.status(503).json({ error: "login_unavailable" });
    }
  });

  router.get("/callback", limiter, async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const fail = (status: number, error: string) => {
      res.clearCookie(BINDING_COOKIE, bindingCookie());
      res.status(status).json({ error });
    };
    const query = req.query as Record<string, unknown>;
    const keys = Object.keys(query);
    if (keys.some((key) => !CALLBACK_PARAMS.has(key) || typeof query[key] !== "string")) {
      logger("central_login_rejected", { reason: "invalid_callback" });
      return fail(400, "invalid_callback");
    }
    if (query.error !== undefined) {
      logger("central_login_rejected", { reason: "identity_provider_rejected" });
      return fail(401, "identity_provider_rejected");
    }
    const binding = req.cookies?.[BINDING_COOKIE];
    if (typeof binding !== "string" || typeof query.state !== "string" || typeof query.code !== "string") {
      logger("central_login_rejected", { reason: "invalid_callback" });
      return fail(400, "invalid_callback");
    }

    let verified: { subject: string };
    try {
      verified = await oidc.complete({ state: query.state, code: query.code, browserBinding: binding });
    } catch (error) {
      logger("central_login_failed", { reason: error instanceof CentralAuthError ? error.reason : "unexpected_error" });
      return fail(401, "login_failed");
    }

    let resolution: Awaited<ReturnType<typeof resolveCentralLogin>>;
    try {
      resolution = await resolveCentralLogin(db, verified.subject);
    } catch {
      logger("central_login_failed", { reason: "resolution_unavailable" });
      return fail(503, "login_unavailable");
    }
    if (!resolution.allowed) {
      // Denied decisions are audited with the verified subject only. No Skilled account is revealed to the browser.
      logger("central_login_denied", { reason: resolution.reason });
      try {
        await db.academyIntegrationAudit.create({
          data: { service: "titan-central", outcome: `CENTRAL_LOGIN_DENIED_${resolution.reason.toUpperCase()}`, externalUserRef: verified.subject },
        });
      } catch {
        // The denial stands even when its audit row cannot be written.
      }
      return fail(403, "account_not_authorised");
    }

    const expiresAt = refreshExpiryDate();
    const { raw, hash } = generateRefreshToken();
    await db.refreshToken.create({
      data: { userId: resolution.userId, tokenHash: hash, deviceInfo: req.headers["user-agent"] ?? "unknown", expiresAt },
    });
    await db.academyIntegrationAudit.create({
      data: { service: "titan-central", outcome: "CENTRAL_LOGIN_SUCCEEDED", companyRef: resolution.organisationRef, externalUserRef: verified.subject },
    });
    logger("central_login_succeeded", { outcome: "allow" });

    res.clearCookie(BINDING_COOKIE, bindingCookie());
    res.cookie(SESSION_COOKIE, raw, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: SESSION_COOKIE_PATH,
      maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
    });
    res.redirect(303, afterLoginUrl);
  });

  return router;
}
