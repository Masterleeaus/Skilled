// ACA-028: an external identity links to one Academy learner in one organisation, a second link is refused,
// and unlinking works. Provisioning runs through the trusted operator module's exported provision() function.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type express from "express";
import {
  configureTestEnvironment, describeWithServices, createFixtures, cleanupFixtures, buildServiceApp, callSkills,
  insertCredential, countAudit, makeCompetency, type Db, type Fixtures,
} from "./harness";

configureTestEnvironment();

let db: Db;
let app: express.Express;
let fx: Fixtures;
let provision: (raw: unknown, db: Db) => Promise<string>;
let token: string;
const ext = (tag: string) => `${fx.prefix}-worker-${tag}`;
const link = (over: Record<string, unknown> = {}) => ({
  action: "link-identity", service: "field-services", externalUserRef: ext("1"),
  userId: "", companyRef: "", ...over,
});

beforeAll(async () => {
  ({ prisma: db } = await import("../../config/prisma"));
  ({ provision } = (await import("../../../prisma/provision-titan-integration")) as unknown as { provision: typeof provision });
  app = await buildServiceApp();
  fx = await createFixtures(db);
  // learnerA belongs to org A only at this point. learnerB belongs to org B only.
  token = (await insertCredential(db, { service: "field-services", companyRef: fx.orgA.externalRef })).token;
}, 120000);

afterAll(async () => {
  if (db && fx) await cleanupFixtures(db, fx);
  await db?.$disconnect?.();
});

