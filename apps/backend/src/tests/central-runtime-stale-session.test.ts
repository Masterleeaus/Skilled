import {describe,it,expect} from "vitest";
import {createCentralRuntimeDependencies} from "../modules/auth/central-runtime-dependencies";
import {prepare,fakePrisma,binding,decision,issuer,audience} from "./support/central-runtime-fixture";
describe("Central-live revocation after local session issued",()=>{
 it("revoked Central entitlement immediately invalidates existing Skilled cookie",async()=>{
  await prepare();let permitted=true;
  const runtime=createCentralRuntimeDependencies({
   db:fakePrisma as never,issuer,audience,
   decide:async()=>permitted?{issuer,subject:"central-user-0001",decision}:null
  });
  const session=await runtime.sessions.create(binding);
  expect(await runtime.sessions.authenticate(session.token)).toMatchObject({userId:binding.userId});
  permitted=false;
  expect(await runtime.sessions.authenticate(session.token)).toBeNull();
 });
});