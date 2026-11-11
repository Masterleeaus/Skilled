import {it,expect} from "vitest";
import {harness,callback,initialCookie,TOKEN} from "./central-browser-lifecycle.fixture";
it("rejects cookie-missing-secure",async()=>{const h=harness();h.complete.mockResolvedValue({cookie:"academy_sid="+TOKEN+"; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600",expiresAt:new Date(Date.now()+60000),identity:{}} as never);const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(401);});
