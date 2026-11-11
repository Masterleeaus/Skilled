import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { auditManifest } from './audit-canonical-import-manifest.mjs';

const hash = b => createHash('sha256').update(b).digest('hex');
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'skilled-manifest-'));
  const files = { 'shared/A.json': JSON.stringify({ id: 'A', title: 'One' }), 'lessons/ready/A.json': JSON.stringify({ id: 'A' }) };
  try {
    for (const [rel, value] of Object.entries(files)) {
      mkdirSync(join(root, rel, '..'), { recursive: true });
      writeFileSync(join(root, rel), value);
    }
    const row = { sourceId: 'A', canonicalFile: 'shared/A.json', canonicalSha256: hash(files['shared/A.json']),
      readySourceFile: 'lessons/ready/A.json', readySourceSha256: hash(files['lessons/ready/A.json']) };
    const manifest = { lessonCount: 1, uniqueSourceIds: 1, duplicateSourceIds: 0, databaseWritten: false, entries: [row] };
    run({ root, manifest, row, files });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('accepts a consistent historical snapshot without writing files', () => fixture(({ root, manifest, files }) => {
  assert.deepEqual(auditManifest(manifest, { curriculumRoot: root }).evidence, []);
  assert.equal(auditManifest(manifest, { curriculumRoot: root }).matches, 1);
  assert.equal(readFileSync(join(root, 'shared/A.json'), 'utf8'), files['shared/A.json']);
}));

test('reports stale canonical content rather than auto-updating stored hashes', () => fixture(({ root, manifest }) => {
  writeFileSync(join(root, 'shared/A.json'), '{"id":"A","title":"Changed"}');
  const report = auditManifest(manifest, { curriculumRoot: root });
  assert.equal(report.stale, 1);
  assert.equal(report.importSafe, false);
}));

test('refuses traversal and malformed stored hashes', () => fixture(({ root, manifest, row }) => {
  row.readySourceFile = '../secret.json';
  row.readySourceSha256 = 'garbage';
  const report = auditManifest(manifest, { curriculumRoot: root });
  assert.equal(report.unsafePaths, 1);
  assert.equal(report.importSafe, false);
}));

test('finds conflicting source ids even when files exist', () => fixture(({ root, manifest, row }) => {
  row.sourceId = 'B';
  const report = auditManifest(manifest, { curriculumRoot: root });
  assert.equal(report.identityMismatch, 1);
  assert.equal(report.importSafe, false);
}));

test('rejects repeated IDs, broken summary and deleted file', () => fixture(({ root, manifest, row }) => {
  manifest.entries.push({ ...row, canonicalFile: 'shared/MISSING.json' });
  const report = auditManifest(manifest, { curriculumRoot: root });
  assert.equal(report.duplicateIds, 1);
  assert.equal(report.missing, 1);
  assert.equal(report.invalid, 1);
}));

test('read-only snapshot rejects malformed input', () => {
  assert.equal(auditManifest(null).importSafe, false);
  assert.equal(auditManifest({ entries: [] }).importSafe, false);
});
