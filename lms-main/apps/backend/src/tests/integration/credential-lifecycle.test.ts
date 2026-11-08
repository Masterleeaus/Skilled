// ACA-017: credential rotation, revocation and expiry. Operations run through the real operator CLI.
// Tokens are held in memory only and are never printed or asserted in messages.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type express from "express";
import {
  configureTestEnvironment, describeWithServices, createFixtures, cleanupFixtures, buildServiceApp, callSkills,
  createCredentialViaCli, insertCredential, runCredentialCli, countAudit, sha256Hex, type Db, type Fixtures,
} from "./harness";

configureTestEnvironment();

let db: Db;
let app: express.Express;
let fx: Fixtures;
let learnerRef: string;

const DAY = 86400000;

async function skills(token: string) {
  return callSkills(app, { service: "field-services", token, companyRef: fx.orgA.externalRef, userRef: learnerRef });
}

beforeAll(async () => {
  ({ prisma: db } = await import("../../config/prisma"));
  app = await buildServiceApp();
  fx = await createFixtures(db);
  learnerRef = `${fx.prefix}-fs-learner-a`;
  await db.academyExternalIdentity.create({
    data: { service: "field-services", externalUserRef: learnerRef, userId: fx.users.learnerA.id, companyId: fx.orgA.id },
  });
}, 120000);

afterAll(async () => {
  if (db && fx) await cleanupFixtures(db, fx);
  await db?.$disconnect?.();
});

