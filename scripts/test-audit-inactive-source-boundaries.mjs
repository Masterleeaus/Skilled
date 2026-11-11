import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { inventory } from './audit-inactive-source-boundaries.mjs';

function setup(run) {
  const folder = mkdtempSync(join(tmpdir(), 'skilled-source-inventory-'));
  const root = join(folder, 'lms-main');
  const files = {
    'apps/backend/src/app.ts': 'app.use("/api/auth", authRoutes); if (process.env.TUTOR_ENABLED === "true") mountTutorRoute(app);',
    'apps/backend/src/server.ts': 'import { api } from "./app";',
    'apps/frontend/src/app/page.tsx': 'export default function Page() { return null }',
    'apps/backend/src/tutor/chatbot/chatbot-service.ts': 'export const old = true;',
    'curriculum/lessons/converted/legacy.json': '{"id":"old"}',
    'docs/legacy-bootstrap/1-init.sh': 'echo "history"',
  };
  try {
    for (const [name, data] of Object.entries(files)) {
      const destination = join(root, name);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, data);
    }
    run({ root, repo: folder, files });
  } finally { rmSync(folder, { recursive: true, force: true }); }
}

test('classifies historical paths without treating stored copies as runtime code', () => setup(({ root, repo }) => {
  const audit = inventory({ root, repo });
  assert.equal(audit.activeSourceFilesChecked, 4);
  assert.equal(audit.archived.find(x => x.label === 'inactive-tutor-chatbot').sourceFiles, 1);
  assert.equal(audit.archived.find(x => x.label === 'retired-converted-lessons').fileCount, 1);
  assert.equal(audit.archived.find(x => x.label === 'legacy-bootstrap').fileCount, 1);
  assert.deepEqual(audit.violations, []);
  assert.deepEqual(audit.mountedApiPrefixes, ['/api/auth']);
}));

test('detects live source importing from a retired code folder', () => setup(({ root, repo }) => {
  const f = join(root, 'apps/backend/src/server.ts');
  writeFileSync(f, 'import "../../..//docs/legacy-bootstrap/bootstrap.mjs";');
  const audit = inventory({ root, repo });
  assert.equal(audit.archivedSourceImports.length, 1);
  assert.equal(audit.violations[0].code, 'ACTIVE_IMPORTS_ARCHIVED');
}));

test('flags removal of tutor activation guard', () => setup(({ root, repo }) => {
  writeFileSync(join(root, 'apps/backend/src/app.ts'), 'app.use("/api/auth", authRoutes);');
  assert.equal(inventory({ root, repo }).violations[0].code, 'TUTOR_GUARD_MISSING');
}));

test('flags mounting an unreviewed chatbot entrypoint', () => setup(({ root, repo }) => {
  writeFileSync(join(root, 'apps/backend/src/app.ts'),
    'if (process.env.TUTOR_ENABLED === "true") mountTutorRoute(app); app.use("/chatbot", require("./tutor/chatbot/route"));');
  assert.ok(inventory({ root, repo }).violations.some(x => x.code === 'UNREVIEWED_CHATBOT_MOUNT'));
}));
