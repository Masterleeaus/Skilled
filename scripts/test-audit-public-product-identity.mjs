import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditPublicIdentity } from './audit-public-product-identity.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function temporary(fn) {
  const target = mkdtempSync(resolve(tmpdir(), 'skilled-public-identity-'));
  try {
    for (const folder of ['apps/frontend/src/app', 'apps/frontend/src/components']) {
      mkdirSync(dirname(resolve(target,folder)),{recursive:true});
      cpSync(resolve(root,folder),resolve(target,folder),{recursive:true});
    }
    const email = 'apps/backend/src/jobs/account-email-content.ts';
    mkdirSync(dirname(resolve(target,email)),{recursive:true});
    cpSync(resolve(root,email),resolve(target,email));
    fn(target);
  } finally { rmSync(target,{recursive:true,force:true}); }
}

test('tracked active UI and account email contain no unapproved obsolete product wording', () => {
  const report = auditPublicIdentity();
  assert.deepEqual(report.issues, []);
  assert.ok(report.scannedFiles >= 30);
  assert.equal(report.passed, true);
});

test('historical attribution stays visible in credits', () => {
  const credits = readFileSync(resolve(root,'apps/frontend/src/app/credits/page.tsx'),'utf8');
  assert.match(credits,/SkilledAt\.Work began from an inherited MIT-licensed/);
  assert.match(credits,/Farrukh Ali Khan/);
});

test('new legacy branding in active pages is detected', () => temporary(target => {
  const p = resolve(target,'apps/frontend/src/app/page.tsx');
  writeFileSync(p,readFileSync(p,'utf8')+'\n// Titan Academy\n');
  const report = auditPublicIdentity({sourceRoot:target});
  assert.ok(report.issues.some(x=>x.path==='apps/frontend/src/app/page.tsx'&&x.kind==='obsolete-product-name'));
}));

test('only the exact historical credits statement is exempted', () => temporary(target => {
  const p = resolve(target,'apps/frontend/src/app/credits/page.tsx');
  writeFileSync(p,readFileSync(p,'utf8')+'\nconst currentBrand = "Titan Academy";\n');
  const report = auditPublicIdentity({sourceRoot:target});
  assert.ok(report.issues.some(x=>x.path==='apps/frontend/src/app/credits/page.tsx'));
}));

test('lost authenticated header identity or transactional email identity fails the audit', () => temporary(target => {
  const p = resolve(target,'apps/frontend/src/components/Topbar.tsx');
  writeFileSync(p,readFileSync(p,'utf8').replace('aria-label={homeHref ? "SkilledAt.Work dashboard" : "SkilledAt.Work home"}','aria-label="Dashboard"'));
  const email = resolve(target,'apps/backend/src/jobs/account-email-content.ts');
  writeFileSync(email,readFileSync(email,'utf8').replace('SKILLED_PRODUCT_NAME = "SkilledAt.Work"','SKILLED_PRODUCT_NAME = "OldName"'));
  const report = auditPublicIdentity({sourceRoot:target});
  assert.ok(report.issues.some(x=>x.kind==='topbar-brand-missing'));
  assert.ok(report.issues.some(x=>x.kind==='account-email-brand-missing'));
}));

test('guest home fallback is required even when dashboard identity exists', () => temporary(target => {
  const p = resolve(target,'apps/frontend/src/components/Topbar.tsx');
  writeFileSync(p,readFileSync(p,'utf8').replace('href={homeHref ?? "/"}','href="/student"'));
  const report = auditPublicIdentity({sourceRoot:target});
  assert.ok(report.issues.some(x=>x.kind==='topbar-brand-missing'));
}));
