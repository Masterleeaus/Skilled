#!/usr/bin/env node
import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit, gitBlobSha, verifyRecord, expectedIds } from './audit-course-mapping-review.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceBytes = fs.readFileSync(path.join(root, 'curriculum/shared/app/SFS-01.json'));
const original = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/reviews/course-mapping/SFS-01.json'), 'utf8'));
const altered = changes => ({ ...original, ...changes });
const errors = changes => verifyRecord(altered(changes), sourceBytes, 'SFS-01');

test('source snapshot uses Git blob hash and detects byte changes', () => {
  assert.equal(gitBlobSha(sourceBytes), original.sourceBlobSha);
  assert.notEqual(gitBlobSha(Buffer.concat([sourceBytes, Buffer.from('\n')])), original.sourceBlobSha);
});
test('all 16 distinct source-linked cases are accounted for', () => {
  const result = audit();
  assert.equal(expectedIds.length, 16);
  assert.equal(result.checked, 16);
  assert.equal(result.unresolved, 16);
  assert.equal(result.invalid, 0);
  assert.equal(new Set(result.records.map(r => r.lessonId)).size, 16);
});
test('snapshot cannot grant publication rights', () => {
  assert.deepEqual(errors({ publicationApproved: true }), ['review_cannot_publish']);
});
test('unresolved records cannot carry invented course placements', () => {
  assert.ok(errors({ proposedCourseSlugs: ['unreviewed-course'] }).includes('unresolved_record_has_placement'));
  assert.ok(errors({ reviewer: 'Example Person' }).includes('unresolved_record_has_decision_metadata'));
});
test('source mapping is tied to the exact lesson and file', () => {
  assert.ok(errors({ lessonId: 'SFS-02' }).includes('lesson_identity_mismatch'));
  assert.ok(errors({ sourceFile: 'curriculum/shared/app/SFS-02.json' }).includes('source_path_mismatch'));
  assert.ok(errors({ sourceBlobSha: '0'.repeat(40) }).includes('source_changed_review_required'));
});
test('source metadata tampering requires refreshed review', () => {
  assert.ok(errors({ sourceTitle: 'Different title' }).includes('evidence_drift_sourceTitle'));
  assert.ok(errors({ observedCourseSlugs: ['arbitrary'] }).includes('course_slugs_changed'));
  assert.ok(errors({ observedLearningOutcomes: [] }).includes('learning_outcomes_changed'));
  assert.ok(errors({ observedInstructionSectionCount: 0 }).includes('instruction_count_changed'));
  assert.ok(errors({ observedSourceReferenceCount: 0 }).includes('source_reference_count_changed'));
});
test('decision requires documented reviewer and rationale', () => {
  const invalid = errors({ decision: 'approved', proposedCourseSlugs: ['course'] });
  assert.ok(invalid.includes('missing_reviewer'));
  assert.ok(invalid.includes('invalid_review_date'));
  assert.ok(invalid.includes('missing_review_rationale'));
  assert.ok(errors({ decision: 'approved', reviewer: 'Qualified Reviewer', reviewedAt: '2026-11-09T00:00:00Z', rationale: 'Placement verified with authoritative course inventory.', proposedCourseSlugs: [] }).includes('approved_without_course'));
  assert.ok(errors({ decision: 'excluded', reviewer: 'Qualified Reviewer', reviewedAt: '2026-11-09T00:00:00Z', rationale: 'Confirmed not suitable for any currently approved course.', proposedCourseSlugs: ['course'] }).includes('excluded_but_placed'));
});
test('valid reviewer decision still does not publish lesson', () => {
  const example = altered({ decision: 'approved', reviewer: 'Qualified Reviewer', reviewedAt: '2026-11-09T00:00:00Z', rationale: 'Course owner confirmed course provenance and placement.', proposedCourseSlugs: ['approved-example-course'] });
  assert.deepEqual(verifyRecord(example, sourceBytes, 'SFS-01'), []);
  assert.equal(example.publicationApproved, false);
});
