import test from 'node:test';
import assert from 'node:assert/strict';
import { scanValue, classify, matchSourceLines } from './audit-curriculum-brand.mjs';

test('finds legacy names in learner-facing nested curriculum text', () => {
  const findings = scanValue({
    audience: 'For any Titan Academy business',
    instruction: [{ heading: 'Intro', body: 'Review any Titan Academy lesson.' }]
  });
  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map(f => f.classification), [
    'learner-visible-review', 'learner-visible-review'
  ]);
  assert.equal(findings[1].pointer, '/instruction/0/body');
});

test('retains provenance and editorial notes for separate manual review', () => {
  const findings = scanValue({
    source: { attribution: 'Titan Academy source pass' },
    reviewNotes: 'Titan Academy migration note',
    id: 'Titan Academy internal record'
  });
  assert.deepEqual(findings.map(f => f.classification), [
    'retain-review-provenance',
    'retain-review-provenance',
    'unclassified-manual-review'
  ]);
});

test('handles arrays, repeated matches and JSON pointer escapes', () => {
  const findings = scanValue({ 'title/a': ['Titan Academy; titan-academy.'] });
  assert.equal(findings.length, 2);
  assert.equal(findings[0].pointer, '/title~1a/0');
  assert.equal(classify('/instruction/0/body'), 'learner-visible-review');
});

test('does not match unrelated Titan or Academy references', () => {
  assert.deepEqual(scanValue({ body: 'Titan system and Academy lesson' }), []);
});

test('maps semantic matches to physical lines only when counts agree', () => {
  const raw = '{\n  "body": "Titan Academy",\n  "summary": "Titan Academy"\n}';
  const matches = scanValue(JSON.parse(raw));
  const located = matchSourceLines(raw, matches);
  assert.deepEqual(located.map(hit => hit.sourceLine), [2, 3]);
  assert.ok(located.every(hit => hit.sourceLineVerified));
  const ambiguous = matchSourceLines('"Titan Academy"', []);
  assert.deepEqual(ambiguous, []);
  const mismatch = matchSourceLines('{"body":"Titan Academy"}', [matches[0], matches[1]]);
  assert.deepEqual(mismatch.map(hit => hit.sourceLine), [null, null]);
  assert.ok(mismatch.every(hit => !hit.sourceLineVerified));
});
