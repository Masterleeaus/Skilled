import { readdirSync,readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient } from "@prisma/client";
import { describe,it,expect } from "vitest";
import { fakePrisma,resetFakeDb,seed,rows } from "./support/fake-prisma";
import { createSkilledCentralSessionStore, centralSessionDigest } from "../modules/auth/central-session-store";

type Scenario={name:string;changes:Record<string,boolean|string|number>;expectedAuthenticated:boolean};
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),"fixtures/central-sessions");
const fixtureNames=readdirSync(dir).filter(n=>/^CS-\d{2}-.*\.json$/.test(n)).sort();
if(fixtureNames.length!==22)throw Error("Missing 22 Central session fixtures");
const db=fakePrisma as unknown as PrismaClient;
const base={userId:"skilled-user-0001",companyId:"skilled-company-0001",
  centralOrganisationId:"central-org-0001",localAccountId:"skilled-acct-0001"};
const initial=new Date("2026-11-09T02:00:00Z");
const token="a".repeat(64);
async function setup(changes:Scenario["changes"]){
  resetFakeDb();
  await seed("company",[{id:base.companyId,name:"A"},{id:"skilled-company-0002",name:"B"}]);
  await seed("user",[{id:base.userId,email:"test@example.test",fullName:"Test",
    role:changes.role??"STUDENT",isActive:changes.inactive!==true,
    isEmailVerified:changes.unverified!==true,
    deletedAt:changes.deleted?new Date("2026-01-01T00:00:00Z"):null}]);
  if(!changes.noMembership)await seed("companyMember",[{companyId:base.companyId,userId:base.userId,role:"LEARNER"}]);
  if(!changes.noLink)await seed("centralCompanyLink",[{
    centralOrganisationId:changes.wrongCentralOrg?"central-org-0002":base.centralOrganisationId,
    localAccountId:changes.wrongAccount?"skilled-acct-0002":base.localAccountId,
    companyId:changes.wrongTenant?"skilled-company-0002":base.companyId,
    state:changes.linkRevoked?"revoked":"verified",
  }]);
}
describe("Central company-scoped opaque sessions: credential lifecycle",()=>{
  for(const file of fixtureNames){
    const scenario:Scenario=JSON.parse(readFileSync(path.join(dir,file),"utf8"));
    it(scenario.name,async()=>{
      const f=scenario.changes;
      await setup(f);
      let seconds=0, centralAllowed=!f.centralRevoked;
      const now=()=>new Date(initial.getTime()+seconds*1000);
      const store=createSkilledCentralSessionStore(db,async()=>centralAllowed,
        {clock:now,randomToken:()=>token,ttlSeconds:3600});
      const invalidAtIssue=Boolean(f.wrongTenant||f.linkRevoked||f.noLink||f.inactive||f.unverified||
        f.deleted||f.noMembership||f.centralRevoked||f.wrongCentralOrg||f.wrongAccount);
      if(invalidAtIssue){
        await expect(store.create(base)).rejects.toThrow();
        expect(rows("skilledCentralSession")).toHaveLength(0);
        expect(scenario.expectedAuthenticated).toBe(false);
        return;
      }
      const issued=await store.create(base);
      expect(issued.token).toBe(token);
      expect(rows("skilledCentralSession")).toHaveLength(1);
      expect(rows("skilledCentralSession")[0].tokenHash).toBe(centralSessionDigest(token));
      expect(JSON.stringify(rows("skilledCentralSession"))).not.toContain(token);
      if(f.advanceSeconds)seconds=Number(f.advanceSeconds);
      if(f.revokeToken)expect(await store.revoke(token)).toBe(true);
      if(f.revokeUser)expect(await store.revokeUser(base.userId)).toBe(1);
      if(f.revokeCompany)expect(await store.revokeCompany(base.companyId)).toBe(1);
      if(f.linkRevokeAfterIssue)await fakePrisma.centralCompanyLink.updateMany({
        where:{centralOrganisationId:base.centralOrganisationId},data:{state:"revoked"}});
      if(f.membershipRemoveAfterIssue)await fakePrisma.companyMember.deleteMany({where:{userId:base.userId}});
      if(f.disableAfterIssue)await fakePrisma.user.updateMany({where:{id:base.userId},data:{isActive:false}});
      if(f.centralRevokeAfterIssue)centralAllowed=false;
      const session=await store.authenticate(f.swapToken?"b".repeat(64):token);
      if(scenario.expectedAuthenticated){
        expect(session).toEqual({...base,role:f.role??"STUDENT"});
      }else expect(session).toBeNull();
    });
  }
  it("rotation revokes the old token and makes the new token current",async()=>{
    await setup({});
    let sequence=0;
    const store=createSkilledCentralSessionStore(db,async()=>true,{
      clock:()=>initial,randomToken:()=>String(++sequence).padStart(64,"a")});
    const first=await store.create(base);
    const next=await store.create(base,first.token);
    expect(await store.authenticate(first.token)).toBeNull();
    expect(await store.authenticate(next.token)).toMatchObject({userId:base.userId});
  });
  it("a failed rotation is atomic, preserving the usable original credential",async()=>{
    await setup({});
    let sequence=0;
    const store=createSkilledCentralSessionStore(db,async()=>true,{
      clock:()=>initial,randomToken:()=>String(++sequence).padStart(64,"a")});
    const first=await store.create(base);
    await expect(store.create(base,"z".repeat(64))).rejects.toThrow();
    expect(await store.authenticate(first.token)).not.toBeNull();
    expect(rows("skilledCentralSession")).toHaveLength(1);
  });
  it("does not authenticate malformed tokens, a plaintext hash, or an invalid clock",async()=>{
    await setup({});
    const store=createSkilledCentralSessionStore(db,async()=>true,{clock:()=>initial,randomToken:()=>token});
    await store.create(base);
    for(const input of [null,"","@".repeat(64),centralSessionDigest(token)]) {
      expect(await store.authenticate(input)).toBeNull();
    }
    const bad=createSkilledCentralSessionStore(db,async()=>true,{clock:()=>new Date("invalid")});
    expect(await bad.authenticate(token)).toBeNull();
  });
  it("rejects invalid TTL and absent Central verification dependencies",()=>{
    for(const ttl of [0,59,86401,1.5]){
      expect(()=>createSkilledCentralSessionStore(db,async()=>true,{ttlSeconds:ttl})).toThrow();
    }
    expect(()=>createSkilledCentralSessionStore(db,null as never)).toThrow();
  });
  it("fails closed rather than skipping an unavailable Central access verifier",async()=>{
    await setup({});
    const store=createSkilledCentralSessionStore(db,async()=>true,{clock:()=>initial,randomToken:()=>token});
    await store.create(base);
    const offline=createSkilledCentralSessionStore(db,async()=>{throw Error("Central offline")},{clock:()=>initial});
    await expect(offline.authenticate(token)).rejects.toThrow("Central offline");
  });
});
