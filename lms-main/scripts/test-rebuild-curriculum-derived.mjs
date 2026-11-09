#!/usr/bin/env node
/** Deterministic regression: regenerated index and queue must have equal source coverage. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildIndex, listAuthoringFiles } from './reconcile-lesson-formats.mjs';
import { createQueue, csv } from './build-curriculum-review-queue.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = buildIndex();
const queue = createQueue(index);
assert.equal(index.total, index.lessons.length);
assert.equal(new Set(index.lessons.map(l => l.id)).size, index.total);
assert.equal(index.total, listAuthoringFiles().filter(({rel}) => rel.startsWith('curriculum/')).length -
  listAuthoringFiles().filter(({rel, file}) => {
    const source = JSON.parse(fs.readFileSync(file,'utf8'));
    return rel.startsWith('curriculum/courses/') && !('id' in source);
  }).length);
assert.ok(index.lessons.every(l => l.publicationApproved === false));
assert.ok(queue.lessons.every(l => l.reviewStatus === 'needs-human-review' && l.publicationApproved === false));
assert.equal(queue.summary.requiringReview, queue.lessons.length);
assert.equal(queue.summary.byPriority.P0 + queue.summary.byPriority.P1 + queue.summary.byPriority.P2, queue.lessons.length);
assert.equal(queue.summary.requiringReview, index.lessons.filter(l => l.reviewBlockers.length > 0).length);
assert.equal(queue.summary.byIssue['course mapping requires review'] ?? 0,
  index.lessons.filter(l => l.reviewBlockers.includes('course mapping requires review')).length);
assert.ok(index.lessons.every(l => fs.existsSync(path.join(root, l.sourceFile))));
assert.ok(queue.lessons.every(l => /^[a-f0-9]{64}$/.test(l.sourceHash)));
const outputs = new Map([
  ['curriculum/lesson-normalization-index.json', JSON.stringify(index,null,2)+'\n'],
  ['curriculum/lesson-review-queue.json', JSON.stringify(queue,null,2)+'\n'],
  ['curriculum/lesson-review-queue.csv', csv(queue)],
]);
for (const [relative, expected] of outputs) {
  assert.equal(fs.readFileSync(path.join(root, relative),'utf8'), expected, `Stale derived artifact: ${relative}`);
}
const run = spawnSync(process.execPath, ['scripts/rebuild-curriculum-derived.mjs','--check'], {cwd:root, encoding:'utf8',timeout:120000});
assert.equal(run.status,0,run.stderr || run.stdout);
const report = JSON.parse(run.stdout);
assert.equal(report.indexedDrafts,index.total);
assert.equal(report.unresolvedDrafts,queue.lessons.length);
assert.deepEqual(report.changedDerivedFiles,[]);
assert.equal(report.sourceFilesChanged,0);
assert.equal(report.publicationApprovalsAdded,0);
console.log(`PASS: ${index.total} draft identities, ${queue.lessons.length} held reviews, three exact derived artifacts`);
