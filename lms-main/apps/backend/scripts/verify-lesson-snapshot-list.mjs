import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/modules/curriculum/curriculum.routes.ts', import.meta.url), 'utf8');
const start = source.indexOf('const snapshotListQuery =');
const end = source.indexOf('// Historical snapshot reads', start);
assert.ok(start > 0 && end > start);
const list = source.slice(start, end);
for (const token of [
  'z.coerce.number().int().min(1).max(100).default(25)',
  'await requireOrgMember(companyId, learnerId)',
  'id: query.cursor, companyId, learnerId',
  'learnerId, ...(query.revisionId',
  'orderBy: [{ createdAt: "desc" }, { id: "desc" }]',
  'take: query.limit + 1',
  'skip: 1',
  'select: { id: true, lessonRevisionId: true, createdAt: true, contentHash: true }',
  'nextCursor: hasMore',
]) assert.ok(list.includes(token), `Missing contract: ${token}`);
assert.ok(!list.includes('resolvedFields:'), 'List must not expose raw resolved fields');
console.log('Snapshot-list source contracts: 10 passed');
