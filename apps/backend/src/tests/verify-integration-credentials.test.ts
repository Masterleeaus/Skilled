/**
 * ACA-017 verification: integration service credentials over the real integration router and the in-memory
 * Prisma double, so it runs without a database. The database-backed CLI lifecycle is in
 * tests/integration/credential-lifecycle.test.ts.
 *
 * Covers: overlapping old and new credentials, immediate revocation, expiry, malformed and unknown tokens,
 * the INTEGRATION_SERVICE_SCOPES allowlist, audit rows, and the rule that secrets are stored hashed and are
 * never written to the database in clear, audit rows, or response bodies.
 */
import express from "express";
import request from "supertest";
import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "verify-credentials-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../modules/levels/level.service", () => ({
  filterToFinishedLevels: async <T>(_learnerId: string, items: T[]) => items,
}));

import { resetFakeDb, rows, seed } from "./support/fake-prisma";
import { integrationRoutes, parseServiceScopes } from "../modules/curriculum/integration.routes";

const PREFIX = "/api/titan/integration";
const ORG_A = "verify-org-a";
const ORG_B = "verify-org-b";
const LEARNER_A = "verify-learner-a";
const DAY = 86400000;

const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const mint = () => randomBytes(48).toString("base64url");

const app = express();
app.use(express.json());
app.use(PREFIX, integrationRoutes);

const skillsPath = (orgRef: string, learnerRef: string) =>
  `${PREFIX}/organisations/${encodeURIComponent(orgRef)}/learners/${encodeURIComponent(learnerRef)}/skills`;

function call(opts: { token?: string | null; caller?: string | null; orgRef?: string; learnerRef?: string } = {}) {
  let req = request(app).get(skillsPath(opts.orgRef ?? ORG_A, opts.learnerRef ?? LEARNER_A));
  if (opts.caller !== null) req = req.set("x-titan-service", opts.caller ?? "field-services");
  if (opts.token !== null && opts.token !== undefined) req = req.set("Authorization", `Bearer ${opts.token}`);
  return req;
}

async function addCredential(overrides: Record<string, unknown> = {}) {
  const token = mint();
  await seed("academyServiceCredential", [{
    service: "field-services", companyRef: ORG_A, label: "verify", tokenHash: digest(token),
    expiresAt: new Date(Date.now() + 30 * DAY), revokedAt: null, ...overrides,
  }]);
  return token;
}

function allAuditRows() {
  return rows("academyIntegrationAudit");
}

beforeAll(() => {
  process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [ORG_A], "ai-workforce": [] });
});

afterAll(() => {
  delete process.env.INTEGRATION_SERVICE_SCOPES;
});

beforeEach(async () => {
  resetFakeDb();
  process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [ORG_A], "ai-workforce": [] });
  await seed("company", [
    { id: "co-a", name: "Org A", externalRef: ORG_A },
    { id: "co-b", name: "Org B", externalRef: ORG_B },
  ]);
  await seed("user", [{ id: "lrn-a", email: "lrn-a@example.test", fullName: "Learner A", role: "STUDENT", isActive: true, isEmailVerified: true, deletedAt: null }]);
  await seed("companyMember", [{ companyId: "co-a", userId: "lrn-a", role: "LEARNER" }]);
  await seed("academyExternalIdentity", [{ service: "field-services", externalUserRef: LEARNER_A, userId: "lrn-a", companyId: "co-a" }]);
});

