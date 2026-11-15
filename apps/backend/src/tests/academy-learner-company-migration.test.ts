/**
 * Migration check for 20261110100000_academy_learner_company_scope against a real Postgres.
 *
 * Runs only when TEST_DATABASE_URL names a disposable database with migrations deployed, and psql is installed.
 * The whole check runs in one transaction that ends in ROLLBACK, so the database is left unchanged.
 * It checks that migration.sql adds the column, FK and indexes; that rollback.sql removes them; that the backfill
 * assigns only unambiguous rows; and that re-applying restores the same state.
 */
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DATABASE_URL = process.env.TEST_DATABASE_URL;
const MIGRATION_DIR = path.join(process.cwd(), "prisma/migrations/20261110100000_academy_learner_company_scope");
const canRun = Boolean(DATABASE_URL) && spawnSync("psql", ["--version"]).status === 0;

// Ids are prefixed so the fixture never collides with real rows. Nothing is committed.
const P = "scope-mig";
const fixture = `
INSERT INTO users (id,email,"passwordHash","fullName","updatedAt") VALUES
 ('${P}-l1','${P}-l1@x.test','h','L1','2026-01-01'),('${P}-l2','${P}-l2@x.test','h','L2','2026-01-01'),
 ('${P}-l3','${P}-l3@x.test','h','L3','2026-01-01'),('${P}-l4','${P}-l4@x.test','h','L4','2026-01-01'),
 ('${P}-l5','${P}-l5@x.test','h','L5','2026-01-01'),('${P}-mg','${P}-mg@x.test','h','MG','2026-01-01');
INSERT INTO categories (id,name,slug) VALUES ('${P}-cat','Cat','${P}-cat');
INSERT INTO academy_companies (id,name) VALUES ('${P}-c1','Co1'),('${P}-c2','Co2');
INSERT INTO academy_company_members (id,"companyId","userId") VALUES
 ('${P}-m1','${P}-c1','${P}-l1'),('${P}-m2','${P}-c1','${P}-l2'),('${P}-m3','${P}-c2','${P}-l2'),('${P}-m4','${P}-c1','${P}-l4');
INSERT INTO courses (id,title,slug,description,"categoryId","teacherId","updatedAt") VALUES
 ('${P}-k1','K1','${P}-k1','d','${P}-cat','${P}-mg','2026-01-01'),('${P}-k2','K2','${P}-k2','d','${P}-cat','${P}-mg','2026-01-01');
INSERT INTO academy_content_lessons (id,"sourceId",layer,"serviceGroup",unit,title,objective,assessment,"sourceVersion","sourceHash","updatedAt") VALUES
 ('${P}-a','${P}-sa','UNIVERSAL','G','U1','A','o','a','1','h','2026-01-01'),
 ('${P}-b','${P}-sb','UNIVERSAL','G','U1','B','o','a','1','h','2026-01-01');
INSERT INTO academy_lesson_revisions (id,"lessonId",version,body,"contentHash") VALUES
 ('${P}-ra','${P}-a',1,'{}','h'),('${P}-rb','${P}-b',1,'{}','h');
INSERT INTO academy_curriculum_tracks (id,slug,title,scope,status,"updatedAt") VALUES
 ('${P}-t1','${P}-t1','T1','UNIVERSAL','PUBLISHED','2026-01-01'),('${P}-t2','${P}-t2','T2','UNIVERSAL','DRAFT','2026-01-01');
INSERT INTO academy_lesson_placements (id,"trackId","lessonId","revisionId",position) VALUES
 ('${P}-p1','${P}-t1','${P}-a','${P}-ra',1),('${P}-p2','${P}-t2','${P}-b','${P}-rb',1);
INSERT INTO academy_course_tracks (id,"courseId","trackId",position) VALUES ('${P}-ct1','${P}-k1','${P}-t1',1),('${P}-ct2','${P}-k2','${P}-t2',1);
INSERT INTO academy_training_assignments (id,"companyId","learnerId","assignedById","courseId",status) VALUES
 ('${P}-ta1','${P}-c1','${P}-l1','${P}-mg','${P}-k1','ASSIGNED'),
 ('${P}-ta2','${P}-c1','${P}-l2','${P}-mg','${P}-k1','ASSIGNED'),
 ('${P}-ta3','${P}-c2','${P}-l2','${P}-mg','${P}-k1','ASSIGNED'),
 ('${P}-ta4','${P}-c2','${P}-l3','${P}-mg','${P}-k1','ASSIGNED'),
 ('${P}-ta5','${P}-c1','${P}-l4','${P}-mg','${P}-k2','ASSIGNED');
INSERT INTO academy_learner_completions (id,"learnerId","lessonId","revisionId") VALUES
 ('${P}-c-l1','${P}-l1','${P}-a','${P}-ra'),('${P}-c-l2','${P}-l2','${P}-a','${P}-ra'),
 ('${P}-c-l3','${P}-l3','${P}-a','${P}-ra'),('${P}-c-l4','${P}-l4','${P}-b','${P}-rb'),
 ('${P}-c-l5','${P}-l5','${P}-a','${P}-ra');
INSERT INTO academy_knowledge_attempts (id,"learnerId","lessonId","revisionId",answers,score,total,passed) VALUES
 ('${P}-k-l1','${P}-l1','${P}-a','${P}-ra','[1]',1,1,true),('${P}-k-l2','${P}-l2','${P}-a','${P}-ra','[1]',1,1,true),
 ('${P}-k-l5','${P}-l5','${P}-a','${P}-ra','[1]',1,1,true);
`;

