import {it,expect} from "vitest";
import {harness,ORIGIN,TOKEN,callback,initialCookie,sessionCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP session-ok",async()=>{const h=harness();const r=await h.agent.get("/auth/titan/academy/session").set("Cookie",sessionCookie());expect(r.status).toBe(200);expect(r.body.identity).toEqual({userId:"user-a",companyId:"company-a",role:"STUDENT"});expect(r.body.identity.centralOrganisationId).toBeUndefined();});
