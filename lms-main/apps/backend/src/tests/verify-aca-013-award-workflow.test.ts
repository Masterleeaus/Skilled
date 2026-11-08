/**
 * ACA-013 verification: the persisted competency award workflow, end to end.
 * Submission, assessor rejection, resubmission, approval, expiry, duplicate and concurrent actions,
 * tenant and role checks, audit fields, and the rule that learner acknowledgement or quiz completion
 * never awards a practical competency. Drives the real curriculum router against the in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const ORG = ids.org1;
const ORG2 = ids.org2;
const ASSESSOR_2 = "assessor-2";
const ORG2_ASSESSOR = "assessor-org2";
const ORG2_LEARNER_SELF_ASSESSOR = "self-org2";
const T0 = new Date("2026-11-08T10:00:00.000Z");
const DAY = 86400000;

const base = `/api/academy/curriculum/companies/${ORG}`;
const reviewUrl = (evidenceId: string, companyId = ORG) => `/api/academy/curriculum/companies/${companyId}/practical-evidence/${evidenceId}/review`;
const submitUrl = "/api/academy/curriculum/practical-evidence";
const skillsUrl = (learnerId: string, companyId = ORG) => `/api/academy/curriculum/companies/${companyId}/skills/${learnerId}`;
const activeUrl = (learnerId: string, companyId = ORG) => `${skillsUrl(learnerId, companyId)}/active`;
const pendingUrl = `${base}/practical-evidence/pending`;

const SUBMISSION = {
  companyId: ORG,
  lessonId: ids.lessonA,
  revisionId: ids.revisionA,
  description: "Observed the full shift sequence from sign-in to verbal handover.",
  evidenceUrls: ["https://example.test/evidence/1"],
};
const APPROVE = { decision: "APPROVED", feedback: "Observed against every practical criterion." };
const REJECT = { decision: "REJECTED", feedback: "Handover record incomplete; resubmit." };

function asUser(userId: string) {
  return `Bearer ${token(userId, "TEACHER")}`;
}

async function submit(userId = ids.learner1, body: Record<string, unknown> = SUBMISSION) {
  return request(app).post(submitUrl).set("Authorization", `Bearer ${token(userId)}`).send(body);
}

async function review(evidenceId: string, body: Record<string, unknown>, userId = ids.assessor, companyId = ORG) {
  return request(app).post(reviewUrl(evidenceId, companyId)).set("Authorization", asUser(userId)).send(body);
}

async function seedEvidence(overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as string | undefined) ?? `ev-${rows("academyPracticalEvidence").length + 1}`;
  await seed("academyPracticalEvidence", [{
    id,
    companyId: ORG,
    learnerId: ids.learner1,
    lessonId: ids.lessonA,
    revisionId: ids.revisionA,
    description: "Observed the shift sequence from sign-in to verbal handover.",
    evidenceUrls: ["https://example.test/evidence/seed"],
    status: "PENDING",
    ...overrides,
  }]);
  return id;
}

const evidenceRow = (id: string) => rows("academyPracticalEvidence").find(row => row.id === id)!;
const competencies = () => rows("academyVerifiedCompetency");

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  await seed("user", [
    { id: ASSESSOR_2, email: "assessor2@example.test", fullName: "Second Assessor", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ORG2_ASSESSOR, email: "org2-assessor@example.test", fullName: "Org Two Assessor", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ORG2_LEARNER_SELF_ASSESSOR, email: "org2-self@example.test", fullName: "Org Two Self", role: "TEACHER", isActive: true, isEmailVerified: true },
  ]);
  await seed("companyMember", [
    { companyId: ORG, userId: ASSESSOR_2, role: "ASSESSOR" },
    { companyId: ORG2, userId: ORG2_ASSESSOR, role: "ASSESSOR" },
    { companyId: ORG2, userId: ORG2_LEARNER_SELF_ASSESSOR, role: "ASSESSOR" },
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ACA-013 persisted workflow: submit, reject, resubmit, approve", () => {
  it("runs the full cycle and keeps every decision on its own evidence row", async () => {
    const first = await submit();
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ status: "PENDING", learnerId: ids.learner1, companyId: ORG, assessorId: null });
    const firstId = first.body.data.id as string;

    const rejected = await review(firstId, REJECT);
    expect(rejected.status).toBe(200);
    expect(rejected.body.data).toMatchObject({ status: "REJECTED", assessorId: ids.assessor, assessorFeedback: REJECT.feedback });
    expect(rejected.body.data.reviewedAt).toBeTruthy();
    expect(competencies()).toHaveLength(0);

    const resubmitted = await submit();
    expect(resubmitted.status).toBe(201);
    const secondId = resubmitted.body.data.id as string;
    expect(secondId).not.toBe(firstId);
    expect(evidenceRow(secondId).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);

    const approved = await review(secondId, APPROVE);
    expect(approved.status).toBe(200);
    expect(approved.body.data).toMatchObject({ status: "APPROVED", assessorId: ids.assessor, assessorFeedback: APPROVE.feedback });

    const awards = competencies();
    expect(awards).toHaveLength(1);
    expect(awards[0]).toMatchObject({
      evidenceId: secondId, learnerId: ids.learner1, assessorId: ids.assessor, companyId: ORG, lessonId: ids.lessonA, revisionId: ids.revisionA,
    });
    // The earlier rejection is untouched by the later approval.
    expect(evidenceRow(firstId)).toMatchObject({ status: "REJECTED", assessorFeedback: REJECT.feedback });
  });

  it("refuses to approve evidence that was rejected earlier, even by the same assessor", async () => {
    const id = (await submit()).body.data.id as string;
    await review(id, REJECT);
    const res = await review(id, APPROVE);
    expect(res.status).toBe(403);
    expect(evidenceRow(id).status).toBe("REJECTED");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses to change a decision once evidence has been approved", async () => {
    const id = await seedEvidence();
    expect((await review(id, APPROVE)).status).toBe(200);
    expect((await review(id, REJECT)).status).toBe(403);
    expect(evidenceRow(id).status).toBe("APPROVED");
    expect(competencies()).toHaveLength(1);
  });

  it("records the reviewing assessor, feedback and review time on the evidence row (audit trail)", async () => {
    const id = await seedEvidence();
    await review(id, APPROVE);
    const row = evidenceRow(id);
    expect(row).toMatchObject({ status: "APPROVED", assessorId: ids.assessor, assessorFeedback: APPROVE.feedback });
    expect(row.reviewedAt).toBeInstanceOf(Date);
    expect(row.description).toBe("Observed the shift sequence from sign-in to verbal handover.");
  });
});

describe("ACA-013 expiry", () => {
  it("stores the expiry on approval and drops the competency from the active view once it passes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T0);
    const id = await seedEvidence();
    const expiresAt = new Date(T0.getTime() + DAY).toISOString();
    expect((await review(id, { ...APPROVE, expiresAt })).status).toBe(200);
    expect(competencies()[0].expiresAt).toEqual(new Date(expiresAt));

    const beforeExpiry = await request(app).get(activeUrl(ids.learner1)).set("Authorization", asUser(ids.assessor));
    expect(beforeExpiry.body.data.skills).toHaveLength(1);

    vi.setSystemTime(new Date(T0.getTime() + 2 * DAY));
    const afterExpiry = await request(app).get(activeUrl(ids.learner1)).set("Authorization", asUser(ids.assessor));
    expect(afterExpiry.body.data.skills).toHaveLength(0);
    // The full passport keeps the historical record; it is not deleted or altered by expiry.
    const history = await request(app).get(skillsUrl(ids.learner1)).set("Authorization", asUser(ids.assessor));
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].expiresAt).toEqual(new Date(expiresAt).toISOString());
  });

  it("refuses an approval whose expiry is not in the future, leaving the evidence pending", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T0);
    const id = await seedEvidence();
    const res = await review(id, { ...APPROVE, expiresAt: new Date(T0.getTime() - 1000).toISOString() });
    expect(res.status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses an expiry on a rejection, leaving the evidence pending", async () => {
    const id = await seedEvidence();
    const res = await review(id, { ...REJECT, expiresAt: new Date(Date.now() + DAY).toISOString() });
    expect(res.status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
  });

  it("issues a competency without expiry when none is given", async () => {
    const id = await seedEvidence();
    await review(id, APPROVE);
    // The fake double leaves an unset optional column undefined; PostgreSQL stores NULL. Both mean "no expiry".
    expect(competencies()[0].expiresAt ?? null).toBeNull();
  });
});

describe("ACA-013 duplicate and concurrent actions", () => {
  it("creates exactly one competency when the same approval is sent concurrently", async () => {
    const id = await seedEvidence();
    const results = await Promise.all([review(id, APPROVE), review(id, APPROVE), review(id, APPROVE)]);
    expect(results.map(r => r.status).sort()).toEqual([200, 403, 403]);
    expect(competencies()).toHaveLength(1);
    expect(evidenceRow(id).status).toBe("APPROVED");
  });

  it("settles a concurrent approval and rejection to one outcome, with the award matching the final status", async () => {
    const id = await seedEvidence();
    const results = await Promise.all([review(id, APPROVE), review(id, REJECT)]);
    expect(results.filter(r => r.status === 200)).toHaveLength(1);
    const status = evidenceRow(id).status;
    expect(["APPROVED", "REJECTED"]).toContain(status);
    expect(competencies()).toHaveLength(status === "APPROVED" ? 1 : 0);
  });

  it("lets only one of two assessors approve the same evidence, and the award names that assessor", async () => {
    const id = await seedEvidence();
    const results = await Promise.all([review(id, APPROVE, ids.assessor), review(id, APPROVE, ASSESSOR_2)]);
    const winners = results.filter(r => r.status === 200);
    expect(winners).toHaveLength(1);
    const winner = winners[0].body.data.assessorId as string;
    expect([ids.assessor, ASSESSOR_2]).toContain(winner);
    expect(competencies()).toHaveLength(1);
    expect(competencies()[0].assessorId).toBe(winner);
  });

  it("does not create a second competency when an approved row is approved again later", async () => {
    const id = await seedEvidence();
    await review(id, APPROVE);
    await review(id, APPROVE, ASSESSOR_2);
    expect(competencies()).toHaveLength(1);
    expect(competencies()[0].assessorId).toBe(ids.assessor);
  });

  it("keeps two separate submissions as separate pending items, each reviewable once", async () => {
    const a = (await submit()).body.data.id as string;
    const b = (await submit()).body.data.id as string;
    expect((await review(a, APPROVE)).status).toBe(200);
    expect((await review(b, REJECT)).status).toBe(200);
    expect(competencies()).toHaveLength(1);
    expect(competencies()[0].evidenceId).toBe(a);
  });
});

describe("ACA-013 role and tenant checks", () => {
  it("refuses review by a learner, including a learner approving their own evidence", async () => {
    const id = (await submit()).body.data.id as string;
    expect((await review(id, APPROVE, ids.learner1)).status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses review by a LEARNER-role member of the organisation who is not an assessor", async () => {
    const id = await seedEvidence({ learnerId: ids.learner2 });
    expect((await review(id, APPROVE, ids.learner1)).status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
  });

  it("refuses review by an organisation assessor when the evidence belongs to another organisation", async () => {
    const id = await seedEvidence();
    const viaOwnOrg = await review(id, APPROVE, ORG2_ASSESSOR, ORG2);
    expect(viaOwnOrg.status).toBe(403);
    const viaPathOfEvidenceOrg = await review(id, APPROVE, ORG2_ASSESSOR, ORG);
    expect(viaPathOfEvidenceOrg.status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses review by an assessor of the evidence organisation when the path names another organisation", async () => {
    const id = await seedEvidence();
    const res = await review(id, APPROVE, ids.assessor, ORG2);
    expect(res.status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
  });

  it("refuses review by a deactivated assessor account (authentication fails before any award)", async () => {
    const id = await seedEvidence();
    await fakePrisma.user.update({ where: { id: ids.assessor }, data: { isActive: false } });
    const res = await review(id, APPROVE);
    expect(res.status).toBe(401);
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses approval when the learner's account has been deactivated since submission", async () => {
    const id = await seedEvidence();
    await fakePrisma.user.update({ where: { id: ids.learner1 }, data: { isActive: false } });
    const res = await review(id, APPROVE);
    expect(res.status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses approval when the learner has been removed from the organisation since submission", async () => {
    const id = await seedEvidence();
    await fakePrisma.companyMember.deleteMany({ where: { companyId: ORG, userId: ids.learner1 } });
    const res = await review(id, APPROVE);
    expect(res.status).toBe(403);
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
  });

  it("refuses review of a decision with an unknown value or too-short feedback", async () => {
    const id = await seedEvidence();
    // Schema validation failures are reported as 422 by the shared error handler.
    expect((await review(id, { decision: "MAYBE", feedback: "Not a valid decision value." })).status).toBe(422);
    expect((await review(id, { decision: "APPROVED", feedback: "short" })).status).toBe(422);
    expect(evidenceRow(id).status).toBe("PENDING");
  });

  it("returns a not-found style refusal for an unknown evidence ID, with no award", async () => {
    const res = await review("no-such-evidence", APPROVE);
    expect(res.status).toBe(403);
    expect(competencies()).toHaveLength(0);
  });

  it("lists pending evidence only for organisation assessors and never across organisations", async () => {
    await seedEvidence();
    await seedEvidence({ id: "ev-other-org", companyId: ORG2, learnerId: ids.outsider });
    const other = await request(app).get(pendingUrl).set("Authorization", asUser(ASSESSOR_2));
    expect(other.body.data.map((row: { id: string }) => row.id)).not.toContain("ev-other-org");
    const outsider = await request(app).get(pendingUrl).set("Authorization", asUser(ids.outsider));
    expect(outsider.status).toBe(403);
  });
});

describe("ACA-013 learner acknowledgement and quiz completion never award a practical competency", () => {
  it("creates no competency when the learner completes the lesson", async () => {
    const res = await request(app)
      .post("/api/academy/curriculum/completions")
      .set("Authorization", `Bearer ${token(ids.learner1)}`)
      .send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    expect(res.status).toBe(200);
    expect(rows("academyLearnerCompletion").length).toBeGreaterThan(0);
    expect(competencies()).toHaveLength(0);
  });

  it("creates no competency when the learner passes the knowledge check", async () => {
    const res = await request(app)
      .post("/api/academy/curriculum/knowledge-checks/attempts")
      .set("Authorization", `Bearer ${token(ids.learner1)}`)
      .send({ lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ passed: true, score: 2, total: 2 });
    expect(competencies()).toHaveLength(0);
  });

  it("creates no competency from completion and a passed quiz together, while evidence is still pending", async () => {
    const id = (await submit()).body.data.id as string;
    await request(app).post("/api/academy/curriculum/completions").set("Authorization", `Bearer ${token(ids.learner1)}`).send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    await request(app).post("/api/academy/curriculum/knowledge-checks/attempts").set("Authorization", `Bearer ${token(ids.learner1)}`).send({ lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1] });
    expect(evidenceRow(id).status).toBe("PENDING");
    expect(competencies()).toHaveLength(0);
    const skills = await request(app).get(skillsUrl(ids.learner1)).set("Authorization", asUser(ids.assessor));
    expect(skills.body.data).toEqual([]);
  });

  it("refuses a learner's attempt to self-approve through the review route, even after completing the lesson", async () => {
    const id = (await submit()).body.data.id as string;
    await request(app).post("/api/academy/curriculum/completions").set("Authorization", `Bearer ${token(ids.learner1)}`).send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    const res = await review(id, APPROVE, ids.learner1);
    expect(res.status).toBe(403);
    expect(competencies()).toHaveLength(0);
  });
});
