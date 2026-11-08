import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../config/prisma";
import { describeWithServices } from "./integration/harness";

const testEmail = `vitest-${Date.now()}@example.com`;
const password = "Password123!";

// Registers and logs in real users, so it runs only when DATABASE_URL and REDIS_URL name configured services.
describeWithServices("Auth flow", () => {
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

  it("blocks self-appointed teacher registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Untrusted Teacher",
      email: `untrusted-${Date.now()}@example.com`,
      password,
      role: "TEACHER",
    });
    // Schema rejection (role literal is STUDENT only) uses the shared validation status, 422.
    expect(res.status).toBe(422);
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

  it("rejects refresh tokens belonging to deactivated users", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const login = await request(app).post("/api/auth/login").send({ email: testEmail, password });
    expect(login.status).toBe(200);
    const cookieHeader = login.headers["set-cookie"];
    const cookies: string[] = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader].filter(Boolean);
    const refreshCookie = cookies.find(cookie => cookie.startsWith("refreshToken="));
    expect(refreshCookie).toBeTruthy();
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    try {
      const result = await request(app).post("/api/auth/refresh").set("Cookie", refreshCookie!);
      expect(result.status).toBe(401);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { isActive: true } });
    }
  });

  it("rejects still-valid access tokens after account deactivation", async () => {
    const login = await request(app).post("/api/auth/login").send({ email: testEmail, password });
    expect(login.status).toBe(200);
    const accessToken = login.body.data.accessToken as string;
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    try {
      const result = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${accessToken}`);
      expect(result.status).toBe(401);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { isActive: true } });
    }
  });

  it("uses current database role after an administrator is demoted", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    try {
      const login = await request(app).post("/api/auth/login").send({ email: testEmail, password });
      expect(login.status).toBe(200);
      const token = login.body.data.accessToken as string;
      await prisma.user.update({ where: { id: user.id }, data: { role: "STUDENT" } });
      const result = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(result.status).toBe(200);
      expect(result.body.data.role).toBe("STUDENT");
      const adminResult = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);
      expect(adminResult.status).toBe(403);
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: { role: "STUDENT" } });
    }
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
