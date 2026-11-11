import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { fakePrisma, resetFakeDb, seed, rows } from "./support/fake-prisma";
import { provision } from "../../prisma/provision-titan-integration";

type Scenario = {
  name:string; action:"link-identity"|"unlink-identity";
  service?:string; externalUserRef?:string; extra?:Record<string,unknown>;
  existing?:"same"|"other-user"|"other-company"|"unscoped";
  member?:boolean; company?:boolean;
  error?:string; expected?:string; audit?:string; count:number; checkSessions?:boolean
};
const dir=resolve(process.cwd(),"src/tests/fixtures/central-offline-provisioning");
const files=readdirSync(dir).filter(x=>/^OP-\d{2}-[\w-]+\.json$/.test(x)).sort();
if(files.length!==20)throw Error("Expected 20 distinct offline provisioning scenarios");
const db=fakePrisma as unknown as PrismaClient;
const originalRef="https://identity.example|user-a";
async function prepare(x:Scenario){
 resetFakeDb();
 await seed("user",[
  {id:"user-a",email:"user-a@example.test",fullName:"User A",role:"STUDENT",isActive:true,isEmailVerified:true,deletedAt:null},
  {id:"user-b",email:"user-b@example.test",fullName:"User B",role:"STUDENT",isActive:true,isEmailVerified:true,deletedAt:null}
 ]);
 await seed("company",[
  {id:"company-b",name:"Other Company",externalRef:"external-company-b"},
  ...(x.company===false?[]:[{id:"company-a",name:"Company A",externalRef:"external-company-a"}])
 ]);
 if(x.company!==false && x.member!==false){
  await seed("companyMember",[{companyId:"company-a",userId:"user-a",role:"LEARNER"}]);
 }
 if(x.existing){
  const companyId=x.existing==="unscoped"?null:x.existing==="other-company"?"company-b":"company-a";
  await seed("academyExternalIdentity",[{
   id:"link-1",service:x.service??"titan-central",
   externalUserRef:x.service==="field-services"?"worker-1":originalRef,
   userId:x.existing==="other-user"?"user-b":"user-a", companyId
  }]);
 }
 if(x.checkSessions){
  const expiry=new Date("2027-01-01T00:00:00Z");
  await seed("refreshToken",[
   {id:"central-refresh",userId:"user-a",tokenHash:"hash-central",deviceInfo:"titan-central-sso:company-a",isRevoked:false,expiresAt:expiry},
   {id:"password-refresh",userId:"user-a",tokenHash:"hash-password",deviceInfo:"browser-session",isRevoked:false,expiresAt:expiry},
   {id:"foreign-refresh",userId:"user-b",tokenHash:"hash-foreign",deviceInfo:"titan-central-sso:company-b",isRevoked:false,expiresAt:expiry}
  ]);
  await seed("skilledCentralSession",[
   {id:"central-session",userId:"user-a",companyId:"company-a",centralOrganisationId:"org-a",localAccountId:"account-a",tokenHash:"hash-opaque",expiresAt:expiry,revokedAt:null}
  ]);
 }
}
describe("Trusted offline Central identity provisioning, tenant scope and audit",()=>{
 for(const file of files){
  const fixture=JSON.parse(readFileSync(resolve(dir,file),"utf8")) as Scenario;
  it(fixture.name,async()=>{
   await prepare(fixture);
   const input={action:fixture.action,service:fixture.service??"titan-central",
    externalUserRef:fixture.externalUserRef??originalRef,userId:"user-a",
    companyRef:"external-company-a",...fixture.extra};
   if(fixture.error){
    await expect(provision(input,db)).rejects.toThrow(fixture.error==="invalid"?undefined:fixture.error);
   }else{
    await expect(provision(input,db)).resolves.toBe(fixture.expected);
   }
   const identities=rows("academyExternalIdentity");
   expect(identities).toHaveLength(fixture.count);
   const audits=rows("academyIntegrationAudit");
   expect(audits).toHaveLength(fixture.audit?1:0);
   if(fixture.audit){
    expect(audits[0]).toMatchObject({service:input.service,companyRef:"external-company-a",outcome:fixture.audit});
   }
   if(fixture.checkSessions){
    const refresh=rows("refreshToken");
    expect(refresh.find(t=>t.id==="central-refresh")?.isRevoked).toBe(true);
    expect(refresh.find(t=>t.id==="password-refresh")?.isRevoked).toBe(false);
    expect(refresh.find(t=>t.id==="foreign-refresh")?.isRevoked).toBe(false);
    expect(rows("skilledCentralSession").find(t=>t.id==="central-session")?.revokedAt).toBeTruthy();
   }
  });
 }
});
