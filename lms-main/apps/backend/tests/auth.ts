import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../config/prisma";

const testEmail = `vitest-${Date.now()}@example.com`;
const password = "Password123!";

describe("Auth flow", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Vitest User",
      email: testEmail,
      password,
      role: "STUDENT",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it("rejects duplicate email registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Vitest User",
      email: testEmail,
      password,
      role: "STUDENT",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects login before email verification", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password,
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/verify/i);
  });

  it("logs in successfully after verifying email", async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    await prisma.user.update({
      where: { id: user!.id },
      data: { isEmailVerified: true },
    });

    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "WrongPassword!",
    });

    expect(res.status).toBe(401);
  });

  it("blocks protected routes without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
