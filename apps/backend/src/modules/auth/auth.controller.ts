import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/response";
import * as authService from "./auth.service";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "./auth.validators";

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const REFRESH_COOKIE = "refreshToken";
const isProd = process.env.NODE_ENV === "production";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const user = await authService.registerUser(input);
    return sendSuccess(res, user, "Registered. Please check your email to verify your account.", 201);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(token);
    return sendSuccess(res, null, "Email verified successfully");
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const deviceInfo = req.headers["user-agent"];
    const result = await authService.loginUser(input, deviceInfo);

    setRefreshCookie(res, result.refreshToken);
    return sendSuccess(res, { accessToken: result.accessToken, user: result.user }, "Login successful");
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const cookieToken = req.cookies?.[REFRESH_COOKIE];
    const token = cookieToken ?? refreshTokenSchema.parse(req.body).refreshToken;
    const result = await authService.refreshAccessToken(token);
    if (cookieToken) {
      // Browser session: keep the rotated credential in an HttpOnly cookie.
      setRefreshCookie(res, result.refreshToken);
      return sendSuccess(res, { accessToken: result.accessToken }, "Token refreshed");
    }
    // Explicit body-token clients must receive their replacement credential.
    return sendSuccess(res, result, "Token refreshed");
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    if (token) await authService.logoutDevice(token);
    res.clearCookie(REFRESH_COOKIE);
    return sendSuccess(res, null, "Logged out");
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logoutAllDevices(req.user!.userId);
    res.clearCookie(REFRESH_COOKIE);
    return sendSuccess(res, null, "Logged out from all devices");
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    // Always return success, even if email doesn't exist — avoids account enumeration
    return sendSuccess(res, null, "If that email exists, a reset link has been sent");
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    return sendSuccess(res, null, "Password reset successfully. Please log in again.");
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await authService.getUserProfile(req.user!.userId);
    return sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, avatarUrl } = updateProfileSchema.parse(req.body ?? {});
    const profile = await authService.updateProfile(req.user!.userId, { fullName, avatarUrl });
    return sendSuccess(res, profile, "Profile updated");
  } catch (err) {
    next(err);
  }
}
