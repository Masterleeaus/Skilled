import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { inspectCompatibility } from './audit-active-compatibility.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/backend');
const readFiles = [
  'prisma/schema.prisma', 'src/app.ts', 'src/modules/auth/auth.routes.ts',
  'src/modules/auth/token.utils.ts', 'src/modules/curriculum/integration.routes.ts',
  'src/modules/curriculum/curriculum.routes.ts',
  'src/modules/curriculum/lesson-review.routes.ts',
  'src/modules/curriculum/lesson-review.service.ts',
  'src/modules/curriculum/file-lesson-loader.ts',
];
function fixture(fn) {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'skilled-compatibility-'));
  try {
    for (const name of readFiles) {
      const target = path.join(scratch, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, name), target);
    }
    const migrations = path.join(root, 'prisma/migrations');
    for (const entry of fs.readdirSync(migrations, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const source = path.join(migrations, entry.name, 'migration.sql');
      if (!fs.existsSync(source)) continue;
      const destination = path.join(scratch, 'prisma/migrations', entry.name, 'migration.sql');
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }
    fn(scratch);
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}
function edit(root, file, replace) {
  const full = path.join(root, file);
  fs.writeFileSync(full, replace(fs.readFileSync(full, 'utf8')));
}
const has = (report, code) => report.violations.some(x => x.name === code);

test('real checkout retains the authentication, tenant, publication and migration anchors', () => {
  const result = inspectCompatibility();
  assert.deepEqual(result.violations, [], JSON.stringify(result.violations));
  assert.equal(result.compatibilityChecksPassed, true);
  assert.ok(result.migrationCount >= 31);
  assert.equal(result.verifiedDatabase, false);
  assert.equal(result.verifiedRuntime, false);
});

test('renaming an existing migration anchor is a breaking change', () => fixture(tmp => {
  fs.renameSync(path.join(tmp, 'prisma/migrations/20261108090000_academy_tenant_company_rename'),
    path.join(tmp, 'prisma/migrations/20261108090000_renamed'));
  assert.ok(has(inspectCompatibility({ backend: tmp }), 'migration-anchor'));
}));

test('losing a persisted chatbot model is detected, but it is not treated as an active route', () => fixture(tmp => {
  edit(tmp, 'prisma/schema.prisma', s => s.replace('model AcademyChatbot {', 'model RemovedLegacyChatbot {'));
  assert.ok(has(inspectCompatibility({ backend: tmp }), 'model'));
}));

test('changing service tenant allowlisting or membership checks is detected', () => fixture(tmp => {
  edit(tmp, 'src/modules/curriculum/integration.routes.ts',
    s => s.replace('allowedRefs?.includes(credential.companyRef)', 'true')
      .replace('companyId: company.id, externalUserRef', 'companyId: null, externalUserRef'));
  const audit = inspectCompatibility({ backend: tmp });
  assert.ok(has(audit, 'service-fail-closed'));
  assert.ok(has(audit, 'integration-company'));
}));

test('removing published revision and enrolment guards is detected', () => fixture(tmp => {
  edit(tmp, 'src/modules/curriculum/curriculum.routes.ts',
    s => s.replace('await assertEnrolled(learnerId, course.id)', '/* removed */')
      .replace('publicLessonBody(placement.revision.body)', 'publicLessonBody(file.body)'));
  const audit = inspectCompatibility({ backend: tmp });
  assert.ok(has(audit, 'learner-access'));
  assert.ok(has(audit, 'approved-not-live-file'));
}));

test('missing migration SQL and weakened JWT pinning are flagged', () => fixture(tmp => {
  fs.rmSync(path.join(tmp, 'prisma/migrations/20261108120100_academy_chatbot/migration.sql'));
  edit(tmp, 'src/modules/auth/token.utils.ts', s => s.replace('algorithms: ["HS256"]', 'algorithms: ["none"]'));
  const audit = inspectCompatibility({ backend: tmp });
  assert.ok(has(audit, 'migration-sql'));
  assert.ok(has(audit, 'migration-anchor'));
  assert.ok(has(audit, 'jwt-algorithm'));
}));
