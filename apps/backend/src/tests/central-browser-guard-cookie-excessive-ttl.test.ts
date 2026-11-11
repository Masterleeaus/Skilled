import {it,expect} from "vitest";
import {centralSessionSetCookie} from "../modules/auth/central-session-cookie";
import {harness,callback,initialCookie,TOKEN} from "./central-browser-lifecycle.fixture";
it("rejects cookie-excessive-ttl",async()=>{const h=harness();h.complete.mockResolvedValue({cookie:centralSessionSetCookie(TOKEN,7200),expiresAt:new Date(Date.now()+60000),identity:{}} as never);const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(401);});
