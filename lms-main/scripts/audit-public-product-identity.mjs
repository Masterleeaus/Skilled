#!/usr/bin/env node
/**
 * Audit active learner-visible product text without touching historical source,
 * content IDs, migration names or MIT attribution.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const activeRoots = ['apps/frontend/src/app', 'apps/frontend/src/components'];
const historicalCredit = 'apps/frontend/src/app/credits/page.tsx';
const obsolete = /\bTitan[ -]Academy\b|\bTitanAcademy\b|\bTitan Academy LMS\b/gi;

function files(dir) {
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const abs = resolve(dir, item.name);
    if (item.isDirectory()) out.push(...files(abs));
    else if (item.isFile() && ['.ts','.tsx','.js','.jsx'].includes(extname(item.name))) out.push(abs);
  }
  return out;
}

/**
 * Do not erase true history. One exact statement on Credits is allowed; its
 * provenance can be reviewed independently from current product copy.
 */
export function auditPublicIdentity({ sourceRoot = root } = {}) {
  const issues = [];
  const scanned = [];
  for (const folder of activeRoots) {
    for (const abs of files(resolve(sourceRoot, folder))) {
      const path = relative(sourceRoot, abs).replaceAll('\\','/');
      scanned.push(path);
      const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        obsolete.lastIndex = 0;
        if (!obsolete.test(lines[i])) continue;
        if (path === historicalCredit && lines[i].includes('Titan Academy began from an inherited MIT-licensed')) continue;
        issues.push({ path, line: i + 1, kind: 'obsolete-product-name' });
      }
    }
  }
  const emailPath = 'apps/backend/src/jobs/account-email-content.ts';
  const email = readFileSync(resolve(sourceRoot, emailPath), 'utf8');
  scanned.push(emailPath);
  if (!email.includes('SKILLED_PRODUCT_NAME = "SkilledAt.Work"')) {
    issues.push({ path: emailPath, kind: 'account-email-brand-missing' });
  }
  if (/Titan[ -]Academy|TitanAcademy/i.test(email)) {
    issues.push({ path: emailPath, kind: 'account-email-legacy-brand' });
  }
  const topbar = readFileSync(resolve(sourceRoot, 'apps/frontend/src/components/Topbar.tsx'), 'utf8');
  if (!topbar.includes('aria-label="SkilledAt.Work dashboard"')) {
    issues.push({ path: 'apps/frontend/src/components/Topbar.tsx', kind: 'topbar-brand-missing' });
  }
  return { schemaVersion: 1, scannedFiles: scanned.length, issues, passed: issues.length === 0,
    note: 'Static active UI and transactional-email product text; no browser runtime or deployed content inspected' };
}

export function runCli(argv = process.argv.slice(2)) {
  let report;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--report') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw Error('Missing --report path');
      report = resolve(argv[++i]);
    } else if (argv[i] !== '--strict') throw Error('Unknown argument: ' + argv[i]);
  }
  const result = auditPublicIdentity();
  if (report) {
    mkdirSync(dirname(report), { recursive: true });
    writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify(result, null, 2));
  if (argv.includes('--strict') && !result.passed) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runCli(); } catch (error) { console.error(error); process.exitCode = 2; }
}
