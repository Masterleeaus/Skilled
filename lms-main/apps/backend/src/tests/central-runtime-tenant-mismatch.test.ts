import {describe,it,expect} from "vitest";
import {createFreshCentralVerifier} from "../modules/auth/central-fresh-access";
import {createScopedCentralSubjectLookup} from "../modules/auth/central-subject-lookup";
import {prepare,fakePrisma,binding,decision,makeDecide,issuer,audience} from "./support/central-runtime-fixture";
describe("Central session revalidation refuses cross-tenant claims",()=>{
 it.each([
  ["organisationId","central-org-0002"],["localUserId","skilled-user-0002"],
  ["localAccountId","skilled-acct-0002"],
 ] as const)("rejects changed %s",async(field,value)=>{
  await prepare();const f=createFreshCentralVerifier({decide:makeDecide({[field]:value}),issuer,audience,
  subjectForBinding:createScopedCentralSubjectLookup(fakePrisma as never,issuer,audience)});
  expect(await f.verifySession(binding)).toBe(false);
 });
});