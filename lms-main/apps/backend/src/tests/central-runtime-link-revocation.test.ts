import {describe,it,expect} from "vitest";
import {createCentralRuntimeDependencies} from "../modules/auth/central-runtime-dependencies";
import {prepare,fakePrisma,binding,makeDecide,issuer,audience} from "./support/central-runtime-fixture";
describe("Central runtime fails after local company mapping revocation",()=>{
 it("new and existing sessions stop when local mapping is revoked",async()=>{
  await prepare();const runtime=createCentralRuntimeDependencies({db:fakePrisma as never,issuer,audience,decide:makeDecide()});
  const issued=await runtime.sessions.create(binding);
  await fakePrisma.centralCompanyLink.updateMany({where:{companyId:binding.companyId},data:{state:"revoked"}});
  expect(await runtime.sessions.authenticate(issued.token)).toBeNull();
  await expect(runtime.sessions.create(binding)).rejects.toThrow();
 });
});