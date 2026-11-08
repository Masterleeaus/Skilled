#!/usr/bin/env node
/** Read-only static preflight. Does not connect to, create, or migrate any DB. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationRoot = join(root, 'apps/backend/prisma/migrations');

export function inspectMigrations(migrations) {
  const errors = [];
  const warnings = [];
  const tables = new Set();
  const declared = new Map();
  const stamps = new Map();
  const names = migrations.map(m => m.name);
  if (new Set(names).size !== names.length) errors.push('Duplicate migration directory name');
  if (names.join('|') !== [...names].sort().join('|')) errors.push('Migrations must be sorted lexically');
  if (!migrations.length) errors.push('No Prisma migration SQL found');

  for (const migration of migrations) {
    const match = migration.name.match(/^(\d{14})_[a-z0-9_]+$/);
    if (!match) errors.push(`Invalid migration directory name: ${migration.name}`);
    else {
      const others = stamps.get(match[1]) || [];
      others.push(migration.name);
      stamps.set(match[1], others);
    }
    const sql = migration.sql.replace(/--[^\n]*/g, '');
    // Production schema changes should never be implicit destructive changes.
    if (/\b(?:DROP\s+(?:TABLE|SCHEMA|DATABASE)|TRUNCATE\s+(?:TABLE\s+)?|DELETE\s+FROM)\b/i.test(sql) ||
        /\bALTER\s+TABLE\s+(?:"[^"]+"|\S+)\s+DROP\s+(?:COLUMN|CONSTRAINT)\b/i.test(sql)) {
      errors.push(`${migration.name}: destructive SQL needs explicit independent review`);
    }
    for (const match of sql.matchAll(/\bCREATE\s+TABLE\s+"([^"]+)"\s*\(/gi)) {
      const table = match[1];
      if (tables.has(table)) errors.push(`${migration.name}: table ${table} created more than once`);
      tables.add(table);
      declared.set(table, migration.name);
    }
    // A table renamed by ALTER TABLE ... RENAME TO exists under its new name from that point on.
    for (const match of sql.matchAll(/\bALTER\s+TABLE\s+"([^"]+)"\s+RENAME\s+TO\s+"([^"]+)"/gi)) {
      tables.delete(match[1]);
      tables.add(match[2]);
      declared.set(match[2], declared.get(match[1]) ?? migration.name);
      declared.delete(match[1]);
    }
    for (const match of sql.matchAll(/\bALTER\s+TABLE\s+"([^"]+)"(?!\s+RENAME\s+TO\b)/gi)) {
      if (!tables.has(match[1])) errors.push(`${migration.name}: ALTER TABLE refers to uncreated table ${match[1]}`);
    }
    for (const match of sql.matchAll(/\bREFERENCES\s+"([^"]+)"\s*\(/gi)) {
      if (!tables.has(match[1])) errors.push(`${migration.name}: FK references uncreated table ${match[1]}`);
    }
    for (const match of sql.matchAll(/\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+"[^"]+"\s+ON\s+"([^"]+)"/gi)) {
      if (!tables.has(match[1])) errors.push(`${migration.name}: index targets uncreated table ${match[1]}`);
    }
  }
  for (const [stamp, dirs] of stamps) {
    if (dirs.length > 1) warnings.push(`Timestamp ${stamp} is shared by ${dirs.length} distinct migrations (${dirs.join(', ')}); lexical ordering is deterministic but requires review.`);
  }
  return { migrationCount: migrations.length, createdTables: tables.size, warnings, errors, tableOrigins: Object.fromEntries(declared) };
}

export function getMigrations(directory = migrationRoot) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(directory, entry.name, 'migration.sql')))
    .map(entry => ({ name: entry.name, sql: readFileSync(join(directory, entry.name, 'migration.sql'), 'utf8') }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = inspectMigrations(getMigrations());
  const summary = {
    check: 'static-migrations-only',
    databaseWasAccessed: false,
    migrationsWereExecuted: false,
    ...result,
  };
  delete summary.tableOrigins;
  console.log(JSON.stringify(summary, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
