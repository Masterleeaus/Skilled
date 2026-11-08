import type { Request } from "express";
import { AppError } from "./AppError";

// Express 5 types route params and query values as string | string[] | ParsedQs.
// These helpers return a single string, or answer 400 when the client sent something else.

export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(`Invalid path parameter: ${name}`, 400, [{ field: name, message: "must be a single value" }]);
  }
  return value;
}

export function query(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new AppError(`Invalid query parameter: ${name}`, 400, [{ field: name, message: "must be a single value" }]);
  }
  return value;
}
