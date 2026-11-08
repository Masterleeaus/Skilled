import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { verifyAccessToken } from "../modules/auth/token.utils";
import { UnauthorizedError } from "../utils/AppError";

/**
 * JWT signatures establish identity, not ongoing permission to access Academy.
 * A fresh user lookup prevents a disabled account or demoted administrator from
 * continuing to use an otherwise valid access token. An unavailable database
 * is an operational error, not an authentication failure.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token.includes(" ")) {
    next(new UnauthorizedError("Invalid or expired token"));
    return;
  }

  let userId: string;
  try {
    const payload = verifyAccessToken(token);
    if (!payload || typeof payload.userId !== "string" || !payload.userId) {
      throw new Error("Missing subject");
    }
    userId = payload.userId;
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, isEmailVerified: true, deletedAt: true },
    });
    if (!user || !user.isActive || !user.isEmailVerified || user.deletedAt) {
      next(new UnauthorizedError("Account is inactive or unavailable"));
      return;
    }
    // Role always comes from current database state, never a stale JWT claim.
    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}