describe("ACA-017 rotation overlap and immediate revocation", () => {
  it("accepts an old and a new credential for the same organisation while both are unrevoked", async () => {
    const oldToken = await addCredential();
    const newToken = await addCredential();
    expect((await call({ token: oldToken })).status).toBe(200);
    expect((await call({ token: newToken })).status).toBe(200);
  });

  it("denies the old credential on the very next request once it is revoked, and the new one keeps working", async () => {
    const oldToken = await addCredential();
    const newToken = await addCredential();
    expect((await call({ token: oldToken })).status).toBe(200);

    const oldRow = rows("academyServiceCredential").find((r) => r.tokenHash === digest(oldToken))!;
    oldRow.revokedAt = new Date();

    const denied = await call({ token: oldToken });
    expect(denied.status).toBe(401);
    expect(denied.body).toEqual({ message: "Service authentication failed" });
    expect((await call({ token: newToken })).status).toBe(200);
  });

  it("does not let a revoked credential be used even when another active credential exists for the same organisation", async () => {
    const revokedToken = await addCredential({ revokedAt: new Date(Date.now() - 1000) });
    await addCredential();
    expect((await call({ token: revokedToken })).status).toBe(401);
  });
});

describe("ACA-017 expiry", () => {
  it("denies a credential whose expiry has passed, even though its row remains", async () => {
    const token = await addCredential({ expiresAt: new Date(Date.now() - 1000) });
    const res = await call({ token });
    expect(res.status).toBe(401);
    expect(rows("academyServiceCredential")).toHaveLength(1);
  });

  it("denies at the exact expiry instant (expiry is exclusive)", async () => {
    const now = new Date("2026-11-08T12:00:00.000Z");
    vi.useFakeTimers({ now, toFake: ["Date"] });
    try {
      const token = await addCredential({ expiresAt: now });
      expect((await call({ token })).status).toBe(401);
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts a credential one millisecond before its expiry", async () => {
    const now = new Date("2026-11-08T12:00:00.000Z");
    vi.useFakeTimers({ now, toFake: ["Date"] });
    try {
      const token = await addCredential({ expiresAt: new Date(now.getTime() + 1) });
      expect((await call({ token })).status).toBe(200);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ACA-017 malformed and unknown credentials", () => {
  const malformed: Array<[string, string | null]> = [
    ["no Authorization header", null],
    ["empty bearer value", "Bearer "],
    ["Basic scheme", "Basic dmVyaWZ5OnZlcmlmeQ=="],
    ["token shorter than 32 characters", "short-token"],
    ["token longer than 512 characters", "x".repeat(513)],
  ];

  for (const [label, header] of malformed) {
    it(`refuses ${label} with the generic message and writes no credential lookup result`, async () => {
      const req = request(app).get(skillsPath(ORG_A, LEARNER_A)).set("x-titan-service", "field-services");
      const res = await (header === null ? req : req.set("Authorization", header));
      expect(res.status).toBe(401);
      expect(res.body).toEqual(expect.objectContaining({ message: expect.any(String) }));
      expect(JSON.stringify(res.body)).not.toMatch(/token|hash|digest/i);
    });
  }

  it("refuses a well-formed but unknown token with the same response as a revoked one", async () => {
    await addCredential();
    const unknown = await call({ token: mint() });
    const revokedToken = await addCredential({ revokedAt: new Date() });
    const revoked = await call({ token: revokedToken });
    expect(unknown.status).toBe(401);
    expect(revoked.status).toBe(401);
    expect(unknown.body).toEqual(revoked.body);
  });

  it("refuses a valid token presented under a caller name it was not issued to", async () => {
    const token = await addCredential();
    const res = await call({ token, caller: "ai-workforce" });
    expect(res.status).toBe(401);
  });

  it("refuses a request with no or an unknown x-titan-service caller before any credential lookup", async () => {
    const token = await addCredential();
    expect((await call({ token, caller: null })).body).toEqual({ message: "Unknown service" });
    expect((await call({ token, caller: "Field-Services" })).body).toEqual({ message: "Unknown service" });
  });
});

describe("ACA-017 least-privilege scopes (INTEGRATION_SERVICE_SCOPES)", () => {
  it("denies a valid credential when the allowlist variable is unset (fail closed)", async () => {
    delete process.env.INTEGRATION_SERVICE_SCOPES;
    const token = await addCredential();
    expect((await call({ token })).status).toBe(401);
  });

  it("denies a valid credential when the allowlist is not valid JSON", async () => {
    process.env.INTEGRATION_SERVICE_SCOPES = "{not json";
    const token = await addCredential();
    expect((await call({ token })).status).toBe(401);
  });

  it("denies every caller when one caller key is missing, because both keys are required", async () => {
    process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [ORG_A] });
    const token = await addCredential();
    expect((await call({ token })).status).toBe(401);
  });

  it("denies a valid credential whose organisation is not on the caller's allowlist", async () => {
    process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [ORG_B], "ai-workforce": [] });
    const token = await addCredential();
    expect((await call({ token })).status).toBe(401);
  });

  it("does not let an allowlist entry for one caller grant access to another caller's credential", async () => {
    process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [], "ai-workforce": [ORG_A] });
    const token = await addCredential();
    expect((await call({ token })).status).toBe(401);
  });

  it("rejects allowlists that are arrays, non-strings, empty entries or over-long entries", () => {
    expect(parseServiceScopes(JSON.stringify([]))).toBeNull();
    expect(parseServiceScopes(JSON.stringify({ "field-services": [1], "ai-workforce": [] }))).toBeNull();
    expect(parseServiceScopes(JSON.stringify({ "field-services": [""], "ai-workforce": [] }))).toBeNull();
    expect(parseServiceScopes(JSON.stringify({ "field-services": ["x".repeat(201)], "ai-workforce": [] }))).toBeNull();
    expect(parseServiceScopes(JSON.stringify({ "field-services": ["a", "a"], "ai-workforce": [] }))).toEqual({ "field-services": ["a"], "ai-workforce": [] });
    expect(parseServiceScopes(undefined)).toBeNull();
  });
});

