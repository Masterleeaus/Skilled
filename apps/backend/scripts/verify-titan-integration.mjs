#!/usr/bin/env node
/** Dependency-free regression checks for Skilled's integration contracts. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const source = readFileSync(join(root, 'src/modules/curriculum/integration.routes.ts'), 'utf8');
const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');
const migrations = join(root, 'prisma/migrations');
const migrationNames = readdirSync(migrations).filter(n => /^\d{14}_/.test(n)).sort();
const checks = [
 ['service credentials database backed', () => assert.match(source, /prisma\.academyServiceCredential\.findUnique/)],
 ['credentials checked for revocation and expiration', () => { assert.match(source, /credential\.revokedAt/); assert.match(source, /credential\.expiresAt/); }],
 ['tenant scope checked before organisation lookup', () => assert.ok(source.indexOf('service?.companyRefs.includes(externalOrganisationRef)') < source.indexOf('prisma.company.findUnique'))],
 ['external identity organisation verified', () => assert.match(source, /identity\.companyId !== company\.id/)],
 ['organisation membership verified', () => assert.match(source, /prisma\.companyMember\.findUnique/)],
 ['expired skills excluded', () => assert.match(source, /expiresAt: \{ gt: now \}/)],
 ['audit success recorded before response', () => assert.ok(source.indexOf('await audit("SUCCESS")') < source.indexOf('res.json({ companyRef'))],
 ['response uses external rather than internal learner identity', () => { assert.match(source, /res\.json\(\{ companyRef: externalOrganisationRef, externalUserRef, verifiedSkills/); assert.doesNotMatch(source, /res\.json\(\{ companyRef: externalOrganisationRef, learnerId/); }],
 ['service scope allowlist enforced from env', () => { assert.match(source, /INTEGRATION_SERVICE_SCOPES/); assert.match(source, /allowedRefs\?\.includes\(credential\.companyRef\)/); }],
 ['external route param is externalOrganisationRef', () => assert.match(source, /\/organisations\/:externalOrganisationRef\/learners\/:externalUserRef\/skills/)],
 ['schema includes service credentials', () => assert.match(schema, /model AcademyServiceCredential\s*\{/)],
 ['schema includes external identity', () => assert.match(schema, /model AcademyExternalIdentity\s*\{/)],
 ['migration SQL present', () => { for(const name of migrationNames) assert.ok(readFileSync(join(migrations,name,'migration.sql'),'utf8').trim().length); }],
];
let failed = 0;
for (const [name, fn] of checks) { try { fn(); console.log('PASS',name); } catch(e) { failed++; console.error('FAIL',name,e.message); } }
console.log(JSON.stringify({checks:checks.length,passed:checks.length-failed,failed,migrations:migrationNames.length}));
process.exitCode = failed ? 1 : 0;
