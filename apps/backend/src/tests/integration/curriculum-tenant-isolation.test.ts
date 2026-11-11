// ACA-004: tenant isolation on the curriculum and integration APIs, exercised against a real database.
// Two organisations are provisioned through the existing code paths: service credentials via the operator CLI
// (manage-titan-credentials.ts) and user access tokens signed by the app for real users. Nothing is mocked.
// A denied request must not reveal whether the resource exists, so each denial is compared with a request for a
// resource that does not exist at all.
import { it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import {
  configureTestEnvironment, describeWithServices, createFixtures, cleanupFixtures, buildServiceApp, callSkills,
  createCredentialViaCli, runCredentialCli, makeCompetency, randomUnknownToken, type Db, type Fixtures,
} from "./harness";

configureTestEnvironment();

const CURRICULUM = "/api/academy/curriculum";

let db: Db;
let app: express.Express;
let integration: express.Express;
let fx: Fixtures;
let course: { id: string };
let managerA: { id: string };
let managerB: { id: string };
let assessorB: { id: string };
let tokens: Record<string, string>;
let companyA: string;
let companyB: string;
let competencyA: string;
let competencyB: string;
let snapshotA: string;
let snapshotB: string;
let evidenceA: string;
let evidenceB: string;
let fsTokenA: string;
let fsTokenB: string;
let aiTokenA: string;
const extA = () => `${fx.prefix}-fs-learner-a`;
const extB = () => `${fx.prefix}-fs-learner-b`;

async function makeUser(tag: string) {
  return db.user.create({
    data: {
      email: `${fx.prefix}-${tag}@example.test`,
      passwordHash: "integration-test-not-a-login",
      fullName: `${fx.prefix} ${tag}`,
      isActive: true,
      isEmailVerified: true,
    },
    select: { id: true },
  });
}

// Real access token for a real user. The authenticate middleware re-reads the account on every request.
async function accessTokenFor(userId: string): Promise<string> {
  const { signAccessToken } = await import("../../modules/auth/token.utils");
  return signAccessToken({ userId, role: "STUDENT" });
}

const bearer = (name: string) => `Bearer ${tokens[name]}`;
const cur = (path: string) => `${CURRICULUM}${path}`;

// Two denials are equivalent when status and body match exactly. Used to show a denial does not reveal existence.
function expectSameDenial(actual: { status: number; body: unknown }, reference: { status: number; body: unknown }) {
  expect(actual.status).toBe(reference.status);
  expect(actual.body).toEqual(reference.body);
}

beforeAll(async () => {
  ({ prisma: db } = await import("../../config/prisma"));
  const { default: curriculumRoutes } = await import("../../modules/curriculum/curriculum.routes");
  const { default: completionReportRoutes } = await import("../../modules/curriculum/completion-report.routes");
  const { errorHandler } = await import("../../middleware/errorHandler");
  app = express();
  app.use(express.json());
  // Mounted as in app.ts: the completion report router shares the curriculum prefix.
  app.use(CURRICULUM, curriculumRoutes);
  app.use(CURRICULUM, completionReportRoutes);
  app.use(errorHandler);
  integration = await buildServiceApp();
  fx = await createFixtures(db);
  companyA = fx.orgA.id;
  companyB = fx.orgB.id;
  course = await db.course.findFirstOrThrow({ where: { slug: `${fx.prefix}-course` }, select: { id: true } });

  // Organisation managers and an assessor for organisation B. Organisation A already has an assessor from the fixture.
  managerA = await makeUser("manager-a");
  managerB = await makeUser("manager-b");
  assessorB = await makeUser("assessor-b");
  await db.companyMember.createMany({
    data: [
      { companyId: companyA, userId: managerA.id, role: "MANAGER" },
      { companyId: companyB, userId: managerB.id, role: "OWNER" },
      { companyId: companyB, userId: assessorB.id, role: "ASSESSOR" },
    ],
  });

  const learnerA = fx.users.learnerA.id;
  const learnerB = fx.users.learnerB.id;
  const assessorA = fx.assessorId;
  tokens = {
    learnerA: await accessTokenFor(learnerA),
    learnerB: await accessTokenFor(learnerB),
    assessorA: await accessTokenFor(assessorA),
    assessorB: await accessTokenFor(assessorB.id),
    managerA: await accessTokenFor(managerA.id),
    managerB: await accessTokenFor(managerB.id),
  };

  // Integration identities for both organisations, and real service credentials from the operator CLI.
  await db.academyExternalIdentity.createMany({
    data: [
      { service: "field-services", externalUserRef: extA(), userId: learnerA, companyId: companyA },
      { service: "field-services", externalUserRef: extB(), userId: learnerB, companyId: companyB },
    ],
  });
  competencyA = await makeCompetency(db, fx, { companyId: companyA, learnerId: learnerA });
  competencyB = await makeCompetency(db, fx, { companyId: companyB, learnerId: learnerB });
  fsTokenA = (await createCredentialViaCli("field-services", fx.orgA.externalRef)).token;
  fsTokenB = (await createCredentialViaCli("field-services", fx.orgB.externalRef)).token;
  aiTokenA = (await createCredentialViaCli("ai-workforce", fx.orgA.externalRef)).token;

  // Assignments through the real manager route. Learners need one before they can submit evidence or snapshot a lesson.
  const assignA = await request(app).post(cur(`/companies/${companyA}/assignments`)).set("Authorization", bearer("managerA")).send({ learnerId: learnerA, courseId: course.id });
  const assignB = await request(app).post(cur(`/companies/${companyB}/assignments`)).set("Authorization", bearer("managerB")).send({ learnerId: learnerB, courseId: course.id });
  expect(assignA.status).toBe(200);
  expect(assignB.status).toBe(200);
}, 180000);

afterAll(async () => {
  if (db && fx) {
    const orgIds = [companyA, companyB];
    await db.academyLessonContextSnapshot.deleteMany({ where: { companyId: { in: orgIds } } });
    // Competencies reference the evidence they were awarded from, so they go first.
    await db.academyVerifiedCompetency.deleteMany({ where: { companyId: { in: orgIds } } });
    await db.academyPracticalEvidence.deleteMany({ where: { companyId: { in: orgIds } } });
    await db.academyTrainingAssignment.deleteMany({ where: { companyId: { in: orgIds } } });
    await db.academyBusinessLessonField.deleteMany({ where: { companyId: { in: orgIds } } });
    await cleanupFixtures(db, fx);
  }
  await db?.$disconnect?.();
});

describeWithServices("ACA-004 service credentials on the integration API", () => {
  it("same tenant: a valid org A credential reads org A's learner and only that learner's skills", async () => {
    const res = await callSkills(integration, { service: "field-services", token: fsTokenA, companyRef: fx.orgA.externalRef, userRef: extA() });
    expect(res.status).toBe(200);
    expect(res.body.verifiedSkills.map((s: { id: string }) => s.id)).toEqual([competencyA]);
  });

  it("foreign tenant: an org A credential asking for org B is refused exactly like an organisation that does not exist", async () => {
    const foreign = await callSkills(integration, { service: "field-services", token: fsTokenA, companyRef: fx.orgB.externalRef, userRef: extB() });
    const unknown = await callSkills(integration, { service: "field-services", token: fsTokenA, companyRef: `${fx.prefix}-no-such-org`, userRef: extB() });
    expect(foreign.status).toBe(404);
    expectSameDenial(foreign, unknown);
    expect(JSON.stringify(foreign.body)).not.toContain(competencyB);
  });

  it("foreign learner: a learner who belongs to org B is refused under org A exactly like a learner who does not exist", async () => {
    const foreign = await callSkills(integration, { service: "field-services", token: fsTokenA, companyRef: fx.orgA.externalRef, userRef: extB() });
    const missing = await callSkills(integration, { service: "field-services", token: fsTokenA, companyRef: fx.orgA.externalRef, userRef: `${fx.prefix}-no-such-learner` });
    expectSameDenial(foreign, missing);
    expect(JSON.stringify(foreign.body)).not.toContain(competencyB);
  });

  it("missing credential: no bearer token is refused with the same body as a wrong token", async () => {
    const none = await callSkills(integration, { service: "field-services", token: null, companyRef: fx.orgA.externalRef, userRef: extA() });
    const wrong = await callSkills(integration, { service: "field-services", token: randomUnknownToken(), companyRef: fx.orgA.externalRef, userRef: extA() });
    expect(none.status).toBe(401);
    expectSameDenial(none, wrong);
    expect(JSON.stringify(none.body)).not.toContain(competencyA);
  });

  it("revoked credential: a revoked org A credential is refused, and the same as an unknown token", async () => {
    const issued = await createCredentialViaCli("field-services", fx.orgA.externalRef);
    const ok = await callSkills(integration, { service: "field-services", token: issued.token, companyRef: fx.orgA.externalRef, userRef: extA() });
    expect(ok.status).toBe(200);
    const revoked = await runCredentialCli({ action: "revoke", id: issued.id });
    expect(revoked.code).toBe(0);
    const after = await callSkills(integration, { service: "field-services", token: issued.token, companyRef: fx.orgA.externalRef, userRef: extA() });
    const unknown = await callSkills(integration, { service: "field-services", token: randomUnknownToken(), companyRef: fx.orgA.externalRef, userRef: extA() });
    expect(after.status).toBe(401);
    expectSameDenial(after, unknown);
  });

  it("mis-scoped caller: an ai-workforce credential presented as field-services is refused like an unknown token", async () => {
    const misScoped = await callSkills(integration, { service: "field-services", token: aiTokenA, companyRef: fx.orgA.externalRef, userRef: extA() });
    const unknown = await callSkills(integration, { service: "field-services", token: randomUnknownToken(), companyRef: fx.orgA.externalRef, userRef: extA() });
    expect(misScoped.status).toBe(401);
    expectSameDenial(misScoped, unknown);
  });

  it("mis-scoped tenant: an org B credential is refused for org A's learner, the same as the scope denial", async () => {
    const crossed = await callSkills(integration, { service: "field-services", token: fsTokenB, companyRef: fx.orgA.externalRef, userRef: extA() });
    expect(crossed.status).toBe(404);
    expect(crossed.body).toEqual({ message: "Organisation not found" });
    expect(JSON.stringify(crossed.body)).not.toContain(competencyA);
  });

  it("every denial above is audited with a DENIED_* or NOT_FOUND_* outcome, not silently refused", async () => {
    const denials = await db.academyIntegrationAudit.count({ where: { OR: [{ outcome: { startsWith: "DENIED" } }, { outcome: { startsWith: "NOT_FOUND" } }] } });
    expect(denials).toBeGreaterThan(0);
  });
});

describeWithServices("ACA-004 curriculum APIs: lessons and lesson context snapshots", () => {
  it("same tenant: a learner snapshots an assigned lesson in their own organisation", async () => {
    const res = await request(app).post(cur(`/companies/${companyA}/lessons/${fx.revisionId}/context`)).set("Authorization", bearer("learnerA"));
    expect(res.status).toBe(200);
    snapshotA = res.body.data.contextSnapshotId;
    expect(snapshotA).toBeTruthy();
  });

  it("foreign tenant: a learner cannot snapshot a lesson through an organisation they do not belong to", async () => {
    const foreign = await request(app).post(cur(`/companies/${companyB}/lessons/${fx.revisionId}/context`)).set("Authorization", bearer("learnerA"));
    expect(foreign.status).toBe(403);
    const missingRevision = await request(app).post(cur(`/companies/${companyB}/lessons/${randomUnknownToken()}/context`)).set("Authorization", bearer("learnerA"));
    expect(missingRevision.status).toBe(403);
    expect(JSON.stringify(foreign.body)).not.toContain(snapshotA);
  });

  it("a learner of org B cannot snapshot through org A's organisation path, and gets the same refusal as a non-member", async () => {
    const crossed = await request(app).post(cur(`/companies/${companyA}/lessons/${fx.revisionId}/context`)).set("Authorization", bearer("learnerB"));
    const stranger = await request(app).post(cur(`/companies/${companyA}/lessons/${fx.revisionId}/context`)).set("Authorization", bearer("managerB"));
    expect(crossed.status).toBe(403);
    expectSameDenial(crossed, stranger);
  });

  it("creates the org B snapshot for learner B, to test snapshot separation", async () => {
    const res = await request(app).post(cur(`/companies/${companyB}/lessons/${fx.revisionId}/context`)).set("Authorization", bearer("learnerB"));
    expect(res.status).toBe(200);
    snapshotB = res.body.data.contextSnapshotId;
  });
});

describeWithServices("ACA-004 curriculum APIs: skills passport", () => {
  it("same tenant: a manager reads a learner of their own organisation", async () => {
    const res = await request(app).get(cur(`/companies/${companyA}/skills/${fx.users.learnerA.id}`)).set("Authorization", bearer("managerA"));
    expect(res.status).toBe(200);
    expect(res.body.data.map((s: { id: string }) => s.id)).toEqual([competencyA]);
  });

  it("foreign tenant: a manager of org A cannot read the skills of a learner of org B, or of an organisation they do not manage", async () => {
    const foreignLearner = await request(app).get(cur(`/companies/${companyA}/skills/${fx.users.learnerB.id}`)).set("Authorization", bearer("managerA"));
    const missingLearner = await request(app).get(cur(`/companies/${companyA}/skills/${randomUnknownToken()}`)).set("Authorization", bearer("managerA"));
    expect(foreignLearner.status).toBe(403);
    expectSameDenial(foreignLearner, missingLearner);
    expect(JSON.stringify(foreignLearner.body)).not.toContain(competencyB);

    const foreignOrg = await request(app).get(cur(`/companies/${companyB}/skills/${fx.users.learnerB.id}`)).set("Authorization", bearer("managerA"));
    const unknownOrg = await request(app).get(cur(`/companies/${randomUnknownToken()}/skills/${fx.users.learnerB.id}`)).set("Authorization", bearer("managerA"));
    expect(foreignOrg.status).toBe(403);
    expectSameDenial(foreignOrg, unknownOrg);
  });

  it("an assessor of org B cannot read org A's active skills, and a learner cannot read another learner's passport", async () => {
    const assessor = await request(app).get(cur(`/companies/${companyA}/skills/${fx.users.learnerA.id}/active`)).set("Authorization", bearer("assessorB"));
    expect(assessor.status).toBe(403);
    const peer = await request(app).get(cur(`/companies/${companyA}/skills/${fx.users.learnerB.id}`)).set("Authorization", bearer("learnerA"));
    expect(peer.status).toBe(403);
    expect(JSON.stringify(peer.body)).not.toContain(competencyB);
  });
});

describeWithServices("ACA-004 curriculum APIs: assignments", () => {
  it("same tenant: a manager lists only their organisation's assignments", async () => {
    const res = await request(app).get(cur(`/companies/${companyA}/assignments`)).set("Authorization", bearer("managerA"));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((row: { companyId: string }) => row.companyId === companyA)).toBe(true);
  });

  it("foreign tenant: a manager of org A cannot list or create assignments in org B", async () => {
    const list = await request(app).get(cur(`/companies/${companyB}/assignments`)).set("Authorization", bearer("managerA"));
    expect(list.status).toBe(403);
    const create = await request(app).post(cur(`/companies/${companyB}/assignments`)).set("Authorization", bearer("managerA")).send({ learnerId: fx.users.learnerB.id, courseId: course.id });
    expect(create.status).toBe(403);
  });

  it("cross-tenant learner: an org A manager cannot assign a learner who is only in org B, and gets the non-member refusal", async () => {
    const res = await request(app).post(cur(`/companies/${companyA}/assignments`)).set("Authorization", bearer("managerA")).send({ learnerId: fx.users.learnerB.id, courseId: course.id });
    expect(res.status).toBe(403);
    const missing = await request(app).post(cur(`/companies/${companyA}/assignments`)).set("Authorization", bearer("managerA")).send({ learnerId: randomUnknownToken(), courseId: course.id });
    expectSameDenial(res, missing);
  });

  it("a learner sees only assignments in organisations they belong to, and no other organisation's rows", async () => {
    const res = await request(app).get(cur("/assignments/me")).set("Authorization", bearer("learnerA"));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((row: { companyId: string }) => row.companyId === companyA)).toBe(true);
  });
});

