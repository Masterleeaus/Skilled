#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMigrations, inspectMigrations } from './audit-migration-readiness.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = readFileSync(join(root, 'apps/backend/prisma/schema.prisma'), 'utf8');
const tables = new Map();
// Prisma models may have custom @@map table names; parity tests check their
// physical table mapping rather than assuming model name == SQL table name.
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{([^]*?)^\}/gm)];
for (const model of models) {
  const [,name,body] = model;
  const physical = body.match(/@@map\("([^\"]+)"\)/)?.[1] ?? name;
  assert.ok(!tables.has(physical), `Two Prisma models map to ${physical}`);
  tables.set(physical, name);
}
const result = inspectMigrations(getMigrations());
assert.equal(result.errors.length, 0, `Migration errors: ${result.errors.join('; ')}`);
const migrations = Object.keys(result.tableOrigins).sort();
const schemaTables = [...tables.keys()].sort();
assert.deepEqual(migrations, schemaTables, 'Prisma model tables differ from migration-created tables');
assert.ok(models.length >= 40, 'Expected all inherited LMS and Academy models');
console.log(`Schema / migration parity: ${models.length} models, ${migrations.length} physical tables, exact match`);
