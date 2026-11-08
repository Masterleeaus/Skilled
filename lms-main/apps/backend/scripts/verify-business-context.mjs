import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const route=readFileSync(new URL('../src/modules/curriculum/curriculum.routes.ts',import.meta.url),'utf8');
const fields=readFileSync(new URL('../src/modules/curriculum/business-lesson-fields.ts',import.meta.url),'utf8');
for(const routeName of ['/business-fields/registry','/business-fields/:fieldKey','/business-fields/:fieldKey/approve','/business-fields/:fieldKey/retire','/lessons/:revisionId/context']) assert.ok(route.includes(routeName),routeName);
for(const guard of ['requireOrgMember(companyId, learnerId)','managerMembership(param(req, "companyId"), userId)','status: "APPROVED"','publicLessonBody(revision.body)','academyLessonContextSnapshot.create','Active course enrolment required']) assert.ok(route.includes(guard),guard);
assert.ok(fields.includes('Array.isArray(value)'));
console.log('Business context source-contract checks: 12 passed');
