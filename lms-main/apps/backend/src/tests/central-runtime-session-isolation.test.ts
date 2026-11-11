import {describe,it,expect} from "vitest";
import {createCentralRuntimeDependencies} from "../modules/auth/central-runtime-dependencies";
import {prepare,fakePrisma,binding,issuer,audience,makeDecide} from "./support/central-runtime-fixture";
describe("sessions cannot be transplanted between Skilled companies",()=>{
 it("denies modified company binding",async()=>{
  await prepare();const rt=createCentralRuntimeDependencies({db:fakePrisma as never,issuer,audience,decide:makeDecide()});
  await expect(rt.sessions.create({...binding,companyId:"skilled-company-0002"})).rejects.toThrow();
 });
 it("keeps invalid opaque token unauthenticated",async()=>{
  await prepare();const rt=createCentralRuntimeDependencies({db:fakePrisma as never,issuer,audience,decide:makeDecide()});
  expect(await rt.sessions.authenticate("a".repeat(64))).toBeNull();
 });
});