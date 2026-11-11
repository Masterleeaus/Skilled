import {it,expect} from "vitest";
import { harness, sessionCookie } from "./central-browser-lifecycle.fixture";
it("Central HTTP logout-no-origin",async()=>{const h=harness();const r=await h.agent.post("/auth/titan/academy/logout").set("Cookie",sessionCookie());expect(r.status).toBe(403);expect(h.revoke).not.toHaveBeenCalled();});
