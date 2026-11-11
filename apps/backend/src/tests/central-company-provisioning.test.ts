import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { applyCentralLinkCommand } from "../modules/auth/central-company-link-provisioning";
import { createPrismaCentralAccountReaders, createPrismaSkilledLinkAuthority } from "../modules/auth/central-prisma-readers";
import { resolveSkilledCentralAccount, type CentralDecision } from "../modules/auth/central-account-resolution";

type Fixture = {
  name:string;
  initial: Array<Record<string, unknown>>;
  commands: unknown[];
  expected: string[];
  state: string|null;
  audits: number;
};
const fixtureDir=path.join(path.dirname(fileURLToPath(import.meta.url)),"fixtures/central-company-provisioning");
const fixtures=readdirSync(fixtureDir).filter(f=>/^CP-\d{2}-.*\.json$/.test(f)).sort();
if(fixtures.length!==22)throw Error("Missing Central provisioning scenarios");
const db=fakePrisma as unknown as PrismaClient;
const baseCompany="skilled-company-0001";
const baseUser="skilled-user-0001";
const decision:CentralDecision={
  allowed:true,applicationId:"academy",organisationId:"central-org-0001",
  localUserId:baseUser,localAccountId:"skilled-acct-0001",
  membershipRevision:1,entitlementRevision:1,linkRevision:1,
};
async function setup(){
  resetFakeDb();
  await seed("company",[{id:baseCompany,name:"Tenant 1",externalRef:"external-org-1"},
    {id:"skilled-company-other",name:"Tenant 2",externalRef:"external-org-2"}]);
  await seed("user",[{id:baseUser,email:"learner1@example.test",fullName:"Learner 1",
    role:"STUDENT",isActive:true,isEmailVerified:true,deletedAt:null}]);
  await seed("companyMember",[{companyId:baseCompany,userId:baseUser,role:"LEARNER"}]);
}
describe("Central company mapping operator commands: atomic, audited and exact",()=>{
  for(const name of fixtures){
    const fixture:Fixture=JSON.parse(readFileSync(path.join(fixtureDir,name),"utf8"));
    it(fixture.name,async()=>{
      await setup();
      if(fixture.initial.length)await seed("centralCompanyLink",fixture.initial);
      for(let i=0;i<fixture.commands.length;i++){
        const command=fixture.commands[i], expected=fixture.expected[i];
        if(expected.startsWith("LINK_")){
          expect(await applyCentralLinkCommand(command,db)).toBe(expected);
        }else{
          await expect(applyCentralLinkCommand(command,db))
            .rejects.toMatchObject({name:"CentralLinkConflict",code:expected});
        }
      }
      const links=rows("centralCompanyLink");
      if(fixture.state===null)expect(links).toHaveLength(0);
      else {
        expect(links).toHaveLength(1);
        expect(links[0].state).toBe(fixture.state);
      }
      const audits=rows("centralCompanyLinkAudit");
      expect(audits).toHaveLength(fixture.audits);
      for(const row of audits){
        expect(row.actorRef).toBe("operator-01");
        expect(row).not.toHaveProperty("logtoSubject");
        expect(row).not.toHaveProperty("password");
      }
    });
  }
  it("the real Prisma read adapters enforce a verified binding and current company membership",async()=>{
    await setup();
    await applyCentralLinkCommand({action:"link",centralOrganisationId:"central-org-0001",
      localAccountId:"skilled-acct-0001",companyId:baseCompany,actorRef:"operator-01"},db);
    const readers=createPrismaCentralAccountReaders(db,async()=>true);
    expect(await resolveSkilledCentralAccount(decision,readers))
      .toEqual({userId:baseUser,companyId:baseCompany,role:"STUDENT"});
    const authority=createPrismaSkilledLinkAuthority(db);
    expect(await authority.centralOrganisationMapsToCompany("central-org-0001",baseCompany)).toBe(true);
    expect(await authority.localAccountBelongsToUser("skilled-acct-0001",baseUser,baseCompany)).toBe(true);
    expect(await authority.activeVerifiedMember(baseUser,baseCompany)).toBe(true);
    await fakePrisma.companyMember.deleteMany({where:{companyId:baseCompany,userId:baseUser}});
    expect(await resolveSkilledCentralAccount(decision,readers)).toBeNull();
    expect(await authority.activeVerifiedMember(baseUser,baseCompany)).toBe(false);
  });
  it("revoking a local mapping denies the next login without touching Central records",async()=>{
    await setup();
    const command={action:"link",centralOrganisationId:"central-org-0001",
      localAccountId:"skilled-acct-0001",companyId:baseCompany,actorRef:"operator-01"} as const;
    await applyCentralLinkCommand(command,db);
    const readers=createPrismaCentralAccountReaders(db,async()=>true);
    expect(await resolveSkilledCentralAccount(decision,readers)).not.toBeNull();
    await applyCentralLinkCommand({...command,action:"revoke"},db);
    expect(await resolveSkilledCentralAccount(decision,readers)).toBeNull();
  });
  it("a Central service outage never grants access",async()=>{
    await setup();
    const readers=createPrismaCentralAccountReaders(db,async()=>{throw new Error("Central unavailable")});
    await expect(resolveSkilledCentralAccount(decision,readers)).rejects.toThrow("Central unavailable");
  });
  it("rejects a missing Central verifier instead of silently approving",()=>{
    expect(()=>createPrismaCentralAccountReaders(db,null as never)).toThrow();
  });
});
