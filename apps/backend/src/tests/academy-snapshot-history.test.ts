/**
 * ACA-015: contextual lesson snapshot history, integrity verification and access isolation.
 * Drives the real curriculum router with supertest against an in-memory Prisma double.
 */
import { createHash } from "node:crypto";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows } from "./support/fake-prisma";
import { ids, revisionBodyA, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const base = `/api/academy/curriculum/companies/${ids.org1}/lesson-context-snapshots`;
const presentUrl = (revisionId: string, companyId = ids.org1) =>
  `/api/academy/curriculum/companies/${companyId}/lessons/${revisionId}/context`;

/** Independent recomputation of the server's snapshot hash, so the test does not trust the route's own helper. */
function expectedHash(revisionId: string, fields: Record<string, unknown>, body: unknown): string {
  return createHash("sha256").update(JSON.stringify({ revisionId, fields, body })).digest("hex");
}

async function present(userId: string, revisionId = ids.revisionA) {
  return request(app).post(presentUrl(revisionId)).set("Authorization", `Bearer ${token(userId)}`);
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("ACA-015 presentation snapshots", () => {
  it("records an immutable snapshot whose hash matches an independent recomputation", async () => {
    const res = await present(ids.learner1);
    expect(res.status).toBe(200);
    const { contextSnapshotId, contentHash, body } = res.body.data;
    expect(body.introduction).toBe("Training for Acme Field Services crews.");
    expect(body.procedure).toEqual(["Prepare kit for Acme Field Services", "Work top to bottom"]);

    const stored = rows("academyLessonContextSnapshot");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: contextSnapshotId, learnerId: ids.learner1, companyId: ids.org1 });
    expect(stored[0].contentHash).toBe(contentHash);
    expect(contentHash).toBe(expectedHash(ids.revisionA, { "business.name": "Acme Field Services" }, body));
  });

  it("never exposes answer keys to learners in presented bodies", async () => {
    const res = await present(ids.learner1);
    const serialised = JSON.stringify(res.body.data.body);
    expect(serialised).not.toContain("correctIndex");
    expect(serialised).toContain("Scanner");
  });

  it("refuses presentation of unpublished revisions and lessons outside the learner's assignment", async () => {
    expect((await present(ids.learner1, ids.revisionDraft)).status).toBe(404);
    const outsider = await present(ids.outsider);
    expect(outsider.status).toBe(403);
    expect(rows("academyLessonContextSnapshot")).toHaveLength(0);
  });

  it("keeps one row per presentation even when the content is identical", async () => {
    const first = await present(ids.learner1);
    const second = await present(ids.learner1);
    expect(first.body.data.contextSnapshotId).not.toBe(second.body.data.contextSnapshotId);
    expect(first.body.data.contentHash).toBe(second.body.data.contentHash);
    expect(rows("academyLessonContextSnapshot")).toHaveLength(2);
  });
});

describe("ACA-015 snapshot history listing", () => {
  it("lists only the caller's presentations, newest first, without content or field values", async () => {
    const a = await present(ids.learner1);
    const b = await present(ids.learner1);
    await present(ids.learner2);

    const res = await request(app).get(base).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<Record<string, unknown>>;
    expect(items.map((item) => item.contextSnapshotId)).toEqual([b.body.data.contextSnapshotId, a.body.data.contextSnapshotId]);
    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual(["contentHash", "contextSnapshotId", "lessonRevisionId", "presentedAt"]);
    }
    expect(res.body.data.nextCursor).toBeNull();
  });

  it("pages through history with cursors without duplicates or gaps", async () => {
    const ids3: string[] = [];
    for (let i = 0; i < 3; i += 1) ids3.push((await present(ids.learner1)).body.data.contextSnapshotId);

    const page1 = await request(app).get(base).query({ limit: 2 }).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(page1.body.data.items).toHaveLength(2);
    expect(page1.body.data.nextCursor).toBe(page1.body.data.items[1].contextSnapshotId);

    const page2 = await request(app).get(base).query({ limit: 2, cursor: page1.body.data.nextCursor }).set("Authorization", `Bearer ${token(ids.learner1)}`);
    const seen = [...page1.body.data.items, ...page2.body.data.items].map((item: { contextSnapshotId: string }) => item.contextSnapshotId);
    expect(seen).toEqual([ids3[2], ids3[1], ids3[0]]);
    expect(page2.body.data.nextCursor).toBeNull();
  });

  it("rejects cursors that belong to another learner, with the same response as an unknown cursor", async () => {
    await present(ids.learner1);
    const other = await present(ids.learner2);
    const foreign = other.body.data.contextSnapshotId as string;
    const res = await request(app).get(base).query({ cursor: foreign }).set("Authorization", `Bearer ${token(ids.learner1)}`);
    const unknown = await request(app).get(base).query({ cursor: "does-not-exist" }).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe(unknown.body.message);
  });

  it("filters history by revision", async () => {
    await present(ids.learner1, ids.revisionA);
    await seedRevisionBPresentation();
    const res = await request(app).get(base).query({ revisionId: ids.revisionB }).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(res.body.data.items.map((item: { lessonRevisionId: string }) => item.lessonRevisionId)).toEqual([ids.revisionB]);
  });
});

