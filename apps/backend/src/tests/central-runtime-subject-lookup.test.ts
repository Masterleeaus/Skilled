import {describe,it,expect} from "vitest";
import {createScopedCentralSubjectLookup} from "../modules/auth/central-subject-lookup";
import {prepare,fakePrisma,binding,issuer,audience,id} from "./support/central-runtime-fixture";
describe("local Central subject lookup by exact user and company",()=>{
 it("returns provisioned subject only from company-scoped registry",async()=>{
  await prepare();expect(await createScopedCentralSubjectLookup(fakePrisma as never,issuer,audience)(binding)).toEqual(id);
 });
 it("does not resolve arbitrary company or user",async()=>{
  await prepare();const find=createScopedCentralSubjectLookup(fakePrisma as never,issuer,audience);
  expect(await find({...binding,companyId:"skilled-company-0002"})).toBeNull();
  expect(await find({...binding,userId:"skilled-user-0002"})).toBeNull();
 });
 it("rejects untrusted issuers",()=>expect(()=>createScopedCentralSubjectLookup(fakePrisma as never,"http://id.example.test",audience)).toThrow());
});