describeWithServices("ACA-017 credential rotation, revocation and expiry", () => {
  it("authenticates a freshly created credential and stores only its SHA-256 digest", async () => {
    const created = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "lifecycle-create", days: 30 });
    expect(created.code).toBe(0);
    const parsed = JSON.parse(created.stdout.trim());
    const row = await db.academyServiceCredential.findUnique({ where: { id: parsed.id } });
    expect(row).not.toBeNull();
    expect(row!.tokenHash).toBe(sha256Hex(parsed.token));
    expect(row!.tokenHash).not.toBe(parsed.token);
    expect(row!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    const days = (row!.expiresAt!.getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
    expect((await skills(parsed.token)).status).toBe(200);
  });

  it("rotation revokes the old credential immediately and the replacement works at once", async () => {
    const original = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "rotate-me", days: 30 });
    const oldParsed = JSON.parse(original.stdout.trim());
    expect((await skills(oldParsed.token)).status).toBe(200);

    const rotated = await runCredentialCli({ action: "rotate", id: oldParsed.id, days: 90 });
    expect(rotated.code).toBe(0);
    const newParsed = JSON.parse(rotated.stdout.trim());
    expect(newParsed.replacedId).toBe(oldParsed.id);
    expect(newParsed.id).not.toBe(oldParsed.id);

    const oldRow = await db.academyServiceCredential.findUnique({ where: { id: oldParsed.id } });
    expect(oldRow!.revokedAt).not.toBeNull();
    const newRow = await db.academyServiceCredential.findUnique({ where: { id: newParsed.id } });
    expect(newRow!.revokedAt).toBeNull();
    expect(newRow!.service).toBe("field-services");
    expect(newRow!.companyRef).toBe(fx.orgA.externalRef);
    const newDays = (newRow!.expiresAt!.getTime() - Date.now()) / DAY;
    expect(newDays).toBeGreaterThan(89);
    expect(newDays).toBeLessThan(91);

    const oldAfter = await skills(oldParsed.token);
    expect(oldAfter.status).toBe(401);
    expect(oldAfter.body).toEqual({ message: "Service authentication failed" });
    expect((await skills(newParsed.token)).status).toBe(200);
    expect(await countAudit(db, { outcome: "DENIED_AUTHENTICATION" })).toBeGreaterThanOrEqual(1);
  });

  it("revocation denies the credential immediately and a second revoke is a no-op", async () => {
    const created = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "revoke-me", days: 30 });
    const parsed = JSON.parse(created.stdout.trim());
    expect((await skills(parsed.token)).status).toBe(200);

    const first = await runCredentialCli({ action: "revoke", id: parsed.id });
    expect(JSON.parse(first.stdout.trim())).toEqual({ revoked: 1 });
    expect((await skills(parsed.token)).status).toBe(401);

    const second = await runCredentialCli({ action: "revoke", id: parsed.id });
    expect(JSON.parse(second.stdout.trim())).toEqual({ revoked: 0 });
  });

  it("rejects an expired credential even though its row still exists", async () => {
    const expired = await insertCredential(db, { service: "field-services", companyRef: fx.orgA.externalRef, expiresAt: new Date(Date.now() - 1000) });
    const res = await skills(expired.token);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Service authentication failed" });
  });

  it("accepts a credential that expires in the future and rejects one at its exact expiry instant", async () => {
    const future = await insertCredential(db, { service: "field-services", companyRef: fx.orgA.externalRef, expiresAt: new Date(Date.now() + 60000) });
    expect((await skills(future.token)).status).toBe(200);
    const atExpiry = await insertCredential(db, { service: "field-services", companyRef: fx.orgA.externalRef, expiresAt: new Date(Date.now() + 300) });
    await new Promise((r) => setTimeout(r, 400));
    expect((await skills(atExpiry.token)).status).toBe(401);
  });

  it("refuses to rotate a revoked or an expired credential", async () => {
    const created = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "no-rotate", days: 30 });
    const parsed = JSON.parse(created.stdout.trim());
    await runCredentialCli({ action: "revoke", id: parsed.id });
    const rotateRevoked = await runCredentialCli({ action: "rotate", id: parsed.id, days: 30 });
    expect(rotateRevoked.code).not.toBe(0);
    expect(rotateRevoked.stderr).toContain("missing, revoked or expired");

    const expired = await insertCredential(db, { service: "field-services", companyRef: fx.orgA.externalRef, expiresAt: new Date(Date.now() - 1000) });
    const rotateExpired = await runCredentialCli({ action: "rotate", id: expired.id, days: 30 });
    expect(rotateExpired.code).not.toBe(0);
    expect(rotateExpired.stderr).toContain("missing, revoked or expired");
  });

  it("lets only one of two simultaneous rotations of the same credential succeed", async () => {
    const created = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "race", days: 30 });
    const parsed = JSON.parse(created.stdout.trim());
    const [a, b] = await Promise.all([
      runCredentialCli({ action: "rotate", id: parsed.id, days: 30 }),
      runCredentialCli({ action: "rotate", id: parsed.id, days: 30 }),
    ]);
    const codes = [a.code, b.code].sort();
    expect(codes).toEqual([0, 1]);
    const loser = a.code === 0 ? b : a;
    expect(loser.stderr).toMatch(/revoked or expired|concurrently revoked/);
    const active = await db.academyServiceCredential.findMany({
      where: { service: "field-services", companyRef: fx.orgA.externalRef, label: { in: ["race"] }, revokedAt: null },
    });
    expect(active.length).toBe(1);
  });

  it("lists credentials without token hashes or secrets", async () => {
    const created = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "list-check", days: 30 });
    const parsed = JSON.parse(created.stdout.trim());
    const listed = await runCredentialCli({ action: "list", service: "field-services", companyRef: fx.orgA.externalRef });
    expect(listed.code).toBe(0);
    expect(listed.stdout).not.toContain(parsed.token);
    expect(listed.stdout).not.toContain("tokenHash");
    const body = JSON.parse(listed.stdout.trim());
    expect(body.credentials.length).toBeGreaterThan(0);
    for (const c of body.credentials) {
      expect(Object.keys(c).sort()).toEqual(["companyRef", "createdAt", "expiresAt", "id", "label", "revokedAt", "service"]);
    }
  });

  it("refuses creation for an unprovisioned organisation and for out-of-range lifetimes", async () => {
    const unknownOrg = await runCredentialCli({ action: "create", service: "field-services", companyRef: `${fx.prefix}-missing`, label: "x", days: 30 });
    expect(unknownOrg.code).not.toBe(0);
    expect(unknownOrg.stderr).toContain("Organisation not provisioned");
    for (const days of [0, 366, 1.5]) {
      const bad = await runCredentialCli({ action: "create", service: "field-services", companyRef: fx.orgA.externalRef, label: "x", days });
      expect(bad.code).not.toBe(0);
      expect(bad.stderr).toContain("Invalid credential request");
    }
  });

  it("refuses a credential created for an unknown caller name", async () => {
    const bad = await runCredentialCli({ action: "create", service: "some-other-service", companyRef: fx.orgA.externalRef, label: "x", days: 30 });
    expect(bad.code).not.toBe(0);
  });
});
