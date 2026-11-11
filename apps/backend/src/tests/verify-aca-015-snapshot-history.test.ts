/**
 * ACA-015 verification: contextual lesson snapshot history and hash integrity.
 * Covers snapshot retrieval after later context edits and retirement, pagination boundaries, tampered or
 * corrupt hashes, cross-organisation access, permission changes, approved-only values, and immutability.
 * Drives the real curriculum router against the in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, revisionBodyA, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const ORG = ids.org1;
const ORG2 = ids.org2;
const base = `/api/academy/curriculum/companies/${ORG}/lesson-context-snapshots`;
const baseFor = (companyId: string) => `/api/academy/curriculum/companies/${companyId}/lesson-context-snapshots`;
const presentUrl = (revisionId: string, companyId = ORG) => `/api/academy/curriculum/companies/${companyId}/lessons/${revisionId}/context`;
const fieldUrl = (fieldKey: string, action = "") => `/api/academy/curriculum/companies/${ORG}/business-fields/${fieldKey}${action}`;
const auth = (userId: string) => `Bearer ${token(userId)}`;
const managerAuth = `Bearer ${token(ids.manager, "TEACHER")}`;

async function present(userId = ids.learner1, revisionId = ids.revisionA, companyId = ORG) {
  return request(app).post(presentUrl(revisionId, companyId)).set("Authorization", auth(userId));
}
async function detail(snapshotId: string, userId = ids.learner1, companyId = ORG) {
  return request(app).get(`${baseFor(companyId)}/${snapshotId}`).set("Authorization", auth(userId));
}
async function list(userId = ids.learner1, query: Record<string, unknown> = {}, companyId = ORG) {
  return request(app).get(baseFor(companyId)).query(query).set("Authorization", auth(userId));
}
const storedRow = (snapshotId: string) => rows("academyLessonContextSnapshot").find(row => row.id === snapshotId)!;

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("ACA-015 retrieval after later context edits and retirement", () => {
  it("returns the original approved values after the field is edited and re-approved", async () => {
    const original = (await present()).body.data;
    await request(app).put(fieldUrl("business.name")).set("Authorization", managerAuth).send({ value: "Renamed Pty Ltd" });
    await request(app).post(fieldUrl("business.name", "/approve")).set("Authorization", managerAuth).send({});

    const again = await detail(original.contextSnapshotId);
    expect(again.status).toBe(200);
    expect(again.body.data.body.introduction).toBe("Training for Acme Field Services crews.");
    expect(again.body.data.contentHash).toBe(original.contentHash);

    const fresh = (await present()).body.data;
    expect(fresh.body.introduction).toBe("Training for Renamed Pty Ltd crews.");
    expect(fresh.contentHash).not.toBe(original.contentHash);
  });

  it("keeps a snapshot readable after its field is retired, and stops resolving the field for new presentations", async () => {
    const original = (await present()).body.data;
    const retire = await request(app).post(fieldUrl("business.name", "/retire")).set("Authorization", managerAuth).send({});
    expect(retire.status).toBe(200);

    const old = await detail(original.contextSnapshotId);
    expect(old.status).toBe(200);
    expect(old.body.data.body.introduction).toBe("Training for Acme Field Services crews.");

    const later = (await present()).body.data;
    expect(later.body.introduction).toBe("Training for {{business:business.name}} crews.");
    const snapshot = storedRow(later.contextSnapshotId);
    expect(snapshot.resolvedFields).toEqual({});
  });

  it("does not let a draft (unapproved) value reach a learner or a snapshot", async () => {
    await fakePrisma.academyBusinessLessonField.update({
      where: { companyId_fieldKey: { companyId: ORG, fieldKey: "business.name" } },
      data: { value: "Unapproved Draft Co", status: "DRAFT", approvedById: null, approvedAt: null, revision: { increment: 1 } },
    });
    const res = await present();
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("Unapproved Draft Co");
    expect(res.body.data.body.introduction).toBe("Training for {{business:business.name}} crews.");
    expect(storedRow(res.body.data.contextSnapshotId).resolvedFields).toEqual({});
  });

  it("refuses to present an approved value that a manager has reset to draft by editing it", async () => {
    await request(app).put(fieldUrl("business.name")).set("Authorization", managerAuth).send({ value: "Edited But Not Approved" });
    const res = await present();
    expect(JSON.stringify(res.body)).not.toContain("Edited But Not Approved");
    expect(res.body.data.body.introduction).toBe("Training for {{business:business.name}} crews.");
  });
});

describe("ACA-015 pagination boundaries", () => {
  async function presentMany(count: number) {
    const idsInOrder: string[] = [];
    for (let i = 0; i < count; i += 1) idsInOrder.push((await present()).body.data.contextSnapshotId as string);
    return idsInOrder;
  }

  it("returns an empty page and no cursor when there is no history", async () => {
    const res = await list();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ items: [], nextCursor: null });
  });

  it("walks a three-item history one item at a time with no duplicates or gaps", async () => {
    const created = await presentMany(3);
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 5; page += 1) {
      const res = await list(ids.learner1, cursor ? { limit: 1, cursor } : { limit: 1 });
      expect(res.status).toBe(200);
      seen.push(...res.body.data.items.map((item: { contextSnapshotId: string }) => item.contextSnapshotId));
      cursor = res.body.data.nextCursor ?? undefined;
      if (!cursor) break;
    }
    expect(seen).toEqual([...created].reverse());
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("returns no next cursor when the page is exactly the size of the history", async () => {
    await presentMany(2);
    const res = await list(ids.learner1, { limit: 2 });
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.nextCursor).toBeNull();
  });

  it("accepts limit 1 and limit 100 and rejects 0 and 101", async () => {
    await presentMany(1);
    expect((await list(ids.learner1, { limit: 1 })).status).toBe(200);
    expect((await list(ids.learner1, { limit: 100 })).status).toBe(200);
    expect((await list(ids.learner1, { limit: 0 })).status).toBe(422);
    expect((await list(ids.learner1, { limit: 101 })).status).toBe(422);
    expect((await list(ids.learner1, { limit: "2.5" })).status).toBe(422);
  });

  it("applies the default page size of 25 when no limit is given", async () => {
    await presentMany(26);
    const res = await list();
    expect(res.body.data.items).toHaveLength(25);
    expect(res.body.data.nextCursor).toBe(res.body.data.items[24].contextSnapshotId);
  });

  it("refuses a cursor that exists for the learner but belongs to a different revision filter", async () => {
    const first = (await present(ids.learner1, ids.revisionA)).body.data.contextSnapshotId as string;
    const res = await list(ids.learner1, { cursor: first, revisionId: ids.revisionB });
    expect(res.status).toBe(404);
  });

  it("refuses an empty cursor value", async () => {
    await presentMany(1);
    const res = await list(ids.learner1, { cursor: "" });
    expect(res.status).toBe(422);
  });

  it("pages within a revision filter without crossing into other revisions", async () => {
    await present(ids.learner1, ids.revisionA);
    await present(ids.learner1, ids.revisionB);
    const a2 = (await present(ids.learner1, ids.revisionA)).body.data.contextSnapshotId as string;
    const page1 = await list(ids.learner1, { limit: 1, revisionId: ids.revisionA });
    expect(page1.body.data.items[0].contextSnapshotId).toBe(a2);
    const page2 = await list(ids.learner1, { limit: 1, revisionId: ids.revisionA, cursor: page1.body.data.nextCursor });
    expect(page2.body.data.items).toHaveLength(1);
    expect(page2.body.data.items[0].lessonRevisionId).toBe(ids.revisionA);
    expect(page2.body.data.nextCursor).toBeNull();
  });
});

describe("ACA-015 tampered and corrupt hashes", () => {
  it("rejects a snapshot whose stored hash has been replaced with another valid-looking hash", async () => {
    const id = (await present()).body.data.contextSnapshotId as string;
    storedRow(id).contentHash = "f".repeat(64);
    const res = await detail(id);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Lesson snapshot integrity verification failed");
    expect(res.body.data).toBeUndefined();
  });

  it("rejects a corrupt stored hash: empty, non-hex and upper-cased variants of the real digest", async () => {
    const id = (await present()).body.data.contextSnapshotId as string;
    const real = storedRow(id).contentHash as string;
    for (const corrupt of ["", "not-a-hash", real.toUpperCase(), `${real}00`]) {
      storedRow(id).contentHash = corrupt;
      expect((await detail(id)).status).toBe(403);
    }
    storedRow(id).contentHash = real;
    expect((await detail(id)).status).toBe(200);
  });

  it("rejects a snapshot whose stored field values were altered, without echoing the altered value", async () => {
    const id = (await present()).body.data.contextSnapshotId as string;
    storedRow(id).resolvedFields = { "business.name": "Tampered Ltd" };
    const res = await detail(id);
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("Tampered Ltd");
  });

  it("rejects a snapshot whose stored fields are not an object", async () => {
    const id = (await present()).body.data.contextSnapshotId as string;
    storedRow(id).resolvedFields = ["business.name", "Acme"];
    const res = await detail(id);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid snapshot fields");
  });

  it("fails closed when the revision body changes after presentation, rather than showing new content under the old hash", async () => {
    const id = (await present()).body.data.contextSnapshotId as string;
    const revision = rows("academyLessonRevision").find(row => row.id === ids.revisionA)!;
    revision.body = { ...revisionBodyA(), introduction: "Silently edited introduction." };
    const res = await detail(id);
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("Silently edited");
  });

  it("returns an unchanged snapshot as valid after an unrelated business field is edited", async () => {
    const id = (await present()).body.data.contextSnapshotId as string;
    await request(app).put(fieldUrl("business.support_phone")).set("Authorization", managerAuth).send({ value: "555-0100" });
    expect((await detail(id)).status).toBe(200);
  });

  it("verifies a multi-field snapshot after its stored field keys come back in a different order (jsonb round trip)", async () => {
    await request(app).put(fieldUrl("business.support_phone")).set("Authorization", managerAuth).send({ value: "555-0100" });
    await request(app).post(fieldUrl("business.support_phone", "/approve")).set("Authorization", managerAuth).send({});
    const id = (await present()).body.data.contextSnapshotId as string;
    const original = storedRow(id).resolvedFields as Record<string, unknown>;
    expect(Object.keys(original)).toHaveLength(2);
    // PostgreSQL jsonb returns keys in its own order (shorter keys first). Simulate that reordering.
    storedRow(id).resolvedFields = Object.fromEntries(Object.entries(original).reverse());
    const res = await detail(id);
    expect(res.status).toBe(200);
    expect(res.body.data.body.introduction).toBe("Training for Acme Field Services crews.");
  });
});

describe("ACA-015 cross-organisation access", () => {
  it("refuses a learner's snapshot through another organisation's path, even when the learner is a member of it", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    await seed("companyMember", [{ companyId: ORG2, userId: ids.learner1, role: "LEARNER" }]);
    const res = await detail(own, ids.learner1, ORG2);
    expect(res.status).toBe(404);
    const history = await list(ids.learner1, {}, ORG2);
    expect(history.body.data.items).toEqual([]);
  });

  it("refuses a cursor from one organisation's history when reading another organisation's history", async () => {
    await present();
    const cursor = (await present()).body.data.contextSnapshotId as string;
    await seed("companyMember", [{ companyId: ORG2, userId: ids.learner1, role: "LEARNER" }]);
    const res = await list(ids.learner1, { cursor }, ORG2);
    expect(res.status).toBe(404);
  });

  it("refuses presentation through an organisation the learner has no assignment in", async () => {
    await seed("companyMember", [{ companyId: ORG2, userId: ids.learner1, role: "LEARNER" }]);
    const res = await present(ids.learner1, ids.revisionA, ORG2);
    expect(res.status).toBe(403);
    expect(rows("academyLessonContextSnapshot")).toHaveLength(0);
  });

  it("refuses a learner from another organisation reading a snapshot by its ID", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    const res = await detail(own, ids.outsider, ORG);
    expect(res.status).toBe(403);
  });

  it("does not let the organisation's own manager read a learner's personal snapshot", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    const res = await detail(own, ids.manager);
    expect(res.status).toBe(404);
    const history = await list(ids.manager);
    expect(history.body.data.items).toEqual([]);
  });
});

describe("ACA-015 permission changes", () => {
  it("denies history, detail and presentation once the learner leaves the organisation, and restores them on rejoining", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    await fakePrisma.companyMember.deleteMany({ where: { companyId: ORG, userId: ids.learner1 } });

    expect((await list()).status).toBe(403);
    expect((await detail(own)).status).toBe(403);
    expect((await present()).status).toBe(403);
    expect(rows("academyLessonContextSnapshot")).toHaveLength(1);

    await seed("companyMember", [{ companyId: ORG, userId: ids.learner1, role: "LEARNER" }]);
    const restored = await detail(own);
    expect(restored.status).toBe(200);
    expect((await list()).body.data.items.map((item: { contextSnapshotId: string }) => item.contextSnapshotId)).toEqual([own]);
  });

  it("denies a learner whose account has been deactivated, with no history or detail", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    await fakePrisma.user.update({ where: { id: ids.learner1 }, data: { isActive: false } });
    expect((await list()).status).toBe(401);
    expect((await detail(own)).status).toBe(401);
  });

  it("keeps old snapshots readable after a role change, without granting any manager access to them", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    await fakePrisma.companyMember.updateMany({ where: { companyId: ORG, userId: ids.learner1 }, data: { role: "ASSESSOR" } });
    expect((await detail(own)).status).toBe(200);
    expect((await detail(own, ids.manager)).status).toBe(404);
  });
});

describe("ACA-015 immutability and learner-only exposure", () => {
  it("does not change an earlier snapshot when the same lesson is presented again later", async () => {
    const first = (await present()).body.data.contextSnapshotId as string;
    const before = { ...storedRow(first) };
    await request(app).put(fieldUrl("business.name")).set("Authorization", managerAuth).send({ value: "Second Name" });
    await request(app).post(fieldUrl("business.name", "/approve")).set("Authorization", managerAuth).send({});
    await present();
    expect(storedRow(first)).toEqual(before);
    expect((await detail(first)).body.data.body.introduction).toBe("Training for Acme Field Services crews.");
  });

  it("exposes no mutation route for snapshots", async () => {
    const own = (await present()).body.data.contextSnapshotId as string;
    const url = `${base}/${own}`;
    expect((await request(app).delete(url).set("Authorization", auth(ids.learner1))).status).toBe(404);
    expect((await request(app).put(url).set("Authorization", auth(ids.learner1)).send({ resolvedFields: {} })).status).toBe(404);
    expect((await request(app).patch(url).set("Authorization", auth(ids.learner1)).send({ contentHash: "x" })).status).toBe(404);
    expect(storedRow(own).contentHash).toBeTruthy();
  });

  it("never returns stored resolved fields or other learners' snapshot IDs in list or detail responses", async () => {
    const mine = (await present(ids.learner1)).body.data.contextSnapshotId as string;
    const theirs = (await present(ids.learner2)).body.data.contextSnapshotId as string;
    const listed = await list(ids.learner1);
    expect(JSON.stringify(listed.body)).not.toContain("resolvedFields");
    expect(JSON.stringify(listed.body)).not.toContain(theirs);
    const single = await detail(mine);
    expect(Object.keys(single.body.data).sort()).toEqual(["body", "companyId", "contentHash", "contextSnapshotId", "lessonRevisionId", "presentedAt"]);
    expect(JSON.stringify(single.body)).not.toContain("resolvedFields");
  });
});
