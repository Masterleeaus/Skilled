import {describe,it,expect} from "vitest";
import {makeApp,START,CALLBACK,GOOD_QUERY,COOKIE} from "./support/central-oidc-http-harness";
describe("OIDC route methods and raw paths",()=>{
 it.each(["post","put","delete"] as const)("rejects %s login without changing state",async(method)=>{
  const h=makeApp();const r=await h.request()[method](START);expect(r.status).toBe(405);expect(h.login.begin).not.toHaveBeenCalled();
 });
 it("does not execute near-match callback",async()=>{
  const h=makeApp();const r=await h.request().get(CALLBACK+"/other"+GOOD_QUERY).set("Cookie",COOKIE);
  expect(r.status).toBe(404);expect(h.login.complete).not.toHaveBeenCalled();
 });
});