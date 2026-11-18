#!/usr/bin/env node
// Regression and negative/security tests for the regulated-content gate (Skilled issue #34).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildInventory, evaluateItem, publishCheck, readRegister, sha256, summarise, validateRegister,
} from './regulated-content-lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const validator = path.join(here, 'validate-regulated-content.mjs');
const builder = path.join(here, 'build-regulated-inventory.mjs');
const NOW = Date.parse('2026-11-18T00:00:00Z');
let assertions = 0;
const check = (condition, message) => { assert.ok(condition, message); assertions++; };
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'regulated-gate-'));

function write(root, rel, data) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n');
}

// Fixture tree: two regulated lessons, one hazard-term lesson, one high-risk course lesson,
// one plain lesson that must stay out of scope, assessments (mapped, plain, orphan), and media.
function fixture(name) {
  const root = path.join(temp, name);
  write(root, 'curriculum/shared/healthcare/H1.json', { id: 'H1', title: 'Infection control', safetyAndRegulatory: 'Follow the national guideline.' });
  write(root, 'curriculum/shared/cleaning/C1.json', { id: 'C1', title: 'Mopping a floor', safetyAndRegulatory: 'Keep the floor dry.' });
  write(root, 'curriculum/shared/cleaning/C2.json', { id: 'C2', title: 'Asbestos awareness', safetyAndRegulatory: 'Stop and report.' });
  write(root, 'curriculum/courses/high-risk/HR1.json', { id: 'HR1', title: 'Equipment transport', layer: 'high-risk', courseSlugs: ['high-risk'] });
  write(root, 'curriculum/assessments/H1.assessment.json', { lessonId: 'H1', knowledgeAnswers: [] });
  write(root, 'curriculum/assessments/C1.assessment.json', { lessonId: 'C1', knowledgeAnswers: [] });
  write(root, 'curriculum/assessments/ORPHAN.assessment.json', { lessonId: 'ORPHAN', knowledgeAnswers: [] });
  write(root, 'curriculum/healthcare/poster.png', 'png-bytes');
  write(root, 'curriculum/icons/plain.png', 'png-bytes');
  return root;
}

function seed(root) {
  const r = spawnSync(process.execPath, [builder, `--root=${root}`], { encoding: 'utf8' });
  assert.equal(r.status, 0, `builder failed: ${r.stderr}`);
}

function approved(item, overrides = {}) {
  return {
    decision: 'approve',
    reviewerRole: 'Qualified healthcare subject-matter reviewer',
    reviewer: 'Jane Example',
    reviewedAt: '2026-11-17',
    expiresAt: '2027-11-17',
    reviewedSha256: item.sha256,
    jurisdiction: 'AU-VIC',
    sourceReferences: [{ title: 'National infection control guideline', url: 'https://example.org/guideline' }],
    requiredWarnings: ['Do not work on contaminated surfaces without training.'],
    ...overrides,
  };
}

function withEntry(root, itemPath, entry) {
  const file = path.join(root, 'curriculum/regulated/review-register.json');
  const register = JSON.parse(fs.readFileSync(file, 'utf8'));
  register.entries[itemPath] = entry;
  fs.writeFileSync(file, JSON.stringify(register, null, 2) + '\n');
}