async function seedRevisionBPresentation() {
  const res = await present(ids.learner1, ids.revisionB);
  expect(res.status).toBe(200);
}

describe("ACA-015 snapshot detail and integrity", () => {
  it("returns the historical body from the snapshot, not today's business field value", async () => {
    const original = await present(ids.learner1);
    const snapshotId = original.body.data.contextSnapshotId as string;

    await prisma.academyBusinessLessonField.update({
      where: { companyId_fieldKey: { companyId: ids.org1, fieldKey: "business.name" } },
      data: { value: "Renamed Business", revision: { increment: 1 } },
    });

    const detail = await request(app).get(`${base}/${snapshotId}`).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.body.introduction).toBe("Training for Acme Field Services crews.");
    expect(JSON.stringify(detail.body.data.body)).not.toContain("Renamed Business");
    expect(detail.body.data.contentHash).toBe(original.body.data.contentHash);
  });

  it("denies detail reads to other learners in the same organisation, returning not found", async () => {
    const own = await present(ids.learner1);
    const res = await request(app).get(`${base}/${own.body.data.contextSnapshotId}`).set("Authorization", `Bearer ${token(ids.learner2)}`);
    expect(res.status).toBe(404);
  });

  it("denies detail reads to non-members of the organisation", async () => {
    const own = await present(ids.learner1);
    const res = await request(app).get(`${base}/${own.body.data.contextSnapshotId}`).set("Authorization", `Bearer ${token(ids.outsider)}`);
    expect(res.status).toBe(403);
  });

  it("fails integrity verification when stored snapshot fields are altered", async () => {
    const own = await present(ids.learner1);
    const snapshotId = own.body.data.contextSnapshotId as string;
    const stored = rows("academyLessonContextSnapshot").find((row) => row.id === snapshotId)!;
    stored.resolvedFields = { "business.name": "Tampered Ltd" };

    const res = await request(app).get(`${base}/${snapshotId}`).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Lesson snapshot integrity verification failed");
    expect(JSON.stringify(res.body)).not.toContain("Tampered Ltd");
  });

  it("fails integrity verification when the stored hash no longer matches the content", async () => {
    const own = await present(ids.learner1);
    const snapshotId = own.body.data.contextSnapshotId as string;
    rows("academyLessonContextSnapshot").find((row) => row.id === snapshotId)!.contentHash = "0".repeat(64);
    const res = await request(app).get(`${base}/${snapshotId}`).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(res.status).toBe(403);
  });

  it("presents the stored revision body with answer keys stripped and business placeholders resolved", async () => {
    const own = await present(ids.learner1);
    expect(own.body.data.body).toEqual({
      introduction: "Training for Acme Field Services crews.",
      procedure: ["Prepare kit for Acme Field Services", "Work top to bottom"],
      resource: { url: "https://example.test/guide", label: "Guide" },
      knowledgeChecks: [
        { id: "TST-A-K01", question: "Which tool is used first?", options: ["Scanner", "Vacuum", "Brush"] },
        { id: "TST-A-K02", question: "What is the approved cleaner?", options: ["Water", "Approved product"] },
      ],
    });
    expect(revisionBodyA()).toHaveProperty("knowledgeChecks");
  });
});
