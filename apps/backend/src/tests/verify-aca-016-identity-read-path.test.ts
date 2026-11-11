/**
 * ACA-016 verification: revoked, inactive and deleted learner identities on the integration skills read path.
 * Covers active, inactive, unverified and soft-deleted accounts, unlinked and re-linked identities, stale or
 * revoked service tokens, company scope changes, cache behaviour, denial bodies, and audit outcomes.
 * Drives the real integration router against the in-memory Prisma double.
 */
import { randomBytes } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { seedAcademyFixture } from "./support/academy-fixtures";
import { buildServiceApp, sha256Hex, skillsPath } from "./integration/harness";
import { setCourseLevelMapForTests } from "../modules/levels/level-rules";

const ORG_A = "ext-org-a";
const ORG_B = "ext-org-b";
const FS = "field-services";
const AI = "ai-workforce";
const ENV_SCOPES = JSON.stringify({ [FS]: [ORG_A, ORG_B], [AI]: [ORG_A, ORG_B] });
const COURSE_SLUG = "verify-int-course";
const LESSON_SOURCE = "VERIFY-INT-L1";

const users = {
  learner: "vi-learner",
  inactive: "vi-inactive",
  unverified: "vi-unverified",
  deleted: "vi-deleted",
  relinked: "vi-relinked",
  orgBLearner: "vi-org-b-learner",
  teacher: "vi-teacher",
};
const orgs = { a: "vi-org-a", b: "vi-org-b" };
const lesson = { id: "vi-lesson", revisionId: "vi-revision" };

let app: Awaited<ReturnType<typeof buildServiceApp>>;
let token: string;
let savedScopes: string | undefined;

function newToken(): string {
  return randomBytes(48).toString("base64url");
}

async function issueCredential(opts: { service?: string; companyRef?: string; expiresAt?: Date | null; revokedAt?: Date | null } = {}): Promise<string> {
  const value = newToken();
  await seed("academyServiceCredential", [{
    service: opts.service ?? FS,
    companyRef: opts.companyRef ?? ORG_A,
    label: "verify-int",
    tokenHash: sha256Hex(value),
    expiresAt: opts.expiresAt === undefined ? new Date(Date.now() + 30 * 86400000) : opts.expiresAt,
    revokedAt: opts.revokedAt ?? null,
  }]);
  return value;
}

function call(ref: string, opts: { service?: string | null; bearer?: string | null; org?: string } = {}) {
  let req = request(app).get(skillsPath(opts.org ?? ORG_A, ref));
  if (opts.service !== null) req = req.set("x-titan-service", opts.service ?? FS);
  if (opts.bearer !== null) req = req.set("Authorization", `Bearer ${opts.bearer ?? token}`);
  return req;
}

const audits = (where: Record<string, unknown> = {}) => rows("academyIntegrationAudit").filter(row => Object.entries(where).every(([k, v]) => row[k] === v));

async function competencyFor(learnerId: string, companyId: string, tag: string): Promise<string> {
  const evidenceId = `vi-ev-${tag}`;
  await seed("academyPracticalEvidence", [{
    id: evidenceId, companyId, learnerId, lessonId: lesson.id, revisionId: lesson.revisionId,
    description: "verify fixture evidence", evidenceUrls: [], status: "APPROVED", assessorId: users.teacher,
  }]);
  const id = `vi-comp-${tag}`;
  await seed("academyVerifiedCompetency", [{
    id, companyId, learnerId, lessonId: lesson.id, revisionId: lesson.revisionId, evidenceId, assessorId: users.teacher, expiresAt: null,
  }]);
  return id;
}

