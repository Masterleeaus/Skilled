import {it,expect} from "vitest";
import {harness,callback,initialCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP callback-wrong-state",async()=>{const h=harness();const r=await h.agent.get("/auth/titan/academy/callback?state=bad&code=valid-code-123").set("Cookie",initialCookie());expect(r.status).toBe(401);expect(h.complete).not.toHaveBeenCalled();});
