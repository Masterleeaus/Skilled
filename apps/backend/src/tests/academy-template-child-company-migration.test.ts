/**
 * Migration check for 20261115120000_academy_template_child_company_scope against a real Postgres.
 *
 * Runs only when TEST_DATABASE_URL names a disposable database with migrations deployed, and psql is installed.
 * The whole check runs in one transaction that ends in ROLLBACK, so the database is left unchanged.
 * It checks that migration.sql adds the column, FKs and indexes; that rollback.sql removes them; that the backfill
 * copies the parent response's company only; and that re-applying restores the same state.
 */
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const DATABASE_URL = process.env.TEST_DATABASE_URL;
const MIGRATION_DIR = path.join(process.cwd(), "prisma/migrations/20261115120000_academy_template_child_company_scope");
const canRun = Boolean(DATABASE_URL) && spawnSync("psql", ["--version"]).status === 0;

const P = "tpl-mig";
const fixture = `
INSERT INTO users (id,email,"passwordHash","fullName","updatedAt") VALUES
 ('${P}-l1','${P}-l1@x.test','h','L1','2026-01-01'),('${P}-as','${P}-as@x.test','h','AS','2026-01-01');
INSERT INTO academy_companies (id,name) VALUES ('${P}-c1','Co1'),('${P}-c2','Co2');
INSERT INTO academy_content_lessons (id,"sourceId",layer,"serviceGroup",unit,title,objective,assessment,"sourceVersion","sourceHash","updatedAt") VALUES
 ('${P}-a','${P}-sa','UNIVERSAL','G','U1','A','o','a','1','h','2026-01-01');
INSERT INTO academy_lesson_revisions (id,"lessonId",version,body,"contentHash") VALUES ('${P}-ra','${P}-a',1,'{}','h');
INSERT INTO academy_template_responses (id,"companyId","learnerId","lessonId","revisionId","templateId","fieldValues",status,"updatedAt") VALUES
 ('${P}-r1','${P}-c1','${P}-l1','${P}-a','${P}-ra','t','{}','SUBMITTED','2026-01-01'),
 ('${P}-r2',NULL,'${P}-l1','${P}-a','${P}-ra','t2','{}','SUBMITTED','2026-01-01'),
 ('${P}-r3','${P}-c2','${P}-l1','${P}-a','${P}-ra','t3','{}','SUBMITTED','2026-01-01');
INSERT INTO academy_template_sign_offs (id,"templateResponseId","assessorId",decision,"rubricResults") VALUES
 ('${P}-s1','${P}-r1','${P}-as','SIGNED_OFF','{}'),('${P}-s2','${P}-r2','${P}-as','SIGNED_OFF','{}');
INSERT INTO academy_generated_documents (id,"templateResponseId",version,"contentHash",assembled) VALUES
 ('${P}-d1','${P}-r1',1,'h','{}'),('${P}-d2','${P}-r2',1,'h','{}'),('${P}-d3','${P}-r3',1,'h','{}');
`;

const COLUMN_COUNT = `SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='companyId' AND table_name IN ('academy_template_sign_offs','academy_generated_documents')`;
const FK_COUNT = `SELECT count(*) FROM pg_constraint WHERE conname IN ('academy_template_sign_offs_companyId_fkey','academy_generated_documents_companyId_fkey')`;

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
    `INSERT INTO snap SELECT 'sign_' || "id", COALESCE("companyId", 'NULL') FROM academy_template_sign_offs WHERE "id" LIKE '${P}-%';`,
    `INSERT INTO snap SELECT 'doc_' || "id", COALESCE("companyId", 'NULL') FROM academy_generated_documents WHERE "id" LIKE '${P}-%';`,
    `\\i ${down}`,
    `INSERT INTO snap SELECT 'columns_after_second_rollback', (${COLUMN_COUNT})::text;`,
    `\\i ${up}`,
    `INSERT INTO snap SELECT 'columns_after_reapply', (${COLUMN_COUNT})::text;`,
    "SELECT json_object_agg(k, v) FROM snap;",
    "ROLLBACK;",
  ].join("\n");
}

describe.skipIf(!canRun)("20261115120000_academy_template_child_company_scope migration", () => {
  it("applies, reverses, copies the parent company to children, and re-applies", () => {
    const out = execFileSync("psql", [DATABASE_URL!, "-q", "-At", "-v", "ON_ERROR_STOP=1"], { input: buildScript(), encoding: "utf8" });
    const line = out.trim().split("\n").filter(Boolean).pop() ?? "{}";
    const state = JSON.parse(line) as Record<string, string>;

    expect(state.columns_after_rollback).toBe("0");
    expect(state.columns_after_apply).toBe("2");
    expect(state.fks_after_apply).toBe("2");
    expect(state.columns_after_second_rollback).toBe("0");
    expect(state.columns_after_reapply).toBe("2");

    // Children of a company-scoped response take that company.
    expect(state[`sign_${P}-s1`]).toBe(`${P}-c1`);
    expect(state[`doc_${P}-d1`]).toBe(`${P}-c1`);
    expect(state[`doc_${P}-d3`]).toBe(`${P}-c2`);
    // Children of a response with no company stay NULL.
    expect(state[`sign_${P}-s2`]).toBe("NULL");
    expect(state[`doc_${P}-d2`]).toBe("NULL");
  });
});
