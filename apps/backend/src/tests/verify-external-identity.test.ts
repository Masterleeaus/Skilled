/**
 * ACA-028 verification: organisation-scoped external identity uniqueness and the link, unlink, relink and
 * transfer lifecycle. Runs the real provisioning function and the integration router over the in-memory Prisma
 * double. The database-backed equivalent is tests/integration/identity-linking.test.ts.
 *
 * The uniqueness policy and the data-repair plan are in lms-main/docs/ACA-028-external-identity-uniqueness.md.
 */
import express from "express";
import request from "supertest";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "verify-identity-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../modules/levels/level.service", () => ({
  filterToFinishedLevels: async <T>(_learnerId: string, items: T[]) => items,
}));

import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { integrationRoutes } from "../modules/curriculum/integration.routes";
import { provision } from "../../prisma/provision-titan-integration";

const BACKEND = path.resolve(__dirname, "../..");
const PREFIX = "/api/titan/integration";
const ORG_A = "verify-id-org-a";
const ORG_B = "verify-id-org-b";
const REF = "verify-worker-1";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

const db = fakePrisma as unknown as Parameters<typeof provision>[1];
const app = express();
app.use(express.json());
app.use(PREFIX, integrationRoutes);

const TOKEN_A = randomBytes(48).toString("base64url");
const TOKEN_B = randomBytes(48).toString("base64url");

function skills(token: string, orgRef: string, learnerRef = REF) {
  return request(app)
    .get(`${PREFIX}/organisations/${encodeURIComponent(orgRef)}/learners/${encodeURIComponent(learnerRef)}/skills`)
    .set("x-titan-service", "field-services")
    .set("Authorization", `Bearer ${token}`);
}

const link = (userId: string, companyRef: string, externalUserRef = REF, service = "field-services") =>
  provision({ action: "link-identity", service, externalUserRef, userId, companyRef }, db);
const unlink = (userId: string, companyRef: string, externalUserRef = REF, service = "field-services") =>
  provision({ action: "unlink-identity", service, externalUserRef, userId, companyRef }, db);
const identityRows = (externalUserRef = REF) => rows("academyExternalIdentity").filter((r) => r.externalUserRef === externalUserRef);
const auditFor = (outcome: string, externalUserRef = REF) =>
  rows("academyIntegrationAudit").filter((r) => r.outcome === outcome && r.externalUserRef === externalUserRef);

beforeEach(async () => {
  resetFakeDb();
  process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [ORG_A, ORG_B], "ai-workforce": [] });
  await seed("company", [
    { id: "co-a", name: "Org A", externalRef: ORG_A },
    { id: "co-b", name: "Org B", externalRef: ORG_B },
  ]);
  await seed("user", [
    { id: "lrn-1", email: "lrn-1@example.test", fullName: "Learner One", role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null },
    { id: "lrn-2", email: "lrn-2@example.test", fullName: "Learner Two", role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null },
  ]);
  await seed("companyMember", [
    { companyId: "co-a", userId: "lrn-1", role: "LEARNER" },
    { companyId: "co-a", userId: "lrn-2", role: "LEARNER" },
    { companyId: "co-b", userId: "lrn-2", role: "LEARNER" },
  ]);
  await seed("academyServiceCredential", [
    { service: "field-services", companyRef: ORG_A, label: "a", tokenHash: digest(TOKEN_A), expiresAt: new Date(Date.now() + 86400000), revokedAt: null },
    { service: "field-services", companyRef: ORG_B, label: "b", tokenHash: digest(TOKEN_B), expiresAt: new Date(Date.now() + 86400000), revokedAt: null },
  ]);
});

describe("ACA-028 migration and preflight artefacts", () => {
  const migrationDir = path.join(BACKEND, "prisma/migrations/20261108100000_academy_external_identity_org_unique");
  const sql = readFileSync(path.join(migrationDir, "migration.sql"), "utf8");
  const stripComments = (text: string) => text.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");

  it("the active migration is additive: it adds a column if missing and creates the org-scoped unique index", () => {
    const code = stripComments(sql);
    expect(code).toMatch(/ADD COLUMN IF NOT EXISTS "companyId" TEXT/);
    expect(code).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS "academy_external_identities_svc_org_ref_key"\s+ON "academy_external_identities" \("service", "companyId", "externalUserRef"\)/);
    expect(code).not.toMatch(/DROP|DELETE|UPDATE|TRUNCATE|ALTER COLUMN|RENAME/i);
  });

  it("the active migration does not drop the global key, so cross-organisation duplicates stay refused", () => {
    expect(stripComments(sql)).not.toContain("academy_external_identities_service_externalUserRef_key");
  });

  it("the global-key drop is kept out of migrations/ and only in disabled-migrations/", () => {
    const migrationNames = readdirSync(path.join(BACKEND, "prisma/migrations"));
    expect(migrationNames.some((name) => /drop_global_key/.test(name))).toBe(false);
    const disabled = path.join(BACKEND, "prisma/disabled-migrations/20261108100300_DISABLED_academy_external_identity_drop_global_key.sql");
    expect(existsSync(disabled)).toBe(true);
    const disabledText = readFileSync(disabled, "utf8");
    // The statement stays commented out, so the file cannot run as a migration by accident.
    expect(stripComments(disabledText).trim()).toBe("");
    expect(disabledText).toContain('-- DROP INDEX IF EXISTS "academy_external_identities_service_externalUserRef_key";');
  });

  it("the Prisma schema declares both keys under the names the migration uses", () => {
    const schema = readFileSync(path.join(BACKEND, "prisma/schema.prisma"), "utf8");
    expect(schema).toContain("@@unique([service, externalUserRef])");
    expect(schema).toContain('@@unique([service, companyId, externalUserRef], map: "academy_external_identities_svc_org_ref_key")');
  });

  it("the preflight contains the duplicate check that must return zero rows before the index is applied", () => {
    const preflight = readFileSync(path.join(BACKEND, "prisma/preflight-20261108100000-external-identity-scope.sql"), "utf8");
    expect(preflight).toContain('GROUP BY "service", "companyId", "externalUserRef"');
    expect(preflight).toContain("HAVING COUNT(*) > 1");
  });
});

