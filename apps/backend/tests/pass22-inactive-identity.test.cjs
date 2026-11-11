const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../src/modules/curriculum/integration.routes.ts'), 'utf8');
const order = [
  'const identity = await prisma.academyExternalIdentity.findUnique',
  'if (!identity || identity.companyId !== company.id)',
  'const learner = await prisma.user.findUnique',
  'if (!learner?.isActive || !learner.isEmailVerified || learner.deletedAt)',
  'await audit("INACTIVE_LEARNER")',
  'const member = await prisma.companyMember.findUnique',
  'const skills = await prisma.academyVerifiedCompetency.findMany',
  'await audit("SUCCESS")',
  'res.json({ companyRef:'
];
let previous = -1;
for (const fragment of order) {
  const at = src.indexOf(fragment);
  assert.ok(at > previous, `Missing or incorrectly ordered security step: ${fragment}`);
  previous = at;
}
assert.match(src, /select: \{ isActive: true, isEmailVerified: true, deletedAt: true \}/);
assert.match(src, /res\.status\(404\)\.json\(\{ message: "Learner not found" \}\); return;/);
console.log(`PASS: ${order.length + 2} integration security source checks`);
