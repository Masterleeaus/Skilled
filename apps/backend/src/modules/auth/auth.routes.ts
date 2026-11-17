import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { createOriginGuard, parseOriginAllowlist } from "../../middleware/origin-guard";
import { env } from "../../config/env";
import { hashToken } from "./token.utils";

const router = Router();

// CSRF: reject cross-origin state-changing requests before any auth handler runs.
router.use(createOriginGuard(parseOriginAllowlist(env.AUTH_ALLOWED_ORIGINS, env.CLIENT_URL)));

// Section 11: rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later", errors: [] },
});

router.post("/register", authLimiter, authController.register);
router.post("/verify-email", authLimiter, authController.verifyEmail);
router.post("/login", authLimiter, authController.login);

// Resend mails a live token to an address, so it is limited per IP and per address. The address key is hashed
// so the in-memory store never holds the plain email. Both limits answer the same way for every account.
const resendIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later", errors: [] },
});
const resendEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return `resend-email:${hashToken(email)}`;
  },
  message: { success: false, message: "Too many verification emails requested, please try again later", errors: [] },
});
router.post("/resend-verification", resendIpLimiter, resendEmailLimiter, authController.resendVerification);
// Separate limit permits normal session refreshes while curbing token guessing.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many refresh attempts", errors: [] },
});
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);
router.get("/me", authenticate, authController.me);
router.patch("/me", authenticate, authController.updateMe);

export default router;