describe("ACA-028 uniqueness across organisations", () => {
  it("refuses the same external ref in a second organisation while the global key is active", async () => {
    await link("lrn-1", ORG_A);
    await expect(db.academyExternalIdentity.create({
      data: { service: "field-services", externalUserRef: REF, userId: "lrn-2", companyId: "co-b" },
    })).rejects.toThrow();
    expect(identityRows()).toHaveLength(1);
    expect(identityRows()[0].companyId).toBe("co-a");
  });

  it("does not link a second organisation's learner to a ref already held by another learner, and changes nothing", async () => {
    await link("lrn-1", ORG_A);
    await expect(link("lrn-2", ORG_B)).rejects.toThrow(/manual reconciliation required/);
    expect(identityRows()).toHaveLength(1);
    expect(identityRows()[0].userId).toBe("lrn-1");
    expect(auditFor("PROVISION_IDENTITY_CREATED")).toHaveLength(1);
    expect(rows("academyIntegrationAudit").filter((r) => r.externalUserRef === REF)).toHaveLength(1);
  });

  it("allows the same external ref under a different service, which has its own key space", async () => {
    await link("lrn-1", ORG_A);
    await expect(link("lrn-2", ORG_B, REF, "ai-workforce")).resolves.toBe("Identity linked");
    expect(rows("academyExternalIdentity").filter((r) => r.externalUserRef === REF)).toHaveLength(2);
  });

  it("refuses duplicate legacy identities (NULL companyId) for the same service and ref", async () => {
    await seed("academyExternalIdentity", [{ service: "field-services", externalUserRef: "verify-legacy", userId: "lrn-1", companyId: null }]);
    await expect(db.academyExternalIdentity.create({
      data: { service: "field-services", externalUserRef: "verify-legacy", userId: "lrn-2", companyId: null },
    })).rejects.toThrow();
  });

  it("never lets a legacy unscoped row be claimed by a different learner, and leaves that row unchanged", async () => {
    await seed("academyExternalIdentity", [{ service: "field-services", externalUserRef: REF, userId: "lrn-1", companyId: null }]);
    await expect(link("lrn-2", ORG_A)).rejects.toThrow(/manual reconciliation required/);
    const row = identityRows()[0];
    expect(row.userId).toBe("lrn-1");
    expect(row.companyId).toBeNull();
    expect(rows("academyIntegrationAudit").filter((r) => r.externalUserRef === REF)).toHaveLength(0);
  });

  it("denies a legacy unscoped row through the API until the same learner re-provisions it", async () => {
    await seed("academyExternalIdentity", [{ service: "field-services", externalUserRef: REF, userId: "lrn-1", companyId: null }]);
    const denied = await skills(TOKEN_A, ORG_A);
    expect(denied.status).toBe(404);
    expect(denied.body).toEqual({ message: "Learner not found" });
    await expect(link("lrn-1", ORG_A)).resolves.toBe("Legacy identity scoped to organisation");
    expect((await skills(TOKEN_A, ORG_A)).status).toBe(200);
  });
});