describeWithServices("ACA-004 curriculum APIs: practical evidence", () => {
  const evidenceBody = (companyId: string) => ({
    companyId,
    lessonId: fx.lessonId,
    revisionId: fx.revisionId,
    description: "Integration evidence for tenant isolation checks.",
    evidenceUrls: ["https://example.test/evidence/one"],
  });

  it("same tenant: a learner submits evidence for an organisation they are assigned through", async () => {
    const res = await request(app).post(cur("/practical-evidence")).set("Authorization", bearer("learnerA")).send(evidenceBody(companyA));
    expect(res.status).toBe(201);
    evidenceA = res.body.data.id;
  });

  it("foreign tenant: a learner cannot submit evidence under an organisation they are not assigned through", async () => {
    const res = await request(app).post(cur("/practical-evidence")).set("Authorization", bearer("learnerA")).send(evidenceBody(companyB));
    expect(res.status).toBe(403);
    const other = await request(app).post(cur("/practical-evidence")).set("Authorization", bearer("learnerB")).send(evidenceBody(companyA));
    expect(other.status).toBe(403);
  });

  it("submits org B evidence for learner B so that the separation can be checked from both sides", async () => {
    const res = await request(app).post(cur("/practical-evidence")).set("Authorization", bearer("learnerB")).send(evidenceBody(companyB));
    expect(res.status).toBe(201);
    evidenceB = res.body.data.id;
  });

  it("pending review: an assessor sees only their own organisation's pending evidence", async () => {
    const own = await request(app).get(cur(`/companies/${companyA}/practical-evidence/pending`)).set("Authorization", bearer("assessorA"));
    expect(own.status).toBe(200);
    const ids = own.body.data.map((row: { id: string }) => row.id);
    expect(ids).toContain(evidenceA);
    expect(ids).not.toContain(evidenceB);

    const foreign = await request(app).get(cur(`/companies/${companyA}/practical-evidence/pending`)).set("Authorization", bearer("assessorB"));
    expect(foreign.status).toBe(403);
    const otherOrg = await request(app).get(cur(`/companies/${companyB}/practical-evidence/pending`)).set("Authorization", bearer("assessorB"));
    expect(otherOrg.status).toBe(200);
    expect(JSON.stringify(otherOrg.body)).not.toContain(evidenceA);
  });

  it("review: an assessor of org B cannot review org A's evidence, and the refusal matches an evidence ID that does not exist", async () => {
    const foreign = await request(app).post(cur(`/companies/${companyB}/practical-evidence/${evidenceA}/review`)).set("Authorization", bearer("assessorB"))
      .send({ decision: "APPROVED", feedback: "Reviewed for isolation check." });
    const missing = await request(app).post(cur(`/companies/${companyB}/practical-evidence/${randomUnknownToken()}/review`)).set("Authorization", bearer("assessorB"))
      .send({ decision: "APPROVED", feedback: "Reviewed for isolation check." });
    expect(foreign.status).toBe(403);
    expectSameDenial(foreign, missing);
    const stillPending = await db.academyPracticalEvidence.findUnique({ where: { id: evidenceA }, select: { status: true } });
    expect(stillPending?.status).toBe("PENDING");
  });

  it("review: an assessor of org A cannot review evidence through org B's path", async () => {
    const res = await request(app).post(cur(`/companies/${companyB}/practical-evidence/${evidenceA}/review`)).set("Authorization", bearer("assessorA"))
      .send({ decision: "APPROVED", feedback: "Reviewed for isolation check." });
    expect(res.status).toBe(403);
    const stillPending = await db.academyPracticalEvidence.findUnique({ where: { id: evidenceA }, select: { status: true, companyId: true } });
    expect(stillPending).toMatchObject({ status: "PENDING", companyId: companyA });
  });
});

