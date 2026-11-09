import {it,expect} from "vitest";
import {harness,ORIGIN,TOKEN,callback,initialCookie,sessionCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP callback-denied",async()=>{const h=harness();h.complete.mockResolvedValue(null as never);const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(401);expect(r.headers["set-cookie"]).toBeDefined();expect(String(r.headers["set-cookie"])).not.toContain("academy_sid=");});
