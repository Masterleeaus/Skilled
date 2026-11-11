import {it,expect} from "vitest";
import { harness, ORIGIN, TOKEN, sessionCookie } from "./central-browser-lifecycle.fixture";
it("Central HTTP logout-revokes",async()=>{const h=harness();const r=await h.agent.post("/auth/titan/academy/logout").set("Origin",ORIGIN).set("Cookie",sessionCookie());expect(r.status).toBe(200);expect(h.revoke).toHaveBeenCalledWith(TOKEN);expect(String(r.headers["set-cookie"])).toContain("Max-Age=0");});
