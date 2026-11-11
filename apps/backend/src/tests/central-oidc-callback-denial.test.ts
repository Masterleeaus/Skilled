import {describe,it,expect} from "vitest";
import {makeApp,CALLBACK,GOOD_QUERY,COOKIE} from "./support/central-oidc-http-harness";
describe("OIDC and Central authorization failures are fail closed",()=>{
 it("does not authorize a failed ID-token/state verification",async()=>{
  const h=makeApp({completionError:true});const r=await h.request().get(CALLBACK+GOOD_QUERY).set("Cookie",COOKIE);
  expect(r.status).toBe(401);expect(h.authorize).not.toHaveBeenCalled();expect(h.handoff).not.toHaveBeenCalled();
 });
 it("rejects revoked entitlement and clears only browser binding",async()=>{
  const h=makeApp({authorized:false});const r=await h.request().get(CALLBACK+GOOD_QUERY).set("Cookie",COOKIE);
  expect(r.status).toBe(403);expect(h.handoff).not.toHaveBeenCalled();expect(r.headers["set-cookie"][0]).toContain("Max-Age=0");
 });
 it("fails closed on Central outage",async()=>{
  const h=makeApp({authorizeError:true});const r=await h.request().get(CALLBACK+GOOD_QUERY).set("Cookie",COOKIE);
  expect(r.status).toBe(401);expect(h.handoff).not.toHaveBeenCalled();
 });
});