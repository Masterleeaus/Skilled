import {describe,it,expect} from "vitest";
import {createCentralRuntimeDependencies} from "../modules/auth/central-runtime-dependencies";
import {prepare,fakePrisma,decision,issuer,audience,makeDecide} from "./support/central-runtime-fixture";
describe("end-to-end trusted decision to local session",()=>{
 it("resolves the same user/company from authentic Central revision",async()=>{
  await prepare();const rt=createCentralRuntimeDependencies({db:fakePrisma as never,issuer,audience,decide:makeDecide()});
  const result=await rt.handoff({principal:{issuer,subject:"central-user-0001",audience,applicationId:"academy"},decision});
  expect(result?.cookie).toContain("academy_sid=");expect(result?.identity.userId).toBe(decision.localUserId);
 });
 it("fails closed when authentication transport is absent",async()=>{
  await prepare();const rt=createCentralRuntimeDependencies({db:fakePrisma as never,issuer,audience,decide:async()=>null});
  expect(await rt.handoff({principal:{issuer,subject:"central-user-0001",audience,applicationId:"academy"},decision})).toBeNull();
 });
});