import express from "express";
import request from "supertest";
import {readFileSync,readdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {describe,it,expect,vi} from "vitest";
import {createSkilledCentralSessionHttp} from "../modules/auth/central-session-http";
import {CENTRAL_SESSION_COOKIE,centralSessionSetCookie,centralSessionClearCookie,parseCentralSessionCookie} from "../modules/auth/central-session-cookie";
import {centralSessionGuard} from "../modules/auth/central-session-guard";
import {createCentralVerifiedHandoff} from "../modules/auth/central-verified-handoff";
import type {SkilledCentralReaders,CentralDecision} from "../modules/auth/central-account-resolution";

const fixtureDir=path.join(path.dirname(fileURLToPath(import.meta.url)),"fixtures/central-session-http");
const fixtureFiles=readdirSync(fixtureDir).filter(f=>/^SH-\d{2}-.*\.json$/.test(f)).sort();
if(fixtureFiles.length!==24)throw Error("Expected 24 HTTP boundary fixtures");
const ORIGIN="https://skilled.example.test";
const token="a".repeat(64);
const user={userId:"skilled-user-0001",companyId:"skilled-company-0001",
  role:"STUDENT" as const,centralOrganisationId:"central-org-0001",localAccountId:"skilled-acct-0001"};
type Fixture={id:string;enabled:boolean;method:"GET"|"POST"|"PUT"|"DELETE";path:string;
  cookie:string;origin:string|null;fetchSite:string|null;authenticated:boolean;revoked:boolean;expectedStatus:number};
const cookies:Record<string,string|undefined>={
  good:`${CENTRAL_SESSION_COOKIE}=${token}`,
  unknown:`${CENTRAL_SESSION_COOKIE}=${"b".repeat(64)}`,
  duplicate:`${CENTRAL_SESSION_COOKIE}=${token}; ${CENTRAL_SESSION_COOKIE}=${token}`,
  malformed:`${CENTRAL_SESSION_COOKIE}=abc!`,empty:`${CENTRAL_SESSION_COOKIE}=`,
  absent:undefined,
};
describe("Central session HTTP boundary and CSRF denial",()=>{
  for(const name of fixtureFiles){
    const fixture:Fixture=JSON.parse(readFileSync(path.join(fixtureDir,name),"utf8"));
    it(fixture.id,async()=>{
      const authenticate=vi.fn(async(raw:string)=>fixture.authenticated&&raw===token?user:null);
      const revoke=vi.fn(async()=>fixture.revoked);
      const app=express();
      app.use("/auth/titan/academy",createSkilledCentralSessionHttp({
        enabled:fixture.enabled,origin:ORIGIN,sessions:{authenticate,revoke},
      }));
      const method=fixture.method.toLowerCase() as "get"|"post"|"put"|"delete";
      let req=request(app)[method]("/auth/titan/academy"+fixture.path);
      if(cookies[fixture.cookie]!==undefined)req=req.set("Cookie",cookies[fixture.cookie]!);
      if(fixture.origin!==null)req=req.set("Origin",fixture.origin);
      if(fixture.fetchSite!==null)req=req.set("Sec-Fetch-Site",fixture.fetchSite);
      const res=await req;
      expect(res.status).toBe(fixture.expectedStatus);
      expect(res.headers["cache-control"]).toBe("no-store");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(JSON.stringify(res.body)).not.toContain(token);
      if(fixture.expectedStatus===204){
        expect(revoke).toHaveBeenCalledOnce();
        expect(res.headers["set-cookie"][0]).toContain(`${CENTRAL_SESSION_COOKIE}=;`);
      }else expect(revoke).not.toHaveBeenCalled();
      if(fixture.expectedStatus===200){
        expect(res.body).toEqual({authenticated:true,userId:user.userId,companyId:user.companyId,role:"STUDENT"});
      }
      if(!fixture.enabled)expect(authenticate).not.toHaveBeenCalled();
    });
  }
  it("refuses HTTP origins and unknown cookie values",()=>{
    expect(()=>createSkilledCentralSessionHttp({enabled:true,origin:"http://skilled.example.test",
      sessions:{authenticate:async()=>user,revoke:async()=>true}})).toThrow();
    expect(parseCentralSessionCookie(`${CENTRAL_SESSION_COOKIE}=${token}`)).toBe(token);
    expect(parseCentralSessionCookie(`${CENTRAL_SESSION_COOKIE}=${token}; ${CENTRAL_SESSION_COOKIE}=${token}`)).toBeNull();
    expect(centralSessionSetCookie(token)).toBe(
      `${CENTRAL_SESSION_COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600`);
    expect(centralSessionClearCookie()).toContain("Max-Age=0");
    expect(()=>centralSessionSetCookie("bad")).toThrow();
  });
  it("guard obtains current cookie identity and never converts it to a JWT",async()=>{
    const app=express();
    app.get("/private",centralSessionGuard(async t=>t===token?user:null),(req,res)=>{
      res.json({identity:res.locals.skilledCentralIdentity});
    });
    const ok=await request(app).get("/private").set("Cookie",`${CENTRAL_SESSION_COOKIE}=${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.identity.companyId).toBe(user.companyId);
    expect((await request(app).get("/private").set("Authorization",`Bearer ${token}`)).status).toBe(401);
  });
});
const decision:CentralDecision={
  allowed:true,applicationId:"academy",organisationId:user.centralOrganisationId,
  localUserId:user.userId,localAccountId:user.localAccountId,
  membershipRevision:1,entitlementRevision:1,linkRevision:1,
};
const readers:SkilledCentralReaders={
  isCentralAccessCurrent:async()=>true,
  findMappings:async()=>[{centralOrganisationId:user.centralOrganisationId,companyId:user.companyId,
    localAccountId:user.localAccountId,localUserId:user.userId,status:"verified"}],
  findUser:async()=>({id:user.userId,role:"STUDENT",isActive:true,isEmailVerified:true,deletedAt:null}),
  isMember:async()=>true,
};
describe("unmounted verified Central callback handoff",()=>{
  it("creates an independently authenticated Skilled-local cookie only after account resolution",async()=>{
    const issue=vi.fn(async()=>({token,expiresAt:new Date("2026-11-09T03:00:00Z")}));
    const complete=createCentralVerifiedHandoff({issuer:"https://id.example.test",audience:"academy-client",
      readers,issue});
    const result=await complete({principal:{issuer:"https://id.example.test",
      audience:"academy-client",subject:"central-user-0001",applicationId:"academy"},decision});
    expect(issue).toHaveBeenCalledWith({userId:user.userId,companyId:user.companyId,
      centralOrganisationId:user.centralOrganisationId,localAccountId:user.localAccountId});
    expect(result?.cookie).toContain("academy_sid=");
    expect(result?.identity).toEqual({userId:user.userId,companyId:user.companyId,role:"STUDENT"});
  });
  it.each([
    ["wrong issuer","https://malicious.example.test","academy-client","academy"],
    ["wrong audience","https://id.example.test","wrong-client","academy"],
    ["wrong product","https://id.example.test","academy-client","field"],
  ])("rejects %s before session issuance",async(_,issuer,audience,applicationId)=>{
    const issue=vi.fn(async()=>({token,expiresAt:new Date()}));
    const complete=createCentralVerifiedHandoff({issuer:"https://id.example.test",audience:"academy-client",
      readers,issue});
    const result=await complete({principal:{issuer,audience,applicationId,subject:"central-user-0001"} as never,decision});
    expect(result).toBeNull();
    expect(issue).not.toHaveBeenCalled();
  });
  it("rejects revoked Central authorization and missing link without issuing a cookie",async()=>{
    const issue=vi.fn(async()=>({token,expiresAt:new Date()}));
    const complete=createCentralVerifiedHandoff({issuer:"https://id.example.test",audience:"academy-client",
      readers:{...readers,isCentralAccessCurrent:async()=>false},issue});
    expect(await complete({principal:{issuer:"https://id.example.test",audience:"academy-client",
      subject:"central-user-0001",applicationId:"academy"},decision})).toBeNull();
    expect(issue).not.toHaveBeenCalled();
  });
});
