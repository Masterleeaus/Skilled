import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/response";
import { logger } from "../config/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  // Known operational errors
  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
    }
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return sendError(res, "Validation failed", 422, err.flatten().fieldErrors as unknown as unknown[]);
  }

  // Known Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, "A record with this value already exists", 409, [
        { fields: err.meta?.target },
      ]);
    }
    if (err.code === "P2025") {
      return sendError(res, "Record not found", 404);
    }
  }

  // Unknown/unexpected errors
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(`${req.method} ${req.originalUrl} - ${message}`, {
    stack: err instanceof Error ? err.stack : undefined,
  });

  return sendError(res, "Internal server error", 500);
}

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
}