describeWithServices("ACA-028 external identity uniqueness and linking lifecycle", () => {
  it("links a new external identity to a member of the stated organisation and audits it", async () => {
    const message = await provision(link({ externalUserRef: ext("1"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }), db);
    expect(message).toBe("Identity linked");
    const rows = await db.academyExternalIdentity.findMany({ where: { service: "field-services", externalUserRef: ext("1") } });
    expect(rows.length).toBe(1);
    expect(rows[0].userId).toBe(fx.users.learnerA.id);
    expect(rows[0].companyId).toBe(fx.orgA.id);
    expect(await countAudit(db, { outcome: "PROVISION_IDENTITY_CREATED", externalUserRef: ext("1") })).toBe(1);
  });

  it("treats a repeat link for the same learner and organisation as idempotent", async () => {
    const message = await provision(link({ externalUserRef: ext("1"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }), db);
    expect(message).toBe("Identity already linked to requested user");
    expect(await db.academyExternalIdentity.count({ where: { service: "field-services", externalUserRef: ext("1") } })).toBe(1);
    expect(await countAudit(db, { outcome: "PROVISION_IDENTITY_CONFIRMED", externalUserRef: ext("1") })).toBe(1);
  });

  it("refuses a second link of the same external identity to a different learner and leaves the first link intact", async () => {
    await expect(provision(link({ externalUserRef: ext("1"), userId: fx.users.learnerB.id, companyRef: fx.orgB.externalRef }), db))
      .rejects.toThrow(/manual reconciliation required/);
    const rows = await db.academyExternalIdentity.findMany({ where: { service: "field-services", externalUserRef: ext("1") } });
    expect(rows.length).toBe(1);
    expect(rows[0].userId).toBe(fx.users.learnerA.id);
    expect(rows[0].companyId).toBe(fx.orgA.id);
  });

  it("refuses to move an existing identity to another organisation even for the same learner", async () => {
    await db.companyMember.create({ data: { companyId: fx.orgB.id, userId: fx.users.learnerA.id, role: "LEARNER" } });
    await expect(provision(link({ externalUserRef: ext("1"), userId: fx.users.learnerA.id, companyRef: fx.orgB.externalRef }), db))
      .rejects.toThrow(/manual reconciliation required/);
    const row = await db.academyExternalIdentity.findFirst({ where: { service: "field-services", externalUserRef: ext("1") } });
    expect(row!.companyId).toBe(fx.orgA.id);
    await db.companyMember.deleteMany({ where: { companyId: fx.orgB.id, userId: fx.users.learnerA.id } });
  });

  it("refuses a link when the learner is not a member of the stated organisation", async () => {
    await expect(provision(link({ externalUserRef: ext("2"), userId: fx.users.learnerB.id, companyRef: fx.orgA.externalRef }), db))
      .rejects.toThrow("User is not a member of the requested organisation");
    expect(await db.academyExternalIdentity.count({ where: { externalUserRef: ext("2") } })).toBe(0);
  });

  it("refuses a link to an organisation that does not exist", async () => {
    await expect(provision(link({ externalUserRef: ext("3"), userId: fx.users.learnerA.id, companyRef: `${fx.prefix}-missing` }), db))
      .rejects.toThrow("Organisation does not exist");
  });

  it("allows the same external reference under a different service, because uniqueness is scoped per service", async () => {
    const message = await provision(link({ service: "ai-workforce", externalUserRef: ext("1"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }), db);
    expect(message).toBe("Identity linked");
    expect(await db.academyExternalIdentity.count({ where: { externalUserRef: ext("1") } })).toBe(2);
    await provision({ action: "unlink-identity", service: "ai-workforce", externalUserRef: ext("1"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }, db);
  });

  it("enforces (service, externalUserRef) uniqueness in the database itself", async () => {
    await expect(db.academyExternalIdentity.create({
      data: { service: "field-services", externalUserRef: ext("1"), userId: fx.users.learnerB.id, companyId: fx.orgB.id },
    })).rejects.toThrow();
  });

  it("settles simultaneous link attempts for one external identity to exactly one learner", async () => {
    await db.companyMember.create({ data: { companyId: fx.orgB.id, userId: fx.users.learnerA.id, role: "LEARNER" } });
    const results = await Promise.allSettled([
      provision(link({ externalUserRef: ext("race"), userId: fx.users.learnerA.id, companyRef: fx.orgB.externalRef }), db),
      provision(link({ externalUserRef: ext("race"), userId: fx.users.learnerB.id, companyRef: fx.orgB.externalRef }), db),
    ]);
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
    const rows = await db.academyExternalIdentity.findMany({ where: { service: "field-services", externalUserRef: ext("race") } });
    expect(rows.length).toBe(1);
    expect([fx.users.learnerA.id, fx.users.learnerB.id]).toContain(rows[0].userId);
  });

  it("unlinks only when the learner and organisation match, and the API stops resolving the identity", async () => {
    await expect(provision({ action: "unlink-identity", service: "field-services", externalUserRef: ext("1"), userId: fx.users.learnerB.id, companyRef: fx.orgA.externalRef }, db))
      .rejects.toThrow("Identity not linked to specified user and organisation");
    expect(await db.academyExternalIdentity.count({ where: { externalUserRef: ext("1") } })).toBe(1);

    const competency = await makeCompetency(db, fx, { companyId: fx.orgA.id, learnerId: fx.users.learnerA.id });
    const before = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ext("1") });
    expect(before.status).toBe(200);
    expect(before.body.verifiedSkills.map((s: { id: string }) => s.id)).toContain(competency);

    const message = await provision({ action: "unlink-identity", service: "field-services", externalUserRef: ext("1"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }, db);
    expect(message).toBe("Identity revoked");
    expect(await countAudit(db, { outcome: "PROVISION_IDENTITY_REVOKED", service: "field-services", externalUserRef: ext("1") })).toBe(1);
    const after = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ext("1") });
    expect(after.status).toBe(404);
    expect(after.body).toEqual({ message: "Learner not found" });
  });

  it("re-linking after an unlink works", async () => {
    const message = await provision(link({ externalUserRef: ext("1"), userId: fx.users.learnerB.id, companyRef: fx.orgB.externalRef }), db);
    expect(message).toBe("Identity linked");
    const row = await db.academyExternalIdentity.findFirst({ where: { service: "field-services", externalUserRef: ext("1") } });
    expect(row!.userId).toBe(fx.users.learnerB.id);
    await provision({ action: "unlink-identity", service: "field-services", externalUserRef: ext("1"), userId: fx.users.learnerB.id, companyRef: fx.orgB.externalRef }, db);
  });

  it("keeps a legacy unscoped identity (companyId NULL) fail-closed until it is re-provisioned", async () => {
    const legacy = await db.academyExternalIdentity.create({
      data: { service: "field-services", externalUserRef: ext("legacy"), userId: fx.users.learnerA.id, companyId: null },
    });
    const denied = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ext("legacy") });
    expect(denied.status).toBe(404);
    expect(denied.body).toEqual({ message: "Learner not found" });

    const message = await provision(link({ externalUserRef: ext("legacy"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }), db);
    expect(message).toBe("Legacy identity scoped to organisation");
    expect(await countAudit(db, { outcome: "PROVISION_IDENTITY_SCOPED", service: "field-services", externalUserRef: ext("legacy") })).toBe(1);
    const upgraded = await db.academyExternalIdentity.findUnique({ where: { id: legacy.id } });
    expect(upgraded!.companyId).toBe(fx.orgA.id);
    const allowed = await callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: ext("legacy") });
    expect(allowed.status).toBe(200);
  });

  it("allows an operator to remove a legacy unscoped identity for the same learner", async () => {
    await db.academyExternalIdentity.create({
      data: { service: "field-services", externalUserRef: ext("legacy-remove"), userId: fx.users.learnerA.id, companyId: null },
    });
    const message = await provision({ action: "unlink-identity", service: "field-services", externalUserRef: ext("legacy-remove"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }, db);
    expect(message).toBe("Identity revoked");
    expect(await db.academyExternalIdentity.count({ where: { externalUserRef: ext("legacy-remove") } })).toBe(0);
  });

  it("rejects unexpected fields in provisioning input", async () => {
    await expect(provision({ ...link({ externalUserRef: ext("x"), userId: fx.users.learnerA.id, companyRef: fx.orgA.externalRef }), role: "ADMIN" }, db))
      .rejects.toThrow();
  });
});
