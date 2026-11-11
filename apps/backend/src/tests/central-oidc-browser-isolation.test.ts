import {describe,it,expect} from "vitest";
import {makeApp,CALLBACK,GOOD_QUERY,COOKIE} from "./support/central-oidc-http-harness";
describe("OIDC browser requests cannot select accounts",()=>{
 it("rejects a callback with a user or company query injection",async()=>{
  const h=makeApp();const r=await h.request().get(CALLBACK+GOOD_QUERY+"&companyId=tenant-b").set("Cookie",COOKIE);
  expect(r.status).toBe(400);expect(h.login.complete).not.toHaveBeenCalled();
 });
 it("requires browser correlation and refuses duplicated binding cookies",async()=>{
  const h=makeApp();expect((await h.request().get(CALLBACK+GOOD_QUERY)).status).toBe(400);
  const res=await h.request().get(CALLBACK+GOOD_QUERY).set("Cookie",COOKIE+"; "+COOKIE);
  expect(res.status).toBe(400);expect(h.handoff).not.toHaveBeenCalled();
 });
});