/**
 * Rate limit on the public certificate verify route. The limiter is per client IP and counts every request to the
 * route, including unknown codes, so a guessing run is throttled as well as successful lookups. The limit is in its
 * own test module because its counter is shared across the module's requests.
 */
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  prisma: { certificate: { findFirst: vi.fn(async () => null), findUnique: vi.fn() }, course: { findUnique: vi.fn() } },
}));

vi.mock("../config/prisma", () => ({ prisma: db.prisma }));
vi.mock("../config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../config/minio", () => ({
  minioClient: { putObject: vi.fn(), removeObject: vi.fn(), presignedGetObject: vi.fn() },
  MINIO_BUCKET: "test-bucket",
  buildObjectKey: (folder: string, name: string) => `${folder}/${name}`,
  STORAGE_FOLDERS: { videos: "videos", images: "images", certificates: "certificates", assignments: "assignments" },
}));

import certificateRoutes from "../modules/certificates/certificate.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use("/api/certificates", certificateRoutes);
app.use(errorHandler);

const LIMIT = 30;

describe("public verify route rate limit", () => {
  it("allows the window's quota, then answers 429 with a JSON message", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < LIMIT; i += 1) {
      const res = await request(app).get("/api/certificates/verify/Zk3q_8vP0aBcD-eFgHiJkL");
      statuses.push(res.status);
    }
    expect(statuses.every((status) => status === 404)).toBe(true);

    const blocked = await request(app).get("/api/certificates/verify/Zk3q_8vP0aBcD-eFgHiJkL");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, message: expect.stringMatching(/too many/i) });
    expect(blocked.headers["ratelimit-limit"] ?? blocked.headers["RateLimit-Limit"]).toBeDefined();
  });

  it("blocks a guessing run of legacy numbers by the same client", async () => {
    const res = await request(app).get("/api/certificates/verify/LMS-2025-00000001");
    expect(res.status).toBe(429);
  });
});
