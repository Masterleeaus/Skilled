import {it,expect} from "vitest";
import {centralSessionSetCookie} from "../modules/auth/central-session-cookie";
import {harness,callback,initialCookie,TOKEN} from "./central-browser-lifecycle.fixture";
it("rejects cookie-domain-injection",async()=>{const h=harness();h.complete.mockResolvedValue({...await h.complete(),"cookie":"academy_sid="+TOKEN+"; Path=/; Domain=evil.example.test; Secure; HttpOnly; SameSite=Lax; Max-Age=3600"} as never);const r=await h.agent.get(callback).set("Cookie",initialCookie());expect(r.status).toBe(401);expect(String(r.headers["set-cookie"])).not.toContain("academy_sid="+TOKEN);});
