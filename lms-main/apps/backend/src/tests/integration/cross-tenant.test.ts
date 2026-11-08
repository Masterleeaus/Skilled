// ACA-004: a service credential for one organisation must not read or change another organisation's data.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type express from "express";
import request from "supertest";
import {
  configureTestEnvironment, describeWithServices, createFixtures, cleanupFixtures, buildServiceApp, callSkills,
  createCredentialViaCli, makeCompetency, countAudit, randomUnknownToken, type Db, type Fixtures,
} from "./harness";

configureTestEnvironment();

let db: Db;
let app: express.Express;
let fx: Fixtures;
let tokenFsOrgA: string;
let tokenFsOrgB: string;
let tokenAiOrgA: string;
let competencyA: string;
let competencyB: string;
const extFsA = () => `${fx.prefix}-fs-learner-a`;
const extFsB = () => `${fx.prefix}-fs-learner-b`;

beforeAll(async () => {
  ({ prisma: db } = await import("../../config/prisma"));
  app = await buildServiceApp();
  fx = await createFixtures(db);
  const learnerA = fx.users.learnerA.id;
  const learnerB = fx.users.learnerB.id;
  await db.academyExternalIdentity.createMany({
    data: [
      { service: "field-services", externalUserRef: extFsA(), userId: learnerA, companyId: fx.orgA.id },
      { service: "field-services", externalUserRef: extFsB(), userId: learnerB, companyId: fx.orgB.id },
    ],
  });
  competencyA = await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: learnerA });
  competencyB = await makeCompetency(db, fx, { companyId: fx.orgB.id, learnerId: learnerB });
  tokenFsOrgA = (await createCredentialViaCli("field-services", fx.orgA.externalRef)).token;
  tokenFsOrgB = (await createCredentialViaCli("field-services", fx.orgB.externalRef)).token;
  tokenAiOrgA = (await createCredentialViaCli("ai-workforce", fx.orgA.externalRef)).token;
}, 120000);

afterAll(async () => {
  if (db && fx) await cleanupFixtures(db, fx);
  await db?.$disconnect?.();
});

