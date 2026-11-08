// ACA-018: consumer contract tests for the Titan integration API.
// Transport is an in-process supertest client against the real router. No external service is contacted.
// Shapes are taken from PASS13/14/15/17/18 and the router source. The partner-side contract is NOT written down
// in this repository, so these tests pin the current API shape and do not invent partner expectations.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type express from "express";
import request from "supertest";
import {
  configureTestEnvironment, describeWithServices, createFixtures, cleanupFixtures, buildServiceApp, callSkills,
  createCredentialViaCli, makeCompetency, type Db, type Fixtures,
} from "./harness";

configureTestEnvironment();

let db: Db;
let app: express.Express;
let fx: Fixtures;
let competencyId: string;
const learnerRef = () => `${fx.prefix}-ext-learner`;
const tokens: Record<"field-services" | "ai-workforce", string> = { "field-services": "", "ai-workforce": "" };

beforeAll(async () => {
  ({ prisma: db } = await import("../../config/prisma"));
  app = await buildServiceApp();
  fx = await createFixtures(db);
  await db.academyExternalIdentity.create({
    data: { service: "field-services", externalUserRef: learnerRef(), userId: fx.users.learnerA.id, companyId: fx.orgA.id },
  });
  await db.academyExternalIdentity.create({
    data: { service: "ai-workforce", externalUserRef: learnerRef(), userId: fx.users.learnerA.id, companyId: fx.orgA.id },
  });
  competencyId = await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: fx.users.learnerA.id });
  await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: fx.users.learnerA.id, expiresAt: new Date(Date.now() - 86400000) });
  tokens["field-services"] = (await createCredentialViaCli("field-services", fx.orgA.externalRef)).token;
  tokens["ai-workforce"] = (await createCredentialViaCli("ai-workforce", fx.orgA.externalRef)).token;
}, 120000);

afterAll(async () => {
  if (db && fx) await cleanupFixtures(db, fx);
  await db?.$disconnect?.();
});

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

describeWithServices.each(["field-services", "ai-workforce"] as const)("consumer contract for %s", (service) => {
  const call = (overrides: Partial<{ token: string | null; service: string | null; companyRef: string; userRef: string }> = {}) =>
    callSkills(app, {
      service,
      token: tokens[service],
      companyRef: fx.orgA.externalRef,
      userRef: learnerRef(),
      ...overrides,
    });

  it("request: GET with x-titan-service and a Bearer token returns 200 and no-store caching", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("response 200: exact top-level shape, echoing the external references", async () => {
    const res = await call();
    expect(Object.keys(res.body).sort()).toEqual(["checkedAt", "companyRef", "externalUserRef", "verifiedSkills"]);
    expect(res.body.companyRef).toBe(fx.orgA.externalRef);
    expect(res.body.externalUserRef).toBe(learnerRef());
    expect(res.body.checkedAt).toMatch(ISO);
    expect(Array.isArray(res.body.verifiedSkills)).toBe(true);
  });

  it("response 200: each verified skill has exactly id, lessonId, revisionId, verifiedAt, expiresAt", async () => {
    const res = await call();
    expect(res.body.verifiedSkills.length).toBe(1);
    const skill = res.body.verifiedSkills[0];
    expect(Object.keys(skill).sort()).toEqual(["expiresAt", "id", "lessonId", "revisionId", "verifiedAt"]);
    expect(skill.id).toBe(competencyId);
    expect(skill.lessonId).toBe(fx.lessonId);
    expect(skill.revisionId).toBe(fx.revisionId);
    expect(skill.verifiedAt).toMatch(ISO);
    expect(skill.expiresAt).toBeNull();
  });

  it("response 200: does not disclose internal learner, assessor or evidence identifiers", async () => {
    const res = await call();
    const text = JSON.stringify(res.body);
    expect(text).not.toContain(fx.users.learnerA.id);
    expect(text).not.toContain(fx.assessorId);
    expect(text).not.toMatch(/learnerId|assessorId|evidence|email|fullName/);
  });

  it("response 200: excludes expired competencies", async () => {
    const res = await call();
    for (const skill of res.body.verifiedSkills) expect(skill.expiresAt === null || Date.parse(skill.expiresAt) > Date.now()).toBe(true);
  });

  it("response 401: bad or missing credential returns the generic authentication message", async () => {
    const missing = await call({ token: null });
    expect(missing.status).toBe(401);
    expect(missing.body).toEqual({ message: "Service authentication failed" });
    const short = await call({ token: "too-short" });
    expect(short.status).toBe(401);
    expect(short.body).toEqual({ message: "Service authentication failed" });
  });

  it("response 404: an out-of-scope organisation and a missing organisation look identical", async () => {
    const outOfScope = await call({ companyRef: `${fx.prefix}-other-tenant` });
    const missing = await call({ companyRef: `${fx.prefix}-never-provisioned` });
    expect(outOfScope.status).toBe(404);
    expect(outOfScope.body).toEqual({ message: "Organisation not found" });
    expect(missing.body).toEqual(outOfScope.body);
  });

  it("response 404: an unknown or internal Academy user ID is not accepted as the external learner reference", async () => {
    const res = await call({ userRef: fx.users.learnerA.id });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found" });
  });

  it("response 400: identifiers longer than 200 characters are rejected with a fixed message", async () => {
    const res = await call({ userRef: "x".repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid identifiers" });
  });
});

describeWithServices("contract drift checks against the documented partner shapes", () => {
  it("accepts the x-titan-service header only for the two documented callers", async () => {
    const res = await callSkills(app, { service: "titan-zero", token: tokens["field-services"], companyRef: fx.orgA.externalRef, userRef: learnerRef() });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Unknown service" });
  });

  it("records current state: the documented business-fields sync route is not mounted", async () => {
    // docs/FIELD_SERVICES_CONTEXT_SYNC.md describes POST .../business-fields/sync. No such route is mounted.
    // Expected documented body: {"fields":[{"fieldKey":"...","value":"...","sourceRecordRef":"..."}]}, max 56 fields.
    const res = await request(app)
      .post(`/api/titan/integration/organisations/${encodeURIComponent(fx.orgA.externalRef)}/business-fields/sync`)
      .set("x-titan-service", "field-services")
      .set("Authorization", `Bearer ${tokens["field-services"]}`)
      .send({ fields: [] });
    expect(res.status).toBe(404);
  });

  it.skip("field-services sync contract: documented business-fields push (OPEN: route not implemented)", () => {
    // Intentionally skipped. Enable once the route exists and the owner confirms the payload and error shapes.
  });
});