beforeEach(async () => {
  resetFakeDb();
  savedScopes = process.env.INTEGRATION_SERVICE_SCOPES;
  process.env.INTEGRATION_SERVICE_SCOPES = ENV_SCOPES;
  setCourseLevelMapForTests({ [COURSE_SLUG]: { [LESSON_SOURCE]: "base" } });
  await seedAcademyFixture();

  await seed("company", [{ id: orgs.a, name: "Verify Org A", externalRef: ORG_A }, { id: orgs.b, name: "Verify Org B", externalRef: ORG_B }]);
  await seed("user", [
    { id: users.learner, email: "vi-learner@example.test", fullName: "Learner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: users.inactive, email: "vi-inactive@example.test", fullName: "Inactive", role: "STUDENT", isActive: false, isEmailVerified: true },
    { id: users.unverified, email: "vi-unverified@example.test", fullName: "Unverified", role: "STUDENT", isActive: true, isEmailVerified: false },
    { id: users.deleted, email: "vi-deleted@example.test", fullName: "Deleted", role: "STUDENT", isActive: false, isEmailVerified: true, deletedAt: new Date() },
    { id: users.relinked, email: "vi-relinked@example.test", fullName: "Relinked", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: users.orgBLearner, email: "vi-org-b@example.test", fullName: "Org B Learner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: users.teacher, email: "vi-teacher@example.test", fullName: "Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
  ]);
  await seed("companyMember", [
    { companyId: orgs.a, userId: users.learner, role: "LEARNER" },
    { companyId: orgs.a, userId: users.inactive, role: "LEARNER" },
    { companyId: orgs.a, userId: users.unverified, role: "LEARNER" },
    { companyId: orgs.a, userId: users.deleted, role: "LEARNER" },
    { companyId: orgs.a, userId: users.relinked, role: "LEARNER" },
    { companyId: orgs.b, userId: users.orgBLearner, role: "LEARNER" },
  ]);
  await seed("academyContentLesson", [{ id: lesson.id, sourceId: LESSON_SOURCE, layer: "verify", serviceGroup: "verify", unit: "verify", title: "Verify lesson", objective: "o", assessment: "a", sourceVersion: "1", sourceHash: "h" }]);
  await seed("academyLessonRevision", [{ id: lesson.revisionId, lessonId: lesson.id, version: 1, body: {}, contentHash: "verify", status: "PUBLISHED", publishedAt: new Date() }]);
  await seed("category", [{ id: "vi-cat", name: "Verify category", slug: "verify-category" }]);
  await seed("course", [{ id: "vi-course", title: "Verify course", slug: COURSE_SLUG, description: "d", categoryId: "vi-cat", teacherId: users.teacher, isPublished: true }]);
  await seed("academyCurriculumTrack", [{ id: "vi-track", slug: "verify-track", title: "Verify track", scope: "UNIVERSAL", status: "PUBLISHED" }]);
  await seed("academyLessonPlacement", [{ trackId: "vi-track", lessonId: lesson.id, revisionId: lesson.revisionId, position: 1, required: true }]);
  await seed("academyCourseTrack", [{ courseId: "vi-course", trackId: "vi-track", position: 1, required: true }]);
  const learners = [users.learner, users.inactive, users.unverified, users.deleted, users.relinked];
  await seed("enrollment", learners.map(studentId => ({ studentId, courseId: "vi-course", status: "ACTIVE" })));
  await seed("academyLearnerCompletion", learners.map(learnerId => ({ learnerId, lessonId: lesson.id, revisionId: lesson.revisionId })));

  await seed("academyExternalIdentity", [
    { service: FS, externalUserRef: "ref-learner", userId: users.learner, companyId: orgs.a },
    { service: FS, externalUserRef: "ref-inactive", userId: users.inactive, companyId: orgs.a },
    { service: FS, externalUserRef: "ref-unverified", userId: users.unverified, companyId: orgs.a },
    { service: FS, externalUserRef: "ref-deleted", userId: users.deleted, companyId: orgs.a },
    { service: FS, externalUserRef: "ref-relink-source", userId: users.learner, companyId: orgs.a },
  ]);

  await competencyFor(users.learner, orgs.a, "learner");
  await competencyFor(users.inactive, orgs.a, "inactive");
  await competencyFor(users.unverified, orgs.a, "unverified");
  await competencyFor(users.deleted, orgs.a, "deleted");
  await competencyFor(users.relinked, orgs.a, "relinked");
  await competencyFor(users.orgBLearner, orgs.b, "org-b");

  app = await buildServiceApp();
  token = await issueCredential();
});

afterEach(() => {
  setCourseLevelMapForTests(null);
  if (savedScopes === undefined) delete process.env.INTEGRATION_SERVICE_SCOPES;
  else process.env.INTEGRATION_SERVICE_SCOPES = savedScopes;
});

describe("ACA-016 active identity", () => {
  it("returns the learner's current competencies for an active, verified, linked member, and audits SUCCESS", async () => {
    const res = await call("ref-learner");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.verifiedSkills.map((s: { id: string }) => s.id)).toEqual(["vi-comp-learner"]);
    expect(audits({ outcome: "SUCCESS", externalUserRef: "ref-learner" })).toHaveLength(1);
  });

  it("never returns another learner's or another organisation's competencies", async () => {
    const res = await call("ref-learner");
    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toContain("vi-comp-inactive");
    expect(serialised).not.toContain("vi-comp-relinked");
    expect(serialised).not.toContain("vi-comp-org-b");
  });
});

describe("ACA-016 inactive, unverified and deleted identities", () => {
  const deniedCases = [
    { name: "deactivated (isActive false)", ref: "ref-inactive", outcome: "INACTIVE_LEARNER" },
    { name: "unverified email", ref: "ref-unverified", outcome: "INACTIVE_LEARNER" },
    { name: "soft-deleted (deletedAt set)", ref: "ref-deleted", outcome: "INACTIVE_LEARNER" },
  ];
  for (const c of deniedCases) {
    it(`denies a ${c.name} learner with no skills, the same body as an unknown learner, and an audit row`, async () => {
      const res = await call(c.ref);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Learner not found" });
      expect(res.body.verifiedSkills).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain("vi-comp-");
      expect(audits({ outcome: c.outcome, externalUserRef: c.ref })).toHaveLength(1);
    });
  }

  it("gives deactivated, unverified, deleted and unlinked identities identical response bodies", async () => {
    const bodies = await Promise.all(["ref-inactive", "ref-unverified", "ref-deleted", "ref-never-linked"].map(ref => call(ref)));
    expect(bodies.map(r => r.status)).toEqual([404, 404, 404, 404]);
    for (const r of bodies) expect(r.body).toEqual({ message: "Learner not found" });
  });

  it("denies a deleted account even when the identity row still exists, and records INACTIVE_LEARNER", async () => {
    expect((await call("ref-deleted")).status).toBe(404);
    expect(rows("academyExternalIdentity").some(row => row.externalUserRef === "ref-deleted")).toBe(true);
  });

  it("takes effect on the next request when an active learner is deactivated, and is reversible", async () => {
    expect((await call("ref-learner")).status).toBe(200);
    await fakePrisma.user.update({ where: { id: users.learner }, data: { isActive: false } });
    const denied = await call("ref-learner");
    expect(denied.status).toBe(404);
    expect(denied.body.verifiedSkills).toBeUndefined();
    await fakePrisma.user.update({ where: { id: users.learner }, data: { isActive: true } });
    expect((await call("ref-learner")).status).toBe(200);
  });

  it("denies a learner whose email verification is withdrawn on the next request", async () => {
    await fakePrisma.user.update({ where: { id: users.learner }, data: { isEmailVerified: false } });
    expect((await call("ref-learner")).status).toBe(404);
    expect(audits({ outcome: "INACTIVE_LEARNER", externalUserRef: "ref-learner" })).toHaveLength(1);
  });
});

describe("ACA-016 unlinked, re-linked and membership changes", () => {
  it("refuses an identity that was never linked, with the same body as a deactivated learner", async () => {
    const res = await call("ref-never-linked");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found" });
    expect(audits({ outcome: "NOT_FOUND_IDENTITY", externalUserRef: "ref-never-linked" })).toHaveLength(1);
  });

  it("stops resolving an identity once it is unlinked, while the learner's account stays active", async () => {
    expect((await call("ref-relink-source")).status).toBe(200);
    await fakePrisma.academyExternalIdentity.deleteMany({ where: { service: FS, externalUserRef: "ref-relink-source" } });
    const res = await call("ref-relink-source");
    expect(res.status).toBe(404);
    expect(res.body.verifiedSkills).toBeUndefined();
  });

  it("returns only the new learner's skills after an identity is re-linked to a different learner in the same organisation", async () => {
    await fakePrisma.academyExternalIdentity.updateMany({ where: { service: FS, externalUserRef: "ref-relink-source" }, data: { userId: users.relinked } });
    const res = await call("ref-relink-source");
    expect(res.status).toBe(200);
    const ids = res.body.verifiedSkills.map((s: { id: string }) => s.id);
    expect(ids).toEqual(["vi-comp-relinked"]);
    expect(ids).not.toContain("vi-comp-learner");
  });

  it("refuses a re-link that moves the identity into another organisation's scope", async () => {
    await fakePrisma.academyExternalIdentity.updateMany({ where: { service: FS, externalUserRef: "ref-relink-source" }, data: { companyId: orgs.b } });
    const res = await call("ref-relink-source", { org: ORG_A });
    expect(res.status).toBe(404);
    expect(res.body.verifiedSkills).toBeUndefined();
    expect(audits({ outcome: "NOT_FOUND_IDENTITY", externalUserRef: "ref-relink-source" })).toHaveLength(1);
  });

  it("refuses a learner removed from the organisation, with no skills, and audits NOT_FOUND_MEMBERSHIP", async () => {
    await fakePrisma.companyMember.deleteMany({ where: { companyId: orgs.a, userId: users.learner } });
    const res = await call("ref-learner");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Learner not found in organisation" });
    expect(res.body.verifiedSkills).toBeUndefined();
    expect(audits({ outcome: "NOT_FOUND_MEMBERSHIP", externalUserRef: "ref-learner" })).toHaveLength(1);
  });

  it("does not return an organisation-B competency to an organisation-A reference for the same learner", async () => {
    await fakePrisma.academyExternalIdentity.create({ data: { service: FS, externalUserRef: "ref-org-b-learner", userId: users.orgBLearner, companyId: orgs.b } });
    const res = await call("ref-org-b-learner", { org: ORG_A });
    expect(res.status).toBe(404);
    expect(res.body.verifiedSkills).toBeUndefined();
  });
});

describe("ACA-016 service token and company scope", () => {
  it("denies a revoked credential on the next request and audits DENIED_AUTHENTICATION", async () => {
    expect((await call("ref-learner")).status).toBe(200);
    await fakePrisma.academyServiceCredential.updateMany({ where: { tokenHash: sha256Hex(token) }, data: { revokedAt: new Date() } });
    const res = await call("ref-learner");
    expect(res.status).toBe(401);
    expect(res.body.verifiedSkills).toBeUndefined();
    expect(audits({ outcome: "DENIED_AUTHENTICATION" }).length).toBeGreaterThanOrEqual(1);
  });

  it("denies an expired credential whose row still exists", async () => {
    const expired = await issueCredential({ expiresAt: new Date(Date.now() - 1000) });
    const res = await call("ref-learner", { bearer: expired });
    expect(res.status).toBe(401);
    expect(res.body.verifiedSkills).toBeUndefined();
  });

  it("denies a credential presented under the other caller's service name", async () => {
    const res = await call("ref-learner", { service: AI });
    expect(res.status).toBe(401);
    expect(res.body.verifiedSkills).toBeUndefined();
  });

  it("denies a credential for an organisation the caller is no longer scoped to, and recovers when scope is restored", async () => {
    expect((await call("ref-learner")).status).toBe(200);
    process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ [FS]: [ORG_B], [AI]: [ORG_A, ORG_B] });
    const denied = await call("ref-learner");
    expect(denied.status).toBe(401);
    expect(denied.body.verifiedSkills).toBeUndefined();
    process.env.INTEGRATION_SERVICE_SCOPES = ENV_SCOPES;
    expect((await call("ref-learner")).status).toBe(200);
  });

  it("fails closed for every tenant when the scope configuration is unset or malformed", async () => {
    delete process.env.INTEGRATION_SERVICE_SCOPES;
    expect((await call("ref-learner")).status).toBe(401);
    process.env.INTEGRATION_SERVICE_SCOPES = "{not json";
    expect((await call("ref-learner")).status).toBe(401);
    process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ [FS]: [ORG_A] });
    expect((await call("ref-learner")).status).toBe(401);
  });

  it("returns the organisation-not-found response and no skills when the company's external reference changes", async () => {
    await fakePrisma.company.update({ where: { id: orgs.a }, data: { externalRef: "ext-org-a-renamed" } });
    const res = await call("ref-learner");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation not found" });
    expect(res.body.verifiedSkills).toBeUndefined();
    expect(audits({ outcome: "NOT_FOUND_ORGANISATION" })).toHaveLength(1);
  });

  it("denies a credential whose tenant is not the requested organisation and audits DENIED_SCOPE", async () => {
    const res = await call("ref-learner", { org: ORG_B });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation not found" });
    expect(audits({ outcome: "DENIED_SCOPE", companyRef: ORG_B })).toHaveLength(1);
  });

  it("rejects a missing service header without resolving any learner", async () => {
    const res = await call("ref-learner", { service: null });
    expect(res.status).toBe(401);
    expect(audits({ outcome: "DENIED_AUTHENTICATION" }).length).toBeGreaterThanOrEqual(1);
    expect(res.body.verifiedSkills).toBeUndefined();
  });
});

describe("ACA-016 audit completeness", () => {
  it("writes one audit row per denied read and never stores skill identifiers in audit rows", async () => {
    const before = rows("academyIntegrationAudit").length;
    await call("ref-inactive");
    await call("ref-never-linked");
    await call("ref-deleted");
    expect(rows("academyIntegrationAudit").length - before).toBe(3);
    expect(JSON.stringify(rows("academyIntegrationAudit"))).not.toContain("vi-comp-");
  });
});