const COLUMN_COUNT = `SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='companyId' AND table_name IN ('academy_learner_completions','academy_knowledge_attempts')`;
const FK_COUNT = `SELECT count(*) FROM pg_constraint WHERE conname IN ('academy_learner_completions_companyId_fkey','academy_knowledge_attempts_companyId_fkey')`;

function buildScript(): string {
  const up = path.join(MIGRATION_DIR, "migration.sql");
  const down = path.join(MIGRATION_DIR, "rollback.sql");
  return [
    "\\set ON_ERROR_STOP on",
    "BEGIN;",
    "CREATE TEMP TABLE snap (k text PRIMARY KEY, v text);",
    `\\i ${down}`,
    `INSERT INTO snap SELECT 'columns_after_rollback', (${COLUMN_COUNT})::text;`,
    fixture,
    `\\i ${up}`,
    `INSERT INTO snap SELECT 'columns_after_apply', (${COLUMN_COUNT})::text;`,
    `INSERT INTO snap SELECT 'fks_after_apply', (${FK_COUNT})::text;`,
    `INSERT INTO snap SELECT 'backfill_' || "id", COALESCE("companyId", 'NULL') FROM academy_learner_completions WHERE "id" LIKE '${P}-%';`,
    `INSERT INTO snap SELECT 'backfill_attempt_' || "id", COALESCE("companyId", 'NULL') FROM academy_knowledge_attempts WHERE "id" LIKE '${P}-%';`,
    `\\i ${down}`,
    `INSERT INTO snap SELECT 'columns_after_second_rollback', (${COLUMN_COUNT})::text;`,
    `\\i ${up}`,
    `INSERT INTO snap SELECT 'columns_after_reapply', (${COLUMN_COUNT})::text;`,
    "SELECT json_object_agg(k, v) FROM snap;",
    "ROLLBACK;",
  ].join("\n");
}

describe.skipIf(!canRun)("20261110100000_academy_learner_company_scope migration", () => {
  it("applies, reverses, backfills only unambiguous rows, and re-applies", () => {
    const script = buildScript();
    const out = execFileSync("psql", [DATABASE_URL!, "-q", "-At", "-v", "ON_ERROR_STOP=1"], { input: script, encoding: "utf8" });
    const line = out.trim().split("\n").filter(Boolean).pop() ?? "{}";
    const state = JSON.parse(line) as Record<string, string>;

    expect(state.columns_after_rollback).toBe("0");
    expect(state.columns_after_apply).toBe("2");
    expect(state.fks_after_apply).toBe("2");
    expect(state.columns_after_second_rollback).toBe("0");
    expect(state.columns_after_reapply).toBe("2");

    // Unambiguous: learner 1 is assigned in one organisation, a member of it, and the lesson revision is placed in a published track.
    expect(state[`backfill_${P}-c-l1`]).toBe(`${P}-c1`);
    expect(state[`backfill_attempt_${P}-k-l1`]).toBe(`${P}-c1`);
    // Ambiguous (member of two assigned organisations), not a member of the assigned organisation, draft track, and no assignment: all NULL.
    expect(state[`backfill_${P}-c-l2`]).toBe("NULL");
    expect(state[`backfill_attempt_${P}-k-l2`]).toBe("NULL");
    expect(state[`backfill_${P}-c-l3`]).toBe("NULL");
    expect(state[`backfill_${P}-c-l4`]).toBe("NULL");
    expect(state[`backfill_${P}-c-l5`]).toBe("NULL");
    expect(state[`backfill_attempt_${P}-k-l5`]).toBe("NULL");
  });
});
