/**
 * File logs rotate by size with a bounded number of copies. The bounds come from configuration, with defaults that
 * keep the logs folder to a few tens of megabytes per file.
 */
import { describe, expect, it } from "vitest";
import winston from "winston";
import { envSchema } from "../config/env";
import { logger } from "../config/logger";

const base = {
  CLIENT_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://lms:lms@localhost:5432/lms?schema=public",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  MINIO_ACCESS_KEY: "minio-access",
  MINIO_SECRET_KEY: "minio-secret",
};

function fileTransports() {
  return logger.transports.filter((transport): transport is winston.transports.FileTransportInstance => transport instanceof winston.transports.File);
}

describe("log file rotation configuration", () => {
  it("defaults to 10 MB per file and 5 rotated copies", () => {
    const result = envSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.success && result.data.LOG_FILE_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(result.success && result.data.LOG_FILE_MAX_FILES).toBe(5);
  });

  it("reads both limits from the environment", () => {
    const result = envSchema.safeParse({ ...base, LOG_FILE_MAX_BYTES: "2097152", LOG_FILE_MAX_FILES: "12" });
    expect(result.success && result.data.LOG_FILE_MAX_BYTES).toBe(2097152);
    expect(result.success && result.data.LOG_FILE_MAX_FILES).toBe(12);
  });

  it("rejects a size limit that would rotate on every line", () => {
    const result = envSchema.safeParse({ ...base, LOG_FILE_MAX_BYTES: "1024" });
    expect(result.success).toBe(false);
  });

  it("rejects an unbounded or zero copy count", () => {
    expect(envSchema.safeParse({ ...base, LOG_FILE_MAX_FILES: "0" }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, LOG_FILE_MAX_FILES: "1000" }).success).toBe(false);
  });
});

describe("file transports", () => {
  it("both file transports rotate by size and keep the newest lines in the base file", () => {
    const files = fileTransports();
    expect(files.map((file) => file.filename)).toEqual(
      expect.arrayContaining([expect.stringMatching(/error\.log$/), expect.stringMatching(/combined\.log$/)]),
    );
    for (const file of files) {
      expect(file.maxsize).toBeGreaterThan(0);
      expect(file.maxFiles).toBeGreaterThan(0);
      expect(file.tailable).toBe(true);
    }
  });
});
