// ACA-016: deactivated, soft-deleted or unenrolled learners must receive no integration skills, and the refusal is audited.
import { it, expect, beforeAll, afterAll } from "vitest";
import type express from "express";
import {
  configureTestEnvironment, describeWithServices, createFixtures, cleanupFixtures, buildServiceApp, callSkills,
  createCredentialViaCli, makeCompetency, countAudit, type Db, type Fixtures,
} from "./harness";

configureTestEnvironment();

let db: Db;
let app: express.Express;
let fx: Fixtures;
let token: string;
let activeCompetency: string;
let expiredCompetency: string;
const ref = (tag: string) => `${fx.prefix}-fs-${tag}`;

beforeAll(async () => {
  ({ prisma: db } = await import("../../config/prisma"));
  app = await buildServiceApp();
  fx = await createFixtures(db);
  const links = ["learnerA", "inactive", "removed", "softDeleted"].map((tag) => ({
    service: "field-services", externalUserRef: ref(tag), userId: fx.users[tag].id, companyId: fx.orgA.id,
  }));
  await db.academyExternalIdentity.createMany({ data: links });
  activeCompetency = await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: fx.users.learnerA.id });
  expiredCompetency = await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: fx.users.learnerA.id, expiresAt: new Date(Date.now() - 86400000) });
  for (const tag of ["inactive", "removed", "softDeleted"]) {
    await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: fx.users[tag].id });
  }
  token = (await createCredentialViaCli("field-services", fx.orgA.externalRef)).token;
}, 120000);

afterAll(async () => {
  if (db && fx) await cleanupFixtures(db, fx);
  await db?.$disconnect?.();
});

describeWithServices("ACA-016 inactive and deleted learner integration rejection", () => {
  it("returns only non-expired skills for an active, enrolled learner", async () => {
    const res = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("learnerA") });
    expect(res.status).toBe(200);
    const ids = res.body.verifiedSkills.map((s: { id: string }) => s.id);
    expect(ids).toContain(activeCompetency);
    expect(ids).not.toContain(expiredCompetency);
  });

  it("refuses a deactivated learner with the same body as an unknown learner and records INACTIVE_LEARNER", async () => {
    const inactive = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("inactive") });
    const unknown = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: `${fx.prefix}-never-linked` });
    expect(inactive.status).toBe(404);
    expect(inactive.body).toEqual({ message: "Learner not found" });
    expect(inactive.body).toEqual(unknown.body);
    expect(inactive.body.verifiedSkills).toBeUndefined();
    const audited = await countAudit(db, { outcome: "INACTIVE_LEARNER", companyRef: fx.orgA.externalRef, externalUserRef: ref("inactive") });
    expect(audited).toBe(1);
  });

  it("refuses a soft-deleted learner (deletedAt set) and records INACTIVE_LEARNER", async () => {
    const res = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("softDeleted") });
    expect(res.status).toBe(404);
    expect(res.body.verifiedSkills).toBeUndefined();
    const audited = await countAudit(db, { outcome: "INACTIVE_LEARNER", companyRef: fx.orgA.externalRef, externalUserRef: ref("softDeleted") });
    expect(audited).toBe(1);
  });

  it("refuses a learner whose account is soft-deleted through the application's delete path", async () => {
    const victim = await db.user.create({
      data: { email: `${fx.prefix}-deleted-later@example.test`, passwordHash: "integration-test-not-a-login", fullName: "deleted later", isEmailVerified: true },
      select: { id: true },
    });
    await db.companyMember.create({ data: { companyId: fx.orgA.id, userId: victim.id, role: "LEARNER" } });
    await db.academyExternalIdentity.create({ data: { service: "field-services", externalUserRef: ref("deleted-later"), userId: victim.id, companyId: fx.orgA.id } });
    const before = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("deleted-later") });
    expect(before.status).toBe(200);
    await db.user.delete({ where: { id: victim.id } });
    const row = await db.user.findFirst({ where: { id: victim.id }, select: { id: true } });
    expect(row).toBeNull();
    const after = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("deleted-later") });
    expect(after.status).toBe(404);
    expect(after.body).toEqual({ message: "Learner not found" });
    const audited = await countAudit(db, { outcome: "INACTIVE_LEARNER", externalUserRef: ref("deleted-later") });
    expect(audited).toBe(1);
  });

  it("refuses a learner who has been removed from the organisation and records NOT_FOUND_MEMBERSHIP", async () => {
    await db.companyMember.deleteMany({ where: { companyId: fx.orgA.id, userId: fx.users.removed.id } });
    const res = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("removed") });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found in organisation" });
    expect(res.body.verifiedSkills).toBeUndefined();
    const audited = await countAudit(db, { outcome: "NOT_FOUND_MEMBERSHIP", externalUserRef: ref("removed") });
    expect(audited).toBe(1);
  });

  it("takes effect on the next request and is reversible when the account is reactivated", async () => {
    await db.user.update({ where: { id: fx.users.learnerA.id }, data: { isActive: false } });
    const denied = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("learnerA") });
    expect(denied.status).toBe(404);
    expect(denied.body.verifiedSkills).toBeUndefined();
    await db.user.update({ where: { id: fx.users.learnerA.id }, data: { isActive: true } });
    const restored = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ref("learnerA") });
    expect(restored.status).toBe(200);
  });
});
