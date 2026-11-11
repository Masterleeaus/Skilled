#!/usr/bin/env node
// Independent editorial classification regression: no real lessons are modified.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanValue, matchSourceLines } from './audit-curriculum-brand.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../tests/fixtures/curriculum-brand');
const names = fs.readdirSync(root).filter(name => /^BR-\d{2}-[\w-]+\.json$/.test(name)).sort();
assert.equal(names.length, 20, 'All 20 distinct classification contracts must be present');
for (const filename of names) {
  test(filename, () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
    const result = scanValue(fixture.input);
    assert.deepEqual(result.map(hit => [hit.pointer, hit.classification]), fixture.expected);
    for (const hit of result) {
      assert.match(hit.match, /^titan[\s-]+academy$/i);
      assert.ok(Number.isInteger(hit.offset) && hit.offset >= 0, 'offset must be nonnegative');
      assert.ok(hit.excerpt.includes(hit.match), 'excerpt must retain exact matching text');
    }
  });
}
// A source-line number is never authoritative if semantic and raw occurrences disagree.
test('raw line count mismatch refuses to fabricate source line positions', () => {
  const hits = scanValue({body:'Titan Academy', title:'Titan Academy'});
  const report = matchSourceLines('{"body":"Titan Academy"}',hits);
  assert.ok(report.every(hit => hit.sourceLine === null && hit.sourceLineVerified === false));
});
