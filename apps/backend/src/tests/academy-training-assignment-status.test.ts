/**
 * Training assignment creation checks the learner's account, not only their membership.
 * Inactive, unverified and soft-deleted learners cannot be assigned a course. Uses the real curriculum
 * router over the in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "training-assignment-status-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const ASSIGN = `/api/academy/curriculum/companies/${ids.org1}/assignments`;
const auth = (userId: string) => ({ Authorization: `Bearer ${token(userId, "TEACHER")}` });

const NEW_LEARNER = "learner-3";

async function assign(learnerId: string) {
  return request(app).post(ASSIGN).set(auth(ids.manager)).send({ learnerId, courseId: ids.course });
}

// The fixture already assigns learner-1 and learner-2, so each case uses a fresh learner in this organisation.
const assignmentsFor = (learnerId: string) => rows("academyTrainingAssignment").filter((row) => row.learnerId === learnerId);
const enrolmentsFor = (learnerId: string) => rows("enrollment").filter((row) => row.studentId === learnerId);

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  await seed("user", [
    { id: NEW_LEARNER, email: "learner3@example.test", fullName: "Learner Three", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("companyMember", [{ companyId: ids.org1, userId: NEW_LEARNER, role: "LEARNER" }]);
});

describe("training assignment creation checks learner account status", () => {
  it("assigns an active, verified learner", async () => {
    const response = await assign(NEW_LEARNER);
    expect(response.status).toBe(200);
    expect(assignmentsFor(NEW_LEARNER)).toHaveLength(1);
    expect(enrolmentsFor(NEW_LEARNER)).toHaveLength(1);
  });

  it("refuses an inactive learner and creates neither an assignment nor an enrolment", async () => {
    await prisma.user.update({ where: { id: NEW_LEARNER }, data: { isActive: false } });

    const response = await assign(NEW_LEARNER);
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/inactive or unavailable/i);
    expect(assignmentsFor(NEW_LEARNER)).toHaveLength(0);
    expect(enrolmentsFor(NEW_LEARNER)).toHaveLength(0);
  });

  it("refuses a learner whose email is not verified", async () => {
    await prisma.user.update({ where: { id: NEW_LEARNER }, data: { isEmailVerified: false } });

    const response = await assign(NEW_LEARNER);
    expect(response.status).toBe(403);
    expect(assignmentsFor(NEW_LEARNER)).toHaveLength(0);
  });

  it("refuses a soft-deleted learner", async () => {
    await prisma.user.update({ where: { id: NEW_LEARNER }, data: { deletedAt: new Date() } });

    const response = await assign(NEW_LEARNER);
    expect(response.status).toBe(403);
    expect(assignmentsFor(NEW_LEARNER)).toHaveLength(0);
  });
});
