import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/response";
import { logger } from "../config/logger";
import { redactUrlQuery } from "./httpRequestLog";

// 5xx messages can carry operator hints or internal paths (for example configuration instructions), so production
// clients get generic copy for them. Development keeps the original message for debugging.
function serverErrorMessage(statusCode: number): string {
  return statusCode === 503 ? "Service temporarily unavailable. Try again later." : "Internal server error";
}

// Body parser and other HTTP-layer errors (oversized body, malformed JSON) carry a 4xx status that is safe to return.
function clientErrorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const { status, expose } = err as { status?: unknown; expose?: unknown };
  return expose === true && typeof status === "number" && status >= 400 && status < 500 ? status : undefined;
}

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
      logger.error(`${req.method} ${redactUrlQuery(req.originalUrl)} - ${err.message}`, { stack: err.stack });
    }
    if (err.statusCode >= 500 && process.env.NODE_ENV === "production") {
      return sendError(res, serverErrorMessage(err.statusCode), err.statusCode);
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

  const httpStatus = clientErrorStatus(err);
  if (httpStatus !== undefined) {
    return sendError(res, err instanceof Error ? err.message : "Bad request", httpStatus);
  }

  // Unknown/unexpected errors
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(`${req.method} ${redactUrlQuery(req.originalUrl)} - ${message}`, {
    stack: err instanceof Error ? err.stack : undefined,
  });

  return sendError(res, "Internal server error", 500);
}

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
}
