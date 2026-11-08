#!/usr/bin/env node
// Dependency-independent audit of pnpm importer specifiers, without resolving packages.
// This is NOT a package-install, integrity, vulnerability or type-check test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = fs.readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8');
const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(rootPkg.packageManager, 'pnpm@10.0.0', 'expected package manager');
assert.match(lock, /^lockfileVersion: '9\.0'/m, 'lockfile format');
const lockLines = lock.split('\n');
function blockForImporter(name) {
  const i = lockLines.indexOf(`  ${name}:`);
  assert.ok(i >= 0, `${name} importer missing`);
  const lines = [];
  for (let j = i + 1; j < lockLines.length; j++) {
    if (/^  [^ ]/.test(lockLines[j]) || /^[^ ]/.test(lockLines[j]) && lockLines[j].trim()) break;
    lines.push(lockLines[j]);
  }
  return lines;
}
let count = 0;
for (const dir of ['apps/backend','apps/frontend']) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, dir, 'package.json'), 'utf8'));
  const block = blockForImporter(dir);
  for (const section of ['dependencies','devDependencies','optionalDependencies']) {
    const found = new Map();
    let key = null;
    let inSection = false;
    for (const line of block) {
      if (/^    [^ ]/.test(line)) { inSection = line.trim() === `${section}:`; key = null; continue; }
      if (!inSection) continue;
      const nameLine = line.match(/^      (.+):\s*$/);
      if (nameLine) { key = nameLine[1].replace(/^['"]|['"]$/g, ''); continue; }
      const specifierLine = line.match(/^        specifier:\s*(.+)\s*$/);
      if (specifierLine && key) {
        const specifier = specifierLine[1].trim().replace(/^['"]|['"]$/g, '');
        found.set(key, specifier); key = null;
      }
    }
    for (const [name, version] of Object.entries(pkg[section] ?? {})) {
      assert.equal(found.get(name), version, `${dir} ${section}/${name}: package.json != lockfile`);
      count++;
    }
    const extras = [...found.keys()].filter(k => !(k in (pkg[section] ?? {})));
    assert.deepEqual(extras, [], `${dir} ${section} contains stale lockfile entries`);
  }
}
console.log(`PASS: ${count} package specifiers match pinned pnpm workspace lockfile (offline)`);
