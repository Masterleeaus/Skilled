import {it,expect} from "vitest";
import {centralSessionSetCookie} from "../modules/auth/central-session-cookie";
import {harness,callback,initialCookie,TOKEN} from "./central-browser-lifecycle.fixture";
it("rejects cookie-expired-session",async()=>{const h=harness();h.complete.mockResolvedValue({cookie:centralSessionSetCookie(TOKEN),expiresAt:new Date(1),identity:{}} as never);const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(401);});
