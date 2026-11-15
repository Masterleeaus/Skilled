#!/usr/bin/env node
// Acceptance test for the blocking curriculum CI gate (issue #26).
// Copies the curriculum inputs into a temporary tree, then checks that:
//   - the unmodified tree passes the gate (exit 0), and
//   - known blocked fixtures make the gate fail (exit 1) with the expected check name.
// Each blocked fixture is a single change a pull request could introduce.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUTS = ['scripts', 'curriculum', 'tests'];

function makeTree(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'curriculum-gate-'));
  for (const entry of INPUTS) {
    fs.cpSync(path.join(repoRoot, entry), path.join(dir, entry), { recursive: true });
  }
  mutate?.(dir);
  return dir;
}

function runGate(dir) {
  // Same invocation as `pnpm curriculum:ci` (fail-on-blocked is not used here; see the workflow).
  return spawnSync(process.execPath, [path.join(dir, 'scripts/ci-curriculum-audit.mjs'), '--report', path.join(dir, 'report.json')], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 300000,
  });
}

test('unmodified curriculum tree passes the gate', () => {
  const dir = makeTree();
  try {
    const result = runGate(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Curriculum CI: PASS/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a draft with invalid JSON is a blocked fixture and fails the gate', () => {
  const dir = makeTree((root) => {
    fs.writeFileSync(path.join(root, 'curriculum/shared/ci-blocked-fixture.json'), '{ "id": "CI-BLOCKED-01", ');
  });
  try {
    const result = runGate(dir);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /FAIL \[hard-structure\]/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a stale normalisation index is a blocked fixture and fails the gate', () => {
  const dir = makeTree((root) => {
    const indexPath = path.join(root, 'curriculum/lesson-normalization-index.json');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    index.total = index.total + 1;
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
  });
  try {
    const result = runGate(dir);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /FAIL \[index-drift\]/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
