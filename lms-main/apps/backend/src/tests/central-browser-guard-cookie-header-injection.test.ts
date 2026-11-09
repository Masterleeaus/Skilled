import {it,expect} from "vitest";
import {centralSessionSetCookie} from "../modules/auth/central-session-cookie";
import {harness,callback,initialCookie,TOKEN} from "./central-browser-lifecycle.fixture";
it("rejects cookie-header-injection",async()=>{const h=harness();h.complete.mockResolvedValue({cookie:"academy_sid="+TOKEN+"; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600\r\nSet-Cookie: attacker=1",expiresAt:new Date(Date.now()+60000),identity:{}} as never);const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(401);});