describe("ACA-028 unlink, relink and organisation transfer", () => {
  it("unlink requires the same learner and the same organisation, and changes nothing when either differs", async () => {
    await link("lrn-1", ORG_A);
    await expect(unlink("lrn-2", ORG_A)).rejects.toThrow("Identity not linked to specified user and organisation");
    await expect(unlink("lrn-1", ORG_B)).rejects.toThrow("Identity not linked to specified user and organisation");
    expect(identityRows()).toHaveLength(1);
    expect(auditFor("PROVISION_IDENTITY_REVOKED")).toHaveLength(0);
  });

  it("unlink of a ref that does not exist is refused with no audit row", async () => {
    await expect(unlink("lrn-1", ORG_A, "verify-never-linked")).rejects.toThrow("Identity not linked");
    expect(rows("academyIntegrationAudit")).toHaveLength(0);
  });

  it("after unlink the stale credential for the organisation gets 404, not the learner's data", async () => {
    await link("lrn-1", ORG_A);
    expect((await skills(TOKEN_A, ORG_A)).status).toBe(200);
    await unlink("lrn-1", ORG_A);
    const stale = await skills(TOKEN_A, ORG_A);
    expect(stale.status).toBe(404);
    expect(stale.body).toEqual({ message: "Learner not found" });
    expect(auditFor("NOT_FOUND_IDENTITY")).toHaveLength(1);
  });

  it("relinks the same learner to the same organisation as a new row, and the API resolves again", async () => {
    await link("lrn-1", ORG_A);
    const firstId = identityRows()[0].id;
    await unlink("lrn-1", ORG_A);
    await expect(link("lrn-1", ORG_A)).resolves.toBe("Identity linked");
    expect(identityRows()).toHaveLength(1);
    expect(identityRows()[0].id).not.toBe(firstId);
    expect((await skills(TOKEN_A, ORG_A)).status).toBe(200);
  });

  it("transfers a learner between organisations only as unlink then link, and never resolves in both", async () => {
    await link("lrn-2", ORG_A);
    expect((await skills(TOKEN_A, ORG_A)).status).toBe(200);
    // A direct link to the new organisation is refused while the identity still belongs to the old one.
    await expect(link("lrn-2", ORG_B)).rejects.toThrow(/manual reconciliation required/);
    expect((await skills(TOKEN_B, ORG_B)).status).toBe(404);

    await unlink("lrn-2", ORG_A);
    await expect(link("lrn-2", ORG_B)).resolves.toBe("Identity linked");

    expect((await skills(TOKEN_A, ORG_A)).status).toBe(404);
    expect((await skills(TOKEN_B, ORG_B)).status).toBe(200);
    expect(identityRows()).toHaveLength(1);
    expect(identityRows()[0].companyId).toBe("co-b");
  });

  it("refuses to link a learner who is not a member of the target organisation, with no identity row or audit row written", async () => {
    await expect(link("lrn-1", ORG_B)).rejects.toThrow("User is not a member of the requested organisation");
    expect(identityRows()).toHaveLength(0);
    expect(rows("academyIntegrationAudit")).toHaveLength(0);
  });

  it("a failed link inside the transaction leaves no partial row behind after a repeat attempt", async () => {
    await expect(link("lrn-1", ORG_B)).rejects.toThrow();
    await expect(link("lrn-1", ORG_A)).resolves.toBe("Identity linked");
    expect(identityRows()).toHaveLength(1);
    expect(rows("academyIntegrationAudit")).toHaveLength(1);
  });

  it("repeated link and unlink cycles leave exactly one identity, one audit row per operation, and no residue", async () => {
    for (let i = 0; i < 3; i++) {
      await link("lrn-1", ORG_A);
      await unlink("lrn-1", ORG_A);
    }
    expect(identityRows()).toHaveLength(0);
    expect(auditFor("PROVISION_IDENTITY_CREATED")).toHaveLength(3);
    expect(auditFor("PROVISION_IDENTITY_REVOKED")).toHaveLength(3);
  });
});

describe("ACA-028 audit metadata for provisioning", () => {
  it("writes one audit row per provisioning operation with service, organisation ref and external ref only", async () => {
    await link("lrn-1", ORG_A);
    await link("lrn-1", ORG_A);
    await unlink("lrn-1", ORG_A);
    const audits = rows("academyIntegrationAudit").filter((r) => r.externalUserRef === REF);
    expect(audits.map((r) => r.outcome)).toEqual(["PROVISION_IDENTITY_CREATED", "PROVISION_IDENTITY_CONFIRMED", "PROVISION_IDENTITY_REVOKED"]);
    for (const row of audits) {
      expect(row.service).toBe("field-services");
      expect(row.companyRef).toBe(ORG_A);
      expect(JSON.stringify(row)).not.toContain("lrn-1");
      expect(JSON.stringify(row)).not.toContain("co-a");
    }
  });

  it("records a scoped legacy upgrade as its own outcome", async () => {
    await seed("academyExternalIdentity", [{ service: "field-services", externalUserRef: REF, userId: "lrn-1", companyId: null }]);
    await link("lrn-1", ORG_A);
    expect(auditFor("PROVISION_IDENTITY_SCOPED")).toHaveLength(1);
  });

  it("rejects provisioning input with unexpected fields, so no extra role can be smuggled in", async () => {
    await expect(provision({ action: "link-identity", service: "field-services", externalUserRef: REF, userId: "lrn-1", companyRef: ORG_A, role: "ADMIN" }, db))
      .rejects.toThrow();
    expect(identityRows()).toHaveLength(0);
  });

  it("refuses an unknown service name", async () => {
    await expect(link("lrn-1", ORG_A, REF, "some-other-service")).rejects.toThrow();
    expect(identityRows()).toHaveLength(0);
  });
});
