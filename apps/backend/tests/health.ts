import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("GET /api/health", () => {
  it("returns dependency status", async () => {
    const res = await request(app).get("/api/health");
    expect([200, 503]).toContain(res.status);
    expect(res.body.data.checks).toHaveProperty("database");
    expect(res.body.data.checks).toHaveProperty("redis");
    expect(res.body.data.checks).toHaveProperty("storage");
  });
});
