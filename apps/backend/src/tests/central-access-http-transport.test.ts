import {describe,expect,it,vi} from "vitest";
import {createCentralAccessHttpTransport} from "../modules/auth/central-access-http-transport";
import {checkCentralLinkedSession} from "../modules/auth/central-verified-access-bridge";
import type {CentralResolutionStore} from "../modules/auth/central-identity-resolver";
import type {CentralSessionBinding} from "../modules/auth/central-session-revalidation";

const origin="https://access.example.test";
const organisationRef="12345678-1234-4234-8234-123456789abc";
const issuer="https://issuer.example.test";
const session:CentralSessionBinding={
  subject:"subject-1",issuer,audience:"urn:titan-central:product:lms",
  organisationRef,localUserId:"user-1",companyId:"company-1",memberRole:"LEARNER",
  centralMembershipRevision:7,centralLinkRevision:2,
};
const principal={subject:session.subject,issuer:session.issuer,audience:session.audience,organisationRef};
const future={
  allowed:true,...principal,localUserId:session.localUserId,companyId:session.companyId,
  memberRole:session.memberRole,membershipRevision:7,linkRevision:2,
};
const json=(value:unknown,status=200,headers?:Record<string,string>)=>
  new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json",...headers}});
const store:CentralResolutionStore={
  company:{findUnique:async()=>({id:"company-1"})},
  academyExternalIdentity:{findMany:async()=>[{id:"link",companyId:"company-1",userId:"user-1"}]},
  user:{findUnique:async()=>({id:"user-1",role:"STUDENT",isActive:true,isEmailVerified:true,deletedAt:null})},
  companyMember:{findUnique:async()=>({role:"LEARNER"})},
};
function make(fetchImpl:typeof fetch,token=async()=> "long-verified-token-1234") {
  return createCentralAccessHttpTransport({origin,enabled:true,getVerifiedBearer:token,fetchImpl});
}

describe("Central HTTP transport / legacy access endpoint",()=>{
  it("requires operator enablement, HTTPS public hostname and bounded timeout",()=>{
    for(const url of ["http://access.example.test","https://localhost","https://127.0.0.1",
      "https://access.example.test/path","https://access.example.test?x=1",
      "https://user:pass@access.example.test","https://access.example.test:4443",
      "https://access.internal","https://access.local"]) {
      expect(()=>createCentralAccessHttpTransport({origin:url,enabled:true,getVerifiedBearer:async()=> "token"})).toThrow();
    }
    expect(()=>createCentralAccessHttpTransport({origin,enabled:false as true,getVerifiedBearer:async()=> "token"})).toThrow();
    expect(()=>createCentralAccessHttpTransport({origin,enabled:true,getVerifiedBearer:async()=> "token",timeoutMs:6000})).toThrow();
  });

  it("issues only a pinned GET with fixed legacy product and no redirect",async()=>{
    const fetcher=vi.fn(async (url:string|URL|Request,init?:RequestInit)=>{
      const u=new URL(String(url));
      expect(u.origin).toBe(origin);
      expect(u.pathname).toBe("/v1/access/check");
      expect(Object.fromEntries(u.searchParams)).toEqual({
        organisation_id:organisationRef,application:"academy",action:"session:open",
      });
      expect(init?.method).toBe("GET");
      expect(init?.redirect).toBe("error");
      expect(init?.cache).toBe("no-store");
      expect((init?.headers as Record<string,string>).authorization).toBe("Bearer long-verified-token-1234");
      return json({allowed:true,role:"learner",reason:"allowed"});
    });
    const output=await make(fetcher as typeof fetch)(principal);
    expect(output).toEqual({allowed:true,role:"learner",reason:"allowed"});
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects unverified scope and missing bearer without making a network request",async()=>{
    const fetcher=vi.fn(async()=>json(future));
    for(const request of [
      {...principal,audience:"urn:titan-central:product:sorted"},
      {...principal,organisationRef:"not-a-uuid"},
      {...principal,subject:"../../escape"},
      {...principal,issuer:"http://insecure.test"},
    ]) await expect(make(fetcher as typeof fetch)(request as typeof principal)).rejects.toThrow();
    await expect(make(fetcher as typeof fetch,async()=>"short")(principal)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refuses HTTP 401, 403, 429, 5xx even with an optimistic body",async()=>{
    for(const status of [401,403,429,500,503]) {
      await expect(make((async()=>json({allowed:true},status)) as typeof fetch)(principal)).rejects.toThrow();
    }
  });

  it("refuses redirects, non-JSON, oversized, malformed and missing bodies",async()=>{
    for(const response of [
      new Response("hi",{headers:{"content-type":"text/plain"}}),
      json({allowed:true},200,{"content-length":"9000"}),
      new Response("x".repeat(8193),{headers:{"content-type":"application/json"}}),
      new Response("{broken",{headers:{"content-type":"application/json"}}),
      new Response(null,{headers:{"content-type":"application/json"}}),
    ]) await expect(make((async()=>response) as typeof fetch)(principal)).rejects.toThrow();
  });

  it("still denies Central's current minimal successful body when connected to the session bridge",async()=>{
    const http=make((async()=>json({allowed:true,role:"learner",reason:"allowed"})) as typeof fetch);
    expect(await checkCentralLinkedSession(session,http,store,{issuer,audience:session.audience}))
      .toEqual({allowed:false,reason:"contract_rejected"});
  });

  it("accepts only a complete future revisioned decision and denies changed link revision",async()=>{
    const get=(body:unknown)=>make((async()=>json(body)) as typeof fetch);
    expect(await checkCentralLinkedSession(session,get(future),store,{issuer,audience:session.audience}))
      .toEqual({allowed:true});
    expect(await checkCentralLinkedSession(session,get({...future,linkRevision:3}),store,{issuer,audience:session.audience}))
      .toEqual({allowed:false,reason:"contract_rejected"});
  });
});
