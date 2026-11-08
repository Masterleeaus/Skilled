#!/usr/bin/env node
import assert from 'node:assert/strict';
import { getMigrations, inspectMigrations } from './audit-migration-readiness.mjs';

let assertions = 0;
const ok = (condition, message) => { assert.ok(condition, message); assertions++; };
const real = inspectMigrations(getMigrations());
ok(real.migrationCount >= 13, 'Expected original and Titan Academy additive migrations');
ok(real.createdTables >= 40, 'Expected substantial LMS table inventory');
ok(real.errors.length === 0, `Static migration errors: ${real.errors.join('; ')}`);
ok(real.warnings.some(w => /Timestamp 20261102000100/.test(w)), 'Flag duplicate timestamp for independent review');

const invalid = inspectMigrations([
  { name: '20260101000000_initial', sql: 'CREATE TABLE "a" ("id" TEXT);' },
  { name: '20260102000000_broken', sql: 'ALTER TABLE "missing" ADD "x" TEXT; CREATE TABLE "a" ("id" TEXT);' },
]);
ok(invalid.errors.some(e => /uncreated table/.test(e)), 'Unknown ALTER target must fail');
ok(invalid.errors.some(e => /created more than once/.test(e)), 'Duplicate CREATE TABLE must fail');
const destructive = inspectMigrations([{ name: '20260101000000_drop', sql: 'DROP TABLE "users";' }]);
ok(destructive.errors.some(e => /destructive SQL/.test(e)), 'Destructive migration must be flagged');
const forwardFK = inspectMigrations([{ name: '20260101000000_fk', sql: 'CREATE TABLE "child" ("id" TEXT REFERENCES "parent"("id"));' }]);
ok(forwardFK.errors.some(e => /uncreated table/.test(e)), 'Undeclared FK target must be flagged');
console.log(`Migration preflight tests: ${assertions} assertions passed`);
