import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = [
  'docs/DEPLOYMENT.md', 'docs/INSTALL.md',
  'docs/runbooks/deployment.md', 'curriculum/research/DEPLOY-RUNBOOK.md'
];
const read = file => readFileSync(join(root, file), 'utf8');

test('one current deployment entrypoint and historical runbook is explicitly non-authoritative', () => {
  const entry = read('docs/DEPLOYMENT.md');
  const legacy = read('curriculum/research/DEPLOY-RUNBOOK.md');
  const install = read('docs/INSTALL.md');
  assert.match(entry, /^# SkilledAt\.Work — deployment entrypoint/m);
  assert.match(legacy, /ARCHIVED OPERATOR REFERENCE — NOT CURRENT DEPLOYMENT AUTHORITY/);
  assert.match(install, /Deployment navigation/);
  assert.ok(legacy.includes('../../docs/DEPLOYMENT.md'));
  assert.match(entry, /NOT production verified/);
});

test('local Markdown relative document links resolve to tracked files', () => {
  for (const doc of docs) {
    const text = read(doc);
    const dir = dirname(join(root, doc));
    const pattern = /\]\(([^)#]+)(?:#[^)]*)?\)/g;
    for (const match of text.matchAll(pattern)) {
      const uri = match[1].replace(/^<|>$/g, '');
      if (/^(https?:|mailto:|#)/.test(uri)) continue;
      assert.ok(existsSync(resolve(dir, decodeURIComponent(uri))), doc + ' has broken link: ' + uri);
    }
  }
});

test('release policy retains data, human approvals, recovery and tenant isolation gates', () => {
  const entry = read('docs/DEPLOYMENT.md');
  for (const marker of [
    'frozen-lockfile', 'migrate deploy', 'migrate dev', 'backup',
    'curriculum:ci', 'approval', 'organisation', 'Stripe',
    'rollback', 'prepare-public-assets.mjs', 'NEXT_PUBLIC_API_URL',
    'canonical-import-manifest.json', 'staging', 'secrets'
  ]) {
    assert.ok(entry.toLowerCase().includes(marker.toLowerCase()), 'Missing release guard: ' + marker);
  }
});

test('historical port conventions never become claimed provisioned facts', () => {
  const entry = read('docs/DEPLOYMENT.md');
  assert.match(entry, /port numbers are not evidence/);
  assert.match(entry, /Do not touch another installed product/);
  assert.match(entry, /NOT production verified/);
});
