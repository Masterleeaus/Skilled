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

test('manifest and built-metadata verifier match the public description exactly', () => {
  const manifest = readFileSync(resolve(root, 'apps/frontend/src/app/manifest.ts'), 'utf8');
  const verifier = readFileSync(resolve(root, 'apps/frontend/scripts/verify-metadata.mjs'), 'utf8');
  const description = appLayout.match(/const siteDescription = "([^"]+)";/)?.[1];
  assert.ok(description, 'Description missing');
  assert.ok(manifest.includes(description), 'PWA manifest description drift');
  assert.ok(verifier.includes(description), 'Built-metadata contract description drift');
});

test('homepage current product copy uses SkilledAt.Work without erasing historical attribution', () => {
  const home = readFileSync(resolve(root, 'apps/frontend/src/app/page.tsx'), 'utf8');
  assert.match(home, /SkilledAt\.Work brings together curriculum lessons/);
  assert.doesNotMatch(home, /Titan Academy/i);
  const credits = readFileSync(resolve(root, 'apps/frontend/src/app/credits/page.tsx'), 'utf8');
  assert.match(credits, /Titan Academy began from an inherited MIT-licensed/);
  assert.match(credits, /SkilledAt\.Work codebase/);
  assert.doesNotMatch(credits, /not verified for Titan Academy/i);
});
