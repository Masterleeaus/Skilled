/**
 * ACA-008 (review approval bound to content hash, publication gate) and
 * ACA-026 (source-draft protection). Runs the real review service and routes
 * against the in-memory Prisma double.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

vi.hoisted(() => {
  process.env.CLIENT_URL ??= "http://localhost:3000";
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  process.env.REDIS_URL ??= "redis://localhost:6379";
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret-0123456789";
  process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-0123456789";
  process.env.MINIO_ACCESS_KEY ??= "test-access";
  process.env.MINIO_SECRET_KEY ??= "test-secret";
});

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import express from "express";
import request from "supertest";
import { resetFakeDb, rows, seed, stringOf } from "./support/fake-prisma";
import { signAccessToken } from "../modules/auth/token.utils";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import {
  contentHashOf,
  createDraftRevision,
  evaluateStructure,
  getRevisionForReview,
  importDraftRevisions,
  listReviewQueue,
  publicationGateEnabled,
  publishRevision,
  recordReview,
} from "../modules/curriculum/lesson-review.service";

const ADMIN = "admin-review-1";
const TEACHER = "teacher-review-1";
const TEACHER_2 = "teacher-review-2";
const SOURCE = "TST-REVIEW-1";
const GATE_ON_ENV: NodeJS.ProcessEnv = {};

type Body = Record<string, unknown>;

function knowledgeBody(extra: Body = {}): Body {
  return {
    id: "TST-REVIEW-1",
    title: "Kit check before a job",
    instruction: [{ heading: "Check", body: "Inspect each item in the kit before the job starts." }],
    procedure: ["Open the kit", "Check each item"],
    summary: ["The kit is checked before every job"],
    qualityStandard: ["All items are present and clean"],
    knowledgeChecks: [{ id: "TST-REVIEW-1-K01", question: "When is the kit checked?", options: ["Before the job", "After the job", "Never"] }],
    ...extra,
  };
}

function templateBody(overrides: { outputSections?: unknown[] } = {}): Body {
  return {
    id: "TST-REVIEW-T1",
    title: "Job sheet",
    lessonKind: "template",
    instruction: [{ heading: "Complete", body: "Fill in the job sheet for the client." }],
    procedure: ["Open the sheet", "Complete each field"],
    summary: ["The job sheet records the work"],
    qualityStandard: ["Every required field is complete"],
    knowledgeChecks: [],
    editableTemplates: [
      {
        templateId: "TST-REVIEW-T1-T01",
        title: "Job sheet",
        purpose: "Record the job",
        fields: [
          { fieldId: "f1", label: "Client", type: "text", prompt: "Who is the client?", guidance: "Name", required: true },
          { fieldId: "f2", label: "Date", type: "date", prompt: "When?", guidance: "Date", required: true },
        ],
      },
    ],
    assessmentRubric: [{ criterion: "Complete", levels: { meets: "All fields complete", does_not_meet: "Fields missing" } }],
    outputDocument: {
      title: "Job sheet",
      format: "form",
      sections: overrides.outputSections ?? [{ heading: "Details", fieldIds: ["f1", "f2"] }],
      footer: "Signed by the assessor",
    },
  };
}

async function setup(): Promise<void> {
  resetFakeDb();
  await seed("user", [
    { id: ADMIN, email: "admin@example.test", fullName: "Admin Reviewer", role: "ADMIN", isActive: true, isEmailVerified: true },
    { id: TEACHER, email: "teacher@example.test", fullName: "Teacher Example", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: TEACHER_2, email: "teacher2@example.test", fullName: "Teacher Two", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: "student-x", email: "student-x@example.test", fullName: "Student Example", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("academyContentLesson", [
    { id: "lesson-review-1", sourceId: SOURCE, layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Kit check", objective: "Check kit", assessment: "Observe", sourceVersion: "1", sourceHash: "h-review" },
  ]);
}

async function draft(body: Body = knowledgeBody(), actorId = TEACHER) {
  return createDraftRevision({ sourceId: SOURCE, body, actorId });
}

async function approve(revisionId: string, contentHash: string, reviewerId = ADMIN) {
  return recordReview({ revisionId, reviewerId, decision: "APPROVED", contentHash });
}

function revisionRow(id: string): Record<string, unknown> {
  const row = rows("academyLessonRevision").find((r) => r.id === id);
  if (!row) throw new Error(`no revision ${id}`);
  return row;
}

function lessonStatus(): string {
  return stringOf(rows("academyContentLesson")[0].contentStatus);
}

function reasonCodes(error: unknown): string[] {
  return ((error as { errors?: Array<{ code: string }> }).errors ?? []).map((reason) => reason.code);
}

beforeEach(async () => {
  await setup();
});

// HTTP harness: the real curriculum router behind the production error shape.
const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use((err: { statusCode?: number; message: string; errors?: unknown[] }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.statusCode ?? 500).json({ message: err.message, errors: err.errors ?? [] });
});
const tokenFor = (userId: string, role: "ADMIN" | "TEACHER" | "STUDENT") => signAccessToken({ userId, role });

describe("ACA-008 approval binds to the content hash", () => {
  it("records an approval against the hash of the revision being reviewed", async () => {
    const revision = await draft();
    const review = await approve(revision.id, revision.contentHash);
    expect(review).toMatchObject({ revisionId: revision.id, decision: "APPROVED", contentHash: revision.contentHash, reviewerId: ADMIN });
    expect(rows("academyLessonReview")).toHaveLength(1);
  });

  it("refuses an approval submitted against a different hash and stores nothing", async () => {
    const revision = await draft();
    await expect(approve(revision.id, "0".repeat(64))).rejects.toMatchObject({ statusCode: 409 });
    expect(rows("academyLessonReview")).toHaveLength(0);
  });

  it("approves and publishes a body stored in non-canonical key order, with one hash throughout (D1 regression)", async () => {
    // Keys deliberately out of sorted order when the body is written.
    const written = knowledgeBody({ summary: ["Kit checked"], procedure: ["Open", "Check"] });
    const revision = await draft(written);
    // Postgres jsonb returns keys shorter-first, then bytewise. Simulate that read-back order.
    const jsonbOrdered = Object.fromEntries(Object.entries(written).sort(([a], [b]) => a.length - b.length || Buffer.compare(Buffer.from(a), Buffer.from(b))));
    expect(JSON.stringify(jsonbOrdered)).not.toBe(JSON.stringify(written));
    revisionRow(revision.id).body = jsonbOrdered;
    const review = await approve(revision.id, revision.contentHash);
    expect(review.contentHash).toBe(revision.contentHash);
    const published = await publishRevision(revision.id, ADMIN, GATE_ON_ENV);
    expect(published.status).toBe("PUBLISHED");
    expect(lessonStatus()).toBe("PUBLISHED");
  });

  it("hashes equal content to the same value whatever the key order, and keeps array order significant", () => {
    const a = { x: 1, y: { p: [1, 2], q: "z" } };
    const reordered = { y: { q: "z", p: [1, 2] }, x: 1 };
    expect(contentHashOf(reordered)).toBe(contentHashOf(a));
    expect(contentHashOf({ x: [1, 2] })).not.toBe(contentHashOf({ x: [2, 1] }));
    expect(contentHashOf(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("publishes when the approval matches the unchanged body", async () => {
    const revision = await draft();
    await approve(revision.id, revision.contentHash);
    const published = await publishRevision(revision.id, ADMIN, GATE_ON_ENV);
    expect(published.status).toBe("PUBLISHED");
    expect(lessonStatus()).toBe("PUBLISHED");
  });

  it("stops the approval applying when the stored body is edited in place", async () => {
    const revision = await draft();
    await approve(revision.id, revision.contentHash);
    revisionRow(revision.id).body = { ...knowledgeBody(), summary: ["Edited after approval"] };
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(error).toMatchObject({ statusCode: 409 });
    expect(reasonCodes(error)).toEqual(expect.arrayContaining(["CONTENT_HASH_MISMATCH", "NOT_APPROVED_FOR_CURRENT_HASH"]));
    expect(revisionRow(revision.id).status).toBe("DRAFT");
  });

  it("does not carry an approval over to a re-hashed edit until that content is approved", async () => {
    const revision = await draft();
    await approve(revision.id, revision.contentHash);
    const edited = knowledgeBody({ summary: ["Edited and re-hashed"] });
    const row = revisionRow(revision.id);
    row.body = edited;
    row.contentHash = contentHashOf(edited);
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(reasonCodes(error)).toEqual(["NOT_APPROVED_FOR_CURRENT_HASH"]);
    await approve(revision.id, stringOf(row.contentHash));
    expect((await publishRevision(revision.id, ADMIN, GATE_ON_ENV)).status).toBe("PUBLISHED");
  });

  it("treats a later rejection of the same content as the current decision", async () => {
    const revision = await draft();
    await approve(revision.id, revision.contentHash);
    await recordReview({ revisionId: revision.id, reviewerId: ADMIN, decision: "REJECTED", notes: "Safety wording is wrong", contentHash: revision.contentHash });
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(reasonCodes(error)).toEqual(["NOT_APPROVED_FOR_CURRENT_HASH"]);
    expect(error.errors[0].message).toMatch(/Latest review.*REJECTED/);
    expect(rows("academyLessonReview")).toHaveLength(2);
  });
});

describe("ACA-008 publication gate", () => {
  it("blocks publication of an unreviewed lesson", async () => {
    const revision = await draft();
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(error).toMatchObject({ statusCode: 409 });
    expect(reasonCodes(error)).toEqual(["NOT_APPROVED_FOR_CURRENT_HASH"]);
    expect(revisionRow(revision.id).status).toBe("DRAFT");
    expect(lessonStatus()).toBe("BRIEF");
  });

  it("blocks a structurally incomplete lesson even when it is approved", async () => {
    const revision = await draft(knowledgeBody({ summary: [] }));
    await approve(revision.id, revision.contentHash);
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(error).toMatchObject({ statusCode: 409 });
    expect(reasonCodes(error)).toEqual(["STRUCTURE_INCOMPLETE"]);
    expect(error.message).toBe("Publication blocked by the lesson review gate");
    expect(error.errors[0].message).toContain("summary");
    expect(revisionRow(revision.id).status).toBe("DRAFT");
  });

  it("checks instruction or procedure, summary, quality standard and knowledge checks", () => {
    expect(evaluateStructure(knowledgeBody()).passed).toBe(true);
    const noInstruction = knowledgeBody({ instruction: [], procedure: [] });
    expect(evaluateStructure(noInstruction).checks.find((c) => c.id === "instruction-or-procedure")?.passed).toBe(false);
    expect(evaluateStructure(knowledgeBody({ qualityStandard: [] })).checks.find((c) => c.id === "quality-standard")?.passed).toBe(false);
    expect(evaluateStructure(knowledgeBody({ knowledgeChecks: [] })).checks.find((c) => c.id === "knowledge-checks")?.passed).toBe(false);
    expect(evaluateStructure(knowledgeBody({ knowledgeChecks: [{ question: "Q", options: ["A", "B"] }] })).passed).toBe(false);
    expect(evaluateStructure(knowledgeBody({ lessonKind: "quiz-only" })).checks.find((c) => c.id === "lesson-kind")?.passed).toBe(false);
  });

  it("requires template output sections to place every field exactly once", () => {
    expect(evaluateStructure(templateBody()).passed).toBe(true);
    const missingField = evaluateStructure(templateBody({ outputSections: [{ heading: "Details", fieldIds: ["f1"] }] }));
    expect(missingField.passed).toBe(false);
    expect(missingField.checks.find((c) => c.id === "template")?.detail).toContain("f2");
  });

  it("publishes an approved, structurally complete template lesson", async () => {
    const revision = await draft(templateBody());
    await approve(revision.id, revision.contentHash);
    expect((await publishRevision(revision.id, ADMIN, GATE_ON_ENV)).status).toBe("PUBLISHED");
  });

  it("ignores review and status claims written inside the lesson body", async () => {
    const revision = await draft(knowledgeBody({ reviewStatus: "APPROVED", status: "PUBLISHED", publishedAt: "2026-11-01" }));
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(reasonCodes(error)).toEqual(["NOT_APPROVED_FOR_CURRENT_HASH"]);
    expect(revisionRow(revision.id).status).toBe("DRAFT");
  });

  it("reads the gate setting: ON unless an explicit off value is set", () => {
    expect(publicationGateEnabled({})).toBe(true);
    expect(publicationGateEnabled({ ACADEMY_PUBLICATION_GATE: "" })).toBe(true);
    expect(publicationGateEnabled({ ACADEMY_PUBLICATION_GATE: "on" })).toBe(true);
    expect(publicationGateEnabled({ ACADEMY_PUBLICATION_GATE: "maybe" })).toBe(true);
    expect(publicationGateEnabled({ ACADEMY_PUBLICATION_GATE: "off" })).toBe(false);
    expect(publicationGateEnabled({ ACADEMY_PUBLICATION_GATE: " FALSE " })).toBe(false);
    expect(publicationGateEnabled({ ACADEMY_PUBLICATION_GATE: "0" })).toBe(false);
  });

  it("allows unreviewed publication only when the gate is explicitly off, and records the bypass", async () => {
    const blocked = await draft();
    await expect(publishRevision(blocked.id, ADMIN, {})).rejects.toMatchObject({ statusCode: 409 });

    const bypassed = await draft(knowledgeBody({ id: "TST-REVIEW-2" }));
    const published = await publishRevision(bypassed.id, ADMIN, { ACADEMY_PUBLICATION_GATE: "off" });
    expect(published.status).toBe("PUBLISHED");
    const audit = rows("auditLog").map((row) => row.action);
    expect(audit).toContain("LESSON_REVISION_PUBLISHED_GATE_OFF");
  });
});

describe("ACA-026 source-draft protection", () => {
  it("refuses to create a revision that carries a non-DRAFT status or a publishedAt value", async () => {
    await expect(createDraftRevision({ sourceId: SOURCE, body: knowledgeBody(), status: "PUBLISHED", actorId: TEACHER })).rejects.toMatchObject({ statusCode: 403 });
    await expect(createDraftRevision({ sourceId: SOURCE, body: knowledgeBody(), publishedAt: new Date(), actorId: TEACHER })).rejects.toMatchObject({ statusCode: 403 });
    expect(rows("academyLessonRevision")).toHaveLength(0);
  });

  it("a bulk import with one refused item writes nothing", async () => {
    await expect(
      importDraftRevisions([
        { sourceId: SOURCE, body: knowledgeBody() },
        { sourceId: SOURCE, body: knowledgeBody({ id: "TST-REVIEW-3" }), status: "PUBLISHED" },
      ], TEACHER),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(rows("academyLessonRevision")).toHaveLength(0);
  });

  it("a bulk import creates DRAFT rows, and the gate does not publish them", async () => {
    const created = await importDraftRevisions([
      { sourceId: SOURCE, body: knowledgeBody() },
      { sourceId: SOURCE, body: knowledgeBody({ id: "TST-REVIEW-4" }) },
    ], TEACHER);
    expect(created.map((r) => r.status)).toEqual(["DRAFT", "DRAFT"]);
    expect(created.every((r) => r.publishedAt === null)).toBe(true);
    for (const revision of created) {
      await expect(publishRevision(revision.id, ADMIN, GATE_ON_ENV)).rejects.toMatchObject({ statusCode: 409 });
    }
    expect(rows("academyLessonRevision").every((r) => r.status === "DRAFT")).toBe(true);
  });

  it("only the review service updates lesson revision rows", () => {
    const srcRoot = join(__dirname, "..");
    const writers: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
          if (name !== "tests") walk(path);
        } else if (name.endsWith(".ts") && /academyLessonRevision\.(update|updateMany|upsert)\(/.test(readFileSync(path, "utf8"))) {
          writers.push(path.slice(srcRoot.length + 1));
        }
      }
    };
    walk(srcRoot);
    expect(writers).toEqual(["modules/curriculum/lesson-review.service.ts"]);
  });
});

describe("ACA-008 reviewer queue, detail and HTTP role", () => {
  it("lists unapproved drafts and drops revisions whose current content is approved", async () => {
    const approvedRevision = await draft();
    await approve(approvedRevision.id, approvedRevision.contentHash);
    const waiting = await draft(knowledgeBody({ id: "TST-REVIEW-5" }));
    const { items: queue } = await listReviewQueue();
    expect(queue.map((item) => item.revisionId)).toEqual([waiting.id]);
    expect(queue[0]).toMatchObject({ reviewState: "NOT_REVIEWED", hashIntegrity: true, contentHash: waiting.contentHash });
  });

  it("shows a draft that sits beyond the 200th draft once the approved ones before it are filtered out", async () => {
    for (let i = 0; i < 200; i += 1) {
      const approvedDraft = await draft();
      await approve(approvedDraft.id, approvedDraft.contentHash);
    }
    const beyond = await draft(knowledgeBody({ id: "TST-REVIEW-BEYOND" }));
    const { items, pagination } = await listReviewQueue();
    expect(items.map((item) => item.revisionId)).toEqual([beyond.id]);
    expect(pagination).toEqual({ page: 1, limit: 200, total: 1, totalPages: 1 });
  });

  it("pages across more than 200 unapproved drafts so that every draft appears exactly once", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 205; i += 1) ids.push((await draft()).id);
    const first = await listReviewQueue({ page: 1, limit: 200 });
    const second = await listReviewQueue({ page: 2, limit: 200 });
    expect(first.items).toHaveLength(200);
    expect(second.items).toHaveLength(5);
    expect(first.pagination).toMatchObject({ total: 205, totalPages: 2 });
    const seen = [...first.items, ...second.items].map((item) => item.revisionId);
    expect(new Set(seen).size).toBe(205);
    expect([...seen].sort()).toEqual([...ids].sort());
  });

  it("serves the queue page over HTTP with pagination metadata", async () => {
    for (let i = 0; i < 3; i += 1) await draft();
    const response = await request(app)
      .get("/api/academy/curriculum/reviews/queue?page=2&limit=2")
      .set("Authorization", `Bearer ${tokenFor(ADMIN, "ADMIN")}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
    const defaults = await request(app).get("/api/academy/curriculum/reviews/queue").set("Authorization", `Bearer ${tokenFor(ADMIN, "ADMIN")}`);
    expect(defaults.body.pagination).toMatchObject({ page: 1, limit: 200, total: 3 });
  });

  it("detail view reports the hash, structural results and gate state", async () => {
    const revision = await draft(knowledgeBody({ summary: [] }));
    const detail = await getRevisionForReview(revision.id);
    expect(detail.gate.currentHash).toBe(revision.contentHash);
    expect(detail.gate.structure.passed).toBe(false);
    expect(detail.gate.allowed).toBe(false);
    expect(detail.publicationGate).toEqual({ setting: "ACADEMY_PUBLICATION_GATE", enabled: true });
  });


  it("returns 403 to a STUDENT who tries to publish, even with an approval", async () => {
    const revision = await draft();
    await approve(revision.id, revision.contentHash);
    const response = await request(app)
      .post(`/api/academy/curriculum/revisions/${revision.id}/publish`)
      .set("Authorization", `Bearer ${tokenFor("student-x", "STUDENT")}`);
    expect(response.status).toBe(403);
    expect(revisionRow(revision.id).status).toBe("DRAFT");
  });

  it("publishes over HTTP for an ADMIN with a matching approval, and returns 409 with reasons without one", async () => {
    const approvedRevision = await draft();
    await approve(approvedRevision.id, approvedRevision.contentHash);
    const ok = await request(app)
      .post(`/api/academy/curriculum/revisions/${approvedRevision.id}/publish`)
      .set("Authorization", `Bearer ${tokenFor(ADMIN, "ADMIN")}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe("PUBLISHED");

    const unreviewed = await draft(knowledgeBody({ id: "TST-REVIEW-6" }));
    const blocked = await request(app)
      .post(`/api/academy/curriculum/revisions/${unreviewed.id}/publish`)
      .set("Authorization", `Bearer ${tokenFor(ADMIN, "ADMIN")}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.errors.map((e: { code: string }) => e.code)).toEqual(["NOT_APPROVED_FOR_CURRENT_HASH"]);
  });

  it("creates lesson revisions as DRAFT over HTTP, ignoring any requested status", async () => {
    const response = await request(app)
      .post(`/api/academy/curriculum/lessons/${SOURCE}/revisions`)
      .set("Authorization", `Bearer ${tokenFor(ADMIN, "ADMIN")}`)
      .send({ body: knowledgeBody(), status: "PUBLISHED" });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe("DRAFT");
    expect(response.body.data.publishedAt).toBeNull();
  });
});

describe("Author independence: a reviewer never approves what they authored or last edited", () => {
  it("refuses an approval by the author, even when the author is a TEACHER reviewer", async () => {
    const revision = await draft(knowledgeBody(), TEACHER);
    await expect(approve(revision.id, revision.contentHash, TEACHER)).rejects.toMatchObject({ statusCode: 403 });
    expect(rows("academyLessonReview")).toHaveLength(0);
  });

  it("allows an ADMIN or a different TEACHER to approve the same revision", async () => {
    const revision = await draft(knowledgeBody(), TEACHER);
    await approve(revision.id, revision.contentHash, ADMIN);
    await approve(revision.id, revision.contentHash, TEACHER_2);
    expect(rows("academyLessonReview")).toHaveLength(2);
  });

  it("counts whoever last edited as the author: the earlier author may approve a later edit by someone else", async () => {
    const first = await draft(knowledgeBody(), TEACHER);
    const edited = await draft(knowledgeBody({ summary: ["Second version"] }), TEACHER_2);
    await expect(approve(edited.id, edited.contentHash, TEACHER_2)).rejects.toMatchObject({ statusCode: 403 });
    await approve(edited.id, edited.contentHash, TEACHER);
    expect((await publishRevision(edited.id, ADMIN, GATE_ON_ENV)).status).toBe("PUBLISHED");
    expect(first.id).not.toBe(edited.id);
  });

  it("records the author in the same write that creates the revision", async () => {
    const revision = await draft(knowledgeBody(), TEACHER);
    const record = rows("auditLog").find((r) => r.action === "LESSON_REVISION_DRAFTED" && r.entityId === revision.id);
    expect(record).toMatchObject({ userId: TEACHER, entity: "AcademyLessonRevision" });
  });

  it("refuses to approve a revision whose author is not recorded", async () => {
    const revision = await draft(knowledgeBody(), TEACHER);
    rows("auditLog").splice(0, rows("auditLog").length);
    await expect(approve(revision.id, revision.contentHash, ADMIN)).rejects.toMatchObject({ statusCode: 409 });
    expect(rows("academyLessonReview")).toHaveLength(0);
  });

  it("the gate ignores an approval given by the author, even if one was stored", async () => {
    const revision = await draft(knowledgeBody(), TEACHER);
    await seed("academyLessonReview", [{ revisionId: revision.id, contentHash: revision.contentHash, reviewerId: TEACHER, decision: "APPROVED" }]);
    const error = await publishRevision(revision.id, ADMIN, GATE_ON_ENV).catch((e) => e);
    expect(error).toMatchObject({ statusCode: 409 });
    expect(reasonCodes(error)).toEqual(["APPROVER_NOT_INDEPENDENT"]);
    expect(revisionRow(revision.id).status).toBe("DRAFT");
  });

  it("over HTTP: a TEACHER cannot approve their own revision, and a STUDENT cannot review at all", async () => {
    const revision = await draft(knowledgeBody(), TEACHER);
    const body = { decision: "APPROVED", contentHash: revision.contentHash };
    const own = await request(app).post(`/api/academy/curriculum/revisions/${revision.id}/reviews`).set("Authorization", `Bearer ${tokenFor(TEACHER, "TEACHER")}`).send(body);
    expect(own.status).toBe(403);
    const student = await request(app).post(`/api/academy/curriculum/revisions/${revision.id}/reviews`).set("Authorization", `Bearer ${tokenFor("student-x", "STUDENT")}`).send(body);
    expect(student.status).toBe(403);
    const other = await request(app).post(`/api/academy/curriculum/revisions/${revision.id}/reviews`).set("Authorization", `Bearer ${tokenFor(TEACHER_2, "TEACHER")}`).send(body);
    expect(other.status).toBe(201);
  });
});
