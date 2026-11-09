import {it,expect} from "vitest";
import {harness,ORIGIN,TOKEN,callback,initialCookie,sessionCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP session-missing",async()=>{const h=harness();const r=await h.agent.get("/auth/titan/academy/session");expect(r.status).toBe(401);expect(h.authenticate).not.toHaveBeenCalled();});