describeWithServices("ACA-004 cross-tenant access to the integration skills API", () => {
  it("denies an org A credential that asks for org B and returns the same 404 as an unknown org", async () => {
    const before = await countAudit(db, { outcome: "DENIED_SCOPE", companyRef: fx.orgB.externalRef });
    const res = await callSkills(app, { service: "field-services", token: tokenFsOrgA, companyRef: fx.orgB.externalRef, userRef: extFsB() });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation not found" });
    expect(res.body.verifiedSkills).toBeUndefined();
    const unknown = await callSkills(app, { service: "field-services", token: tokenFsOrgA, companyRef: `${fx.prefix}-no-such-org`, userRef: extFsB() });
    expect(unknown.body).toEqual(res.body);
    const after = await countAudit(db, { outcome: "DENIED_SCOPE", companyRef: fx.orgB.externalRef });
    expect(after).toBe(before + 1);
  });

  it("does not return org B's learner through org A's organisation reference", async () => {
    const res = await callSkills(app, { service: "field-services", token: tokenFsOrgA, companyRef: fx.orgA.externalRef, userRef: extFsB() });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found" });
    expect(JSON.stringify(res.body)).not.toContain(competencyB);
    const rows = await countAudit(db, { outcome: "NOT_FOUND_IDENTITY", companyRef: fx.orgA.externalRef, externalUserRef: extFsB() });
    expect(rows).toBeGreaterThanOrEqual(1);
  });

  it("does not return org A's learner to org B's credential", async () => {
    const res = await callSkills(app, { service: "field-services", token: tokenFsOrgB, companyRef: fx.orgB.externalRef, userRef: extFsA() });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found" });
    expect(JSON.stringify(res.body)).not.toContain(competencyA);
  });

  it("does not resolve a learner linked under field-services when queried as ai-workforce", async () => {
    const res = await callSkills(app, { service: "ai-workforce", token: tokenAiOrgA, companyRef: fx.orgA.externalRef, userRef: extFsA() });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found" });
  });

  it("returns only the requested tenant's competencies for an in-scope learner", async () => {
    const res = await callSkills(app, { service: "field-services", token: tokenFsOrgA, companyRef: fx.orgA.externalRef, userRef: extFsA() });
    expect(res.status).toBe(200);
    const ids = res.body.verifiedSkills.map((s: { id: string }) => s.id);
    expect(ids).toEqual([competencyA]);
    expect(ids).not.toContain(competencyB);
  });

  it("treats organisation references as exact, case-sensitive values", async () => {
    const res = await callSkills(app, { service: "field-services", token: tokenFsOrgA, companyRef: fx.orgB.externalRef.toUpperCase(), userRef: extFsB() });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation not found" });
  });

  it("does not expose org B data when the path tries to smuggle a second organisation", async () => {
    const smuggled = `${fx.orgA.externalRef}%2F..%2F${fx.orgB.externalRef}`;
    const res = await callSkills(app, { service: "field-services", token: tokenFsOrgA, companyRef: smuggled, userRef: extFsB() });
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(competencyB);
  });

  it("rejects write methods without changing any competency or identity rows", async () => {
    const countBefore = await db.academyVerifiedCompetency.count({ where: { companyId: { in: [fx.orgA.id, fx.orgB.id] } } });
    const identitiesBefore = await db.academyExternalIdentity.count({ where: { userId: { in: [fx.users.learnerA.id, fx.users.learnerB.id] } } });
    const base = `/api/titan/integration/organisations/${encodeURIComponent(fx.orgA.externalRef)}/learners/${encodeURIComponent(extFsA())}/skills`;
    for (const method of ["post", "put", "patch", "delete"] as const) {
      const res = await (request(app)[method](base)
        .set("x-titan-service", "field-services")
        .set("Authorization", `Bearer ${tokenFsOrgA}`)
        .send({ verifiedSkills: [{ id: "forged" }] }));
      expect([404, 405]).toContain(res.status);
    }
    const countAfter = await db.academyVerifiedCompetency.count({ where: { companyId: { in: [fx.orgA.id, fx.orgB.id] } } });
    const identitiesAfter = await db.academyExternalIdentity.count({ where: { userId: { in: [fx.users.learnerA.id, fx.users.learnerB.id] } } });
    expect(countAfter).toBe(countBefore);
    expect(identitiesAfter).toBe(identitiesBefore);
  });

  it("audits every scope and identity denial with the caller's service", async () => {
    const scopeDenials = await countAudit(db, { service: "field-services", externalUserRef: extFsB(), outcome: { in: ["DENIED_SCOPE", "NOT_FOUND_IDENTITY"] } });
    expect(scopeDenials).toBeGreaterThanOrEqual(3);
    const successRows = await countAudit(db, { companyRef: fx.orgA.externalRef, externalUserRef: extFsA(), outcome: "SUCCESS" });
    expect(successRows).toBeGreaterThanOrEqual(1);
  });

  // Gap check: the register requires an audit event for every denied request. Authentication failures
  // (no or bad bearer token, unknown caller, service mismatch) are currently rejected without an audit row.
  describe("authentication denials are audited", () => {
    const cases: Array<{ name: string; service: string | null; token: string | null }> = [
      { name: "missing bearer token", service: "field-services", token: null },
      { name: "unknown caller header", service: "not-a-service", token: tokenFsOrgA },
      { name: "unknown credential", service: "field-services", token: randomUnknownToken() },
      { name: "credential used by the wrong service", service: "ai-workforce", token: tokenFsOrgA },
    ];
    for (const c of cases) {
      it(`records a DENIED_AUTHENTICATION audit row for: ${c.name}`, async () => {
        const before = await countAudit(db, { outcome: "DENIED_AUTHENTICATION" });
        const res = await callSkills(app, { service: c.service, token: c.token, companyRef: fx.orgA.externalRef, userRef: extFsA() });
        expect([401]).toContain(res.status);
        const after = await countAudit(db, { outcome: "DENIED_AUTHENTICATION" });
        expect(after).toBe(before + 1);
      });
    }
  });
});
