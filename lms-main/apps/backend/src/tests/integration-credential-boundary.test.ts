/**
 * Integration credential boundary (ACA-004), over the in-memory Prisma double so it runs without a database.
 * A service credential bound to organisation A must not read organisation B's learner or competencies.
 * The real database-backed suite is tests/integration/cross-tenant.test.ts and is skipped without services.
 *
 * The level gate (filterToFinishedLevels) is out of scope here and is replaced by an identity filter, so the
 * positive control can show that org A's own learner does get data back.
 *
 * Status: written, not run.
 */
import express from "express";
import request from "supertest";
import { createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "integration-boundary-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../modules/levels/level.service", () => ({
  filterToFinishedLevels: async <T>(_learnerId: string, items: T[]) => items,
}));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { integrationRoutes } from "../modules/curriculum/integration.routes";

const PREFIX = "/api/titan/integration";
const ORG_A = "ext-org-a";
const ORG_B = "ext-org-b";
const LEARNER_A = "ext-lrn-a";
const LEARNER_B = "ext-lrn-b";
// Opaque test tokens, at least 32 characters. Only their SHA-256 digests are stored.
const TOKEN_A = "integration-boundary-token-org-a-000000000000";
const TOKEN_B = "integration-boundary-token-org-b-000000000000";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

const app = express();
app.use(express.json());
app.use(PREFIX, integrationRoutes);

const skillsPath = (orgRef: string, learnerRef: string) =>
  `${PREFIX}/organisations/${encodeURIComponent(orgRef)}/learners/${encodeURIComponent(learnerRef)}/skills`;

function call(token: string, orgRef: string, learnerRef: string) {
  return request(app).get(skillsPath(orgRef, learnerRef)).set("x-titan-service", "field-services").set("Authorization", `Bearer ${token}`);
}

const previousScopes = process.env.INTEGRATION_SERVICE_SCOPES;

beforeAll(() => {
  // Both organisations are allowed for field-services, so only the credential's own tenant limits access.
  process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [ORG_A, ORG_B], "ai-workforce": [] });
});

afterAll(() => {
  if (previousScopes === undefined) delete process.env.INTEGRATION_SERVICE_SCOPES;
  else process.env.INTEGRATION_SERVICE_SCOPES = previousScopes;
});

beforeEach(async () => {
  resetFakeDb();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await seed("company", [
    { id: "co-a", name: "Org A", externalRef: ORG_A },
    { id: "co-b", name: "Org B", externalRef: ORG_B },
  ]);
  await seed("user", [
    { id: "lrn-a", email: "lrn-a@example.test", fullName: "Learner A", role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null },
    { id: "lrn-b", email: "lrn-b@example.test", fullName: "Learner B", role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null },
  ]);
  await seed("companyMember", [
    { companyId: "co-a", userId: "lrn-a", role: "LEARNER" },
    { companyId: "co-b", userId: "lrn-b", role: "LEARNER" },
  ]);
  await seed("academyExternalIdentity", [
    { service: "field-services", externalUserRef: LEARNER_A, userId: "lrn-a", companyId: "co-a" },
    { service: "field-services", externalUserRef: LEARNER_B, userId: "lrn-b", companyId: "co-b" },
  ]);
  // Competencies reference evidence, evidence references a revision, and a revision references a lesson (foreign keys).
  await seed("user", [{ id: "assessor-x", email: "assessor-x@example.test", fullName: "Assessor X", role: "TEACHER", isActive: true, isEmailVerified: true, deletedAt: null }]);
  await seed("academyContentLesson", [
    { id: "lesson-x", sourceId: "LSN-X", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson X", objective: "o", assessment: "a", sourceVersion: "1", sourceHash: "h-x" },
  ]);
  await seed("academyLessonRevision", [
    { id: "rev-x", lessonId: "lesson-x", version: 1, body: {}, contentHash: "h-x", status: "PUBLISHED", publishedAt: new Date() },
  ]);
  await seed("academyPracticalEvidence", [
    { id: "ev-a", companyId: "co-a", learnerId: "lrn-a", lessonId: "lesson-x", revisionId: "rev-x", description: "Evidence A", evidenceUrls: [], status: "APPROVED" },
    { id: "ev-b", companyId: "co-b", learnerId: "lrn-b", lessonId: "lesson-x", revisionId: "rev-x", description: "Evidence B", evidenceUrls: [], status: "APPROVED" },
  ]);
  await seed("academyVerifiedCompetency", [
    { id: "comp-a", companyId: "co-a", learnerId: "lrn-a", lessonId: "lesson-x", revisionId: "rev-x", evidenceId: "ev-a", assessorId: "assessor-x", verifiedAt: new Date(), expiresAt: null },
    { id: "comp-b", companyId: "co-b", learnerId: "lrn-b", lessonId: "lesson-x", revisionId: "rev-x", evidenceId: "ev-b", assessorId: "assessor-x", verifiedAt: new Date(), expiresAt: null },
  ]);
  await seed("academyServiceCredential", [
    { service: "field-services", companyRef: ORG_A, label: "org-a", tokenHash: digest(TOKEN_A), expiresAt, revokedAt: null },
    { service: "field-services", companyRef: ORG_B, label: "org-b", tokenHash: digest(TOKEN_B), expiresAt, revokedAt: null },
  ]);
});

describe("[written, not run] integration credential boundary for org A", () => {
  it("returns org A's own learner and only org A's competency (positive control)", async () => {
    const res = await call(TOKEN_A, ORG_A, LEARNER_A);
    expect(res.status).toBe(200);
    expect(res.body.verifiedSkills.map((skill: { id: string }) => skill.id)).toEqual(["comp-a"]);
  });

  it("does not return org B's learner through org A's organisation reference", async () => {
    const res = await call(TOKEN_A, ORG_A, LEARNER_B);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found" });
    expect(JSON.stringify(res.body)).not.toContain("comp-b");
    const audit = rows("academyIntegrationAudit").filter((row) => row.outcome === "NOT_FOUND_IDENTITY" && row.externalUserRef === LEARNER_B);
    expect(audit).toHaveLength(1);
  });

  it("does not return any data for org B's organisation reference to an org A credential", async () => {
    const res = await call(TOKEN_A, ORG_B, LEARNER_B);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation not found" });
    expect(JSON.stringify(res.body)).not.toContain("comp-b");
    const audit = rows("academyIntegrationAudit").filter((row) => row.outcome === "DENIED_SCOPE" && row.companyRef === ORG_B);
    expect(audit).toHaveLength(1);
  });

  it("does not return org A's learner to an org B credential", async () => {
    const res = await call(TOKEN_B, ORG_A, LEARNER_A);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation not found" });
    expect(JSON.stringify(res.body)).not.toContain("comp-a");
  });
});
