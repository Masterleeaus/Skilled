import {describe,it,expect} from "vitest";
import {makeApp,START,CALLBACK,GOOD_QUERY,COOKIE} from "./support/central-oidc-http-harness";
describe("disabled OIDC routes never touch the login provider",()=>{
 it("does not start authorization",async()=>{const h=makeApp({enabled:false});const r=await h.request().get(START);expect(r.status).toBe(404);expect(h.login.begin).not.toHaveBeenCalled();});
 it("does not complete a callback or issue a session",async()=>{const h=makeApp({enabled:false});const r=await h.request().get(CALLBACK+GOOD_QUERY).set("Cookie",COOKIE);expect(r.status).toBe(404);expect(h.login.complete).not.toHaveBeenCalled();expect(h.handoff).not.toHaveBeenCalled();});
});