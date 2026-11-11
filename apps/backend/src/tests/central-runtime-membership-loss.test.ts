import {describe,it,expect} from "vitest";
import {createCentralRuntimeDependencies} from "../modules/auth/central-runtime-dependencies";
import {prepare,fakePrisma,binding,makeDecide,issuer,audience} from "./support/central-runtime-fixture";
describe("company membership revocation is checked on every request",()=>{
 it("denies previously valid sessions after membership deletion",async()=>{
  await prepare();const rt=createCentralRuntimeDependencies({db:fakePrisma as never,issuer,audience,decide:makeDecide()});
  const issued=await rt.sessions.create(binding);
  await fakePrisma.companyMember.deleteMany({where:{companyId:binding.companyId,userId:binding.userId}});
  expect(await rt.sessions.authenticate(issued.token)).toBeNull();
 });
});