describe("ACA-017 audit metadata and secret handling", () => {
  it("records one DENIED_AUTHENTICATION row per refused attempt, with the caller and no learner or organisation", async () => {
    const before = allAuditRows().length;
    await call({ token: mint() });
    await call({ token: null });
    const added = allAuditRows().slice(before);
    expect(added).toHaveLength(2);
    for (const row of added) {
      expect(row.outcome).toBe("DENIED_AUTHENTICATION");
      expect(row.service).toBe("field-services");
      expect(row.companyRef).toBeUndefined();
      expect(row.externalUserRef).toBeUndefined();
    }
  });

  it("never stores a presented token or its digest in any audit row", async () => {
    const token = mint();
    await call({ token });
    const token2 = await addCredential();
    await call({ token: token2 });
    const dump = JSON.stringify(allAuditRows());
    expect(dump).not.toContain(token);
    expect(dump).not.toContain(token2);
    expect(dump).not.toContain(digest(token2));
  });

  it("stores only digests in the credential table and never a clear token", async () => {
    const token = await addCredential();
    const dump = JSON.stringify(rows("academyServiceCredential"));
    expect(dump).not.toContain(token);
    for (const row of rows("academyServiceCredential")) expect(String(row.tokenHash)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns no-store on a successful call and echoes no credential material", async () => {
    const token = await addCredential();
    const res = await call({ token });
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(JSON.stringify(res.body)).not.toContain(token);
    expect(JSON.stringify(res.body)).not.toContain(digest(token));
  });

  it("writes a SUCCESS audit row carrying the caller, organisation reference and learner reference", async () => {
    const token = await addCredential();
    await call({ token });
    const success = allAuditRows().filter((r) => r.outcome === "SUCCESS");
    expect(success.at(-1)).toEqual(expect.objectContaining({ service: "field-services", companyRef: ORG_A, externalUserRef: LEARNER_A }));
  });

  it("does not return data for a credential whose stored organisation reference differs in case", async () => {
    const token = await addCredential({ companyRef: "VERIFY-ORG-A" });
    expect((await call({ token })).status).toBe(401);
  });
});
