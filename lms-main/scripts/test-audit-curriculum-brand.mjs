import test from 'node:test';
import assert from 'node:assert/strict';
import { scanValue, classify } from './audit-curriculum-brand.mjs';

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