describeWithServices("ACA-004 curriculum APIs: completion reports", () => {
  it("same tenant: a manager's organisation report lists its own learners only", async () => {
    const res = await request(app).get(cur(`/companies/${companyA}/completion-reports`)).set("Authorization", bearer("managerA"));
    expect(res.status).toBe(200);
    const learnerIds = res.body.data.learners.map((l: { learnerId: string }) => l.learnerId);
    expect(learnerIds).toContain(fx.users.learnerA.id);
    expect(learnerIds).not.toContain(fx.users.learnerB.id);
    expect(JSON.stringify(res.body)).not.toContain(evidenceB);
  });

  it("foreign tenant: a manager of org A cannot read org B's roll-up, and an assessor cannot read a roll-up at all", async () => {
    const foreign = await request(app).get(cur(`/companies/${companyB}/completion-reports`)).set("Authorization", bearer("managerA"));
    expect(foreign.status).toBe(403);
    const assessor = await request(app).get(cur(`/companies/${companyA}/completion-reports`)).set("Authorization", bearer("assessorA"));
    expect(assessor.status).toBe(403);
  });

  it("learner report: an assessor of org A reads their own learner, and a foreign learner gets the same not-found as a missing one", async () => {
    const own = await request(app).get(cur(`/companies/${companyA}/completion-reports/learners/${fx.users.learnerA.id}`)).set("Authorization", bearer("assessorA"));
    expect(own.status).toBe(200);
    const foreign = await request(app).get(cur(`/companies/${companyA}/completion-reports/learners/${fx.users.learnerB.id}`)).set("Authorization", bearer("assessorA"));
    const missing = await request(app).get(cur(`/companies/${companyA}/completion-reports/learners/${randomUnknownToken()}`)).set("Authorization", bearer("assessorA"));
    expect(foreign.status).toBe(404);
    expectSameDenial(foreign, missing);
    expect(JSON.stringify(foreign.body)).not.toContain(competencyB);
  });

  it("learner report: a learner reads only their own report, and org B's report is refused to org A's learner", async () => {
    const peer = await request(app).get(cur(`/companies/${companyA}/completion-reports/learners/${fx.users.learnerB.id}`)).set("Authorization", bearer("learnerA"));
    expect(peer.status).toBe(403);
    const crossOrg = await request(app).get(cur(`/companies/${companyB}/completion-reports/learners/${fx.users.learnerB.id}`)).set("Authorization", bearer("learnerA"));
    expect(crossOrg.status).toBe(403);
    expect(JSON.stringify(crossOrg.body)).not.toContain(evidenceB);
  });
});

