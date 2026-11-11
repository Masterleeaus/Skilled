import {it,expect} from "vitest";
import {harness,principal,envelope,json,decision} from "./central-decision-transport.fixture";

it("accepts Central's short-lived decision and strips transport expiry from trusted grant",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,expiresAt:new Date(Date.now()+240_000).toISOString()}}));
 expect(await h.make()(principal)).toEqual({issuer:principal.issuer,subject:principal.subject,decision});
});
it("rejects expired, overlong, and malformed Central decision expiry",async()=>{
 for(const expiresAt of [new Date(Date.now()-60_000).toISOString(),new Date(Date.now()+600_000).toISOString(),"tomorrow",null]){
  const h=harness();
  h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,expiresAt}}));
  expect(await h.make()(principal)).toBeNull();
 }
});
it("still rejects arbitrary unexpected decision claims",async()=>{
 const h=harness();
 h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,expiresAt:new Date(Date.now()+240_000).toISOString(),admin:true}}));
 expect(await h.make()(principal)).toBeNull();
});
