import {describe,it,expect} from "vitest";
import {makeApp,CALLBACK,GOOD_QUERY,COOKIE} from "./support/central-oidc-http-harness";
describe("verified callback creates only an app-owned session",()=>{
 it("passes verified principal to trusted Central authorizer and session handoff",async()=>{
  const h=makeApp();const r=await h.request().get(CALLBACK+GOOD_QUERY).set("Cookie",COOKIE);
  expect(r.status).toBe(303);expect(r.headers.location).toBe("/dashboard");
  expect(r.headers["set-cookie"]).toHaveLength(2);
  expect(r.headers["set-cookie"][1]).toContain("academy_sid=");
  expect(h.login.complete).toHaveBeenCalledWith({browserBinding:"a".repeat(43),state:"statetoken123456",code:"codetoken123456"});
  expect(h.authorize).toHaveBeenCalledOnce();expect(h.handoff).toHaveBeenCalledOnce();
  expect(JSON.stringify(r.body)).not.toContain("statetoken123456");
 });
});