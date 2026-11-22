// Static checks for issue #302: the three non-additive migrations must ship a rollback.sql that reverses them.
// Reads files only; no database. Run: node --test tests/issue-302-rollback-files.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MIGRATIONS = path.join(__dirname, '../prisma/migrations');
const read = (dir, file) => fs.readFileSync(path.join(MIGRATIONS, dir, file), 'utf8');

const TENANT_RENAME = '20261108090000_academy_tenant_company_rename';
const INDEX_RENAME = '20261108100200_academy_training_assignment_index_name';
const LESSON_SCOPE = '20261102260000_academy_course_lesson_organisation_scope';

test('each named migration has both migration.sql and rollback.sql', () => {
  for (const dir of [TENANT_RENAME, INDEX_RENAME, LESSON_SCOPE]) {
    assert.ok(fs.existsSync(path.join(MIGRATIONS, dir, 'migration.sql')), `missing migration.sql: ${dir}`);
    assert.ok(fs.existsSync(path.join(MIGRATIONS, dir, 'rollback.sql')), `missing rollback.sql: ${dir}`);
  }
});

test('tenant rename rollback restores the original name of every renamed object', () => {
  const up = read(TENANT_RENAME, 'migration.sql');
  const down = read(TENANT_RENAME, 'rollback.sql');
  const renames = up
    .split('\n')
    .filter((line) => /^\s*ALTER (TABLE|INDEX)\b/.test(line) && /\bRENAME\b/.test(line));
  assert.ok(renames.length >= 36, `expected at least 36 rename statements, found ${renames.length}`);
  for (const line of renames) {
    const names = [...line.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const original = names[0];
    assert.ok(down.includes(`"${original}"`), `rollback does not restore: ${original}`);
  }
});

test('index-name rollback renames the index back to its companyId name', () => {
  const down = read(INDEX_RENAME, 'rollback.sql');
  assert.match(down, /academy_training_assignments_org_learner_course_key/);
  assert.match(down, /academy_training_assignments_companyId_learnerId_courseId_/);
  assert.match(down, /ALTER INDEX %I RENAME TO %I/);
});

test('lesson-scope rollback recreates the dropped key and removes the added objects', () => {
  const up = read(LESSON_SCOPE, 'migration.sql');
  const down = read(LESSON_SCOPE, 'rollback.sql');
  const dropped = up.match(/DROP INDEX "([^"]+)"/);
  assert.ok(dropped, 'migration no longer drops an index; update this test');
  assert.match(
    down,
    new RegExp(`CREATE UNIQUE INDEX IF NOT EXISTS "${dropped[1]}"`),
    'rollback must recreate the dropped unique key',
  );
  assert.match(down, /DROP COLUMN IF EXISTS "organisationId"/);
  assert.match(down, /RAISE EXCEPTION|RAISE/, 'rollback must refuse while organisation-scoped rows exist');
});
