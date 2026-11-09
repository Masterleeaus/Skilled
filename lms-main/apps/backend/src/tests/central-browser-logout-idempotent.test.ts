import {it,expect} from "vitest";
import {harness,ORIGIN,TOKEN,callback,initialCookie,sessionCookie} from "./central-browser-lifecycle.fixture";
it("Central HTTP logout-idempotent",async()=>{const h=harness();h.revoke.mockRejectedValue(Error("revoked"));const r=await h.agent.post("/auth/titan/academy/logout").set("Origin",ORIGIN).set("Cookie",sessionCookie());expect(r.status).toBe(200);expect(String(r.headers["set-cookie"])).toContain("Max-Age=0");});
