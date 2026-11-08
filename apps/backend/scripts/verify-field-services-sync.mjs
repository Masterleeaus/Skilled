// Static, unverified source-contract check. Not a database-backed test.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const modulesDir = fileURLToPath(new URL('../src/modules/', import.meta.url));
const routeFile = new URL('../src/modules/curriculum/integration.routes.ts', import.meta.url);

// Walk src/modules and collect every .ts source file.
function listTsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listTsFiles(full) : full.endsWith('.ts') ? [full] : [];
  });
}

// The sync endpoint is documented in docs/FIELD_SERVICES_CONTEXT_SYNC.md but must be mounted as a route under src/modules.
const syncRoutePattern = /business-fields\/sync/;
const syncRouteFiles = listTsFiles(modulesDir).filter((file) => syncRoutePattern.test(readFileSync(file, 'utf8')));

if (syncRouteFiles.length === 0) {
  console.error('FAIL field-services business-fields sync route: not found under apps/backend/src/modules.');
  console.error('Reason: no route matching "business-fields/sync" is mounted. The integration router');
  console.error('(apps/backend/src/modules/curriculum/integration.routes.ts) only exposes the skills read route.');
  console.error('The sync contract in docs/FIELD_SERVICES_CONTEXT_SYNC.md is therefore not implemented.');
  console.error('This script was not run against the sync checks. Nothing was invented or stubbed.');
  process.exit(1);
}

const source = readFileSync(routeFile, 'utf8');
const checks = [
  ['authenticated service route', /integrationRoutes\.use\(serviceAuthenticate\)/],
  ['service-only sync', /service\?\.caller !== "field-services"/],
  ['credential external company scope', /!service\?\.companyRefs\.includes\(externalOrganisationRef\)/],
  ['field registry allowlist', /isBusinessLessonFieldKey\(key\)/],
  ['restricted field groups', /FIELD_SERVICES_SYNC_KEYS/],
  ['duplicate rejection', /new Set\(keys\)\.size !== keys\.length/],
  ['batch size limit', /max\(56\)/],
  ['transactional writes', /prisma\.\$transaction\(async tx/],
  ['no overwrite existing', /SKIPPED_EXISTING/],
  ['only draft created', /status: "DRAFT"/],
  ['manual approval required', /approvalRequired: true/],
  ['source provenance', /sourceSystem: "field-services"/],
];
for (const [label, re] of checks) { assert.match(source, re, label); console.log(`PASS ${label}`); }
console.log(`${checks.length} source-contract checks passed`);
