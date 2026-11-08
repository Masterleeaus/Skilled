import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appLayout = readFileSync(resolve(root, 'apps/frontend/src/app/layout.tsx'), 'utf8');

test('public browser and sharing description uses Skilled product naming', () => {
  const description = appLayout.match(/const siteDescription = "([^"]+)";/);
  assert.ok(description, 'Site description must be defined for social previews');
  assert.match(description[1], /SkilledAt\.Work/);
  assert.doesNotMatch(description[1], /Titan Academy|generic LMS/i);
  assert.match(appLayout, /description: siteDescription,/);
  assert.match(appLayout, /metadataBase: new URL\(siteUrl\)/);
});

test('production public origin stays configurable, not assumed', () => {
  assert.match(appLayout, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(appLayout, /http:\/\/localhost:3000/);
});
