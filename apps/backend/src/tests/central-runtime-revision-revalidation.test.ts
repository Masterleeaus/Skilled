import {describe,it,expect} from "vitest";
import {createFreshCentralVerifier} from "../modules/auth/central-fresh-access";
import {createScopedCentralSubjectLookup} from "../modules/auth/central-subject-lookup";
import {prepare,fakePrisma,binding,decision,makeDecide,issuer,audience} from "./support/central-runtime-fixture";
describe("fresh Central membership/link/entitlement revisions",()=>{
 it("approves only matching current revisions",async()=>{
  await prepare();const f=createFreshCentralVerifier({decide:makeDecide(),issuer,audience,
   subjectForBinding:createScopedCentralSubjectLookup(fakePrisma as never,issuer,audience)});
  expect(await f.verifyDecision(decision,binding.companyId)).toBe(true);
 });
 it.each(["membershipRevision","entitlementRevision","linkRevision"] as const)("rejects stale %s",async field=>{
  await prepare();const f=createFreshCentralVerifier({decide:makeDecide({[field]:2}),issuer,audience,
  subjectForBinding:createScopedCentralSubjectLookup(fakePrisma as never,issuer,audience)});
  expect(await f.verifyDecision(decision,binding.companyId)).toBe(false);
 });
});