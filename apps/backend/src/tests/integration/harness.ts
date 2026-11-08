// Shared harness for Titan integration tests. Runs only against a disposable local test database.
import { randomBytes, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { describe } from "vitest";
import express from "express";
import request from "supertest";
import type { prisma as AppPrisma } from "../../config/prisma";
import { setCourseLevelMapForTests } from "../../modules/levels/level-rules";
import { PLACEHOLDER_DATABASE_URL, PLACEHOLDER_REDIS_URL } from "../support/test-env";

export type Db = typeof AppPrisma;

// Integration tests run from apps/backend (the package's `npm test` directory).
export const BACKEND_ROOT = process.cwd();
export const SERVICE_PATH_PREFIX = "/api/titan/integration";

const SAFE_DEFAULTS: Record<string, string> = {
  NODE_ENV: "test",
  CLIENT_URL: "http://localhost:3000",
  JWT_ACCESS_SECRET: "integration-test-access-secret",
  JWT_REFRESH_SECRET: "integration-test-refresh-secret",
  MINIO_ACCESS_KEY: "integration-test",
  MINIO_SECRET_KEY: "integration-test",
};

// True when DATABASE_URL and REDIS_URL both name real services rather than the vitest placeholders.
// Suites that need them check this and skip otherwise, so a bare run never reaches a live service.
export function hasConfiguredServices(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  const redisUrl = process.env.REDIS_URL;
  return Boolean(databaseUrl && redisUrl) && databaseUrl !== PLACEHOLDER_DATABASE_URL && redisUrl !== PLACEHOLDER_REDIS_URL;
}

// Suites that need a real database (and Redis) are reported as skipped, not passed, when only placeholders are set.
export const describeWithServices = hasConfiguredServices() ? describe : describe.skip;

// Fail closed: integration tests delete rows, so they must never point at a shared or production database.
export function configureTestEnvironment(): void {
  if (!hasConfiguredServices()) return;
  const databaseUrl = process.env.DATABASE_URL as string;
  const url = new URL(databaseUrl);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Refusing to run: test database must be local");
  if (!/test/i.test(dbName)) throw new Error(`Refusing to run: database "${dbName}" does not look like a test database`);
  for (const [key, value] of Object.entries(SAFE_DEFAULTS)) process.env[key] ??= value;
}

export function uniquePrefix(): string {
  return `p42-${process.pid}-${Date.now().toString(36)}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Mirrors the production mount in app.ts. Only the integration router is mounted so that unrelated
// modules (Redis queues, MinIO, mail) are not started during tests.
export async function buildServiceApp() {
  const { integrationRoutes } = await import("../../modules/curriculum/integration.routes");
  const app = express();
  app.use(express.json());
  app.use(SERVICE_PATH_PREFIX, integrationRoutes);
  app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ message: "Internal error" });
  });
  return app;
}

export function skillsPath(externalOrganisationRef: string, externalUserRef: string): string {
  return `${SERVICE_PATH_PREFIX}/organisations/${encodeURIComponent(externalOrganisationRef)}/learners/${encodeURIComponent(externalUserRef)}/skills`;
}

type Caller = "field-services" | "ai-workforce";

export function callSkills(
  app: express.Express,
  opts: { service?: string | null; token?: string | null; companyRef: string; userRef: string },
) {
  let req = request(app).get(skillsPath(opts.companyRef, opts.userRef));
  if (opts.service !== null && opts.service !== undefined) req = req.set("x-titan-service", opts.service);
  if (opts.token !== null && opts.token !== undefined) req = req.set("Authorization", `Bearer ${opts.token}`);
  return req;
}

// Credentials are created through the real operator CLI. The token is returned to the caller in memory only.
export function runCredentialCli(input: Record<string, unknown>): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const tsx = path.join(BACKEND_ROOT, "node_modules/.bin/tsx");
  const script = path.join(BACKEND_ROOT, "prisma/manage-titan-credentials.ts");
  return new Promise((resolve, reject) => {
    const child = spawn(tsx, [script], { cwd: BACKEND_ROOT, env: process.env });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("credential CLI timed out")); }, 90000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (err) => { clearTimeout(timer); reject(err); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
    child.stdin.end(JSON.stringify(input));
  });
}

export async function createCredentialViaCli(
  service: Caller,
  companyRef: string,
  days = 30,
): Promise<{ id: string; token: string; expiresAt: string }> {
  const result = await runCredentialCli({ action: "create", service, companyRef, label: "integration-test", days });
  if (result.code !== 0) throw new Error(`credential create failed: ${result.stderr.trim()}`);
  const parsed = JSON.parse(result.stdout.trim());
  return { id: parsed.id, token: parsed.token, expiresAt: parsed.expiresAt };
}

// Direct insert for scenarios the CLI cannot express (for example, an already-expired credential).
export async function insertCredential(
  db: Db,
  opts: { service: Caller | string; companyRef: string; expiresAt?: Date | null; revokedAt?: Date | null },
): Promise<{ id: string; token: string }> {
  const token = randomBytes(48).toString("base64url");
  const row = await db.academyServiceCredential.create({
    data: {
      service: opts.service,
      companyRef: opts.companyRef,
      label: "integration-test-direct",
      tokenHash: sha256Hex(token),
      expiresAt: opts.expiresAt === undefined ? new Date(Date.now() + 30 * 86400000) : opts.expiresAt,
      revokedAt: opts.revokedAt ?? null,
    },
  });
  return { id: row.id, token };
}

export function randomUnknownToken(): string {
  return randomBytes(48).toString("base64url");
}

export interface Fixtures {
  prefix: string;
  startedAt: Date;
  orgA: { id: string; externalRef: string };
  orgB: { id: string; externalRef: string };
  users: Record<string, { id: string }>;
  lessonId: string;
  revisionId: string;
  assessorId: string;
}

async function makeUser(db: Db, prefix: string, tag: string, extra: { isActive?: boolean; deletedAt?: Date | null } = {}) {
  return db.user.create({
    data: {
      email: `${prefix}-${tag}@example.test`,
      passwordHash: "integration-test-not-a-login",
      fullName: `${prefix} ${tag}`,
      isActive: extra.isActive ?? true,
      // Verified by default, as a real active account is. The route refuses unverified learners (ACA-016).
      isEmailVerified: true,
      deletedAt: extra.deletedAt ?? null,
    },
    select: { id: true },
  });
}

export async function makeCompetency(
  db: Db,
  fx: Pick<Fixtures, "lessonId" | "revisionId" | "assessorId">,
  opts: { companyId: string; learnerId: string; expiresAt?: Date | null },
): Promise<string> {
  const evidence = await db.academyPracticalEvidence.create({
    data: {
      companyId: opts.companyId,
      learnerId: opts.learnerId,
      lessonId: fx.lessonId,
      revisionId: fx.revisionId,
      description: "integration-test fixture evidence",
      evidenceUrls: [],
      status: "APPROVED",
      assessorId: fx.assessorId,
    },
  });
  const competency = await db.academyVerifiedCompetency.create({
    data: {
      companyId: opts.companyId,
      learnerId: opts.learnerId,
      lessonId: fx.lessonId,
      revisionId: fx.revisionId,
      evidenceId: evidence.id,
      assessorId: fx.assessorId,
      expiresAt: opts.expiresAt ?? null,
    },
  });
  return competency.id;
}

// Creates two tenants, learners in each, and a lesson/revision to attach competencies to.
export async function createFixtures(db: Db): Promise<Fixtures> {
  const prefix = uniquePrefix();
  const startedAt = new Date();
  const refA = `${prefix}-org-a`;
  const refB = `${prefix}-org-b`;
  const rowA = await db.company.create({ data: { name: `${prefix} org A`, externalRef: refA }, select: { id: true } });
  const rowB = await db.company.create({ data: { name: `${prefix} org B`, externalRef: refB }, select: { id: true } });
  const orgA = { id: rowA.id, externalRef: refA };
  const orgB = { id: rowB.id, externalRef: refB };
  // Integration callers are denied unless the env allowlist names their company (fail closed). Both fixture
  // companies are allowed per caller; the route's own scope check still separates them per credential.
  process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [refA, refB], "ai-workforce": [refA, refB] });
  const assessor = await makeUser(db, prefix, "assessor");
  const learnerA = await makeUser(db, prefix, "learner-a");
  const learnerB = await makeUser(db, prefix, "learner-b");
  const inactive = await makeUser(db, prefix, "inactive", { isActive: false });
  const removed = await makeUser(db, prefix, "removed");
  const softDeleted = await makeUser(db, prefix, "soft-deleted", { deletedAt: new Date() });
  const lesson = await db.academyContentLesson.create({
    data: {
      sourceId: `${prefix}-lesson-1`, layer: "integration-test", serviceGroup: "integration-test", unit: "integration-test",
      title: "integration test lesson", objective: "fixture", assessment: "fixture",
      sourceVersion: "integration-test", sourceHash: "integration-test",
    },
    select: { id: true },
  });
  const revision = await db.academyLessonRevision.create({
    data: { lessonId: lesson.id, version: 1, body: {}, contentHash: "integration-test", status: "PUBLISHED" },
    select: { id: true },
  });
  // Level gate fixtures (PASS42): the base lesson is assigned to learners A and B through a published course.
  // Both have acknowledged it, so base is finished for each and their competencies are returned.
  const category = await db.category.create({ data: { name: `${prefix} category`, slug: `${prefix}-category` }, select: { id: true } });
  const course = await db.course.create({
    data: { title: `${prefix} course`, slug: `${prefix}-course`, description: "integration fixture", categoryId: category.id, teacherId: assessor.id, isPublished: true },
    select: { id: true },
  });
  const track = await db.academyCurriculumTrack.create({
    data: { slug: `${prefix}-track`, title: `${prefix} track`, scope: "UNIVERSAL", status: "PUBLISHED" },
    select: { id: true },
  });
  // The curriculum level map has no entry for this synthetic course, so the fixture registers its own (test hook).
  setCourseLevelMapForTests({ [`${prefix}-course`]: { [`${prefix}-lesson-1`]: "base" } });
  await db.academyLessonPlacement.create({ data: { trackId: track.id, lessonId: lesson.id, revisionId: revision.id, position: 1, required: true } });
  await db.academyCourseTrack.create({ data: { courseId: course.id, trackId: track.id, position: 1, required: true } });
  await db.enrollment.createMany({
    data: [learnerA.id, learnerB.id].map((studentId) => ({ studentId, courseId: course.id, status: "ACTIVE" as const })),
  });
  await db.academyLearnerCompletion.createMany({
    data: [learnerA.id, learnerB.id].map((learnerId) => ({ learnerId, lessonId: lesson.id, revisionId: revision.id })),
  });
  const fx: Fixtures = {
    prefix, startedAt, orgA, orgB, lessonId: lesson.id, revisionId: revision.id, assessorId: assessor.id,
    users: { assessor, learnerA, learnerB, inactive, removed, softDeleted },
  };
  await db.companyMember.createMany({
    data: [
      { companyId: orgA.id, userId: learnerA.id, role: "LEARNER" },
      { companyId: orgA.id, userId: inactive.id, role: "LEARNER" },
      { companyId: orgA.id, userId: removed.id, role: "LEARNER" },
      { companyId: orgA.id, userId: softDeleted.id, role: "LEARNER" },
      { companyId: orgB.id, userId: learnerB.id, role: "LEARNER" },
      { companyId: orgA.id, userId: assessor.id, role: "ASSESSOR" },
    ],
  });
  return fx;
}

export async function cleanupFixtures(db: Db, fx: Fixtures): Promise<void> {
  const orgIds = [fx.orgA.id, fx.orgB.id];
  const userIds = Object.values(fx.users).map((u) => u.id);
  await db.academyIntegrationAudit.deleteMany({
    where: { OR: [{ companyRef: { startsWith: fx.prefix, mode: "insensitive" } }, { companyRef: null, createdAt: { gte: fx.startedAt } }] },
  });
  await db.academyServiceCredential.deleteMany({ where: { companyRef: { startsWith: fx.prefix } } });
  await db.academyVerifiedCompetency.deleteMany({ where: { companyId: { in: orgIds } } });
  await db.academyPracticalEvidence.deleteMany({ where: { learnerId: { in: userIds } } });
  await db.academyExternalIdentity.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { companyId: { in: orgIds } }] } });
  await db.companyMember.deleteMany({ where: { companyId: { in: orgIds } } });
  setCourseLevelMapForTests(null);
  // Level gate fixtures (PASS42): completions and placements reference the revision, so they are removed first.
  await db.academyLearnerCompletion.deleteMany({ where: { revisionId: fx.revisionId } });
  await db.academyLessonPlacement.deleteMany({ where: { lessonId: fx.lessonId } });
  await db.academyCourseTrack.deleteMany({ where: { track: { slug: { startsWith: fx.prefix } } } });
  await db.enrollment.deleteMany({ where: { studentId: { in: userIds } } });
  await db.academyCurriculumTrack.deleteMany({ where: { slug: { startsWith: fx.prefix } } });
  // Course and Category are soft-deleted by the config/prisma extension, so they are removed with raw SQL.
  // Course must go before the users, because courses reference their teacher.
  await db.$executeRaw`DELETE FROM "courses" WHERE "slug" LIKE ${fx.prefix + "-%"}`;
  await db.$executeRaw`DELETE FROM "categories" WHERE "slug" LIKE ${fx.prefix + "-%"}`;
  await db.academyLessonRevision.deleteMany({ where: { id: fx.revisionId } });
  await db.academyContentLesson.deleteMany({ where: { id: fx.lessonId } });
  await db.company.deleteMany({ where: { id: { in: orgIds } } });
  // Raw SQL bypasses the soft-delete extension in config/prisma, so fixture users are really removed.
  await db.$executeRaw`DELETE FROM "users" WHERE "email" LIKE ${fx.prefix + "-%@example.test"}`;
}

export async function countAudit(db: Db, where: Record<string, unknown>): Promise<number> {
  return db.academyIntegrationAudit.count({ where: where as never });
}

export type { Caller };