function run(script, extra) {
  return spawnSync(process.execPath, [script, ...extra], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

try {
  // 1. Scope: classification by folder, layer, hazard terms, assessment inheritance, and media.
  const root = fixture('scope');
  const inv = buildInventory(root);
  const paths = inv.items.map(i => i.path);
  check(paths.includes('curriculum/shared/healthcare/H1.json'), 'Regulated folder lesson is in scope');
  check(paths.includes('curriculum/shared/cleaning/C2.json'), 'Hazard-term lesson is in scope');
  check(paths.includes('curriculum/courses/high-risk/HR1.json'), 'High-risk layer lesson is in scope');
  check(!paths.includes('curriculum/shared/cleaning/C1.json'), 'Plain lesson stays out of scope');
  check(paths.includes('curriculum/assessments/H1.assessment.json'), 'Assessment of a regulated lesson is in scope');
  check(!paths.includes('curriculum/assessments/C1.assessment.json'), 'Assessment of a plain lesson stays out of scope');
  check(paths.includes('curriculum/assessments/ORPHAN.assessment.json'), 'Assessment with no lesson is kept in scope until mapped');
  check(paths.includes('curriculum/healthcare/poster.png'), 'Media in a regulated folder is in scope');
  check(!paths.includes('curriculum/icons/plain.png'), 'Media outside regulated folders stays out of scope');

  // 2. Determinism: identical input gives identical inventory.
  check(JSON.stringify(buildInventory(root)) === JSON.stringify(inv), 'Inventory is deterministic');

  // 3. Fail closed: with no approvals, nothing is publishable.
  seed(root);
  const register0 = readRegister(root);
  const base = summarise(inv, register0, NOW);
  check(base.publishable === 0 && base.blocked === inv.items.length, 'Pending content is blocked by default');
  check(base.reasonCounts.decision_pending === inv.items.length, 'Pending reason recorded for every item');
  check(evaluateItem(inv.items[0], undefined, NOW).reasons.includes('missing_register_entry'), 'Missing entry blocks');

  // 4. Valid, current approval is publishable and not flagged.
  const h1 = inv.items.find(i => i.path === 'curriculum/shared/healthcare/H1.json');
  const good = evaluateItem(h1, approved(h1), NOW);
  check(good.publishable && good.reasons.length === 0 && good.flags.length === 0, 'Complete current approval is publishable');
  check(evaluateItem(h1, approved(h1, { sourceReferences: [{ title: 'Board circular', citation: 'Circular 4/2026, s.3' }] }), NOW).publishable, 'Citation without URL is accepted');
  check(evaluateItem(h1, approved(h1, { expiresAt: '2026-12-10' }), NOW).flags.includes('expiring_soon'), 'Approval expiring within 30 days is flagged');

  // 5. Negative cases: each defect blocks with its reason.
  const cases = [
    [{ reviewer: 'TBD' }, 'missing_named_reviewer', 'placeholder reviewer'],
    [{ reviewer: 'Jane' }, 'missing_named_reviewer', 'single-word reviewer'],
    [{ reviewer: '' }, 'missing_named_reviewer', 'empty reviewer'],
    [{ reviewerRole: '' }, 'missing_reviewer_role', 'missing reviewer role'],
    [{ reviewerRole: 'TBD' }, 'missing_reviewer_role', 'placeholder reviewer role'],
    [{ reviewedAt: '2026-12-01' }, 'invalid_review_date', 'future review date'],
    [{ reviewedAt: null }, 'invalid_review_date', 'missing review date'],
    [{ jurisdiction: null }, 'missing_jurisdiction', 'missing jurisdiction'],
    [{ jurisdiction: '   ' }, 'missing_jurisdiction', 'blank jurisdiction'],
    [{ sourceReferences: [] }, 'missing_source_references', 'no source references'],
    [{ sourceReferences: [{ title: 'Old', url: 'http://example.org/x' }] }, 'missing_source_references', 'plain http source'],
    [{ sourceReferences: [{ title: 'Bad', url: 'javascript:alert(1)' }] }, 'missing_source_references', 'javascript source URL'],
    [{ sourceReferences: [{ title: '', url: 'https://example.org/x' }] }, 'missing_source_references', 'source without title'],
    [{ requiredWarnings: 'warn' }, 'invalid_warnings', 'warnings not an array'],
    [{ expiresAt: '2026-11-01' }, 'stale_review_expired', 'expired approval'],
    [{ expiresAt: '2026-11-10' }, 'stale_review_expired', 'expired approval (recent)'],
    [{ expiresAt: '2027-12-01' }, 'invalid_expiry', 'review interval over 365 days'],
    [{ expiresAt: '2026-11-01', reviewedAt: '2026-11-17' }, 'stale_review_expired', 'expiry before now'],
    [{ expiresAt: null }, 'invalid_expiry', 'missing expiry'],
    [{ reviewedSha256: 'f'.repeat(64) }, 'content_changed_since_review', 'hash not the reviewed hash'],
    [{ reviewedSha256: null }, 'content_changed_since_review', 'no reviewed hash'],
  ];
  for (const [overrides, reason, label] of cases) {
    const result = evaluateItem(h1, approved(h1, overrides), NOW);
    check(!result.publishable && result.reasons.includes(reason), `Blocks ${label} (${reason})`);
  }
  for (const decision of ['revise', 'retire', 'pending']) {
    const result = evaluateItem(h1, approved(h1, { decision }), NOW);
    check(!result.publishable && result.reasons.includes(`decision_${decision}`), `Decision ${decision} blocks publication`);
  }
  for (const decision of ['APPROVE', '__proto__', 'approve ', undefined]) {
    check(!evaluateItem(h1, approved(h1, { decision }), NOW).publishable, `Malformed decision ${String(decision)} blocks`);
  }

  // 6. Register structure: unknown keys (including traversal-shaped keys) and incomplete approvals are errors.
  const inventory = buildInventory(root);
  const reg = readRegister(root);
  const clean = validateRegister(inventory, reg);
  check(clean.length === 0, 'Freshly seeded register has no structural errors');
  const tampered = JSON.parse(JSON.stringify(reg));
  tampered.entries['../../etc/passwd'] = { decision: 'pending' };
  check(validateRegister(inventory, tampered).some(e => e.startsWith('register_unknown_item')), 'Traversal-shaped register key is rejected');
  const incomplete = JSON.parse(JSON.stringify(reg));
  incomplete.entries[h1.path] = approved(h1, { reviewer: 'TBD' });
  check(validateRegister(inventory, incomplete).some(e => e.startsWith('approval_incomplete:missing_named_reviewer')), 'Approval without a reviewer is a structural error');
  const missingItem = JSON.parse(JSON.stringify(reg));
  delete missingItem.entries[h1.path];
  check(validateRegister(inventory, missingItem).some(e => e.startsWith('register_missing_item')), 'In-scope item without an entry is an error');
  const stale = JSON.parse(JSON.stringify(reg));
  stale.entries[h1.path] = approved(h1, { reviewedAt: '2025-11-01', expiresAt: '2026-11-01' });
  check(validateRegister(inventory, stale).length === 0 && !evaluateItem(h1, stale.entries[h1.path], NOW).publishable, 'Stale approval is blocked, not a structural error');

  // 7. Publication check: approval is bound to content; edits and unknown paths fail closed.
  withEntry(root, h1.path, approved(h1));
  const pass = publishCheck(root, h1.path, NOW);
  check(pass.publishable, 'Publication check passes for a current approval');
  fs.appendFileSync(path.join(root, h1.path), '\n');
  const edited = publishCheck(root, h1.path, NOW);
  check(!edited.publishable && edited.reasons.includes('content_changed_since_review'), 'Editing approved content revokes publication');
  check(!publishCheck(root, 'curriculum/shared/cleaning/C1.json', NOW).publishable, 'Out-of-scope path is blocked');
  check(publishCheck(root, '../../etc/passwd', NOW).reasons.includes('not_in_inventory'), 'Traversal path is blocked as not in inventory');
  check(publishCheck(root, 'curriculum/shared/healthcare/MISSING.json', NOW).reasons.includes('not_in_inventory'), 'Missing path is blocked');
  fs.unlinkSync(path.join(root, 'curriculum/shared/healthcare/H1.json'));
  check(publishCheck(root, h1.path, NOW).reasons.includes('content_missing'), 'Deleted content is blocked');

  // 8. CLI: drift fails until the inventory is regenerated; publish check exit codes.
  const cliRoot = fixture('cli');
  const drift = run(validator, [`--root=${cliRoot}`]);
  check(drift.status === 1 && drift.stdout.includes('inventory_drift'), 'CLI fails on missing inventory');
  seed(cliRoot);
  const ok = run(validator, [`--root=${cliRoot}`]);
  check(ok.status === 0, 'CLI passes on a freshly generated inventory');
  check(run(validator, [`--root=${cliRoot}`, '--publish=curriculum/shared/healthcare/H1.json']).status === 1, 'CLI publish check blocks pending content');
  fs.appendFileSync(path.join(cliRoot, 'curriculum/shared/healthcare/H1.json'), '\n');
  check(run(validator, [`--root=${cliRoot}`]).status === 1, 'CLI fails when inventory no longer matches content');

  // 9. Real repository: inventory is current, register is structurally valid, nothing is published without evidence.
  const repoRun = run(validator, [`--root=${repo}`]);
  check(repoRun.status === 0, `Repository gate passes: ${repoRun.stdout}`);
  const repoReport = JSON.parse(repoRun.stdout);
  check(repoReport.errors.length === 0 && repoReport.publishable === 0, 'Repository has no approvals without evidence');
  check(repoReport.total > 0, 'Repository inventory is non-empty');
  check(sha256(Buffer.from('x')).length === 64, 'Hash helper returns SHA-256');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log(`regulated-content gate: ${assertions} assertions passed`);
