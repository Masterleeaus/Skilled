import {it,expect,describe,beforeEach,afterEach,vi} from "vitest";
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

// Boundary cases, pinned to a fixed clock so the 300 second limit is tested exactly (issue #206).
describe("decision expiry boundaries at the 300 second limit",()=>{
 const fixedNow=Date.parse("2026-11-15T10:00:00.000Z");
 beforeEach(()=>{vi.useFakeTimers({toFake:["Date"]});vi.setSystemTime(fixedNow);});
 afterEach(()=>{vi.useRealTimers();});
 const withExpiry=(expiresAt:unknown)=>{
  const h=harness();
  h.fetcher.mockImplementation(async()=>json({...envelope(),decision:{...decision,expiresAt}}));
  return h.make()(principal);
 };
 it("refuses a decision whose expiry equals the current time",async()=>{
  expect(await withExpiry(new Date(fixedNow).toISOString())).toBeNull();
 });
 it("refuses a decision that expired one millisecond ago",async()=>{
  expect(await withExpiry(new Date(fixedNow-1).toISOString())).toBeNull();
 });
 it("accepts a decision that expires one millisecond from now",async()=>{
  expect(await withExpiry(new Date(fixedNow+1).toISOString())).toEqual({issuer:principal.issuer,subject:principal.subject,decision});
 });
 it("accepts a decision that expires exactly 300 seconds from now",async()=>{
  expect(await withExpiry(new Date(fixedNow+300_000).toISOString())).toEqual({issuer:principal.issuer,subject:principal.subject,decision});
 });
 it("refuses a decision that expires one millisecond beyond 300 seconds",async()=>{
  expect(await withExpiry(new Date(fixedNow+300_001).toISOString())).toBeNull();
 });
 it("refuses an expiry without millisecond precision",async()=>{
  expect(await withExpiry("2026-11-15T10:04:00Z")).toBeNull();
 });
});
