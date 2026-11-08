import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const src=readFileSync(new URL('../src/modules/curriculum/curriculum.routes.ts',import.meta.url),'utf8');
const endpoint=src.split('router.get("/companies/:companyId/lesson-context-snapshots/:snapshotId"')[1];
assert.ok(endpoint,'historical snapshot route registered');
const checks=[
  'authenticate', 'requireOrgMember(companyId, learnerId)',
  'id: param(req, "snapshotId"), companyId, learnerId',
  'snapshot.resolvedFields', 'snapshot.lessonRevisionId',
  'publicLessonBody(revision.body)', 'resolveLessonText(value, fields',
  'contentHash !== snapshot.contentHash',
  'Lesson snapshot integrity verification failed',
  'contextSnapshotId: snapshot.id',
];
for (const item of checks) assert.ok(endpoint.includes(item),`missing snapshot security/integrity contract: ${item}`);
const digest=(revisionId,fields,body)=>createHash('sha256').update(JSON.stringify({revisionId,fields,body})).digest('hex');
const original=digest('rev-1',{'business.name':'Example Co'},'Welcome Example Co');
assert.equal(original,digest('rev-1',{'business.name':'Example Co'},'Welcome Example Co'));
assert.notEqual(original,digest('rev-1',{'business.name':'Different Co'},'Welcome Example Co'));
assert.notEqual(original,digest('rev-2',{'business.name':'Example Co'},'Welcome Example Co'));
console.log(`Snapshot retrieval checks passed: ${checks.length+4}`);
