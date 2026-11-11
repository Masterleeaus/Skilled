#!/usr/bin/env node
/**
 * Rebuild derived editorial artifacts from canonical lesson files.
 * No lesson, assessment, source approval, review decision, or publication status is ever written.
 *
 * Usage:
 *   node scripts/rebuild-curriculum-derived.mjs --check
 *   node scripts/rebuild-curriculum-derived.mjs --write
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildIndex, listAuthoringFiles } from './reconcile-lesson-formats.mjs';
import { createQueue, csv } from './build-curriculum-review-queue.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length !== 1 || !['--check', '--write'].includes(args[0])) {
  console.error('Specify exactly one of --check or --write');
  process.exit(2);
}
const mode = args[0];
const paths = {
  index: path.join(root, 'curriculum/lesson-normalization-index.json'),
  queue: path.join(root, 'curriculum/lesson-review-queue.json'),
  csv: path.join(root, 'curriculum/lesson-review-queue.csv'),
};
const inputs = listAuthoringFiles();
const sourceFingerprints = new Map(inputs.map(({ file }) => [
  file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
]));
const index = buildIndex(inputs);
const queue = createQueue(index);
assert.equal(index.lessons.length, index.total, 'Every lesson must be represented');
assert.equal(new Set(index.lessons.map(l => l.id)).size, index.total, 'No duplicate lesson identity');
assert.ok(index.lessons.every(l => l.publicationApproved === false), 'Derived lessons must remain unapproved');
assert.ok(index.lessons.every(l => l.originalStatus), 'Original review statuses must remain present');
assert.ok(index.lessons.every(l => fs.existsSync(path.join(root, l.sourceFile))), 'All source references must exist');
assert.equal(queue.summary.totalDrafts, index.total, 'Queue total must match index');
assert.equal(queue.summary.requiringReview, index.lessons.filter(l => l.reviewBlockers.length).length, 'Unresolved lesson coverage must reconcile');
assert.equal(queue.lessons.length, queue.summary.requiringReview);
assert.ok(queue.lessons.every(l => l.reviewStatus === 'needs-human-review' && l.publicationApproved === false), 'No implicit approval');
assert.equal(queue.summary.byPriority.P0 + queue.summary.byPriority.P1 + queue.summary.byPriority.P2, queue.lessons.length);
const outputs = new Map([
  [paths.index, JSON.stringify(index, null, 2) + '\n'],
  [paths.queue, JSON.stringify(queue, null, 2) + '\n'],
  [paths.csv, csv(queue)],
]);
const drift = [...outputs].filter(([file, expected]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== expected)
  .map(([file]) => path.relative(root, file).split(path.sep).join('/'));
if (mode === '--write') {
  for (const [file, expected] of outputs) {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === expected) continue;
    const temporary = `${file}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(temporary, expected);
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.rmSync(temporary);
    }
  }
}
for (const [file, before] of sourceFingerprints) {
  const after = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(after, before, `Source lesson was modified: ${file}`);
}
const report = {
  mode: mode.slice(2),
  sourceFileCount: inputs.length,
  indexedDrafts: index.total,
  unresolvedDrafts: queue.lessons.length,
  priorities: queue.summary.byPriority,
  blockers: index.blockers,
  changedDerivedFiles: drift,
  sourceFilesChanged: 0,
  publicationApprovalsAdded: 0,
};
console.log(JSON.stringify(report, null, 2));
if (mode === '--check' && drift.length) process.exitCode = 1;
