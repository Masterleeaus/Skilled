#!/usr/bin/env node
/**
 * Independent fixture-level coverage for the canonical authoring normalizer.
 * Synthetic fixtures are deliberately outside curriculum/ and cannot be published.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAuthoring } from './reconcile-lesson-formats.mjs';
import { createQueue } from './build-curriculum-review-queue.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'tests/fixtures/lesson-normalization');
const fixtures=fs.readdirSync(dir).filter(name=>name.endsWith('.json')).sort();
assert.equal(fixtures.length,20,'Expected exactly 20 independent regression fixtures');
const base={
  id:'SYNTHETIC-ONLY', title:'Synthetic regression draft', status:'DRAFT',
  learningOutcomes:['Identify the documented task safely'],
  instruction:[{heading:'Step',body:'Follow the approved procedure and stop when unsafe.'}],
  courseSlugs:['synthetic-course']
};
const counts={P0:0,P1:0,P2:0,clean:0};
for(const filename of fixtures){
  const fixture=JSON.parse(fs.readFileSync(path.join(dir,filename),'utf8'));
  assert.match(fixture.caseId,/^FX-\d{2}$/);
  assert.ok(Array.isArray(fixture.remove) && Array.isArray(fixture.expectedBlockers));
  const source={...structuredClone(base),...fixture.overrides};
  for(const field of fixture.remove)delete source[field];
  const before=JSON.stringify(source);
  const normalized=normalizeAuthoring(source,`tests/fixtures/lesson-normalization/${filename}`);
  assert.deepEqual(normalized.reviewBlockers,fixture.expectedBlockers,
    `${fixture.caseId}: ${fixture.description}`);
  assert.equal(normalized.publicationApproved,false,`${fixture.caseId}: no inferred approval`);
  assert.equal(normalized.originalStatus,source.status,`${fixture.caseId}: preserve source review status`);
  assert.equal(normalized.format,'full-authoring');
  assert.match(normalized.sourceHash,/^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(source),before,`${fixture.caseId}: source content cannot be rewritten`);
  const blockers=Object.fromEntries(normalized.reviewBlockers.map(b=>[b,1]));
  const queue=createQueue({total:1,blockers,lessons:[normalized]});
  if(fixture.expectedPriority===null){
    assert.equal(queue.lessons.length,0,`${fixture.caseId}: valid draft does not enter blockers queue`);
    counts.clean++;
  }else{
    assert.equal(queue.lessons.length,1,`${fixture.caseId}: unresolved source requires review`);
    assert.equal(queue.lessons[0].priority,fixture.expectedPriority,
      `${fixture.caseId}: severity must match issue priority`);
    assert.equal(queue.lessons[0].reviewStatus,'needs-human-review');
    assert.equal(queue.lessons[0].publicationApproved,false);
    assert.equal(queue.lessons[0].issues.length,normalized.reviewBlockers.length);
    counts[fixture.expectedPriority]++;
  }
}
assert.deepEqual(counts,{P0:9,P1:4,P2:4,clean:2});
console.log(`PASS: ${fixtures.length} normalized lesson scenarios; ${counts.P0} P0, ${counts.P1} P1, ${counts.P2} P2, ${counts.clean} clean drafts; no inferred approvals`);