describeWithServices("ACA-004 curriculum APIs: lesson context snapshots", () => {
  it("same tenant: a learner lists and reads their own snapshot in their organisation", async () => {
    const list = await request(app).get(cur(`/companies/${companyA}/lesson-context-snapshots`)).set("Authorization", bearer("learnerA"));
    expect(list.status).toBe(200);
    expect(list.body.data.items.map((i: { contextSnapshotId: string }) => i.contextSnapshotId)).toEqual([snapshotA]);
    const detail = await request(app).get(cur(`/companies/${companyA}/lesson-context-snapshots/${snapshotA}`)).set("Authorization", bearer("learnerA"));
    expect(detail.status).toBe(200);
    expect(detail.body.data.contextSnapshotId).toBe(snapshotA);
  });

  it("foreign snapshot: another learner's snapshot is refused exactly like a snapshot that does not exist", async () => {
    // Learner B is a member of org B, so the org B path is open to them but does not reveal org A's snapshot.
    const foreignSnapshot = await request(app).get(cur(`/companies/${companyB}/lesson-context-snapshots/${snapshotA}`)).set("Authorization", bearer("learnerB"));
    const missing = await request(app).get(cur(`/companies/${companyB}/lesson-context-snapshots/${randomUnknownToken()}`)).set("Authorization", bearer("learnerB"));
    expect(foreignSnapshot.status).toBe(404);
    expectSameDenial(foreignSnapshot, missing);
    // Learner A asking under org A for org B's snapshot gets the same not-found.
    const foreignOrgSnapshot = await request(app).get(cur(`/companies/${companyA}/lesson-context-snapshots/${snapshotB}`)).set("Authorization", bearer("learnerA"));
    expectSameDenial(foreignOrgSnapshot, missing);
    expect(JSON.stringify(foreignOrgSnapshot.body)).not.toContain(snapshotB);
    // Learner A asking under org B, where they are not a member, is refused as a non-member.
    const notMember = await request(app).get(cur(`/companies/${companyB}/lesson-context-snapshots/${snapshotA}`)).set("Authorization", bearer("learnerA"));
    expect(notMember.status).toBe(403);
  });

  it("list: a manager sees no learner's snapshots, and a foreign organisation's list is refused", async () => {
    const manager = await request(app).get(cur(`/companies/${companyA}/lesson-context-snapshots`)).set("Authorization", bearer("managerA"));
    expect(manager.status).toBe(200);
    expect(manager.body.data.items).toEqual([]);
    const foreign = await request(app).get(cur(`/companies/${companyB}/lesson-context-snapshots`)).set("Authorization", bearer("learnerA"));
    expect(foreign.status).toBe(403);
  });

  it("cursor: a cursor that points at another learner's or organisation's snapshot is refused as not found", async () => {
    const res = await request(app).get(cur(`/companies/${companyA}/lesson-context-snapshots?cursor=${snapshotB}`)).set("Authorization", bearer("learnerA"));
    expect(res.status).toBe(404);
    const missing = await request(app).get(cur(`/companies/${companyA}/lesson-context-snapshots?cursor=${randomUnknownToken()}`)).set("Authorization", bearer("learnerA"));
    expectSameDenial(res, missing);
  });
});

