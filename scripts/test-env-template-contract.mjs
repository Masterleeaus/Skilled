#!/usr/bin/env node
// Offline check: every environment variable that apps/backend and apps/frontend read at runtime
// (or that an operator script reads) must appear in .env.production.example, active or commented.
// Detection (source only, no execution):
//   1. process.env.NAME and process.env["NAME"] literals
//   2. process.env[IDENT] where IDENT is a same-file const holding a literal name
//   3. const *_VAR / *_ENV = "NAME" (the convention used by the provider and script modules)
//   4. the envSchema keys in apps/backend/src/config/env.ts
// Test code (tests/, *.test.*, fixtures, harnesses) is excluded. Each allowlist entry needs a reason.
// Usage: node scripts/test-env-template-contract.mjs [path/to/template]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const templatePath = resolve(process.argv[2] ?? join(root, '.env.production.example'));
const scanRoots = ['apps/backend', 'apps/frontend'].map((p) => join(root, p));
const SOURCE_EXT = /\.(ts|tsx|js|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', 'build']);
const TEST_PATH = /(^|\/)(tests?|__tests__)\/|\.(test|spec)\.|fixture|harness|test-env/;

// Names that are read by code in scope but must not be in the production template. Reason required.
const ALLOWLIST = new Map([
  ['SEED_CONFIRM_WIPE', 'apps/backend/prisma/seed.ts destructive-seed confirmation; the seed refuses to run in production. Must never be set in a production environment.'],
]);

const errors = [];
const sources = new Map(); // name -> Set of relative file paths
const skipped = [];

function addSource(name, file) {
  if (!sources.has(name)) sources.set(name, new Set());
  sources.get(name).add(file);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE_EXT.test(entry)) out.push(full);
  }
  return out;
}

for (const scanRoot of scanRoots) {
  if (!existsSync(scanRoot)) { errors.push(`scan root missing: ${relative(root, scanRoot)}`); continue; }
  for (const file of walk(scanRoot)) {
    const rel = relative(root, file).split(sep).join('/');
    if (TEST_PATH.test(rel)) { skipped.push(rel); continue; }
    const text = readFileSync(file, 'utf8');

    for (const m of text.matchAll(/\bprocess\.env\.([A-Z][A-Z0-9_]*)\b/g)) addSource(m[1], rel);
    for (const m of text.matchAll(/\bprocess\.env\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\]/g)) addSource(m[1], rel);

    for (const m of text.matchAll(/\bprocess\.env\[\s*([A-Za-z_]\w*)\s*\]/g)) {
      const ident = m[1];
      const bound = new RegExp(`\\b(?:const|let|var)\\s+${ident}\\s*=\\s*['"]([A-Z][A-Z0-9_]*)['"]`).exec(text);
      if (bound) addSource(bound[1], rel);
      else errors.push(`${rel}: process.env[${ident}] cannot be resolved to a literal name`);
    }

    for (const m of text.matchAll(/\b(?:const|let|var)\s+[A-Za-z_]\w*_(?:VAR|ENV)\s*=\s*['"]([A-Z][A-Z0-9_]*)['"]/g)) addSource(m[1], rel);
  }
}

const envTs = join(root, 'apps/backend/src/config/env.ts');
const schemaKeys = [...readFileSync(envTs, 'utf8').matchAll(/^\s{2}([A-Z][A-Z0-9_]*):\s*z\./gm)].map((m) => m[1]);
if (schemaKeys.length === 0) errors.push('no envSchema keys found in apps/backend/src/config/env.ts (parser out of date?)');
for (const key of schemaKeys) addSource(key, 'apps/backend/src/config/env.ts (envSchema)');

if (!existsSync(templatePath)) {
  errors.push(`template not found: ${relative(root, templatePath)}`);
} else {
  const template = readFileSync(templatePath, 'utf8');
  const required = [...sources.keys()].filter((name) => !ALLOWLIST.has(name)).sort();
  const missing = required.filter((name) => !new RegExp(`^[ \\t]*#?[ \\t]*${name}=`, 'm').test(template));
  for (const name of missing) {
    errors.push(`${name} is read by ${[...sources.get(name)].sort().join(', ')} but is missing from ${relative(root, templatePath)}`);
  }

  // Port and public-origin contract for the two entries in the issue.
  const dbLine = template.match(/^DATABASE_URL="postgresql:\/\/[^"]*@127\.0\.0\.1:(\d+)\/titan_academy/m);
  if (!dbLine) errors.push('DATABASE_URL loopback titan_academy entry not found in template');
  else {
    if (dbLine[1] !== '5433') errors.push(`DATABASE_URL port is ${dbLine[1]}, expected 5433 (dedicated Academy cluster)`);
    const runbook = readFileSync(join(root, 'curriculum/research/DEPLOY-RUNBOOK.md'), 'utf8');
    if (!/port = 5433/.test(runbook)) errors.push('DEPLOY-RUNBOOK.md no longer documents port = 5433; reconcile the template with the runbook');
  }
  const site = template.match(/^NEXT_PUBLIC_SITE_URL="([^"]*)"/m);
  if (!site) errors.push('NEXT_PUBLIC_SITE_URL is not set in template');
  else if (!site[1].startsWith('https://')) errors.push('NEXT_PUBLIC_SITE_URL placeholder must start with https://');

  console.log(`Template: ${relative(root, templatePath)}`);
  console.log(`Runtime and operator env names detected: ${sources.size} (envSchema keys: ${schemaKeys.length})`);
  console.log(`Allowlisted: ${[...ALLOWLIST.keys()].join(', ')}`);
  console.log(`Test files excluded: ${skipped.length}`);
  console.log(`Names checked against template: ${required.length}, missing: ${missing.length}`);
}

if (errors.length) {
  console.error('ENV TEMPLATE CONTRACT: FAIL');
  for (const e of errors) console.error(`- ${e}`);
  process.exitCode = 1;
} else {
  console.log('PASS: every runtime env name is in the production template; DATABASE_URL uses 5433; NEXT_PUBLIC_SITE_URL present');
}