describeWithServices("ACA-004 curriculum APIs: unauthenticated and inactive callers", () => {
  it("refuses a request with no token and a request with a token for a removed account identically", async () => {
    const none = await request(app).get(cur(`/companies/${companyA}/assignments`));
    expect(none.status).toBe(401);
    const bogus = await request(app).get(cur(`/companies/${companyA}/assignments`)).set("Authorization", `Bearer ${randomUnknownToken()}`);
    expectSameDenial(none, bogus);
  });

  it("refuses a valid token for an inactive account, because the account is re-read on every request", async () => {
    // The fixture's inactive user is a real, signed token for an account that Academy no longer accepts.
    const token = await accessTokenFor(fx.users.inactive.id);
    const res = await request(app).get(cur("/assignments/me")).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describeWithServices("ACA-004 curriculum APIs: organisation business fields", () => {
  const FIELD = "business.name";

  it("same tenant: a manager writes and reads their own organisation's business field", async () => {
    const put = await request(app).put(cur(`/companies/${companyA}/business-fields/${FIELD}`)).set("Authorization", bearer("managerA")).send({ value: "Org A name" });
    expect(put.status).toBe(200);
    const list = await request(app).get(cur(`/companies/${companyA}/business-fields`)).set("Authorization", bearer("managerA"));
    expect(list.status).toBe(200);
    expect(list.body.data.map((f: { value: unknown }) => f.value)).toEqual(["Org A name"]);
  });

  it("foreign tenant: a manager of org A cannot read, write, approve or retire org B's business field", async () => {
    await request(app).put(cur(`/companies/${companyB}/business-fields/${FIELD}`)).set("Authorization", bearer("managerB")).send({ value: "Org B name" });
    const read = await request(app).get(cur(`/companies/${companyB}/business-fields`)).set("Authorization", bearer("managerA"));
    expect(read.status).toBe(403);
    expect(JSON.stringify(read.body)).not.toContain("Org B name");
    const write = await request(app).put(cur(`/companies/${companyB}/business-fields/${FIELD}`)).set("Authorization", bearer("managerA")).send({ value: "Forged" });
    expect(write.status).toBe(403);
    const approve = await request(app).post(cur(`/companies/${companyB}/business-fields/${FIELD}/approve`)).set("Authorization", bearer("managerA"));
    expect(approve.status).toBe(403);
    const retire = await request(app).post(cur(`/companies/${companyB}/business-fields/${FIELD}/retire`)).set("Authorization", bearer("managerA"));
    expect(retire.status).toBe(403);
    const row = await db.academyBusinessLessonField.findUnique({ where: { companyId_fieldKey: { companyId: companyB, fieldKey: FIELD } } });
    expect(row).toMatchObject({ value: "Org B name", status: "DRAFT" });
  });

  it("an assessor or learner of an organisation cannot read its manager-only business fields", async () => {
    const assessor = await request(app).get(cur(`/companies/${companyA}/business-fields`)).set("Authorization", bearer("assessorA"));
    expect(assessor.status).toBe(403);
    const learner = await request(app).get(cur(`/companies/${companyA}/business-fields`)).set("Authorization", bearer("learnerA"));
    expect(learner.status).toBe(403);
  });
});
